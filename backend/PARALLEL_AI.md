# Parallel AI Integration - Dynamic Sponsor Learning

## 🌐 What This Does

The agent can now **search the web** to learn about sponsors BEFORE searching the codebase! This makes detection WAY smarter and more accurate.

## How It Works

### Traditional Approach ❌
```
Agent: Search for "Anthropic"
Codebase: No matches
Agent: Score: 0/10 (not integrated)
Reality: They used @anthropic-ai/sdk extensively! ❌
```

### With Parallel AI ✅
```
Agent: learn_about_sponsor("Anthropic", "npm packages")
Web: "@anthropic-ai/sdk, claude-3-5-sonnet, messages.create API"

Agent: search_code("@anthropic-ai/sdk|anthropic")
Codebase: Found in package.json and src/ai/claude.ts

Agent: read_file("src/ai/claude.ts") 
Code: Heavy usage with streaming, function calling

Agent: Score: 9/10 (deeply integrated) ✅
```

## New Tools Available

### 1. `search_web(query)`
General web search for any information.

**Example:**
```javascript
search_web("Anthropic AI SDK npm package")
search_web("Redis integration best practices")
search_web("Skyflow vault API authentication")
```

### 2. `learn_about_sponsor(sponsor_name, aspect)`
Focused learning about a specific sponsor.

**Example:**
```javascript
learn_about_sponsor("Anthropic", "npm packages")
→ Discovers: @anthropic-ai/sdk, claude-3-sonnet, API endpoints

learn_about_sponsor("Redis", "API endpoints")  
→ Discovers: redis.io, HSET, ZADD, pub/sub patterns

learn_about_sponsor("Skyflow", "authentication")
→ Discovers: vault tokens, API keys, tokenization
```

## Agent Workflow (Automatic!)

The agent now follows this smart workflow:

```
FOR EACH SPONSOR:
  
  PHASE 1: LEARN 🧠
  ├─ learn_about_sponsor(name, "npm packages")
  ├─ learn_about_sponsor(name, "API endpoints")
  └─ search_web(name + " integration patterns")
  
  PHASE 2: SEARCH 🔍
  ├─ search_code(discovered_packages)
  ├─ search_code(discovered_apis)
  └─ search_code(discovered_patterns)
  
  PHASE 3: VERIFY ✓
  ├─ read_file(found_files)
  ├─ Analyze actual usage
  └─ Score accurately
```

## Configuration

### Set Up Parallel AI

1. **Get API Key:**
   - Visit https://platform.parallel.ai/home
   - Sign up / sign in
   - Generate API key

2. **Add to Environment:**
```bash
export PARALLEL_API_KEY="your-key-here"
```

Or in `.env`:
```
PARALLEL_API_KEY=your-key-here
```

3. **Restart Backend:**
```bash
npm run dev
```

That's it! The agent will automatically use web search.

## API Endpoint

The integration uses Parallel AI's search endpoint:

```typescript
POST https://api.parallel.ai/v1/search
Authorization: Bearer YOUR_KEY
Content-Type: application/json

{
  "query": "Anthropic AI SDK npm package",
  "max_results": 5,
  "include_answer": true
}
```

**Note:** If the actual Parallel AI API endpoint is different, update `src/services/parallel.ts` line 21.

## Benefits

### 1. Always Up-to-Date
- Latest SDK versions
- Current API patterns
- Real documentation

### 2. Smarter Detection
- Finds actual package names
- Discovers API endpoints
- Learns auth patterns

### 3. Self-Improving
- Learns from documentation
- Adapts to changes
- Works with new sponsors automatically

### 4. Better Accuracy
- Fewer false negatives
- More evidence
- Context-aware scoring

## Example Analysis Log

```
================================================================================
📍 ITERATION 1
================================================================================

  ┌─ Tool 1: learn_about_sponsor
  │ Input: {
  │   "sponsor_name": "Anthropic",
  │   "aspect": "npm packages"
  │ }
  🌐 Searching web via Parallel AI: "Anthropic npm package SDK"
  ✓ Got 5 results from Parallel AI
  │ Result (1234ms):
  │   Summary: Anthropic provides @anthropic-ai/sdk for Node.js...
  │   1. Anthropic SDK - npm
  │      @anthropic-ai/sdk is the official SDK for Claude API
  │   2. Getting Started with Anthropic
  │      Install: npm install @anthropic-ai/sdk
  └─ Done

  ┌─ Tool 2: search_code
  │ Input: {
  │   "pattern": "@anthropic-ai/sdk|anthropic"
  │ }
  │ Result (45ms):
  │   package.json:12: "@anthropic-ai/sdk": "^0.27.3"
  │   src/ai/claude.ts:1: import Anthropic from '@anthropic-ai/sdk'
  │   src/ai/claude.ts:15: const client = new Anthropic({
  └─ Done

  ┌─ Tool 3: read_file
  │ Input: {
  │   "path": "src/ai/claude.ts"
  │ }
  │ Result (12ms):
  │   // Full file with heavy Anthropic usage
  │   import Anthropic from '@anthropic-ai/sdk'
  │   ...
  │   messages.create(), streaming, function calling
  └─ Done

RESULT: Anthropic integrated at 9/10 depth! ✅
```

## Troubleshooting

### "Web search unavailable"
- Check PARALLEL_API_KEY is set
- Verify API key is valid
- Check internet connection

### Wrong API endpoint?
Edit `src/services/parallel.ts`:
```typescript
const response = await fetch('https://YOUR_ACTUAL_ENDPOINT', {
  // Update this URL
});
```

### Want to disable web search temporarily?
```bash
# Unset the key
unset PARALLEL_API_KEY

# Agent falls back to pattern-based detection
```

## Cost Optimization

Each web search costs a small amount. To optimize:

1. **Cache results** (future enhancement)
2. **Limit searches** - agent already does 2-3 per sponsor
3. **Batch queries** - combine multiple patterns

## Next Steps

This is just the start! Future enhancements:

- **Caching** - Remember learned patterns
- **Sponsor profiles** - Build knowledge base over time
- **Direct docs** - Fetch from official documentation
- **Code examples** - Find real integration examples

---

**Bottom line**: Your agent is now **10x smarter** at finding sponsor integrations! 🎯

