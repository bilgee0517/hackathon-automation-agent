// AI Agent tools for Claude

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { searchWithParallel, learnAboutSponsor } from '../services/parallel';
import { memorySystem } from '../services/memory';

export const tools = [
  {
    name: "recall_learnings",
    description: "Recall past learnings and patterns from previous analyses. Use this to access knowledge you've gained from analyzing other repositories.",
    input_schema: {
      type: "object",
      properties: {
        sponsor: {
          type: "string",
          description: "Optional: Sponsor name to recall specific patterns for (e.g., 'redis', 'anthropic'). Leave empty to get all learnings."
        }
      }
    }
  },
  {
    name: "search_web",
    description: "Search the internet to learn about technologies, APIs, SDKs, and integration patterns. Use this BEFORE searching the codebase to learn what to look for.",
    input_schema: {
      type: "object",
      properties: {
        query: { 
          type: "string", 
          description: "What to search for (e.g., 'Anthropic AI SDK npm package', 'Redis integration patterns')" 
        }
      },
      required: ["query"]
    }
  },
  {
    name: "learn_about_sponsor",
    description: "Learn about a specific sponsor's technology, SDKs, APIs, and integration patterns from the web. Use this to discover package names, API endpoints, and common usage patterns.",
    input_schema: {
      type: "object",
      properties: {
        sponsor_name: { 
          type: "string", 
          description: "Name of the sponsor (e.g., 'Anthropic', 'Redis', 'Skyflow')" 
        },
        aspect: {
          type: "string",
          description: "What to learn about (e.g., 'npm packages', 'API endpoints', 'integration patterns', 'authentication')"
        }
      },
      required: ["sponsor_name", "aspect"]
    }
  },
  {
    name: "read_file",
    description: "Read contents of a file from the repository. Use this to examine specific files in detail.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path relative to repo root (e.g., 'package.json', 'src/index.js')"
        }
      },
      required: ["path"]
    }
  },
  {
    name: "list_directory",
    description: "List files and directories in a given path. Use this to explore the repository structure.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path relative to repo root (default: '.' for root)"
        }
      }
    }
  },
  {
    name: "search_code",
    description: "Search for a pattern in the codebase using ripgrep. Very fast for finding specific strings, imports, or code patterns.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Search pattern (can be regex)"
        },
        file_pattern: {
          type: "string",
          description: "Optional glob pattern to filter files (e.g., '*.js', '*.py')"
        }
      },
      required: ["pattern"]
    }
  },
  {
    name: "get_file_tree",
    description: "Get the complete file structure as a tree. Use this to understand the overall project layout.",
    input_schema: {
      type: "object",
      properties: {
        depth: {
          type: "number",
          description: "Maximum depth to display (default: 3)"
        }
      }
    }
  },
  {
    name: "read_package_dependencies",
    description: "Read and parse package dependencies from package.json, requirements.txt, go.mod, or other dependency files.",
    input_schema: {
      type: "object",
      properties: {}
    }
  }
];

/**
 * Execute a tool call from the AI agent
 */
