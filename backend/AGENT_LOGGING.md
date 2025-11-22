# Enhanced Agent Logging & Observatory

## Overview

The backend now includes comprehensive logging for the AI agent analysis process. You can watch the agent in real-time and see exactly what it's doing at every step.

## Accessing the Agent Observatory

### Live Watch Dashboard

Visit: `http://localhost:3001/api/watch/{jobId}`

Replace `{jobId}` with the actual job ID returned when you submit an analysis.

Example:
```
http://localhost:3001/api/watch/abc123-def456-ghi789
```

## Features

### 1. **Real-Time Flow Visualization**
- Visual representation of the agent's decision-making process
- Shows tool calls, API requests, and results in real-time
- Color-coded nodes for different types of actions:
  - 🤖 **Agent** (purple) - Main agent decisions
  - 🔧 **Tools** (yellow) - Tool executions
  - ✅ **Results** (green) - Successful completions
  - ⚡ **Lightning** (purple) - Cloud execution
  - ❌ **Errors** (red) - Failed operations

### 2. **Detailed Timeline**
- Expandable timeline items with full details
- Click on any item to see:
  - Full tool inputs (JSON)
  - Complete tool outputs
  - API request/response details
  - Parsing information
- Timestamps showing elapsed time from start

### 3. **Full Logs Panel**
- Terminal-style log output
- Color-coded by event type:
  - Blue: API requests/responses
  - Green: Tool calls
  - Orange: Results
  - Cyan: Thinking/parsing
  - Red: Errors
- Shows complete data including:
  - Full tool inputs and outputs
  - API usage statistics
  - Response lengths and timings
  - All intermediate steps

### 4. **Log Controls**
- **Show/Hide Full Logs**: Toggle the detailed logs panel
- **Download Logs**: Save all logs to a text file
- **Clear View**: Clear the visual display (doesn't delete logs)
- **Auto-scroll**: Toggle automatic scrolling to latest events

## Event Types

### Core Events
- `start` - Analysis begins
- `iteration` - New agent iteration
- `api_request` - Request to Claude API
- `api_response` - Response from Claude API
- `tool_call` - Agent calls a tool
- `tool_result` - Tool execution complete
- `parsing` - Parsing agent response
- `complete` - Analysis finished
- `error` - Error occurred

### Lightning Execution Events
- `lightning_start` - Lightning execution begins
- `lightning_action` - Lightning performing action
- `lightning_result` - Lightning execution complete

## Statistics Dashboard

Real-time metrics displayed at the top:
- **Status**: Current state (Running/Complete/Error)
- **Events**: Total number of events emitted
- **Duration**: Total elapsed time
- **Iteration**: Current iteration number

## Example Usage

1. Submit an analysis:
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl": "https://github.com/user/repo",
    "teamName": "My Team",
    "projectName": "My Project"
  }'
```

2. Get the job ID from the response:
```json
{
  "jobId": "abc123-def456-ghi789",
  "status": "pending"
}
```

3. Open the observatory:
```
http://localhost:3001/api/watch/abc123-def456-ghi789
```

4. Watch the agent work in real-time!

## Detailed Log Output

The full logs show comprehensive information:

```
[0.50s] 🌐 API REQUEST to Claude (claude-3-5-haiku-20241022)
  - Messages: 1
  - Max tokens: 8000
  - Tools available: 12

[2.34s] 📥 API RESPONSE (1840ms)
  - Stop reason: tool_use
  - Content blocks: 3
  - Usage: {"input_tokens":2341,"output_tokens":543}

[2.35s] 🔧 TOOL CALL: read_file (1/2)
  Input:
{
  "path": "src/index.ts"
}

[2.67s] ✅ TOOL RESULT: read_file (320ms)
  - Length: 4523 chars, 143 lines
  Result:
import express from 'express';
...
```

## Event Streaming

The observatory uses Server-Sent Events (SSE) for real-time updates:
- Historical events are sent immediately on connection
- New events stream in as they occur
- Keep-alive pings every 30 seconds
- Automatic reconnection on disconnect

## Tips

1. **Keep the observatory open** while running analyses to see the full process
2. **Click timeline items** to expand and see full details
3. **Download logs** for detailed debugging or analysis
4. **Watch the flow diagram** to understand the agent's decision-making process
5. **Check API usage** in the detailed logs to optimize token consumption

## Troubleshooting

### Observatory not updating?
- Check that the job ID is correct
- Ensure the backend is running
- Check browser console for connection errors

### Can't see old logs?
- Logs are stored in memory (up to 1000 events per job)
- Download logs before restarting the server
- Historical events are sent on connection

### Want more detail?
- All events include full data in the `data` field
- Tool results include complete output (not truncated)
- API responses include token usage stats
- Click timeline items to expand full details

## Architecture

The logging system consists of:
1. **Event Emitter** (`dashboard.ts`) - Central event hub
2. **Agent Integration** - Events emitted from orchestrator and executors
3. **SSE Endpoint** - Real-time event streaming
4. **HTML Dashboard** - Visual interface with JavaScript handling

Events flow:
```
Agent → emitAgentEvent() → EventEmitter → SSE → Browser → UI
```

## Future Enhancements

Potential improvements:
- [ ] Persistent log storage (database/file)
- [ ] Log search and filtering
- [ ] Export to JSON format
- [ ] Performance analytics
- [ ] Agent decision explanations
- [ ] Comparison between runs

