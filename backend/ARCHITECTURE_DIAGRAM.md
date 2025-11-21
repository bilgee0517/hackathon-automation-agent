# Architecture Diagram: Lightning AI Integration

## Two-Agent Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                      HACKATHON AUTOMATION AGENT                    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  1. MAIN ORCHESTRATOR (Existing - Unchanged)                      │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  • Claude/OpenAI powered                                          │
│  • Static code analysis                                           │
│  • Pattern detection                                              │
│  • Dependency scanning                                            │
│  • 2-3 min execution time                                         │
│                                                                    │
│  Tools:                                                           │
│  - read_file()                                                    │
│  - search_code()                                                  │
│  - list_directory()                                               │
│  - read_package_dependencies()                                    │
│  - recall_learnings()                                             │
│  - search_web()                                                   │
│                                                                    │
│  Output: Initial Analysis + Scores                               │
│                                                                    │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         │ Detects: Anthropic (8/10), Redis (7/10)
                         │
                         ↓
┌───────────────────────────────────────────────────────────────────┐
│  FEATURE FLAG CHECK                                                │
│  if (ENABLE_LIGHTNING_EXECUTION === true)                         │
│     → Delegate to Lightning Agent                                 │
│  else                                                              │
│     → Return static analysis                                      │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         │ Lightning Enabled
                         │
                         ↓
┌───────────────────────────────────────────────────────────────────┐
│  2. LIGHTNING EXECUTION AGENT (New - Optional)                    │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  • Claude powered (separate instance)                             │
│  • Cloud execution                                                │
│  • Integration validation                                         │
│  • Real-time testing                                              │
│  • 3-5 min execution time                                         │
│                                                                    │
│  Workflow:                                                        │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ 1. Create Execution Plan (AI)                       │         │
│  │    • Which environment? (Python/Node/Go)            │         │
│  │    • What commands? (install/test/start)            │         │
│  │    • Which endpoints to test?                       │         │
│  │    • Should we execute? (safety check)              │         │
│  └─────────────────────────────────────────────────────┘         │
│                         ↓                                          │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ 2. Create Lightning AI Studio                       │         │
│  │    • Isolated cloud environment                     │         │
│  │    • Upload repository                              │         │
│  └─────────────────────────────────────────────────────┘         │
│                         ↓                                          │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ 3. Install Dependencies                             │         │
│  │    • npm install / pip install                      │         │
│  │    • Capture logs                                   │         │
│  └─────────────────────────────────────────────────────┘         │
│                         ↓                                          │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ 4. Run Tests                                        │         │
│  │    • npm test / pytest                              │         │
│  │    • Count pass/fail                                │         │
│  │    • Capture output                                 │         │
│  └─────────────────────────────────────────────────────┘         │
│                         ↓                                          │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ 5. Start Application                                │         │
│  │    • npm start / python app.py                      │         │
│  │    • Wait for startup                               │         │
│  │    • Get app URL                                    │         │
│  └─────────────────────────────────────────────────────┘         │
│                         ↓                                          │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ 6. Test API Endpoints                               │         │
│  │    • GET /api/health                                │         │
│  │    • POST /api/chat (validate Claude integration)   │         │
│  │    • GET /api/stats (validate Redis integration)    │         │
│  │    • Measure response times                         │         │
│  └─────────────────────────────────────────────────────┘         │
│                         ↓                                          │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ 7. AI Analysis of Results                           │         │
│  │    • Did integrations work?                         │         │
│  │    • Any errors?                                    │         │
│  │    • Performance acceptable?                        │         │
│  │    • Generate verification notes                    │         │
│  └─────────────────────────────────────────────────────┘         │
│                         ↓                                          │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ 8. Cleanup                                          │         │
│  │    • Delete studio                                  │         │
│  │    • Return ExecutionResults                        │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                    │
│  Output: Execution Results + Evidence                             │
│                                                                    │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         │ Returns execution data
                         │
                         ↓
