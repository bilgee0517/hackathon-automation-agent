# Lightning AI Setup Guide

This guide helps you configure Lightning AI for the hackathon automation agent.

## Quick Start

### 1. Get Your Lightning AI Credentials

Visit [Lightning AI](https://lightning.ai/) and:

1. **Sign up or log in** to your account
2. **Get your API Key**:
   - Go to Settings → API Keys
   - Create a new API key if you don't have one
   - Copy it (starts with `lai-...`)

3. **Get your Username**:
   - Look at your profile URL: `https://lightning.ai/yourusername`
   - Your username is the part after the last slash

4. **(Optional) Get your Teamspace**:
   - If working in a team, get the teamspace name from your teamspace URL
   - Example: `https://lightning.ai/yourteam/` → teamspace is `yourteam`

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Lightning AI Configuration
LIGHTNING_API_KEY=lai-your-api-key-here
LIGHTNING_USERNAME=your-username
LIGHTNING_TEAMSPACE=your-teamspace  # Optional, omit for personal workspace

# Enable Lightning execution
ENABLE_LIGHTNING_EXECUTION=true

# Optional: Use CLI fallback if SDK fails
LIGHTNING_USE_CLI_FALLBACK=true
```

### 3. Install Lightning SDK

```bash
# Install the Lightning Python SDK
pip install lightning lightning-sdk

# Verify installation
python3 -c "import lightning; print(f'Lightning {lightning.__version__} installed')"
```

### 4. Test Your Setup

Run the test script:

```bash
cd backend
./check-lightning.sh
```

Or test directly:

```bash
python3 scripts/lightning_executor.py \
  "https://github.com/username/test-repo" \
  "test-project" \
  "echo 'Hello Lightning'"
```

## Troubleshooting

### Issue: "Studio creation failed"

**Solutions:**
1. Verify your credentials are correct
2. Check you have access to create Studios at https://lightning.ai/
3. Try creating a Studio manually in the web UI first
4. If using teamspace, verify the teamspace name is correct
5. Try without teamspace (personal workspace) by removing `LIGHTNING_TEAMSPACE`

### Issue: "Studio not responsive" or timeouts

**Solutions:**
1. Studios can take 30-60 seconds to start. Be patient.
2. Check Lightning AI status at https://status.lightning.ai/
3. Try using a smaller project first to verify setup
4. Enable CLI fallback: `LIGHTNING_USE_CLI_FALLBACK=true`

### Issue: "Lightning package not installed"

```bash
pip install lightning lightning-sdk
# Or with virtualenv:
source venv/bin/activate
pip install lightning lightning-sdk
```

### Issue: Commands timing out

The script has intelligent timeouts:
- Install commands: 10 minutes
- Test commands: 5 minutes  
- Other commands: 3 minutes

If you need longer, edit `lightning_executor.py` timeout values.

### Issue: Want to disable Lightning temporarily

```bash
# In .env file
ENABLE_LIGHTNING_EXECUTION=false
```

The system will fall back to local validation.

## How It Works

### SDK Execution (Primary Method)

1. Creates or connects to a Lightning Studio
2. Starts the studio (with timeout protection)
3. Tests studio responsiveness
4. Clones your repository
5. Executes install and test commands
6. Captures all outputs
7. Cleans up and stops the studio

### CLI Fallback (Backup Method)

If the SDK fails, the script automatically tries the Lightning CLI:

1. Checks if `lightning` CLI is installed
2. Creates a bash script with your commands
3. Executes via `lightning run studio`
4. Returns results

## Advanced Configuration

### Using Different Machine Types

Edit `lightning_executor.py` to specify machine type:

```python
studio = Studio(
    name=studio_name,
    teamspace=teamspace,
    user=user_param,
    machine=Machine.GPU,  # or Machine.CPU, Machine.A100, etc.
    create_ok=True
)
```

### Custom Timeouts

Edit timeout values in `lightning_executor.py`:

```python
if 'install' in cmd.lower():
    timeout_seconds = 900  # 15 minutes instead of 10
```

### Disabling CLI Fallback

```bash
LIGHTNING_USE_CLI_FALLBACK=false
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Hackathon Automation Agent (Node.js)  │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  lightning.ts Service                   │
│  - Checks configuration                 │
│  - Calls Python bridge                  │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  lightning_executor.py                  │
│  - Lightning SDK execution              │
│  - Timeout management                   │
│  - CLI fallback                         │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Lightning AI Cloud                     │
│  - Studios (cloud dev environments)     │
│  - Command execution                    │
│  - GPU/CPU resources                    │
└─────────────────────────────────────────┘
```

## Best Practices

1. **Always test locally first** before enabling Lightning execution
2. **Set appropriate timeouts** based on your project size
3. **Monitor Lightning AI dashboard** during execution
4. **Clean up manually** if scripts fail (check https://lightning.ai/)
5. **Use CLI fallback** as a safety net
6. **Start with simple projects** to verify your setup

## Getting Help

- Lightning AI Docs: https://lightning.ai/docs
- Lightning AI Discord: https://discord.gg/lightning-ai
- SDK Issues: https://github.com/Lightning-AI/lightning/issues
- This project's issues: (your repo here)

## Example Output

Successful execution looks like:

```
⚡ Lightning AI Cloud Execution
   Repo: https://github.com/user/project
   Project: MyProject
⚡ Creating Lightning Studio: myproject-project
   ✓ Studio created
⚡ Starting Studio...
   ✓ Studio started successfully
⚡ Testing Studio responsiveness...
   ✓ Studio is responsive!
⚡ Cloning repository...
   ✓ Clone complete
⚡ Executing command 1/2: npm install
   ✓ Command succeeded
⚡ Executing command 2/2: npm test
   ✓ Command succeeded
✓ Lightning execution complete
```

