# Hackathon Automation Agent - Backend

AI-powered backend service that analyzes hackathon project repositories to detect sponsor technology integrations using Claude AI.

## Features

- 🤖 **Autonomous AI Agent**: Claude-powered agent that explores codebases intelligently
- 🔍 **15 Sponsor Detection**: Detects integrations with AWS, Skyflow, Postman, Redis, Forethought, Finster AI, Senso, Anthropic, Sanity, TRM Labs, Coder, Lightpanda, Lightning AI, Parallel, and Cleric
- ⚡ **Job Queue**: Redis-based queue for async processing
- 📊 **Structured Results**: Saves analysis to Sanity CMS
- 💾 **S3 Storage**: Optionally stores repo snapshots in AWS S3
- 🎯 **Smart Scoring**: 0-10 integration depth scores with evidence
- 🔭 **Agent Observatory**: Real-time visualization of agent behavior with detailed logging

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  GitHub     │────▶│   Backend    │────▶│   Sanity    │
│  Repos      │     │   + AI Agent │     │   CMS       │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ├──▶ Redis Queue
                           ├──▶ AWS S3
                           └──▶ Claude API
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` - AI provider (set at least one)
  - Anthropic (Claude) is preferred and used if both are set
  - OpenAI (GPT-4) is used as fallback
- `REDIS_HOST` - Redis server hostname
- `SANITY_PROJECT_ID` - Sanity project ID
- `SANITY_TOKEN` - Sanity write token

Optional:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` - For S3 storage
- `LIGHTNING_API_KEY` - For test execution in sandbox

### 3. Set Up Redis

Install and run Redis locally:

```bash
# macOS
brew install redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

### 4. Set Up Sanity

Create a Sanity project and import the schemas:

```bash
npm install -g @sanity/cli
sanity init

# Copy schemas from backend/sanity-schemas/ to your Sanity project
# Then deploy:
sanity deploy
```

## Usage

### Development

```bash
npm run dev
```

Server runs on http://localhost:3001

### Production

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/analyze

Submit a repository for analysis.

**Request:**
```json
{
  "githubUrl": "https://github.com/username/repo",
  "teamName": "Team Awesome",
  "projectName": "My Hackathon Project",
  "branch": "main"
}
```

**Response:**
```json
{
  "jobId": "abc-123-def",
  "status": "pending",
  "message": "Analysis job created successfully"
}
```

### GET /api/watch/:jobId

**🆕 NEW: Agent Observatory** - Watch the AI agent work in real-time!

Open this URL in your browser to see:
- Visual flow diagram of agent decisions
- Real-time tool calls and results
- Complete logs with full inputs/outputs
- API usage statistics
- Timeline with expandable details

Example: `http://localhost:3001/api/watch/abc-123-def`

See [AGENT_LOGGING.md](./AGENT_LOGGING.md) for full documentation.

**Quick Demo:**
```bash
./scripts/demo-logging.sh
```

### GET /api/status/:jobId

Check job status.

**Response:**
```json
{
  "jobId": "abc-123-def",
  "status": "analyzing",
  "progress": "Running AI agent analysis...",
  "updatedAt": "2024-01-20T10:30:00Z"
}
```

### GET /api/results/:jobId

Get analysis results (when complete).

**Response:**
```json
{
  "teamId": "xyz-789",
  "teamName": "Team Awesome",
  "projectName": "My Hackathon Project",
  "repositoryStats": {
    "mainLanguage": "TypeScript",
    "totalFiles": 42,
    "hasTests": true
  },
  "sponsors": {
    "anthropic": {
      "detected": true,
      "integrationScore": 9,
      "technicalSummary": "Claude API integrated for AI chat feature...",
      "plainEnglishSummary": "The team uses Claude AI to power their chatbot...",
      "prizeEligible": true,
      "confidence": 0.95
    },
    // ... other sponsors
  }
}
```

### GET /api/health

Health check endpoint.

## How It Works

1. **Job Creation**: Client submits GitHub URL, job is queued in Redis
2. **Clone Repo**: Worker clones the repository to temp directory
3. **AI Analysis**: Claude agent explores the codebase using tools:
   - `read_file` - Read file contents
   - `list_directory` - List directory contents
   - `search_code` - Search for patterns using ripgrep
   - `get_file_tree` - Get project structure
   - `read_package_dependencies` - Parse dependency files
4. **Score & Summarize**: Agent scores each sponsor integration (0-10) and writes summaries
5. **Save Results**: Results saved to Sanity CMS and cached in Redis
6. **Cleanup**: Cloned repository deleted

## Sponsor Detection

The agent detects 15 sponsor technologies by looking for:
- Package dependencies (npm, pip, go modules, etc.)
- Import statements
- Configuration files
- Actual code usage
- API calls

Each integration gets:
- Detection status (boolean)
- Integration score (0-10)
- Technical summary (for developers)
- Plain English summary (for non-technical stakeholders)
- Evidence (files, code snippets, findings)
- Prize eligibility recommendation
- Suggestions for improvement

## Project Structure

```
backend/
├── src/
│   ├── agent/
│   │   ├── tools.ts           # AI agent tool implementations
│   │   ├── orchestrator.ts    # Claude agent loop
│   │   └── prompts.ts         # System prompts
│   ├── api/
│   │   ├── server.ts          # Express server
│   │   ├── routes.ts          # API routes
│   │   └── processor.ts       # Job processor
│   ├── services/
│   │   ├── github.ts          # GitHub cloning
│   │   ├── redis.ts           # Redis client & queue
│   │   ├── sanity.ts          # Sanity client
│   │   └── s3.ts              # AWS S3 storage
│   ├── sponsors/
│   │   └── detectors.ts       # Detection patterns
│   └── types.ts               # TypeScript types
├── sanity-schemas/            # Sanity CMS schemas
├── package.json
└── tsconfig.json
```

## Testing

Test with a sample repository:

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl": "https://github.com/username/sample-project",
    "teamName": "Test Team",
    "projectName": "Test Project"
  }'
```

Then check status:

```bash
curl http://localhost:3001/api/status/YOUR_JOB_ID
```

## Deployment

### Option 1: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: AWS/Docker

```bash
# Build Docker image
docker build -t hackathon-analyzer .

# Run
docker run -p 3001:3001 --env-file .env hackathon-analyzer
```

## Cost Estimates

- **Anthropic Claude**: ~$0.50-2 per analysis
- **Redis**: Free (self-hosted) or ~$10/month (managed)
- **AWS S3**: ~$1/month for storage
- **Sanity**: Free tier (generous limits)

## License

MIT

