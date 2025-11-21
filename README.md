# Hackathon Automation Agent

An AI-powered system that automatically analyzes hackathon projects to detect sponsor technology integrations and generates comprehensive, fair summaries.

## Overview

This agent watches what teams build and translates it into human language for organizers, judges, sponsors, and non-technical teammates. It automatically analyzes repositories and API usage to understand which sponsors are truly integrated and how, then generates honest, sponsor-specific summaries, prize signals, and clear feedback—without teams having to write extra reports.

## Features

- 🤖 **Autonomous AI Agent**: Claude-powered agent that intelligently explores codebases
- 🔍 **15 Sponsor Technologies**: Detects AWS, Skyflow, Postman, Redis, Forethought, Finster AI, Senso, Anthropic, Sanity, TRM Labs, Coder, Lightpanda, Lightning AI, Parallel, and Cleric
- ⚡ **Cloud Execution (NEW)**: Lightning AI integration runs projects in the cloud to validate integrations with real execution
- ⚡ **Async Processing**: Redis-based job queue for scalable analysis
- 📊 **Structured Results**: Saves to Sanity CMS for easy querying
- 💾 **Optional S3 Storage**: Persist repositories for re-analysis
- 🎯 **Smart Scoring**: 0-10 integration depth scores with detailed evidence
- 👀 **Agent Observatory**: Real-time visualization of agent analysis process

## Architecture

The system uses sponsor tools to build itself:
- **Anthropic (Claude)**: Powers the AI agent that analyzes repos
- **Lightning AI**: Cloud execution environment for running and testing projects
- **Sanity**: Stores final analysis results as structured data
- **Redis**: Job queue for analysis tasks + caching results
- **AWS S3**: Stores cloned repos and analysis artifacts (optional)

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.8+ (for Lightning AI integration)
- Redis server
- AI API key (Anthropic or OpenAI)
- Sanity account (optional)
- Lightning AI account (optional, for cloud execution)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/hackathon-automation-agent.git
cd hackathon-automation-agent
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start Redis**
```bash
# macOS
brew install redis && redis-server

# Or Docker
docker run -d -p 6379:6379 redis:alpine
```

5. **(Optional) Setup Lightning AI for cloud execution**
```bash
# Install Lightning SDK
pip3 install lightning-sdk

# Add to .env:
# ENABLE_LIGHTNING_EXECUTION=true
# LIGHTNING_USER_ID=your-user-id
# LIGHTNING_API_KEY=your-api-key
# See backend/LIGHTNING_QUICKSTART.md for details
```

6. **Run the backend**
```bash
npm run dev
```

Server starts at http://localhost:3001

### Usage

Submit a repository for analysis:

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl": "https://github.com/username/repo",
    "teamName": "Team Awesome",
    "projectName": "My Project"
  }'
```

Check status:
```bash
curl http://localhost:3001/api/status/YOUR_JOB_ID
```

Get results:
```bash
curl http://localhost:3001/api/results/YOUR_JOB_ID
```

## How It Works

### Static Analysis (Always Enabled)

1. **Submit Repository**: POST GitHub URL to `/api/analyze`
2. **Clone & Analyze**: Agent clones repo and explores with tools:
   - Read files, search code, list directories
   - Parse dependencies (package.json, requirements.txt, etc.)
   - Detect imports and SDK usage
3. **AI Assessment**: Claude agent evaluates each sponsor integration:
   - Detection (yes/no)
   - Integration depth score (0-10)
   - Technical + plain English summaries
   - Evidence (files, code snippets)
   - Prize eligibility
4. **Save Results**: Push to Sanity CMS, cache in Redis
5. **Return Analysis**: Complete sponsor breakdown available via API

### ⚡ Cloud Execution (Optional - Lightning AI)

When enabled, the agent goes further:

1. **Delegate to Lightning Agent**: Main orchestrator hands off to specialized execution agent
2. **Clone in Cloud**: Lightning AI spins up a Studio and clones the GitHub repo
3. **Install Dependencies**: Runs `npm install` / `pip install` in the cloud
4. **Run Tests**: Executes `npm test` / `pytest` in real cloud environment
5. **Validate Integrations**: Checks if sponsor SDKs actually work
6. **Report Back**: Enhanced scores based on real execution results

**Example**: A project claiming Postman integration gets a higher score if its tests actually run and make Postman API calls successfully.

See `backend/LIGHTNING_COMPLETE.md` for full documentation.

## Project Structure

```
hackathon-automation-agent/
├── backend/              # Node.js backend + AI agent
│   ├── src/
│   │   ├── agent/       # AI agent (tools, orchestrator, prompts)
│   │   ├── api/         # Express server, routes, processor
│   │   ├── services/    # GitHub, Redis, Sanity, S3
│   │   └── sponsors/    # Detection patterns for 15 sponsors
│   └── sanity-schemas/  # Sanity CMS schema definitions
└── README.md
```

## Sponsors Detected

The agent analyzes projects for these 15 sponsor technologies:

1. **AWS** - Amazon Web Services (S3, Lambda, DynamoDB, etc.)
2. **Skyflow** - Data privacy vault
3. **Postman** - API testing and development
4. **Redis** - In-memory data store
5. **Forethought** - AI customer support
6. **Finster AI** - Compliance AI
7. **Senso** - Data platform
8. **Anthropic** - Claude AI
9. **Sanity** - Structured content CMS
10. **TRM Labs** - Blockchain compliance
11. **Coder** - Cloud IDE
12. **Lightpanda** - Browser automation
13. **Lightning AI** - ML platform
14. **Parallel** - DeFi protocol
15. **Cleric** - Workflow automation

## API Documentation

See [backend/README.md](backend/README.md) for detailed API documentation.

## Development

Built for hackathons, by hackathon participants! This is a meta-project—an agent built to help hackathon teams showcase their work.

## License

MIT
