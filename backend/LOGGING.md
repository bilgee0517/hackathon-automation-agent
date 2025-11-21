# Comprehensive Logging Guide

## What You'll See Now

The system now provides detailed logging at every step of the analysis process:

### 1. Agent Iterations
```
--- Agent Iteration 1 ---
Stop reason: tool_use
```
You'll see exactly which iteration the agent is on and why it stopped (tool_use, end_turn, etc.)

### 2. Tool Execution
```
🔧 Executing tool: read_file
   Input: {"path":"package.json"}...
   ✓ Result: File: package.json (42 lines)...
```
Shows:
- Which tool is being used
- What input parameters were provided
- Preview of the result

### 3. Analysis Completion
```
✓ Agent completed analysis
Response length: 15234 characters
Response preview: {
  "repositoryStats": {
    "mainLanguage": "TypeScript",
  ...
```
Shows:
- When analysis completes
- Size of the response
- Preview of the JSON

### 4. JSON Parsing
```
📝 Parsing agent response...
✓ Found JSON in markdown code block
JSON text length: 15000
JSON preview (first 300 chars): {...}
✓ JSON parsed successfully
✓ Analysis structure validated
```
Shows:
- How JSON was extracted
- Size and preview
- Validation results

### 5. Error Details (if any)
```
❌ JSON Parse Error: Unexpected token
Context around error position:
..."sponsors": {"aws": {detected: true}...
```
Shows:
- Exact error message
- Context around where parsing failed
- First and last 500 chars of response if boundaries can't be found

## Progress Updates

Instead of generic "step 2", you'll now see:
- `Iteration 1: Thinking...`
- `Using tool: read_file`
- `Using tool: search_code`
- `Parsing analysis results...`
- `Analysis complete!`

## Server Console Logs

When running the server, you'll see detailed logs like:

```
🤖 Using AI provider: Claude (Anthropic)

--- Agent Iteration 1 ---
Stop reason: tool_use
🔧 Executing tool: get_file_tree
   Input: {"depth":3}...
   ✓ Result: .
├── package.json
├── src/
│   ├── index.ts...

--- Agent Iteration 2 ---
Stop reason: tool_use
🔧 Executing tool: read_package_dependencies
   Input: {}...
   ✓ Result: Dependencies found:

=== Node.js (package.json) ===...

--- Agent Iteration 15 ---
Stop reason: end_turn

✓ Agent completed analysis
Response length: 12456 characters
Response preview: {"repositoryStats":{"mainLanguage":"TypeScript"...

📝 Parsing agent response...
✓ Found JSON in markdown code block
JSON text length: 12400
✓ JSON parsed successfully
✓ Analysis structure validated
```

## Benefits

1. **Debug Issues Faster**: See exactly where the agent fails
2. **Understand Agent Behavior**: Know which tools it chooses to use
3. **Monitor Progress**: Real-time updates on what's happening
4. **Troubleshoot JSON**: Detailed error context when parsing fails

## Common Issues You Can Now Debug

### Issue: Agent gets stuck
**What you'll see**: Same iteration repeating, same tools being called
**Solution**: Check if the tool is returning useful results

### Issue: JSON parsing fails
**What you'll see**: Exact position and context of the error
**Solution**: Look at the response preview to see what the agent actually returned

### Issue: Missing analysis fields
**What you'll see**: Warnings about missing repositoryStats or sponsors
**Solution**: Check the system prompt or add guidance for that field

## Next Steps

Try running the analysis again and watch the detailed logs:

```bash
npm run dev
# In another terminal:
node scripts/test-api.js https://github.com/username/repo
```

You'll now see every step of what the AI agent is doing! 🎯

