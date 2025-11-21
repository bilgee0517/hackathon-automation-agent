# Getting Started with Hackathon Automation Agent

This guide will help you get the backend up and running in under 10 minutes.

## Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js 20+** installed (`node --version`)
- ✅ **Redis** installed or Docker
- ✅ **AI API Key** (at least one):
  - **Anthropic** (preferred) - get one at https://console.anthropic.com
  - **OpenAI** (fallback) - get one at https://platform.openai.com

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Redis

Choose one option:

**Option A: Local Redis (macOS)**
```bash
brew install redis
brew services start redis
```

**Option B: Docker**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 3. Configure Environment Variables

The backend needs an AI API key (Anthropic or OpenAI):

**Option A: Use Anthropic (Claude) - Preferred**
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

**Option B: Use OpenAI (GPT-4) - Fallback**
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

**Note**: If both are set, Anthropic will be used. You only need one.

**Optional**: Set Redis host if not localhost
```bash
export REDIS_HOST="localhost"
```

**Alternative**: Copy `.env.example` to `.env` and edit:
```bash
cp .env.example .env
nano .env  # or your preferred editor
```

### 4. Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Starting Hackathon Automation Agent Backend...

Initializing Redis connection...
✓ Redis client connected
✓ Analysis queue initialized
✓ Queue processor initialized

✓ Server running on http://localhost:3001
✓ API endpoints: http://localhost:3001/api

Ready to analyze hackathon projects! 🎉
```

## Quick Test

Test the API with a sample repository:

```bash
# Test with the Anthropic SDK repo
node scripts/test-api.js https://github.com/anthropics/anthropic-sdk-typescript
```

Or manually with curl:

```bash
# Submit an analysis job
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl": "https://github.com/anthropics/anthropic-sdk-typescript",
    "teamName": "Test Team",
    "projectName": "Test Project"
  }'

# Response will include a jobId
# {"jobId":"abc-123-def","status":"pending","message":"Analysis job created successfully"}

# Check status
curl http://localhost:3001/api/status/abc-123-def

# Get results (when complete)
curl http://localhost:3001/api/results/abc-123-def
```

## Understanding the Output

The agent will analyze the repository and return results like:

```json
{
  "teamName": "Test Team",
  "projectName": "Test Project",
  "repositoryStats": {
    "mainLanguage": "TypeScript",
    "totalFiles": 42,
    "hasTests": true
  },
  "sponsors": {
    "anthropic": {
      "detected": true,
      "integrationScore": 9,
      "technicalSummary": "Uses @anthropic-ai/sdk extensively...",
      "plainEnglishSummary": "This project uses Claude AI...",
      "prizeEligible": true,
      "confidence": 0.95,
      "evidence": {
        "files": ["src/index.ts", "src/client.ts"],
        "codeSnippets": ["import Anthropic from '@anthropic-ai/sdk'"]
      }
    },
    "aws": {
      "detected": false,
      "integrationScore": 0,
      ...
    }
  }
}
```

## Optional: Set Up Sanity CMS

To persist results to Sanity:

1. Create a Sanity account: https://www.sanity.io
2. Create a new project
3. Get your Project ID and create an API token
4. Set environment variables:
```bash
export SANITY_PROJECT_ID="your-project-id"
export SANITY_TOKEN="your-token"
export SANITY_DATASET="production"
```
5. Import the schemas from `backend/sanity-schemas/` into your Sanity project

## Optional: Set Up AWS S3

To store repository snapshots:

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
export S3_BUCKET="your-bucket-name"
```

## Troubleshooting

### Redis Connection Error

**Error**: `Redis client error: connect ECONNREFUSED`

**Solution**: Make sure Redis is running:
```bash
redis-cli ping  # Should return PONG
```

### Anthropic API Error

**Error**: `Error: Missing API key`

**Solution**: Set your API key:
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### Git Clone Error

**Error**: `Failed to clone repository`

**Solution**: 
- Make sure the GitHub URL is correct and public
- Check your internet connection
- Verify git is installed: `git --version`

## Next Steps

Once the backend is running:

1. ✅ Test with different repositories
2. ✅ Integrate with a frontend (coming soon)
3. ✅ Deploy to production (Railway, AWS, etc.)
4. ✅ Set up monitoring and logging

## Need Help?

- Check the main [README.md](README.md) for detailed docs
- Review the [API documentation](#api-endpoints)
- Look at example requests in `scripts/test-api.js`

Happy hacking! 🚀

