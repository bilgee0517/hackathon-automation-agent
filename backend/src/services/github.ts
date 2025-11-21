// GitHub repository cloning service

import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = path.join(process.cwd(), 'tmp', 'repos');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export interface CloneResult {
  repoPath: string;
  repoId: string;
  success: boolean;
  error?: string;
}

/**
 * Parse GitHub URL and extract repo URL and branch
 */
export function parseGitHubUrl(url: string): { repoUrl: string; branch?: string } {
  // Handle GitHub web URLs with /tree/branch or /blob/branch
  // Example: https://github.com/user/repo/tree/branch-name
  const webUrlMatch = url.match(/^(https:\/\/github\.com\/[^\/]+\/[^\/]+)\/(?:tree|blob)\/([^\/]+)/);
  
  if (webUrlMatch) {
    return {
      repoUrl: webUrlMatch[1],
      branch: webUrlMatch[2]
    };
  }
  
  // Regular GitHub URL
  // Example: https://github.com/user/repo
  const repoUrlMatch = url.match(/^https:\/\/github\.com\/[^\/]+\/[^\/]+/);
  
  if (repoUrlMatch) {
    return {
      repoUrl: repoUrlMatch[0]
    };
  }
  
  // Return as-is if not a recognized format
  return { repoUrl: url };
}

/**
 * Clone a GitHub repository to a temporary directory
 */
export async function cloneRepository(githubUrl: string, branch?: string): Promise<CloneResult> {
  const repoId = uuidv4();
  const repoPath = path.join(TEMP_DIR, repoId);

  try {
    // Parse the GitHub URL to extract repo and branch
    const parsed = parseGitHubUrl(githubUrl);
    const actualRepoUrl = parsed.repoUrl;
    const actualBranch = branch || parsed.branch;
    
    console.log(`Cloning repository: ${actualRepoUrl}`);
    if (actualBranch) {
      console.log(`Branch: ${actualBranch}`);
    }
    
    const git: SimpleGit = simpleGit();
    
    const cloneOptions = actualBranch ? ['--branch', actualBranch, '--single-branch'] : [];
    
    await git.clone(actualRepoUrl, repoPath, cloneOptions);
    
    console.log(`Successfully cloned repository to ${repoPath}`);
    
    return {
      repoPath,
      repoId,
      success: true
    };
  } catch (error) {
    console.error(`Failed to clone repository ${githubUrl}:`, error);
    
    // Clean up failed clone attempt
    if (fs.existsSync(repoPath)) {
      await cleanupRepository(repoPath);
    }
    
    return {
      repoPath,
      repoId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean up a cloned repository
 */
export async function cleanupRepository(repoPath: string): Promise<void> {
  try {
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
      console.log(`Cleaned up repository at ${repoPath}`);
    }
  } catch (error) {
    console.error(`Failed to clean up repository at ${repoPath}:`, error);
  }
}

/**
 * Get the main language of the repository by analyzing file extensions
 */
export function detectMainLanguage(repoPath: string): string {
  const languageMap: Record<string, number> = {};
  
  function scanDirectory(dir: string) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        // Skip node_modules, .git, and other common directories
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', 'vendor', '__pycache__'].includes(file)) {
            scanDirectory(filePath);
          }
        } else {
          const ext = path.extname(file);
          if (ext) {
            languageMap[ext] = (languageMap[ext] || 0) + 1;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDirectory(repoPath);
  
  // Map extensions to language names
  const extToLang: Record<string, string> = {
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.jsx': 'React',
    '.tsx': 'React/TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.cs': 'C#',
    '.cpp': 'C++',
    '.c': 'C',
    '.swift': 'Swift',
    '.kt': 'Kotlin'
  };
  
  // Find the most common extension
  let maxCount = 0;
  let mainExt = '.js';
  
  for (const [ext, count] of Object.entries(languageMap)) {
    if (count > maxCount) {
      maxCount = count;
      mainExt = ext;
    }
  }
  
  return extToLang[mainExt] || 'Unknown';
}

/**
 * Count total files in repository (excluding common ignored directories)
 */
export function countFiles(repoPath: string): number {
  let count = 0;
  
  function scanDirectory(dir: string) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', 'vendor', '__pycache__'].includes(file)) {
            scanDirectory(filePath);
          }
        } else {
          count++;
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDirectory(repoPath);
  return count;
}

/**
 * Check if repository has tests
 */
export function hasTests(repoPath: string): boolean {
  const testIndicators = [
    'test/',
    'tests/',
    '__tests__/',
    'spec/',
    '.test.',
    '.spec.',
    'jest.config',
    'pytest.ini',
    'go.test'
  ];
  
  function checkDirectory(dir: string): boolean {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        // Check if filename matches test indicators
        for (const indicator of testIndicators) {
          if (file.includes(indicator)) {
            return true;
          }
        }
        
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !['node_modules', '.git'].includes(file)) {
          if (checkDirectory(filePath)) {
            return true;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return false;
  }
  
  return checkDirectory(repoPath);
}

