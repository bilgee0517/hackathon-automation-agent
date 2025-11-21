// Queue processor - orchestrates the entire analysis pipeline

import { Job } from 'bull';
import { QueueJob, AnalysisResult } from '../types';
import { getAnalysisQueue, updateJobStatus } from '../services/redis';
import { cloneRepository, cleanupRepository, detectMainLanguage, countFiles, hasTests } from '../services/github';
import { uploadRepoToS3 } from '../services/s3';
import { saveSponsorAnalysis } from '../services/sanity';
import { runAgentAnalysis } from '../agent/orchestrator';

/**
 * Process a single analysis job
 */
async function processAnalysisJob(job: Job<QueueJob>): Promise<AnalysisResult> {
  const { jobId, githubUrl, teamName, projectName, branch } = job.data;
  
  console.log(`\n========================================`);
  console.log(`Processing job ${jobId}`);
  console.log(`Team: ${teamName}`);
  console.log(`Project: ${projectName}`);
  console.log(`GitHub: ${githubUrl}`);
  console.log(`========================================\n`);
  
  let repoPath: string | null = null;
  
  try {
    // Step 1: Clone repository
    await updateJobStatus(jobId, 'analyzing', 'Cloning repository...');
    console.log('Step 1: Cloning repository...');
    
    const cloneResult = await cloneRepository(githubUrl, branch);
    
    if (!cloneResult.success) {
      throw new Error(`Failed to clone repository: ${cloneResult.error}`);
    }
    
    repoPath = cloneResult.repoPath;
    console.log(`✓ Repository cloned to ${repoPath}`);
    
    // Step 2: Gather basic repository stats
    await updateJobStatus(jobId, 'analyzing', 'Gathering repository stats...');
    console.log('Step 2: Gathering repository stats...');
    
    const mainLanguage = detectMainLanguage(repoPath);
    const totalFiles = countFiles(repoPath);
    const hasTestFiles = hasTests(repoPath);
    
    console.log(`  - Main language: ${mainLanguage}`);
    console.log(`  - Total files: ${totalFiles}`);
    console.log(`  - Has tests: ${hasTestFiles}`);
    
    // Step 3: Upload to S3 (optional, can be made async)
    try {
      if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET) {
        await updateJobStatus(jobId, 'analyzing', 'Uploading to S3...');
        console.log('Step 3: Uploading repository to S3...');
        const s3Location = await uploadRepoToS3(repoPath, cloneResult.repoId);
        console.log(`✓ Uploaded to ${s3Location}`);
      } else {
        console.log('Step 3: Skipping S3 upload (not configured)');
      }
    } catch (s3Error) {
      console.warn('S3 upload failed (non-critical):', s3Error);
    }
    
    // Step 4: Run AI agent analysis
    await updateJobStatus(jobId, 'analyzing', 'Running AI agent analysis...');
    console.log('Step 4: Running AI agent analysis...');
    
    const analysis = await runAgentAnalysis(
      repoPath,
      teamName,
      projectName,
      githubUrl,
      (progress) => {
        console.log(`  Agent: ${progress}`);
        updateJobStatus(jobId, 'analyzing', progress).catch(console.error);
      }
    );
    
    // Update with basic stats
    analysis.repositoryStats = {
      ...analysis.repositoryStats,
      mainLanguage,
      totalFiles,
      hasTests: hasTestFiles,
      testsPassed: null
    };
    
    console.log('✓ AI agent analysis complete');
    
    // Step 5: Save to Sanity
    try {
      if (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) {
        await updateJobStatus(jobId, 'analyzing', 'Saving results to Sanity...');
        console.log('Step 5: Saving results to Sanity...');
        const sanityId = await saveSponsorAnalysis(analysis);
        console.log(`✓ Saved to Sanity: ${sanityId}`);
      } else {
        console.log('Step 5: Skipping Sanity save (not configured)');
      }
    } catch (sanityError) {
      console.warn('Sanity save failed (non-critical):', sanityError);
    }
    
    // Step 6: Cache results (optional - currently disabled for fresh analysis)
    // await updateJobStatus(jobId, 'analyzing', 'Caching results...');
    // console.log('Step 6: Caching results...');
    // await cacheAnalysisResult(githubUrl, analysis);
    // console.log('✓ Results cached');
    console.log('Step 6: Skipping cache (disabled for fresh analysis)');
    
    // Step 7: Update job status to complete
    await updateJobStatus(jobId, 'complete', 'Analysis complete', undefined);
    
    // Store the full result in Redis as well
    const redis = (await import('../services/redis')).getRedisClient();
    await redis.setex(`job:${jobId}`, 3600, JSON.stringify({
      jobId,
      status: 'complete',
      result: analysis,
      completedAt: new Date().toISOString()
    }));
    
    console.log(`\n✓ Job ${jobId} completed successfully!\n`);
    
    return analysis;
    
  } catch (error) {
    console.error(`\n✗ Job ${jobId} failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus(jobId, 'failed', undefined, errorMessage);
    
    throw error;
    
  } finally {
    // Clean up cloned repository
    if (repoPath) {
      console.log('Cleaning up cloned repository...');
      await cleanupRepository(repoPath);
      console.log('✓ Cleanup complete');
    }
  }
}

/**
 * Initialize the queue processor
 */
export async function initializeQueueProcessor(): Promise<void> {
  const queue = getAnalysisQueue();
  
  // Set up the processor
  queue.process(async (job: Job<QueueJob>) => {
    return await processAnalysisJob(job);
  });
  
  // Event handlers
  queue.on('completed', (job) => {
    console.log(`✓ Job ${job.id} completed`);
  });
  
  queue.on('failed', (job, err) => {
    console.error(`✗ Job ${job?.id} failed:`, err.message);
  });
  
  queue.on('stalled', (job) => {
    console.warn(`⚠️  Job ${job.id} stalled`);
  });
  
  console.log('✓ Queue processor initialized');
}

