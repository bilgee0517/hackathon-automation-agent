# Hackathon Agent - Mock AI Analysis Service

This is a standalone mock AI agent that simulates a remote analysis service. It demonstrates how an external service can inject project analysis data into your Sanity database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from the example:
```bash
cp .env.example .env
```

3. Add your Sanity credentials to `.env`:
   - Get your project ID from Sanity Studio
   - Create a write token at https://sanity.io/manage (needs Editor permissions)

## Usage

Run the agent to inject test data:
```bash
npm run inject
```

Test Sanity connection:
```bash
npm run test
```

## What it does

1. Creates 3 team members (hackers)
2. Creates a new project "CryptoGuard Pro" with:
   - Full analysis data
   - Sponsor integrations (TRM, Redis, Postman)
   - GitHub metadata
3. Creates judge notes for the project

## Verification

After running:
- Check Sanity Studio at http://localhost:3333
- Check Frontend Dashboard at http://localhost:3000
- The new project should appear with all data