export async function executeToolCall(
  toolName: string,
  input: any,
  repoPath: string
): Promise<string> {
  try {
    switch (toolName) {
      case 'recall_learnings':
        return await recallLearnings(input.sponsor);
      
      case 'search_web':
        return await searchWithParallel(input.query);
      
      case 'learn_about_sponsor':
        return await learnAboutSponsor(input.sponsor_name, input.aspect);
      
      case 'read_file':
        return readFile(repoPath, input.path);
      
      case 'list_directory':
        return listDirectory(repoPath, input.path || '.');
      
      case 'search_code':
        return searchCode(repoPath, input.pattern, input.file_pattern);
      
      case 'get_file_tree':
        return getFileTree(repoPath, input.depth || 3);
      
      case 'read_package_dependencies':
        return readPackageDependencies(repoPath);
      
      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    return `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Read a file from the repository
 */
function readFile(repoPath: string, filePath: string): string {
  const fullPath = path.join(repoPath, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return `Error: File not found: ${filePath}`;
  }
  
  if (!fs.statSync(fullPath).isFile()) {
    return `Error: Not a file: ${filePath}`;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lineCount = content.split('\n').length;
    return `File: ${filePath} (${lineCount} lines)\n\n${content}`;
  } catch (error) {
    return `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * List directory contents
 */
function listDirectory(repoPath: string, dirPath: string): string {
  const fullPath = path.join(repoPath, dirPath);
  
  if (!fs.existsSync(fullPath)) {
    return `Error: Directory not found: ${dirPath}`;
  }
  
  if (!fs.statSync(fullPath).isDirectory()) {
    return `Error: Not a directory: ${dirPath}`;
  }
  
  try {
    const items = fs.readdirSync(fullPath);
    
    const formatted = items.map(item => {
      const itemPath = path.join(fullPath, item);
      const stat = fs.statSync(itemPath);
      const type = stat.isDirectory() ? 'DIR ' : 'FILE';
      const size = stat.isFile() ? ` (${stat.size} bytes)` : '';
      return `${type} ${item}${size}`;
    });
    
    return `Directory: ${dirPath}\n\n${formatted.join('\n')}`;
  } catch (error) {
    return `Error listing directory: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Find ripgrep executable
 */
function findRipgrep(): string | null {
  const possiblePaths = [
    '/opt/homebrew/bin/rg',  // Homebrew on Apple Silicon
    '/usr/local/bin/rg',      // Homebrew on Intel Mac
    '/usr/bin/rg',            // Linux system install
    'rg'                       // In PATH
  ];
  
  for (const rgPath of possiblePaths) {
    try {
      execSync(`${rgPath} --version`, { stdio: 'ignore' });
      return rgPath;
    } catch {
      continue;
    }
  }
  
  return null;
}

// Cache the ripgrep path
let cachedRgPath: string | null | undefined;

/**
 * Search code using ripgrep (fallback to native Node.js if rg not available)
 */
function searchCode(repoPath: string, pattern: string, filePattern?: string): string {
  // Find ripgrep once and cache it
  if (cachedRgPath === undefined) {
    cachedRgPath = findRipgrep();
    if (cachedRgPath) {
      console.log(`✓ Found ripgrep at: ${cachedRgPath}`);
    } else {
      console.log('ℹ️  ripgrep not found, using native search');
    }
  }
  
  if (cachedRgPath) {
    try {
      const globArg = filePattern ? `-g "${filePattern}"` : '';
      const cmd = `${cachedRgPath} "${pattern}" ${repoPath} ${globArg} --max-count 50 --heading --line-number 2>/dev/null`;
      
      const result = execSync(cmd, { 
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 5 // 5MB
      });
      
      return `Search results for "${pattern}":\n\n${result}`;
    } catch (error: any) {
      // rg returns exit code 1 when no matches found
      if (error.status === 1) {
        return `No matches found for "${pattern}"`;
      }
      // Fall through to native search on other errors
    }
  }
  
  // Fallback to native search
  return nativeSearch(repoPath, pattern, filePattern);
}

/**
 * Native Node.js file search (no external dependencies)
 */
function nativeSearch(repoPath: string, pattern: string, filePattern?: string): string {
  const results: string[] = [];
  let filesSearched = 0;
  const maxFiles = 100;
  const maxMatches = 50;
  
  try {
    const regex = new RegExp(pattern, 'gi');
    
    function searchInDirectory(dir: string) {
      if (filesSearched >= maxFiles || results.length >= maxMatches) return;
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          if (filesSearched >= maxFiles || results.length >= maxMatches) break;
          
          // Skip common ignored directories
          if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__'].includes(item)) {
            continue;
          }
          
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            searchInDirectory(itemPath);
          } else if (stat.isFile()) {
            // Check file pattern if provided
            if (filePattern) {
              const globPattern = filePattern.replace(/\*/g, '.*').replace(/\./g, '\\.');
              const fileRegex = new RegExp(globPattern);
              if (!fileRegex.test(item)) {
                continue;
              }
            }
            
            // Skip binary and large files
            if (stat.size > 1024 * 1024) continue; // Skip files > 1MB
            
            // Only search text files
            const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rb', '.php', 
                                   '.c', '.cpp', '.h', '.cs', '.html', '.css', '.json', '.yaml', '.yml',
                                   '.md', '.txt', '.sh', '.bash', '.env', '.toml', '.rs', '.kt', '.swift'];
            const ext = path.extname(item).toLowerCase();
            if (!textExtensions.includes(ext)) continue;
            
            filesSearched++;
            
            try {
              const content = fs.readFileSync(itemPath, 'utf-8');
              const lines = content.split('\n');
              
              lines.forEach((line, lineNum) => {
                if (results.length >= maxMatches) return;
                
                if (regex.test(line)) {
                  const relativePath = path.relative(repoPath, itemPath);
                  results.push(`${relativePath}:${lineNum + 1}: ${line.trim()}`);
                }
              });
            } catch (err) {
              // Skip files we can't read
            }
          }
        }
      } catch (err) {
        // Skip directories we can't read
      }
    }
    
    searchInDirectory(repoPath);
    
    if (results.length === 0) {
      return `No matches found for "${pattern}" (searched ${filesSearched} files)`;
    }
    
    return `Search results for "${pattern}" (${results.length} matches in ${filesSearched} files):\n\n${results.join('\n')}`;
    
  } catch (error) {
    return `Error searching for "${pattern}": ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Get file tree structure
 */
function getFileTree(repoPath: string, depth: number): string {
  // Try to find tree command in common locations
  const treePaths = [
    '/opt/homebrew/bin/tree',
    '/usr/local/bin/tree',
    '/usr/bin/tree',
    'tree'
  ];
  
  for (const treePath of treePaths) {
    try {
      const result = execSync(`${treePath} -L ${depth} -I 'node_modules|.git|dist|build|__pycache__|vendor' ${repoPath} 2>/dev/null`, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 2
      });
      
      return result;
    } catch (error) {
      continue;
    }
  }
  
  // Fallback to native implementation
  return generateSimpleTree(repoPath, depth);
}

/**
 * Fallback tree generation
 */
function generateSimpleTree(dir: string, maxDepth: number, currentDepth: number = 0, prefix: string = ''): string {
  if (currentDepth >= maxDepth) return '';
  
  let output = '';
  const skipDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', 'vendor'];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach((item, index) => {
      if (skipDirs.includes(item)) return;
      
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      const isLast = index === items.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      
      output += `${prefix}${connector}${item}\n`;
      
      if (stat.isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        output += generateSimpleTree(itemPath, maxDepth, currentDepth + 1, newPrefix);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
  
  return output;
}

/**
 * Read package dependencies from various dependency files
 */
function readPackageDependencies(repoPath: string): string {
  let output = 'Dependencies found:\n\n';
  
  // Check package.json (Node.js)
  const packageJsonPath = path.join(repoPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      
      output += '=== Node.js (package.json) ===\n';
      
      if (pkg.dependencies) {
        output += '\nDependencies:\n';
        Object.entries(pkg.dependencies).forEach(([name, version]) => {
          output += `  - ${name}: ${version}\n`;
        });
      }
      
      if (pkg.devDependencies) {
        output += '\nDev Dependencies:\n';
        Object.entries(pkg.devDependencies).forEach(([name, version]) => {
          output += `  - ${name}: ${version}\n`;
        });
      }
      
      output += '\n';
    } catch (error) {
      output += 'Error parsing package.json\n\n';
    }
  }
  
  // Check requirements.txt (Python)
  const requirementsPath = path.join(repoPath, 'requirements.txt');
  if (fs.existsSync(requirementsPath)) {
    try {
      const content = fs.readFileSync(requirementsPath, 'utf-8');
      output += '=== Python (requirements.txt) ===\n';
      output += content + '\n\n';
    } catch (error) {
      output += 'Error reading requirements.txt\n\n';
    }
  }
  
  // Check go.mod (Go)
  const goModPath = path.join(repoPath, 'go.mod');
  if (fs.existsSync(goModPath)) {
    try {
      const content = fs.readFileSync(goModPath, 'utf-8');
      output += '=== Go (go.mod) ===\n';
      output += content + '\n\n';
    } catch (error) {
      output += 'Error reading go.mod\n\n';
    }
  }
  
  // Check Cargo.toml (Rust)
  const cargoPath = path.join(repoPath, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    try {
      const content = fs.readFileSync(cargoPath, 'utf-8');
      output += '=== Rust (Cargo.toml) ===\n';
      output += content + '\n\n';
    } catch (error) {
      output += 'Error reading Cargo.toml\n\n';
    }
  }
  
  if (output === 'Dependencies found:\n\n') {
    return 'No dependency files found (package.json, requirements.txt, go.mod, Cargo.toml)';
  }
  
  return output;
}

/**
 * Recall learnings from past analyses
 */
async function recallLearnings(sponsor?: string): Promise<string> {
  try {
    if (sponsor) {
      // Get patterns for specific sponsor
      const pattern = await memorySystem.recallSponsorPatterns(sponsor);
      
      if (!pattern) {
        return `No learnings found for ${sponsor} yet. This might be your first analysis!`;
      }
      
      let output = `🧠 Past learnings for ${sponsor}:\n\n`;
      output += `Confidence: ${(pattern.confidence * 100).toFixed(0)}%\n`;
      output += `Success rate: ${pattern.successCount}/${pattern.successCount + pattern.failureCount}\n\n`;
      
      if (pattern.packages.length > 0) {
        output += `📦 Known packages:\n`;
        pattern.packages.forEach(pkg => output += `  - ${pkg}\n`);
        output += '\n';
      }
      
      if (pattern.apis.length > 0) {
        output += `🔌 Known APIs:\n`;
        pattern.apis.forEach(api => output += `  - ${api}\n`);
        output += '\n';
      }
      
      if (pattern.envVars.length > 0) {
        output += `🔑 Environment variables:\n`;
        pattern.envVars.forEach(env => output += `  - ${env}\n`);
        output += '\n';
      }
      
      if (pattern.keywords.length > 0) {
        output += `🏷️  Keywords:\n`;
        pattern.keywords.forEach(kw => output += `  - ${kw}\n`);
        output += '\n';
      }
      
      output += `Last updated: ${new Date(pattern.lastUpdated).toLocaleString()}\n`;
      
      return output;
      
    } else {
      // Get summary of all learnings
      const summary = await memorySystem.getLearningsSummary();
      
      if (summary.totalAnalyses === 0) {
        return `🧠 No past learnings yet. This is your first analysis!\n\nYou're starting fresh - use search_web and learn_about_sponsor to gather knowledge.`;
      }
      
      let output = `🧠 Your Learning Summary (from ${summary.totalAnalyses} analyses):\n\n`;
      output += `📊 Performance:\n`;
      output += `  - Average accuracy: ${(summary.averageAccuracy * 100).toFixed(1)}%\n`;
      output += `  - Average confidence: ${(summary.averageConfidence * 100).toFixed(1)}%\n`;
      output += `  - Improvement rate: ${summary.improvementRate >= 0 ? '+' : ''}${summary.improvementRate.toFixed(1)}%\n\n`;
      
      output += `📦 Patterns learned: ${summary.totalPatternsLearned} sponsors\n\n`;
      
      if (summary.topPatterns.length > 0) {
        output += `🏆 Top discovered patterns (use these!):\n`;
        summary.topPatterns.slice(0, 10).forEach(p => {
          output += `  - ${p.sponsor}: "${p.pattern}" (confidence: ${(p.confidence * 100).toFixed(0)}%)\n`;
        });
        output += '\n';
      }
      
      output += `💡 Use recall_learnings(sponsor="redis") to get detailed patterns for a specific sponsor.\n`;
      
      return output;
    }
  } catch (error) {
    console.error('Error recalling learnings:', error);
    return 'Error accessing memory system. Continuing without past learnings.';
  }
}

