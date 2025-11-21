// Redis client and queue service

import Redis from 'ioredis';
import Bull, { Queue } from 'bull';
import { QueueJob } from '../types';

// Redis client for caching
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      }
    });

    redisClient.on('connect', () => {
      console.log('✓ Redis client connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
  }
  
  return redisClient;
}

// Bull queue for job processing
let analysisQueue: Queue<QueueJob> | null = null;

export function getAnalysisQueue(): Queue<QueueJob> {
  if (!analysisQueue) {
    analysisQueue = new Bull<QueueJob>('repo-analysis', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        timeout: 600000 // 10 minutes
      }
    });

    analysisQueue.on('error', (error) => {
      console.error('Queue error:', error);
    });

    console.log('✓ Analysis queue initialized');
  }
  
  return analysisQueue;
}

/**
 * Cache analysis results
 */
export async function cacheAnalysisResult(repoUrl: string, result: any): Promise<void> {
  const redis = getRedisClient();
  const key = `analysis:${repoUrl}`;
  const ttl = 86400; // 24 hours
  
  try {
    await redis.setex(key, ttl, JSON.stringify(result));
    console.log(`Cached analysis result for ${repoUrl}`);
  } catch (error) {
    console.error('Failed to cache analysis result:', error);
  }
}

/**
 * Get cached analysis result
 */
export async function getCachedAnalysisResult(repoUrl: string): Promise<any | null> {
  const redis = getRedisClient();
  const key = `analysis:${repoUrl}`;
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      console.log(`Cache hit for ${repoUrl}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to get cached analysis result:', error);
  }
  
  return null;
}

/**
 * Store job status
 */
export async function updateJobStatus(
  jobId: string,
  status: 'pending' | 'analyzing' | 'complete' | 'failed',
  progress?: string,
  error?: string
): Promise<void> {
  const redis = getRedisClient();
  const key = `job:${jobId}`;
  
  const statusData = {
    jobId,
    status,
    progress,
    error,
    updatedAt: new Date().toISOString()
  };
  
  try {
    await redis.setex(key, 3600, JSON.stringify(statusData)); // 1 hour TTL
  } catch (error) {
    console.error('Failed to update job status:', error);
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<any | null> {
  const redis = getRedisClient();
  const key = `job:${jobId}`;
  
  try {
    const status = await redis.get(key);
    if (status) {
      return JSON.parse(status);
    }
  } catch (error) {
    console.error('Failed to get job status:', error);
  }
  
  return null;
}

/**
 * Close connections gracefully
 */
export async function closeConnections(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  
  if (analysisQueue) {
    await analysisQueue.close();
    analysisQueue = null;
  }
}

