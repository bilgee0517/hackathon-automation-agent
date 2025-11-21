// Express server

import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { initializeQueueProcessor } from './processor';
import { getRedisClient, getAnalysisQueue } from '../services/redis';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'Hackathon Automation Agent API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      analyze: 'POST /api/analyze',
      status: 'GET /api/status/:jobId',
      results: 'GET /api/results/:jobId'
    }
  });
});

// 404 handler
app.use((req, res) => {
  return
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// Startup
async function startServer() {
  try {
    console.log('🚀 Starting Hackathon Automation Agent Backend...\n');
    
    // Check required environment variables
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const hasRedis = !!process.env.REDIS_HOST;
    
    if (!hasAnthropicKey && !hasOpenAIKey) {
      console.error('❌ ERROR: No AI provider configured!');
      console.error('   Please set either ANTHROPIC_API_KEY or OPENAI_API_KEY\n');
      process.exit(1);
    }
    
    if (!hasRedis) {
      console.warn('⚠️  Warning: REDIS_HOST not set, defaulting to localhost\n');
    }
    
    // Show which AI provider will be used
    if (hasAnthropicKey) {
      console.log('✓ AI Provider: Anthropic (Claude)');
    } else if (hasOpenAIKey) {
      console.log('✓ AI Provider: OpenAI (GPT-4)');
    }
    
    // Initialize Redis
    console.log('Initializing Redis connection...');
    getRedisClient();
    
    // Initialize queue
    console.log('Initializing job queue...');
    getAnalysisQueue();
    
    // Initialize queue processor
    console.log('Starting queue processor...');
    await initializeQueueProcessor();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API endpoints: http://localhost:${PORT}/api`);
      console.log(`\nReady to analyze hackathon projects! 🎉\n`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  
  const queue = getAnalysisQueue();
  await queue.close();
  
  const redis = getRedisClient();
  await redis.quit();
  
  console.log('✓ Shutdown complete');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export default app;

