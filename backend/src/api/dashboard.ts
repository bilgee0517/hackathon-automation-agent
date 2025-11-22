// Agent Observatory - Dashboard routes for watching agent in real-time
// Provides live visualization of agent analysis flow

import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';

const router = Router();

// Global event emitter for agent events
export const agentEventEmitter = new EventEmitter();
agentEventEmitter.setMaxListeners(100); // Support many concurrent viewers

interface AgentEvent {
  jobId: string;
  timestamp: number;
  type: 'start' | 'iteration' | 'tool_call' | 'tool_result' | 'decision' | 'thinking' | 'lightning_start' | 'lightning_action' | 'lightning_result' | 'test_generation' | 'complete' | 'error' | 'api_request' | 'api_response' | 'parsing' | 'validation';
  agent: 'main' | 'lightning' | 'test-generator';
  data: any;
}

// Store recent events per job (for late joiners)
const jobEventHistory = new Map<string, AgentEvent[]>();
const MAX_HISTORY_PER_JOB = 1000;

/**
 * Emit an agent event
 */
export function emitAgentEvent(event: AgentEvent) {
  // Store in history
  if (!jobEventHistory.has(event.jobId)) {
    jobEventHistory.set(event.jobId, []);
  }
  
  const history = jobEventHistory.get(event.jobId)!;
  history.push(event);
  
  // Limit history size
  if (history.length > MAX_HISTORY_PER_JOB) {
    history.shift();
  }
  
  // Emit to listeners
  agentEventEmitter.emit(`job:${event.jobId}`, event);
  agentEventEmitter.emit('all', event);
}

/**
 * GET /watch/:jobId - Serve the agent visualization page
 */
router.get('/watch/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  
  // Serve the HTML page
  res.send(getAgentWatchHTML(jobId));
});

/**
 * GET /watch/:jobId/stream - SSE endpoint for real-time events
 */
