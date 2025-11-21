# Quick Test Commands

## Test the API

### Basic test with default repo:
```bash
node scripts/test-api.js
```

### Test with a specific repository:
```bash
node scripts/test-api.js https://github.com/username/repo
```

### Test with verbose output (see backend logs):
```bash
# Terminal 1: Run backend with logs
npm run dev

# Terminal 2: Run test
node scripts/test-api.js https://github.com/anthropics/anthropic-sdk-typescript
```

## Manual Testing with curl

### 1. Check health:
```bash
curl http://localhost:3001/api/health
```

### 2. Submit analysis:
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl": "https://github.com/anthropics/anthropic-sdk-typescript",
    "teamName": "Test Team",
    "projectName": "Test Project"
  }'
```

Response:
```json
{
  "jobId": "abc-123-def",
  "status": "pending",
  "message": "Analysis job created successfully"
}
```

### 3. Check status:
```bash
curl http://localhost:3001/api/status/abc-123-def
```

Response while processing:
```json
{
  "jobId": "abc-123-def",
  "status": "analyzing",
  "progress": "Using tool: read_file",
  "updatedAt": "2024-01-20T10:30:00Z"
}
```

### 4. Get results (when complete):
```bash
curl http://localhost:3001/api/results/abc-123-def
```

## Debugging

### Check what's in Redis:
```bash
redis-cli
> KEYS job:*
> GET job:abc-123-def
```

### Check backend logs:
The backend now shows comprehensive logs:
- Agent iterations
- Tool usage with previews
- JSON parsing details
- Error context

See `LOGGING.md` for details.

## Expected Output

You should see:
1. ✓ Health check passes
2. ✓ Job created with ID
3. ⏳ Status updates (pending → analyzing → complete)
4. 📊 Full analysis results with:
   - Repository stats
   - Sponsor integrations (0-15 detected)
   - Scores for each sponsor
   - Technical + plain English summaries
   - Prize eligibility

## Common Issues

### "Job undefined"
- Backend not running
- Wrong API URL
- Check `npm run dev` is active

### "Status undefined"
- Redis not running
- Run: `redis-server`

### "Analysis failed"
- Check backend logs for details
- No AI API key set
- Repository clone failed

### Takes too long
- Large repos take 2-5 minutes
- Check backend logs for progress
- Agent exploring the codebase

