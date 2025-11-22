#!/usr/bin/env python3
"""
Lightning AI Execution Bridge
Executes code in Lightning AI cloud using the Lightning SDK

Note: This script uses programmatic API access, not CLI login.
Set LIGHTNING_API_KEY and optionally LIGHTNING_USER_ID in environment.

Enhanced with:
- Better timeout handling
- Async command execution
- More robust error recovery
- CLI fallback option
"""

import os
import sys
import json
import time
import signal
import subprocess
from lightning_sdk import Machine, Studio

# Global timeout handler
class TimeoutError(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutError("Operation timed out")

def run_with_timeout(func, timeout_seconds=300):
    """Run a function with a timeout"""
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout_seconds)
    try:
        result = func()
        signal.alarm(0)  # Cancel the alarm
        return result
    except TimeoutError:
        signal.alarm(0)
        raise
    except Exception as e:
        signal.alarm(0)
        raise

def execute_via_cli(repo_url: str, project_name: str, commands: list) -> dict:
    """
    Fallback: Execute via Lightning CLI if SDK fails
    This is more stable but requires `lightning` CLI to be installed
    """
    print(f"⚡ Attempting Lightning CLI execution...", file=sys.stderr)
    
    results = {
        'success': False,
        'outputs': [],
        'errors': []
    }
    
    try:
        # Check if CLI is available
        cli_check = subprocess.run(['lightning', '--version'], 
                                   capture_output=True, text=True, timeout=10)
        if cli_check.returncode != 0:
            results['errors'].append("Lightning CLI not available")
            return results
        
        print(f"   ✓ Lightning CLI available: {cli_check.stdout.strip()}", file=sys.stderr)
        
        # Create a temporary script to run in studio
        script_content = f"""#!/bin/bash
set -e
git clone {repo_url} /teamspace/studios/this_studio/repo
cd /teamspace/studios/this_studio/repo
{chr(10).join(commands)}
"""
        
        script_path = f"/tmp/lightning_script_{int(time.time())}.sh"
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Execute via CLI
        print(f"   Running commands via CLI...", file=sys.stderr)
        cli_result = subprocess.run(
            ['lightning', 'run', 'studio', '--script', script_path],
            capture_output=True,
            text=True,
            timeout=600
        )
        
        os.remove(script_path)
        
        if cli_result.returncode == 0:
            results['success'] = True
            results['outputs'].append({
                'command': 'all_commands',
                'stdout': cli_result.stdout,
                'stderr': cli_result.stderr,
                'exitCode': 0,
                'success': True
            })
            print(f"   ✓ CLI execution succeeded", file=sys.stderr)
        else:
            results['errors'].append(f"CLI execution failed: {cli_result.stderr}")
            results['outputs'].append({
                'command': 'all_commands',
                'stdout': cli_result.stdout,
                'stderr': cli_result.stderr,
                'exitCode': cli_result.returncode,
                'success': False
            })
        
        return results
        
    except subprocess.TimeoutExpired:
        results['errors'].append("CLI execution timed out")
        return results
    except Exception as e:
        results['errors'].append(f"CLI execution error: {str(e)}")
        return results