┌───────────────────────────────────────────────────────────────────┐
│  3. RESULT SYNTHESIS (New Logic in Main Orchestrator)            │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Combines Static + Execution Results:                             │
│                                                                    │
│  For each detected sponsor:                                       │
│  ┌─────────────────────────────────────────────────────┐         │
│  │ • Attach execution results                          │         │
│  │ • Adjust scores:                                    │         │
│  │   - Boost (+1) if execution verified                │         │
│  │   - Lower (-2) if endpoints failed                  │         │
│  │ • Increase confidence                               │         │
│  │ • Enhance technical summary                         │         │
│  │ • Add verification notes                            │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                    │
│  Add execution summary to analysis                                │
│                                                                    │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         ↓
┌───────────────────────────────────────────────────────────────────┐
│  FINAL ANALYSIS RESULT                                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  {                                                                │
│    "teamName": "TeamAwesome",                                     │
│    "sponsors": {                                                  │
│      "anthropic": {                                               │
│        "integrationScore": 9,  // ← Was 8, boosted               │
│        "confidence": 1.0,       // ← Was 0.8, increased          │
│        "executionResults": {    // ← NEW!                        │
│          "tested": true,                                          │
│          "appStarted": true,                                      │
│          "endpointsTested": [...],                               │
│          "verificationNotes": "..."                              │
│        }                                                          │
│      }                                                            │
│    },                                                             │
│    "executionSummary": {       // ← NEW!                         │
│      "enabled": true,                                             │
│      "success": true,                                             │
│      "cloudPlatform": "Lightning AI"                             │
│    }                                                              │
│  }                                                                │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. **Non-Disruptive**
```
Static Analysis (Existing)
  ↓
  Always completes ✅
  ↓
  Returns results ✅
```

### 2. **Optional Enhancement**
```
if (Lightning Enabled) {
  Run execution agent ⚡
  Enhance results with execution data
} else {
  Return static results only
}
```

### 3. **Fail-Safe**
```
try {
  Lightning execution
} catch (error) {
  Log error
  Continue with static results ✅
}
```

### 4. **Separate Concerns**
```
Main Orchestrator:     Static analysis (what's in the code)
Lightning Agent:       Execution validation (does it work)
Synthesis:            Combine both perspectives
```

## Data Flow

```
GitHub Repo
    ↓
[Clone & Scan]
    ↓
Main Orchestrator
    ↓
Static Analysis
    ├→ Sponsors detected
    ├→ Initial scores
    ├→ Pattern-based evidence
    ↓
    ├─→ if (Lightning disabled) → Return static results
    ↓
Lightning Execution Agent
    ├→ Create cloud environment
    ├→ Install & test
    ├→ Start & validate
    ├→ Collect evidence
    ↓
Synthesis Layer
    ├→ Adjust scores
    ├→ Increase confidence
    ├→ Add execution proof
    ↓
Enhanced Analysis Result
    ├→ Saved to Sanity CMS
    ├→ Cached in Redis
    ├→ Returned to client
    ↓
Judges / Dashboard
```

## File Structure

```
backend/src/
├── agent/
│   ├── orchestrator.ts           # Main agent (existing)
│   ├── lightning-executor.ts     # NEW: Lightning agent
│   ├── tools.ts                  # Static analysis tools
│   └── prompts.ts                # AI prompts
├── services/
│   ├── lightning.ts              # NEW: Lightning AI service
│   ├── redis.ts                  # Job queue
│   ├── sanity.ts                 # Results storage
│   └── github.ts                 # Repo cloning
└── types.ts                      # NEW: Extended with ExecutionResults
```

## Environment Variables

```bash
# Existing (Required)
ANTHROPIC_API_KEY=xxx
REDIS_HOST=localhost

# NEW (Optional for Lightning)
ENABLE_LIGHTNING_EXECUTION=false   # Feature flag
LIGHTNING_API_KEY=yyy              # Lightning AI credentials
```

## Benefits of This Architecture

✅ **Zero Breaking Changes**: Existing functionality untouched
✅ **Feature Flag**: Easy to enable/disable
✅ **Fail-Safe**: Execution errors don't break analysis
✅ **Separation of Concerns**: Two specialized agents
✅ **Incremental Enhancement**: Static first, execution second
✅ **Clear Delegation**: Main agent delegates, doesn't execute itself
✅ **Evidence-Based**: Execution provides real proof
✅ **Maintainable**: Each agent has clear responsibility

