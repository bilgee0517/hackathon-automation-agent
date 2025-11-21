// Express API routes

import express, { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getAnalysisQueue, updateJobStatus, getJobStatus } from '../services/redis';
import { AnalysisRequest } from '../types';

const router: Router = express.Router();

/**
 * POST /api/analyze - Submit a repository for analysis
 */
router.post('/analyze', async (req: Request, res: Response): Promise<any> => {
  try {
    const { githubUrl, teamName, projectName, branch, teamMembers, hackathonId }: AnalysisRequest = req.body;
    
    // Validate required fields
    if (!githubUrl || !teamName || !projectName) {
      return res.status(400).json({
        error: 'Missing required fields: githubUrl, teamName, projectName'
      });
    }
    
    // Validate GitHub URL
    if (!githubUrl.includes('github.com')) {
      return res.status(400).json({
        error: 'Invalid GitHub URL'
      });
    }
    
    // Note: Caching disabled for fresh analysis each time
    // If you want to enable caching, uncomment the lines below:
    /*
    const cached = await getCachedAnalysisResult(githubUrl);
    if (cached) {
      return res.json({
        status: 'complete',
        cached: true,
        result: cached
      });
    }
    */
    
    // Create job
    const jobId = uuidv4();
    const queue = getAnalysisQueue();
    
    await queue.add({
      jobId,
      githubUrl,
      teamName,
      projectName,
      branch,
      teamMembers,
      hackathonId
    });
    
    // Update status
    await updateJobStatus(jobId, 'pending', 'Job queued for analysis');
    
    console.log(`Created analysis job: ${jobId} for ${githubUrl}`);
    
    res.json({
      jobId,
      status: 'pending',
      message: 'Analysis job created successfully'
    });
    
  } catch (error) {
    console.error('Error creating analysis job:', error);
    res.status(500).json({
      error: 'Failed to create analysis job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/status/:jobId - Get job status
 */
router.get('/status/:jobId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { jobId } = req.params;
    
    const status = await getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    res.json(status);
    
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/results/:jobId - Get analysis results
 */
router.get('/results/:jobId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { jobId } = req.params;
    
    const status = await getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    if (status.status !== 'complete') {
      return res.status(202).json({
        status: status.status,
        message: 'Analysis not yet complete'
      });
    }
    
    // Get the full result from the status
    res.json(status.result || status);
    
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({
      error: 'Failed to get results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health - Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'hackathon-analyzer-backend'
  });
});

export default router;

