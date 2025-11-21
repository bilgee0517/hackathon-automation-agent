// Lightning AI service for cloud execution
// Uses Lightning AI Python bridge for real cloud execution

import axios from 'axios';
import { execSync } from 'child_process';
import path from 'path';
import { EndpointTestResult } from '../types';

interface CommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

interface CloudExecutionResult {
  success: boolean;
  outputs: Array<{
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    success: boolean;
  }>;
  errors: string[];
}

/**
 * Lightning AI Studio Manager
 * Handles execution via Lightning AI Python bridge
 */
export class LightningStudioManager {
  private apiKey: string;
  private pythonScript: string;
  
  constructor() {
    this.apiKey = process.env.LIGHTNING_API_KEY || '';
    this.pythonScript = path.join(__dirname, '../../scripts/lightning_executor.py');
  }
  
  /**
   * Check if Lightning AI is configured and available
   */
  isAvailable(): boolean {
    if (!this.apiKey || this.apiKey.length === 0) {
      console.log('⚠️  Lightning AI API key not configured');
      return false;
    }
    
    // Check if Python 3 is available
    try {
      execSync('python3 --version', { stdio: 'ignore' });
    } catch (error) {
      console.log('⚠️  Python 3 not found');
      return false;
    }
    
    // Check if lightning package is installed
    try {
      execSync('python3 -c "import lightning"', { stdio: 'ignore' });
      console.log('✓ Lightning AI Python package available');
      return true;
    } catch (error) {
      console.log('⚠️  Lightning package not installed. Install with: pip install lightning');
      return false;
    }
  }
  
  /**
   * Execute commands in Lightning AI cloud via Python bridge
   */
  async executeInCloud(
    repoUrl: string,
    projectName: string,
    commands: string[]
  ): Promise<CloudExecutionResult> {
    console.log(`⚡ Executing in Lightning AI cloud...`);
    console.log(`   Repo: ${repoUrl}`);
    console.log(`   Project: ${projectName}`);
    console.log(`   Commands: ${commands.join(', ')}`);
    
    try {
      // Build Python command with proper escaping
      const args = [
        this.pythonScript,
        repoUrl,
        projectName,
        ...commands
      ];
      
      // Execute Python bridge script
      const result = execSync(`python3 ${args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ')}`, {
        encoding: 'utf-8',
        env: { ...process.env, LIGHTNING_API_KEY: this.apiKey },
        timeout: 600000, // 10 minute timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      // Parse JSON output
      const output = JSON.parse(result);
      
      console.log(`✓ Lightning execution complete`);
      console.log(`   Success: ${output.success}`);
      console.log(`   Commands executed: ${output.outputs?.length || 0}`);
      
      return output;
      
    } catch (error: any) {
      console.error('⚡ Lightning execution failed:', error);
      
      // Try to parse error output as JSON
      let parsedError: CloudExecutionResult | null = null;
      if (error.stdout) {
        try {
          parsedError = JSON.parse(error.stdout);
        } catch (e) {
          // Not JSON, ignore
        }
      }
      
      return parsedError || {
        success: false,
        outputs: [],
        errors: [error.message || 'Unknown error']
      };
    }
  }
  
  /**
   * Legacy compatibility methods (kept for backwards compatibility)
   */
  
  async createStudio(_config: any): Promise<string> {
    // Studios are created automatically by Lightning App
    return `ltng-${Date.now()}`;
  }
  
  async uploadRepo(_studioId: string, _repoPath: string): Promise<void> {
    // Handled by Lightning App
  }
  
  async executeCommand(
    _studioId: string,
    _command: string,
    _workdir?: string
  ): Promise<CommandResult> {
    // Single command execution - use executeInCloud() instead
    return {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: 'Use executeInCloud() for Lightning execution',
      duration: 0
    };
  }
  
  async startApp(
    _studioId: string,
    _command: string,
    _port: number = 3000
  ): Promise<string> {
    return 'https://lightning.ai/app';
  }
  
  async testEndpoint(
    url: string,
    method: string = 'GET',
    headers?: Record<string, string>,
    body?: any
  ): Promise<EndpointTestResult> {
    console.log(`⚡ Testing endpoint: ${method} ${url}`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method,
        url,
        headers,
        data: body,
        timeout: 30000,
        validateStatus: () => true
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: url,
        method,
        status: response.status,
        responseTime,
        success: response.status >= 200 && response.status < 300,
        body: JSON.stringify(response.data).substring(0, 500)
      };
      
    } catch (error) {
      return {
        endpoint: url,
        method,
        status: 0,
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async getLogs(_studioId: string, _lines: number = 100): Promise<string> {
    return '';
  }
  
  async deleteStudio(_studioId: string): Promise<void> {
    // Handled automatically by Lightning
  }
}

/**
 * Singleton instance
 */
let lightningManager: LightningStudioManager | null = null;

export function getLightningManager(): LightningStudioManager {
  if (!lightningManager) {
    lightningManager = new LightningStudioManager();
  }
  return lightningManager;
}

/**
 * Check if Lightning AI execution is enabled
 */
export function isLightningExecutionEnabled(): boolean {
  const enabled = process.env.ENABLE_LIGHTNING_EXECUTION === 'true';
  const hasApiKey = !!process.env.LIGHTNING_API_KEY;
  
  if (enabled && !hasApiKey) {
    console.warn('⚠️  Lightning execution enabled but LIGHTNING_API_KEY not set');
    return false;
  }
  
  return enabled && hasApiKey;
}