def execute_in_cloud(repo_url: str, project_name: str, commands: list) -> dict:
    """
    Execute commands in Lightning AI cloud
    
    Args:
        repo_url: GitHub repository URL
        project_name: Project name for the studio
        commands: List of commands to execute
        
    Returns:
        dict: Execution results
    """
    
    print(f"⚡ Lightning AI Cloud Execution", file=sys.stderr)
    print(f"   Repo: {repo_url}", file=sys.stderr)
    print(f"   Project: {project_name}", file=sys.stderr)
    
    # Get credentials from environment
    api_key = os.environ.get('LIGHTNING_API_KEY')
    user_id = os.environ.get('LIGHTNING_USER_ID')
    username = os.environ.get('LIGHTNING_USERNAME')  # Username for user parameter
    teamspace = os.environ.get('LIGHTNING_TEAMSPACE', 'Vision-model')  # Default to Vision-model
    
    if not api_key:
        return {
            'success': False,
            'outputs': [],
            'errors': ['LIGHTNING_API_KEY not set in environment']
        }
    
    # Need either username or user_id for the user parameter
    user_param = username or user_id
    if not user_param:
        return {
            'success': False,
            'outputs': [],
            'errors': [
                'LIGHTNING_USERNAME or LIGHTNING_USER_ID must be set in environment',
                'The SDK needs a user parameter when creating Studios',
                'Get your username from: https://lightning.ai/ (check your profile URL)'
            ]
        }
    
    # Set the API key for lightning SDK to use
    os.environ['LIGHTNING_API_KEY'] = api_key
    
    studio = None
    results = {
        'success': True,
        'outputs': [],
        'errors': []
    }
    
    try:
        # Extract repo name from URL
        repo_name = repo_url.rstrip('/').split('/')[-1].replace('.git', '')
        studio_name = f"{project_name}-{repo_name}"[:50]  # Max 50 chars
        studio_name = studio_name.replace(' ', '-').lower()  # Make it URL-safe
        
        print(f"⚡ Creating Lightning Studio: {studio_name}", file=sys.stderr)
        print(f"   Using API key: {api_key[:20]}...", file=sys.stderr)
        print(f"   Teamspace: {teamspace}", file=sys.stderr)
        print(f"   User: {user_param}", file=sys.stderr)
        
        # Try multiple approaches to create/connect to studio
        studio_created = False
        last_error = None
        
        # Approach 1: Try to connect to existing studio first
        try:
            print(f"   Attempting to connect to existing studio...", file=sys.stderr)
            studio = Studio(name=studio_name, teamspace=teamspace, user=user_param)
            studio_created = True
            print(f"   ✓ Connected to existing studio", file=sys.stderr)
        except Exception as e1:
            last_error = str(e1)
            print(f"   Studio doesn't exist, creating new one...", file=sys.stderr)
        
        # Approach 2: Create new studio if connection failed
        if not studio_created:
            try:
                print(f"   Creating new studio...", file=sys.stderr)
                studio = Studio(
                    name=studio_name,
                    teamspace=teamspace,
                    user=user_param,
                    create_ok=True
                )
                studio_created = True
                print(f"   ✓ Studio created", file=sys.stderr)
            except Exception as e2:
                last_error = str(e2)
                print(f"   ✗ Studio creation failed: {last_error}", file=sys.stderr)
                
                # Approach 3: Try without teamspace (personal workspace)
                try:
                    print(f"   Trying personal workspace...", file=sys.stderr)
                    studio = Studio(name=studio_name, create_ok=True)
                    studio_created = True
                    print(f"   ✓ Studio created in personal workspace", file=sys.stderr)
                except Exception as e3:
                    last_error = str(e3)
                    print(f"   ✗ All approaches failed", file=sys.stderr)
        
        if not studio_created:
            return {
                'success': False,
                'outputs': [],
                'errors': [
                    f"Lightning Studio creation failed: {last_error}",
                    "",
                    "TROUBLESHOOTING:",
                    "1. Verify your Lightning AI account: https://lightning.ai/",
                    "2. Get your credentials from Settings > API Keys",
                    "3. For teamspace, get name from your teamspace URL",
                    "4. Try creating a Studio manually first to verify access",
                    "",
                    "Required env vars:",
                    "  LIGHTNING_API_KEY=<your-api-key>",
                    "  LIGHTNING_USERNAME=<your-username>",
                    "  LIGHTNING_TEAMSPACE=<teamspace-name> (optional)"
                ]
            }
            raise Exception(f"Studio creation failed: {last_error}")
        
        # Start the Studio with timeout protection
        print(f"⚡ Starting Studio...", file=sys.stderr)
        studio_started = False
        
        try:
            # Try to start studio with timeout
            def start_studio():
                studio.start()
                return True
            
            run_with_timeout(start_studio, timeout_seconds=120)
            studio_started = True
            print(f"   ✓ Studio started successfully", file=sys.stderr)
            
            # Give it a moment to fully initialize
            time.sleep(3)
            
        except TimeoutError:
            print(f"   ⚠️  Start timed out, assuming studio is already running...", file=sys.stderr)
            studio_started = True  # Assume it's running
        except Exception as start_error:
            print(f"   ⚠️  Start failed: {start_error}", file=sys.stderr)
            print(f"   Assuming studio may already be running...", file=sys.stderr)
            studio_started = True  # Try to continue anyway
        
        # Test if studio is actually responsive
        print(f"⚡ Testing Studio responsiveness...", file=sys.stderr)
        try:
            def test_studio():
                return studio.run("echo 'Lightning Studio Ready' && pwd")
            
            test_output = run_with_timeout(test_studio, timeout_seconds=30)
            print(f"   ✓ Studio is responsive!", file=sys.stderr)
            print(f"   Working directory: {test_output.strip()}", file=sys.stderr)
        except TimeoutError:
            print(f"   ✗ Studio test timed out", file=sys.stderr)
            return {
                'success': False,
                'outputs': [],
                'errors': ["Studio is not responsive (timeout)", "Try again or check Lightning AI dashboard"]
            }
        except Exception as test_error:
            print(f"   ✗ Studio test failed: {test_error}", file=sys.stderr)
            return {
                'success': False,
                'outputs': [],
                'errors': [f"Studio not responsive: {test_error}"]
            }
        
        # Clone the repository with timeout
        print(f"⚡ Cloning repository...", file=sys.stderr)
        repo_dir = f"/teamspace/studios/this_studio/repo-{int(time.time())}"
        
        try:
            def clone_repo():
                # Check if directory exists, clean it first
                cleanup_cmd = f"rm -rf {repo_dir}"
                studio.run(cleanup_cmd)
                return studio.run(f"git clone {repo_url} {repo_dir}")
            
            clone_output = run_with_timeout(clone_repo, timeout_seconds=120)
            print(f"   ✓ Clone complete", file=sys.stderr)
            results['outputs'].append({
                'command': f'git clone {repo_url}',
                'stdout': clone_output[:1000],  # Limit output size
                'stderr': '',
                'exitCode': 0,
                'success': True
            })
        except TimeoutError:
            error_msg = "Git clone timed out (>120s)"
            print(f"   ✗ {error_msg}", file=sys.stderr)
            results['success'] = False
            results['errors'].append(error_msg)
            return results
        except Exception as clone_error:
            error_msg = str(clone_error)
            print(f"   ✗ Clone failed: {error_msg}", file=sys.stderr)
            results['success'] = False
            results['errors'].append(f"Git clone failed: {error_msg}")
            return results
        
        # Change to repo directory and execute commands with timeout
        for i, cmd in enumerate(commands):
            print(f"⚡ Executing command {i+1}/{len(commands)}: {cmd}", file=sys.stderr)
            
            # Determine timeout based on command type
            timeout_seconds = 300  # Default 5 minutes
            if 'install' in cmd.lower() or 'download' in cmd.lower():
                timeout_seconds = 600  # 10 minutes for installs
            elif 'test' in cmd.lower():
                timeout_seconds = 300  # 5 minutes for tests
            else:
                timeout_seconds = 180  # 3 minutes for other commands
            
            try:
                # Execute in the repo directory with timeout
                full_cmd = f"cd {repo_dir} && timeout {timeout_seconds} {cmd}"
                
                def run_cmd():
                    return studio.run(full_cmd)
                
                output = run_with_timeout(run_cmd, timeout_seconds=timeout_seconds + 30)
                
                results['outputs'].append({
                    'command': cmd,
                    'stdout': output[:5000],  # Limit to 5KB per command
                    'stderr': '',
                    'exitCode': 0,
                    'success': True
                })
                
                print(f"   ✓ Command succeeded", file=sys.stderr)
                print(f"   Output preview: {output[:200]}", file=sys.stderr)
                
            except TimeoutError:
                error_msg = f"Command timed out after {timeout_seconds}s"
                print(f"   ✗ {error_msg}", file=sys.stderr)
                
                # Don't fail completely on timeout, mark as partial success
                results['outputs'].append({
                    'command': cmd,
                    'stdout': '',
                    'stderr': error_msg,
                    'exitCode': 124,  # Standard timeout exit code
                    'success': False
                })
                results['errors'].append(f"Command '{cmd}' {error_msg}")
                # Continue with next command instead of breaking
                
            except Exception as e:
                error_msg = str(e)
                print(f"   ✗ Command failed: {error_msg[:200]}", file=sys.stderr)
                
                results['outputs'].append({
                    'command': cmd,
                    'stdout': '',
                    'stderr': error_msg[:2000],
                    'exitCode': 1,
                    'success': False
                })
                results['errors'].append(f"Command '{cmd}' failed: {error_msg[:500]}")
                
                # For install failures, stop. For test failures, continue
                if 'install' in cmd.lower() or 'download' in cmd.lower():
                    results['success'] = False
                    break
        
        # Stop the Studio with graceful cleanup
        print(f"⚡ Cleaning up Studio...", file=sys.stderr)
        try:
            # Clean up the repo directory
            cleanup_cmd = f"rm -rf {repo_dir}"
            studio.run(cleanup_cmd)
            print(f"   ✓ Workspace cleaned", file=sys.stderr)
        except Exception as cleanup_error:
            print(f"   ⚠️  Cleanup warning: {cleanup_error}", file=sys.stderr)
        
        try:
            studio.stop()
            print(f"   ✓ Studio stopped", file=sys.stderr)
        except Exception as stop_error:
            print(f"   ⚠️  Stop warning: {stop_error}", file=sys.stderr)
            # Not critical if stop fails
        
        print(f"✓ Lightning execution complete", file=sys.stderr)
        
        # Mark as at least partial success if we got some results
        if len(results['outputs']) > 0 and not results['success']:
            # If we have outputs but success=False, check if install succeeded
            install_succeeded = any(o['success'] and ('install' in o['command'].lower()) for o in results['outputs'])
            if install_succeeded:
                results['success'] = True  # Partial success is still success
                results['errors'].append("Note: Some commands failed but installation succeeded")
        
        return results
        
    except Exception as e:
        error_msg = str(e)
        print(f"⚡ SDK execution error: {error_msg}", file=sys.stderr)
        
        results['success'] = False
        results['errors'].append(f"Lightning SDK execution failed: {error_msg}")
        
        # Try to cleanup
        if studio:
            try:
                studio.stop()
            except:
                pass
        
        # FALLBACK: Try CLI execution if SDK fails
        use_cli_fallback = os.environ.get('LIGHTNING_USE_CLI_FALLBACK', 'true').lower() == 'true'
        if use_cli_fallback:
            print(f"⚡ Attempting CLI fallback...", file=sys.stderr)
            cli_results = execute_via_cli(repo_url, project_name, commands)
            if cli_results['success']:
                print(f"✓ CLI fallback succeeded!", file=sys.stderr)
                return cli_results
            else:
                print(f"✗ CLI fallback also failed", file=sys.stderr)
                results['errors'].extend(cli_results.get('errors', []))
        
        return results


def main():
    """Main entry point"""
    
    if len(sys.argv) < 4:
        print(json.dumps({
            'success': False,
            'outputs': [],
            'errors': ['Usage: lightning_executor.py <repo_url> <project_name> <command1> [command2] ...']
        }))
        sys.exit(1)
    
    repo_url = sys.argv[1]
    project_name = sys.argv[2]
    commands = sys.argv[3:]
    
    results = execute_in_cloud(repo_url, project_name, commands)
    
    # Output JSON result to stdout
    print(json.dumps(results))
    
    sys.exit(0 if results['success'] else 1)


if __name__ == '__main__':
    main()
