# Advanced Observability with LangTrace

## Current Logging (Built-in)

The system now has comprehensive logging that shows:

### What You See:
```
================================================================================
📍 ITERATION 1
================================================================================
Messages in conversation: 1
Requesting response from GPT-4...
✓ Response received in 1234ms
Finish reason: tool_calls

🔧 Agent wants to use tools: get_file_tree, read_package_dependencies

  ┌─ Tool 1: get_file_tree
  │ Input: {
  │          "depth": 3
  │        }
  │ Result (456ms, 2345 chars, 45 lines):
  │        .
  │        ├── package.json
  │        ├── src/
  │        │   ├── index.ts
  │        │   └── components/
  │        ... (40 more lines)
  └─ Done

  ┌─ Tool 2: read_package_dependencies
  │ Input: {}
  │ Result (123ms, 1234 chars, 30 lines):
  │        Dependencies found:
  │        
  │        === Node.js (package.json) ===
  │        
  │        Dependencies:
  │        ... (25 more lines)
  └─ Done
```

### Information Displayed:
- ✅ Iteration number and timing
- ✅ Number of messages in conversation
- ✅ Response time from AI
- ✅ Which tools are being used
- ✅ Tool input parameters
- ✅ Tool execution time
- ✅ Tool output preview (first 5 lines)
- ✅ Total chars and lines returned

## Upgrade to LangTrace (Optional)

For even more powerful observability, you can integrate LangTrace:

### What LangTrace Adds:
- 📊 Web UI dashboard
- 🔍 Trace visualization
- 💰 Cost tracking per request
- 📈 Performance analytics
- 🐛 Error tracking
- 🔄 Request replay
- 📝 Prompt versioning

### Installation:

```bash
npm install @langtrace/typescript-sdk
```

### Integration:

1. **Wrap the orchestrator** (`src/agent/orchestrator.ts`):

```typescript
import { Langtrace } from '@langtrace/typescript-sdk';

// Initialize at the top
Langtrace.init({
  api_key: process.env.LANGTRACE_API_KEY
});

// Wrap your analysis function
export async function runAgentAnalysis(...) {
  return await Langtrace.withTrace('agent_analysis', async (span) => {
    span.setAttributes({
      teamName,
      projectName,
      githubUrl
    });
    
    // Your existing code...
  });
}
```

2. **Add to environment**:
```bash
LANGTRACE_API_KEY=your-key-here
```

3. **View traces**:
Visit https://app.langtrace.ai to see:
- Full conversation history
- Token usage per iteration
- Cost breakdown
- Latency metrics
- Error rates

## Alternative: Custom Debug Mode

For local development without external services:

### Add Debug Logging:

Create `src/utils/debug.ts`:

```typescript
const DEBUG = process.env.DEBUG === 'true';

export function logDebug(category: string, data: any) {
  if (!DEBUG) return;
  
  console.log(`\n[DEBUG:${category}]`);
  console.log(JSON.stringify(data, null, 2));
}
```

Use it:

```typescript
import { logDebug } from '../utils/debug';

// Log full prompts
logDebug('PROMPT', { system: systemPrompt, messages });

// Log full responses
logDebug('RESPONSE', response);
```

Run with:
```bash
DEBUG=true npm run dev
```

## Comparison

| Feature | Built-in Logs | LangTrace | Custom Debug |
|---------|--------------|-----------|--------------|
| Setup Time | ✅ Ready | ⏱️ 10 min | ⏱️ 5 min |
| Cost | Free | Paid | Free |
| Web UI | ❌ | ✅ | ❌ |
| Local Only | ✅ | ❌ | ✅ |
| Token Tracking | ❌ | ✅ | Manual |
| Conversation Replay | ❌ | ✅ | ❌ |
| Performance Analytics | Basic | Advanced | Basic |

## Recommendations

### For Hackathon (MVP):
**Use built-in logs** - They're comprehensive and immediate!

### For Production:
**Add LangTrace** - Worth it for:
- Cost monitoring
- Performance optimization
- Debugging production issues
- Team collaboration

### For Development:
**Add custom debug mode** - Good for:
- Seeing full prompts/responses
- Testing prompt changes
- Local development
- No external dependencies

## Current Logs Are Great Because:

1. **Immediate** - No setup needed
2. **Detailed** - See tools, inputs, outputs
3. **Timing** - Know what's slow
4. **Free** - No external service
5. **Portable** - Works anywhere

## Try It Now!

Restart your backend and watch the detailed logs:

```bash
cd backend
npm run dev

# Watch the beautiful logs! 🎨
```

You'll see exactly what the agent is thinking and doing!

## Save Logs for Analysis

Capture logs to file:

```bash
npm run dev 2>&1 | tee analysis.log
```

Then analyze:
```bash
# Find all tool calls
grep "Tool.*:" analysis.log

# Find slow operations
grep "ms" analysis.log | sort -t'(' -k2 -n

# Count iterations
grep "ITERATION" analysis.log | wc -l
```

---

**Bottom line**: The built-in logs are now very comprehensive! LangTrace is nice-to-have but not necessary for MVP. 🚀

