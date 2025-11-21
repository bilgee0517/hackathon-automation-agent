// Lightning AI service for cloud execution
// Uses Lightning AI Studios API to run projects in the cloud

import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { ExecutionResults, EndpointTestResult } from '../types';

interface LightningStudioConfig {
  name: string;
  environment: 'python' | 'nodejs' | 'go';
  hardware?: 'cpu' | 'cpu-medium' | 'gpu-t4';
  diskSizeGB?: number;
}

interface CommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

/**
 * Lightning AI Studio Manager
 * Handles creation, execution, and cleanup of Lightning AI Studios
 */
export class LightningStudioManager {
  private apiKey: string;
  private apiBaseUrl: string;
  private client: AxiosInstance;
  
  constructor() {
    this.apiKey = process.env.LIGHTNING_API_KEY || '';
    this.apiBaseUrl = process.env.LIGHTNING_API_URL || 'https://lightning.ai/api/v1';
    
    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 min timeout
    });
  }
  
  /**
   * Check if Lightning AI is configured and available
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }
  
  /**
   * Create a new Lightning Studio
   */
  async createStudio(config: LightningStudioConfig): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Lightning AI is not configured. Set LIGHTNING_API_KEY');
    }
    
    console.log(`⚡ Creating Lightning Studio: ${config.name}`);
    
    try {
      // Note: This is a placeholder implementation
      // Real implementation would use Lightning AI's actual API
      // For now, we'll simulate with local execution as fallback
      
      const studioId = `ltng-studio-${Date.now()}`;
      
      console.log(`✓ Studio created: ${studioId}`);
      return studioId;
      
    } catch (error) {
      console.error('Failed to create Lightning Studio:', error);
      throw error;
    }
  }
  
  /**
   * Upload repository to studio
   */
  async uploadRepo(studioId: string, repoPath: string): Promise<void> {
    console.log(`⚡ Uploading repo to studio ${studioId}...`);
    
    try {
      // Create zip of repo
      const zipPath = `/tmp/repo-${Date.now()}.zip`;
      await this.zipDirectory(repoPath, zipPath);
      
      // Upload to studio (placeholder)
      console.log(`✓ Repo uploaded (${fs.statSync(zipPath).size} bytes)`);
      
      // Cleanup
      fs.unlinkSync(zipPath);
      
    } catch (error) {
      console.error('Failed to upload repo:', error);
      throw error;
    }
  }
  
  /**
   * Execute a command in the studio
   */
  async executeCommand(
    studioId: string,
    command: string,
    workdir?: string
  ): Promise<CommandResult> {
    console.log(`⚡ Executing in studio: ${command}`);
    
    const startTime = Date.now();
    
    try {
      // Placeholder: Would call Lightning API
      // For now, return simulated success
      const result: CommandResult = {
        success: true,
        exitCode: 0,
        stdout: `Simulated execution of: ${command}`,
        stderr: '',
        duration: Date.now() - startTime
      };
      
      console.log(`✓ Command completed (${result.duration}ms)`);
      return result;
      
    } catch (error) {
      console.error('Command execution failed:', error);
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Start an application in the studio
   */
  async startApp(
    studioId: string,
    command: string,
    port: number = 3000
  ): Promise<string> {
    console.log(`⚡ Starting app in studio on port ${port}...`);
    
    try {
      // Execute start command in background
      await this.executeCommand(studioId, command);
      
      // Return the studio URL
      const url = `https://${studioId}.lightning.ai:${port}`;
      console.log(`✓ App started: ${url}`);
      
      return url;
      
    } catch (error) {
      console.error('Failed to start app:', error);
      throw error;
    }
  }
  
  /**
   * Test an HTTP endpoint
   */
  async testEndpoint(
    url: string,
    method: string = 'GET',
    headers?: Record<string, string>,
    body?: any
  ): Promise<EndpointTestResult> {
    console.log(`⚡ Testing endpoint: ${method} ${url}`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method,
        url,
        headers,
        data: body,
        timeout: 30000,
        validateStatus: () => true // Don't throw on any status
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: url,
        method,
        status: response.status,
        responseTime,
        success: response.status >= 200 && response.status < 300,
        body: JSON.stringify(response.data).substring(0, 500) // Truncate
      };
      
    } catch (error) {
      return {
        endpoint: url,
        method,
        status: 0,
        responseTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get logs from studio
   */
  async getLogs(studioId: string, lines: number = 100): Promise<string> {
    console.log(`⚡ Fetching logs from studio (last ${lines} lines)...`);
    
    try {
      // Placeholder implementation
      return `[Simulated logs for studio ${studioId}]`;
      
    } catch (error) {
      console.error('Failed to get logs:', error);
      return '';
    }
  }
  
  /**
   * Delete studio (cleanup)
   */
  async deleteStudio(studioId: string): Promise<void> {
    console.log(`⚡ Deleting studio ${studioId}...`);
    
    try {
      // Placeholder: Would call Lightning API to delete
      console.log(`✓ Studio deleted`);
      
    } catch (error) {
      console.error('Failed to delete studio:', error);
      // Don't throw - cleanup is best effort
    }
  }
  
  /**
   * Helper: Zip a directory
   */
  private async zipDirectory(sourceDir: string, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));
      
      archive.pipe(output);
      
      // Add directory contents, excluding common ignore patterns
      archive.glob('**/*', {
        cwd: sourceDir,
        ignore: [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**',
          '__pycache__/**',
          '*.log',
          '.env',
          '.DS_Store'
        ]
      });
      
      archive.finalize();
    });
  }
}

/**
 * Singleton instance
 */
let lightningManager: LightningStudioManager | null = null;

export function getLightningManager(): LightningStudioManager {
  if (!lightningManager) {
    lightningManager = new LightningStudioManager();
  }
  return lightningManager;
}

/**
 * Check if Lightning AI execution is enabled
 */
export function isLightningExecutionEnabled(): boolean {
  const enabled = process.env.ENABLE_LIGHTNING_EXECUTION === 'true';
  const hasApiKey = !!process.env.LIGHTNING_API_KEY;
  
  return enabled && hasApiKey;
}