router.get('/watch/:jobId/stream', (req: Request, res: Response) => {
  const { jobId } = req.params;
  
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  // Send historical events first
  const history = jobEventHistory.get(jobId) || [];
  for (const event of history) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
  
  // Listen for new events
  const eventHandler = (event: AgentEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  
  agentEventEmitter.on(`job:${jobId}`, eventHandler);
  
  // Cleanup on close
  req.on('close', () => {
    agentEventEmitter.off(`job:${jobId}`, eventHandler);
    res.end();
  });
  
  // Keep alive ping every 30s
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

/**
 * GET /watch - List all active jobs
 */
router.get('/watch', (_req: Request, res: Response) => {
  const activeJobs = Array.from(jobEventHistory.keys()).map(jobId => {
    const events = jobEventHistory.get(jobId)!;
    const lastEvent = events[events.length - 1];
    
    return {
      jobId,
      status: lastEvent.type === 'complete' ? 'completed' : lastEvent.type === 'error' ? 'failed' : 'active',
      lastActivity: new Date(lastEvent.timestamp).toISOString(),
      eventCount: events.length
    };
  });
  
  res.json({ jobs: activeJobs });
});

/**
 * Helper: Generate HTML for agent watch page
 */
function getAgentWatchHTML(jobId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Observatory - ${jobId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      font-size: 28px;
      color: #667eea;
      margin-bottom: 8px;
    }
    
    .header .job-id {
      font-size: 14px;
      color: #666;
      font-family: monospace;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    
    .stat {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-top: 4px;
    }
    
    .flow-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow-x: auto;
    }
    
    .flow-diagram {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 500px;
    }
    
    .flow-row {
      display: flex;
      align-items: center;
      gap: 16px;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .node {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 16px 20px;
      min-width: 200px;
      position: relative;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .node.agent {
      border-color: #667eea;
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    }
    
    .node.tool {
      border-color: #f59e0b;
      background: #fef3c7;
    }
    
    .node.result {
      border-color: #10b981;
      background: #d1fae5;
    }
    
    .node.lightning {
      border-color: #8b5cf6;
      background: #ede9fe;
    }
    
    .node.error {
      border-color: #ef4444;
      background: #fee2e2;
    }
    
    .node.active {
      animation: pulse 2s infinite;
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.02);
      }
    }
    
    .node-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .node-icon {
      font-size: 20px;
    }
    
    .node-title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
    }
    
    .node-content {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }
    
    .node-time {
      font-size: 11px;
      color: #999;
      margin-top: 8px;
      font-family: monospace;
    }
    
    .arrow {
      font-size: 24px;
      color: #cbd5e1;
      flex-shrink: 0;
    }
    
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    
    .status-badge.running {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-badge.success {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-badge.error {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .timeline {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .timeline-item {
      font-size: 13px;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
    }
    
    .timeline-item:last-child {
      border-bottom: none;
    }
    
    .timeline-time {
      font-family: monospace;
      color: #999;
      font-size: 11px;
      min-width: 60px;
    }
    
    .timeline-text {
      color: #666;
      flex: 1;
    }
    
    .timeline-item.expandable {
      cursor: pointer;
      background: #fff;
      padding: 12px;
      border-radius: 6px;
      margin: 4px 0;
      border: 1px solid #e0e0e0;
      transition: all 0.2s;
    }
    
    .timeline-item.expandable:hover {
      background: #f8f9fa;
      border-color: #667eea;
    }
    
    .expand-icon {
      color: #667eea;
      font-weight: bold;
      margin-right: 8px;
    }
    
    .detail-panel {
      display: none;
      margin-top: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #667eea;
      font-family: monospace;
      font-size: 11px;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .detail-panel.visible {
      display: block;
    }
    
    .log-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-top: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .log-section h2 {
      font-size: 18px;
      color: #667eea;
      margin-bottom: 16px;
    }
    
    .log-controls {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .log-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }
    
    .log-button:hover {
      background: #5568d3;
    }
    
    .log-button.secondary {
      background: #e0e0e0;
      color: #333;
    }
    
    .log-button.secondary:hover {
      background: #d0d0d0;
    }
    
    .full-logs {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      max-height: 500px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .log-line {
      margin-bottom: 4px;
      line-height: 1.5;
    }
    
    .log-line.tool {
      color: #4ec9b0;
    }
    
    .log-line.result {
      color: #ce9178;
    }
    
    .log-line.api {
      color: #569cd6;
    }
    
    .log-line.thinking {
      color: #9cdcfe;
    }
    
    .log-line.error {
      color: #f48771;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧠 Agent Observatory</h1>
      <div class="job-id">Job ID: ${jobId}</div>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Status</div>
          <div class="stat-value" id="status">Connecting...</div>
        </div>
        <div class="stat">
          <div class="stat-label">Events</div>
          <div class="stat-value" id="eventCount">0</div>
        </div>
        <div class="stat">
          <div class="stat-label">Duration</div>
          <div class="stat-value" id="duration">0s</div>
        </div>
        <div class="stat">
          <div class="stat-label">Iteration</div>
          <div class="stat-value" id="iteration">0</div>
        </div>
      </div>
    </div>
    
    <div class="flow-container">
      <div class="flow-diagram" id="flowDiagram">
        <div class="empty-state">
          <div class="empty-state-icon">🔄</div>
          <div>Waiting for agent to start...</div>
        </div>
      </div>
      
      <div class="timeline" id="timeline"></div>
    </div>
    
    <div class="log-section">
      <h2>📋 Detailed Logs</h2>
      <div class="log-controls">
        <button class="log-button" onclick="toggleFullLogs()">Show/Hide Full Logs</button>
        <button class="log-button secondary" onclick="downloadLogs()">Download Logs</button>
        <button class="log-button secondary" onclick="clearLogs()">Clear View</button>
        <button class="log-button secondary" onclick="autoScroll = !autoScroll; this.textContent = autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'">Auto-scroll: ON</button>
      </div>
      <div class="full-logs" id="fullLogs" style="display: none;"></div>
    </div>
  </div>

  <script>
    const jobId = '${jobId}';
    const eventSource = new EventSource('/api/watch/' + jobId + '/stream');
    
    let eventCount = 0;
    let startTime = null;
    let currentIteration = 0;
    let autoScroll = true;
    let allLogs = [];
    
    const flowDiagram = document.getElementById('flowDiagram');
    const timeline = document.getElementById('timeline');
    const fullLogs = document.getElementById('fullLogs');
    const statusEl = document.getElementById('status');
    const eventCountEl = document.getElementById('eventCount');
    const durationEl = document.getElementById('duration');
    const iterationEl = document.getElementById('iteration');
    
    // Update duration counter
    setInterval(() => {
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        durationEl.textContent = minutes > 0 ? \`\${minutes}m \${seconds}s\` : \`\${seconds}s\`;
      }
    }, 1000);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleEvent(data);
    };
    
    eventSource.onerror = () => {
      statusEl.textContent = 'Disconnected';
      statusEl.className = 'stat-value error';
    };
    
    function handleEvent(event) {
      if (!startTime && event.type === 'start') {
        startTime = event.timestamp;
        flowDiagram.innerHTML = '';
      }
      
      eventCount++;
      eventCountEl.textContent = eventCount;
      
      if (event.type === 'iteration') {
        currentIteration = event.data.iteration;
        iterationEl.textContent = currentIteration;
      }
      
      // Update status
      updateStatus(event);
      
      // Add to flow diagram
      addFlowNode(event);
      
      // Add to timeline
      addTimelineItem(event);
      
      // Add to detailed logs
      addDetailedLog(event);
    }
    
    function addDetailedLog(event) {
      const elapsed = startTime ? ((event.timestamp - startTime) / 1000).toFixed(2) : '0.00';
      let logClass = '';
      let logText = '';
      
      switch (event.type) {
        case 'api_request':
          logClass = 'api';
          logText = \`[\${elapsed}s] 🌐 API REQUEST to Claude (\${event.data.model})\n  - Messages: \${event.data.messageCount}\n  - Max tokens: \${event.data.max_tokens}\n  - Tools available: \${event.data.toolsAvailable}\`;
          break;
          
        case 'api_response':
          logClass = 'api';
          logText = \`[\${elapsed}s] 📥 API RESPONSE (\${event.data.duration}ms)\n  - Stop reason: \${event.data.stopReason}\n  - Content blocks: \${event.data.contentBlocks}\n  - Usage: \${JSON.stringify(event.data.usage)}\`;
          break;
          
        case 'tool_call':
          logClass = 'tool';
          logText = \`[\${elapsed}s] 🔧 TOOL CALL: \${event.data.tool} (\${event.data.toolIndex}/\${event.data.totalTools})\n  Input:\n\${event.data.inputFull}\`;
          break;
          
        case 'tool_result':
          logClass = 'result';
          logText = \`[\${elapsed}s] ✅ TOOL RESULT: \${event.data.tool} (\${event.data.duration}ms)\n  - Length: \${event.data.resultLength} chars, \${event.data.resultLines} lines\n  Result:\n\${event.data.resultFull.substring(0, 2000)}\${event.data.resultLength > 2000 ? '\\n  ... (truncated, see full result below)' : ''}\`;
          break;
          
        case 'parsing':
          logClass = 'thinking';
          logText = \`[\${elapsed}s] 📝 PARSING response (\${event.data.responseLength} chars)\n  Preview: \${event.data.responsePreview}...\`;
          break;
          
        case 'iteration':
          logClass = 'thinking';
          logText = \`[\${elapsed}s] 📍 ITERATION \${event.data.iteration} (Messages: \${event.data.messageCount})\`;
          break;
          
        case 'lightning_start':
          logClass = 'api';
          logText = \`[\${elapsed}s] ⚡ LIGHTNING EXECUTION STARTED\`;
          break;
          
        case 'lightning_action':
          logClass = 'tool';
          logText = \`[\${elapsed}s] ⚡ LIGHTNING ACTION: \${event.data.action}\n  Details: \${JSON.stringify(event.data, null, 2)}\`;
          break;
          
        case 'lightning_result':
          logClass = 'result';
          logText = \`[\${elapsed}s] ⚡ LIGHTNING RESULT: \${event.data.success ? 'SUCCESS' : 'FAILED'}\n  Message: \${event.data.message}\`;
          break;
          
        case 'error':
          logClass = 'error';
          logText = \`[\${elapsed}s] ❌ ERROR: \${event.data.error}\n  Stack: \${event.data.stack || 'N/A'}\`;
          break;
          
        case 'complete':
          logClass = 'result';
          logText = \`[\${elapsed}s] 🎉 ANALYSIS COMPLETE\n  Duration: \${event.data.duration}ms\`;
          break;
          
        default:
          logText = \`[\${elapsed}s] \${event.type}: \${JSON.stringify(event.data)}\`;
      }
      
      if (logText) {
        const logLine = document.createElement('div');
        logLine.className = \`log-line \${logClass}\`;
        logLine.textContent = logText;
        fullLogs.appendChild(logLine);
        
        allLogs.push({ time: elapsed, type: event.type, text: logText });
        
        if (autoScroll && fullLogs.style.display !== 'none') {
          fullLogs.scrollTop = fullLogs.scrollHeight;
        }
      }
    }
    
    function toggleFullLogs() {
      if (fullLogs.style.display === 'none') {
        fullLogs.style.display = 'block';
        if (autoScroll) {
          fullLogs.scrollTop = fullLogs.scrollHeight;
        }
      } else {
        fullLogs.style.display = 'none';
      }
    }
    
    function downloadLogs() {
      const logText = allLogs.map(log => log.text).join('\\n\\n');
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`agent-logs-\${jobId}.txt\`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    function clearLogs() {
      if (confirm('Clear the log view? (This will not delete the actual logs)')) {
        fullLogs.innerHTML = '';
      }
    }
    
    function updateStatus(event) {
      const statusMap = {
        'start': { text: 'Running', class: 'running' },
        'complete': { text: 'Complete ✅', class: 'success' },
        'error': { text: 'Error ❌', class: 'error' },
        'lightning_start': { text: 'Lightning ⚡', class: 'running' }
      };
      
      const status = statusMap[event.type] || { text: 'Running', class: 'running' };
      statusEl.textContent = status.text;
      statusEl.className = 'stat-value ' + status.class;
    }
    
    function addFlowNode(event) {
      const row = document.createElement('div');
      row.className = 'flow-row';
      
      const elapsed = startTime ? ((event.timestamp - startTime) / 1000).toFixed(1) + 's' : '0s';
      
      if (event.type === 'tool_call') {
        // Main agent → Tool → Result flow
        row.innerHTML = \`
          <div class="node agent">
            <div class="node-header">
              <span class="node-icon">🤖</span>
              <span class="node-title">Main Agent</span>
            </div>
            <div class="node-content">Calling tool...</div>
            <div class="node-time">\${elapsed}</div>
          </div>
          <div class="arrow">→</div>
          <div class="node tool active">
            <div class="node-header">
              <span class="node-icon">🔧</span>
              <span class="node-title">\${event.data.tool}</span>
              <span class="spinner"></span>
            </div>
            <div class="node-content">\${formatInput(event.data.input)}</div>
            <div class="node-time">\${elapsed}</div>
          </div>
        \`;
      } else if (event.type === 'tool_result') {
        // Find and update the tool node
        const activeTools = document.querySelectorAll('.node.tool.active');
        if (activeTools.length > 0) {
          const lastTool = activeTools[activeTools.length - 1];
          lastTool.classList.remove('active');
          lastTool.classList.add('result');
          lastTool.querySelector('.spinner').remove();
          
          // Add arrow and result
          const resultNode = document.createElement('div');
          resultNode.className = 'node result';
          resultNode.innerHTML = \`
            <div class="node-header">
              <span class="node-icon">✅</span>
              <span class="node-title">Result</span>
            </div>
            <div class="node-content">\${formatResult(event.data.result)}</div>
            <div class="node-time">\${elapsed} (\${event.data.duration}ms)</div>
          \`;
          
          const arrow = document.createElement('div');
          arrow.className = 'arrow';
          arrow.textContent = '→';
          
          lastTool.parentElement.appendChild(arrow);
          lastTool.parentElement.appendChild(resultNode);
        }
      } else if (event.type === 'decision') {
        row.innerHTML = \`
          <div class="node agent">
            <div class="node-header">
              <span class="node-icon">💭</span>
              <span class="node-title">Agent Decision</span>
            </div>
            <div class="node-content">\${event.data.decision}</div>
            <div class="node-time">\${elapsed}</div>
          </div>
        \`;
      } else if (event.type === 'lightning_action') {
        row.innerHTML = \`
          <div class="node lightning">
            <div class="node-header">
              <span class="node-icon">⚡</span>
              <span class="node-title">Lightning Agent</span>
            </div>
            <div class="node-content">\${event.data.action}</div>
            <div class="node-time">\${elapsed}</div>
          </div>
          <div class="arrow">→</div>
          <div class="node active">
            <div class="node-header">
              <span class="node-icon">🔄</span>
              <span class="node-title">\${event.data.task || 'Executing'}</span>
              <span class="spinner"></span>
            </div>
            <div class="node-content">\${event.data.details || ''}</div>
            <div class="node-time">\${elapsed}</div>
          </div>
        \`;
      } else if (event.type === 'lightning_result') {
        const activeLightning = document.querySelectorAll('.node.active');
        if (activeLightning.length > 0) {
          const lastNode = activeLightning[activeLightning.length - 1];
          lastNode.classList.remove('active');
          lastNode.classList.add('result');
          const spinner = lastNode.querySelector('.spinner');
          if (spinner) spinner.remove();
          
          // Add result
          const resultNode = document.createElement('div');
          resultNode.className = 'node result';
          resultNode.innerHTML = \`
            <div class="node-header">
              <span class="node-icon">\${event.data.success ? '✅' : '❌'}</span>
              <span class="node-title">Result</span>
            </div>
            <div class="node-content">\${event.data.message || 'Completed'}</div>
            <div class="node-time">\${elapsed}</div>
          \`;
          
          const arrow = document.createElement('div');
          arrow.className = 'arrow';
          arrow.textContent = '→';
          
          lastNode.parentElement.appendChild(arrow);
          lastNode.parentElement.appendChild(resultNode);
        }
      } else if (event.type === 'complete') {
        row.innerHTML = \`
          <div class="node result" style="width: 100%; text-align: center;">
            <div class="node-header" style="justify-content: center;">
              <span class="node-icon">🎉</span>
              <span class="node-title">Analysis Complete!</span>
            </div>
            <div class="node-content">Total time: \${((event.timestamp - startTime) / 1000).toFixed(1)}s</div>
          </div>
        \`;
      }
      
      if (row.children.length > 0) {
        flowDiagram.appendChild(row);
        row.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
    
    function addTimelineItem(event) {
      const item = document.createElement('div');
      
      const elapsed = startTime ? ((event.timestamp - startTime) / 1000).toFixed(1) : '0.0';
      const time = document.createElement('div');
      time.className = 'timeline-time';
      time.textContent = elapsed + 's';
      
      const text = document.createElement('div');
      text.className = 'timeline-text';
      text.textContent = formatTimelineText(event);
      
      // Make expandable for certain event types
      const expandableTypes = ['tool_call', 'tool_result', 'api_request', 'api_response', 'parsing'];
      if (expandableTypes.includes(event.type)) {
        item.className = 'timeline-item expandable';
        
        const expandIcon = document.createElement('span');
        expandIcon.className = 'expand-icon';
        expandIcon.textContent = '▶';
        
        const detailPanel = document.createElement('div');
        detailPanel.className = 'detail-panel';
        detailPanel.textContent = formatDetailedData(event);
        
        item.appendChild(time);
        item.appendChild(expandIcon);
        item.appendChild(text);
        item.appendChild(detailPanel);
        
        item.onclick = () => {
          if (detailPanel.classList.contains('visible')) {
            detailPanel.classList.remove('visible');
            expandIcon.textContent = '▶';
          } else {
            detailPanel.classList.add('visible');
            expandIcon.textContent = '▼';
          }
        };
      } else {
        item.className = 'timeline-item';
        item.appendChild(time);
        item.appendChild(text);
      }
      
      timeline.appendChild(item);
      
      if (autoScroll) {
        timeline.scrollTop = timeline.scrollHeight;
      }
    }
    
    function formatDetailedData(event) {
      switch (event.type) {
        case 'tool_call':
          return 'Tool: ' + event.data.tool + '\\n\\nInput:\\n' + event.data.inputFull;
          
        case 'tool_result':
          return 'Tool: ' + event.data.tool + '\\nDuration: ' + event.data.duration + 'ms\\nLength: ' + event.data.resultLength + ' chars, ' + event.data.resultLines + ' lines\\n\\nFull Result:\\n' + event.data.resultFull;
          
        case 'api_request':
          return 'Model: ' + event.data.model + '\\nMax tokens: ' + event.data.max_tokens + '\\nMessages: ' + event.data.messageCount + '\\nTools: ' + event.data.toolsAvailable;
          
        case 'api_response':
          return 'Duration: ' + event.data.duration + 'ms\\nStop reason: ' + event.data.stopReason + '\\nContent blocks: ' + event.data.contentBlocks + '\\n\\nUsage:\\n' + JSON.stringify(event.data.usage, null, 2);
          
        case 'parsing':
          return 'Response length: ' + event.data.responseLength + ' chars\\n\\nPreview:\\n' + event.data.responsePreview;
          
        default:
          return JSON.stringify(event.data, null, 2);
      }
    }
    
    function formatInput(input) {
      if (typeof input === 'string') return input.substring(0, 100);
      return JSON.stringify(input).substring(0, 100);
    }
    
    function formatResult(result) {
      if (typeof result === 'string') return result.substring(0, 150) + '...';
      return JSON.stringify(result).substring(0, 150) + '...';
    }
    
    function formatTimelineText(event) {
      const map = {
        'start': '🤖 Analysis started',
        'iteration': \`📍 Iteration \${event.data.iteration} (\${event.data.messageCount} messages)\`,
        'api_request': \`🌐 API request (\${event.data.model}) - Click to expand\`,
        'api_response': \`📥 API response (\${event.data.duration}ms, stop: \${event.data.stopReason}) - Click to expand\`,
        'tool_call': \`🔧 Calling \${event.data.tool} (\${event.data.toolIndex}/\${event.data.totalTools}) - Click to expand\`,
        'tool_result': \`✅ \${event.data.tool} completed (\${event.data.duration}ms, \${event.data.resultLines} lines) - Click to expand\`,
        'decision': \`💭 \${event.data.decision}\`,
        'parsing': \`📝 Parsing response (\${event.data.responseLength} chars) - Click to expand\`,
        'validation': \`✔️ Validation: \${event.data.message}\`,
        'thinking': \`💭 \${event.data.thought}\`,
        'lightning_start': '⚡ Lightning execution started',
        'lightning_action': \`⚡ \${event.data.action}\`,
        'lightning_result': \`\${event.data.success ? '✅' : '❌'} \${event.data.message}\`,
        'complete': '🎉 Analysis complete',
        'error': \`❌ Error: \${event.data.error}\`
      };
      
      return map[event.type] || event.type;
    }
  </script>
</body>
</html>`;
}

export default router;

