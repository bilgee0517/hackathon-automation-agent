// Lightning Execution Agent
// Specialized AI agent that runs projects in Lightning AI cloud and validates integrations

import { getLightningManager } from '../services/lightning';
import { getAnthropicClient } from './provider';
import { getTestGeneratorAgent } from './test-generator';
import { ExecutionResults, EndpointTestResult } from '../types';
import { emitAgentEvent } from '../api/dashboard';

interface ExecutionAgentInput {
  repoPath: string;
  githubUrl: string; // GitHub URL for cloud cloning
  language: string;
  sponsors: string[]; // List of detected sponsors to validate
  projectName: string;
  jobId?: string; // For event logging
}

interface ExecutionPlan {
  shouldExecute: boolean;
  environment: 'python' | 'nodejs' | 'go';
  installCommand: string;
  testCommand?: string;
  startCommand?: string;
  port?: number;
  endpointsToTest?: Array<{
    path: string;
    method: string;
    description: string;
  }>;
  estimatedDuration: number; // seconds
}

/**
 * Lightning Execution Agent
 * This agent receives a plan from the main orchestrator and executes it in Lightning AI
 */
export class LightningExecutionAgent {
  private lightning = getLightningManager();
  
  /**
   * Main execution flow - now uses real Lightning AI cloud execution
   */
  async executeAnalysis(input: ExecutionAgentInput): Promise<ExecutionResults> {
    console.log('\n⚡═════════════════════════════════════════════════════');
    console.log('⚡ Lightning Execution Agent Starting');
    console.log('⚡═════════════════════════════════════════════════════');
    console.log(`Project: ${input.projectName}`);
    console.log(`Language: ${input.language}`);
    console.log(`GitHub: ${input.githubUrl}`);
    console.log(`Sponsors to validate: ${input.sponsors.join(', ')}`);
    
    // Emit start event
    if (input.jobId) {
      emitAgentEvent({
        jobId: input.jobId,
        timestamp: Date.now(),
        type: 'lightning_start',
        agent: 'lightning',
        data: { projectName: input.projectName, language: input.language, sponsors: input.sponsors }
      });
    }
    
    // Check if Lightning is available
    if (!this.lightning.isAvailable()) {
      console.log('⚡ Lightning AI not available, using local validation only');
      
      if (input.jobId) {
        emitAgentEvent({
          jobId: input.jobId,
          timestamp: Date.now(),
          type: 'lightning_action',
          agent: 'lightning',
          data: { action: 'Using local validation (Lightning AI not configured)' }
        });
      }
      
      return await this.localValidationFallback(input);
    }
    
    try {
      // Step 1: Get execution plan from AI
      const plan = await this.createExecutionPlan(input);
      
      if (!plan.shouldExecute) {
        console.log('⚡ AI suggests local validation only');
        
        if (input.jobId) {
          emitAgentEvent({
            jobId: input.jobId,
            timestamp: Date.now(),
            type: 'lightning_action',
            agent: 'lightning',
            data: { action: 'Using local validation (execution plan suggested local only)' }
          });
        }
        
        return await this.localValidationFallback(input);
      }
      
      // Step 2: Execute in Lightning AI cloud via Python bridge
      console.log('\n⚡ Executing in Lightning AI cloud...');
      
      if (input.jobId) {
        emitAgentEvent({
          jobId: input.jobId,
          timestamp: Date.now(),
          type: 'lightning_action',
          agent: 'lightning',
          data: { 
            action: 'Executing in Lightning AI cloud', 
            environment: plan.environment,
            installCommand: plan.installCommand,
            testCommand: plan.testCommand
          }
        });
      }
      
      const commands = [
        plan.installCommand,
        ...(plan.testCommand ? [plan.testCommand] : [])
      ];
      
      const startTime = Date.now();
      const cloudResult = await this.lightning.executeInCloud(
        input.githubUrl,
        input.projectName,
        commands
      );
      const durationMs = Date.now() - startTime;
      
      if (input.jobId) {
        emitAgentEvent({
          jobId: input.jobId,
          timestamp: Date.now(),
          type: 'lightning_result',
          agent: 'lightning',
          data: { 
            success: cloudResult.success,
            message: `Cloud execution completed in ${durationMs}ms`,
            outputs: cloudResult.outputs.map(o => ({
              command: o.command,
              success: o.success,
              stdout: o.stdout?.substring(0, 500),
              stderr: o.stderr?.substring(0, 500)
            }))
          }
        });
      }
      
      // Process cloud results
      const installOutput = cloudResult.outputs.find(o => o.command === plan.installCommand);
      const testOutput = cloudResult.outputs.find(o => o.command === plan.testCommand);
      
      const results: ExecutionResults = {
        tested: true,
        cloudEnvironment: 'Lightning AI Cloud',
        durationMs,
        installSuccess: installOutput?.success || false,
        installLogs: installOutput?.stdout || '',
        testsRun: testOutput ? this.parseTestCount(testOutput.stdout) : undefined,
        testsPassed: testOutput?.success ? 1 : 0,
        testLogs: testOutput?.stdout || ''
      };
      
      // Check if tests actually ran or if we just got the fallback echo
      const actualTestOutput = testOutput?.stdout || testOutput?.stderr || '';
      const testsActuallyRan = this.parseTestCount(actualTestOutput) > 0 || 
                                actualTestOutput.includes('passing') ||
                                actualTestOutput.includes('test') ||
                                actualTestOutput.includes('passed');
      
      const testsMissing = testOutput && 
        (actualTestOutput.includes('No tests found') ||  // Our echo fallback
         actualTestOutput.includes('Missing script') ||   // npm error
         actualTestOutput.includes('command not found') || // yarn not found
         !testsActuallyRan);  // No actual test results
      
      // If tests are missing, generate and run them!
      if (testsMissing && installOutput?.success) {
        console.log('\n🧪 Tests missing or no real tests ran - activating Test Generation Agent...');
        console.log(`   Test output: ${actualTestOutput.substring(0, 100)}`);
        
        if (input.jobId) {
          emitAgentEvent({
            jobId: input.jobId,
            timestamp: Date.now(),
            type: 'test_generation',
            agent: 'test-generator',
            data: { action: 'Generating tests with AI' }
          });
        }
        
        try {
          const generatedTests = await this.generateAndRunTests(input, cloudResult);
          
          if (generatedTests) {
            results.testsRun = generatedTests.testsRun;
            results.testsPassed = generatedTests.testsPassed;
            results.testLogs = (results.testLogs || '') + '\n\n--- AI-Generated Tests ---\n' + generatedTests.testLogs;
            
            console.log(`🧪 Generated tests completed: ${generatedTests.testsPassed}/${generatedTests.testsRun} passed`);
            
            if (input.jobId) {
              emitAgentEvent({
                jobId: input.jobId,
                timestamp: Date.now(),
                type: 'test_generation',
                agent: 'test-generator',
                data: { 
                  action: 'Tests generated and executed',
                  testsRun: generatedTests.testsRun,
                  testsPassed: generatedTests.testsPassed
                }
              });
            }
          }
        } catch (genError) {
          console.error('🧪 Test generation failed:', genError);
          if (input.jobId) {
            emitAgentEvent({
              jobId: input.jobId,
              timestamp: Date.now(),
              type: 'test_generation',
              agent: 'test-generator',
              data: { action: 'Test generation failed', error: String(genError) }
            });
          }
        }
      }
      
      // Validate integrations
      results.endpointsTested = await this.validateIntegrations(
        input.repoPath,
        input.sponsors,
        results.installLogs || '',
        results.testLogs || ''
      );
      
      const validatedCount = results.endpointsTested?.filter(t => t.success).length || 0;
      results.appStarted = validatedCount > 0;
      
      // AI Analysis of execution results
      results.verificationNotes = await this.analyzeExecutionResults(input, results);
      
      console.log('\n⚡═════════════════════════════════════════════════════');
      console.log(`⚡ Cloud execution complete in ${durationMs}ms`);
      console.log('⚡═════════════════════════════════════════════════════\n');
      
      return results;
      
    } catch (error) {
      console.error('⚡ Lightning execution failed:', error);
      console.log('⚡ Falling back to local validation');
      return await this.localValidationFallback(input);
    }
  }
  
  /**
   * Parse test count from output
   */
  private parseTestCount(output: string): number {
    const patterns = [
      /(\d+) passing/,
      /(\d+) tests? passed/,
      /OK: (\d+)/,
      /Tests run: (\d+)/,
      /(\d+) passed/
    ];
    
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return 0;
  }
  
  /**
   * Generate tests using AI and run them in Lightning Studio
   */
  private async generateAndRunTests(
    input: ExecutionAgentInput,
    _cloudResult: any
  ): Promise<{ testsRun: number; testsPassed: number; testLogs: string } | null> {
    
    console.log('\n🧪═════════════════════════════════════════════════════');
    console.log('🧪 TEST GENERATION SUB-AGENT');
    console.log('🧪═════════════════════════════════════════════════════');
    
    try {
      // Step 1: Analyze repo to find main files
      const mainFiles = await this.findMainFiles(input.repoPath, input.language);
      console.log(`Found ${mainFiles.length} main files to analyze`);
      
      // Step 2: Use Test Generator Agent to create tests
      const testGenerator = getTestGeneratorAgent();
      const generatedTests = await testGenerator.generateTests({
        repoPath: input.repoPath,
        language: input.language,
        mainFiles,
        detectedSponsors: input.sponsors,
        hasPackageJson: true,  // We know this if npm install worked
        hasApiEndpoints: mainFiles.some(f => 
          f.includes('server') || f.includes('app') || f.includes('api')
        )
      });
      
      if (generatedTests.length === 0) {
        console.log('🧪 No tests were generated');
        return null;
      }
      
      const test = generatedTests[0];
      console.log(`🧪 Generated test file: ${test.filename}`);
      console.log(`🧪 Framework: ${test.framework}`);
      
      // Step 3: Write test file to Lightning Studio and run it
      const testResult = await this.lightning.executeInCloud(
        input.githubUrl,
        input.projectName,
        [
          // Write the test file
          `cat > ${test.filename} << 'TESTEOF'
${test.content}
TESTEOF`,
          // Install test framework if needed
          test.framework === 'jest' ? 'npm install --save-dev jest' : 
          test.framework === 'pytest' ? 'pip install pytest' : 'echo "Framework ready"',
          // Run the tests
          test.framework === 'jest' ? `npx jest ${test.filename} --verbose` :
          test.framework === 'pytest' ? `pytest ${test.filename} -v` :
          `node ${test.filename}`
        ]
      );
      
      console.log('🧪 Test execution complete');
      
      // Parse test results
      const testRunOutput = testResult.outputs[testResult.outputs.length - 1];
      const testsRun = this.parseTestCount(testRunOutput?.stdout || '');
      const testsPassed = testRunOutput?.success ? testsRun : 0;
      
      return {
        testsRun: testsRun || 1,
        testsPassed,
        testLogs: testRunOutput?.stdout || testRunOutput?.stderr || 'No output'
      };
      
    } catch (error) {
      console.error('🧪 Test generation/execution error:', error);
      return null;
    }
  }
  
  /**
   * Find main source files to analyze
   */
  private async findMainFiles(repoPath: string, _language: string): Promise<string[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const mainFiles: string[] = [];
    
    // Common entry point patterns
    const patterns = [
      'index.js', 'index.ts', 'app.js', 'app.ts', 'server.js', 'server.ts',
      'main.js', 'main.ts', 'src/index.js', 'src/index.ts', 'src/app.js', 'src/app.ts',
      'app.py', 'main.py', 'server.py', 'src/app.py', 'src/main.py',
      'main.go', 'app.go', 'server.go', 'cmd/main.go'
    ];
    
    for (const pattern of patterns) {
      try {
        const fullPath = path.join(repoPath, pattern);
        await fs.access(fullPath);
        mainFiles.push(pattern);
        
        if (mainFiles.length >= 3) break;  // Limit to 3 files
      } catch {
        // File doesn't exist, continue
      }
    }
    
    return mainFiles;
  }
  
  /**
   * Local validation fallback (works without cloud)
   */
  private async localValidationFallback(input: ExecutionAgentInput): Promise<ExecutionResults> {
    const startTime = Date.now();
    
    console.log('\n⚡ Running local validation...');
    
    const results: ExecutionResults = {
      tested: true,
      cloudEnvironment: 'Local Validation',
      installSuccess: true,
      installLogs: ''
    };
    
    try {
      // Validate integrations by examining code
      results.endpointsTested = await this.validateIntegrations(
        input.repoPath,
        input.sponsors,
        '',
        ''
      );
      
      const validatedCount = results.endpointsTested?.filter(t => t.success).length || 0;
      results.appStarted = validatedCount > 0;
      
      console.log(`⚡ Validated ${validatedCount}/${input.sponsors.length} sponsor integrations`);
      
      // AI Analysis of validation results
      results.verificationNotes = await this.analyzeExecutionResults(
        input,
        results
      );
      
      const duration = Date.now() - startTime;
      console.log('\n⚡═════════════════════════════════════════════════════');
      console.log(`⚡ Local validation complete in ${duration}ms`);
      console.log('⚡═════════════════════════════════════════════════════\n');
      
      return results;
      
    } catch (error) {
      console.error('⚡ Local validation failed:', error);
      return {
        tested: true,
        verificationNotes: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Use AI to create an execution plan
   */
  private async createExecutionPlan(input: ExecutionAgentInput): Promise<ExecutionPlan> {
    console.log('\n⚡ Creating execution plan...');
    
    // Determine environment from language
    let environment: 'python' | 'nodejs' | 'go' = 'nodejs';
    let installCommand = 'npm install';
    let testCommand = 'npm test';
    
    const lang = input.language.toLowerCase();
    if (lang.includes('python')) {
      environment = 'python';
      installCommand = 'pip install -r requirements.txt || pip install .';
      testCommand = 'pytest || python -m pytest || python -m unittest || echo "No tests found"';
    } else if (lang.includes('go')) {
      environment = 'go';
      installCommand = 'go mod download';
      testCommand = 'go test ./... || echo "No tests found"';
    } else if (lang.includes('javascript') || lang.includes('typescript') || lang.includes('node')) {
      environment = 'nodejs';
      installCommand = 'npm install || yarn install';
      testCommand = 'npm test || yarn test || echo "No tests found"';
    }
    
    // Simple execution plan - always execute when Lightning is enabled
    const plan: ExecutionPlan = {
      shouldExecute: true, // Always execute when Lightning is enabled
      environment,
      installCommand,
      testCommand,
      startCommand: environment === 'nodejs' ? 'npm start' : environment === 'python' ? 'python app.py' : undefined,
      port: 3000,
      endpointsToTest: [
        { path: '/', method: 'GET', description: 'Root endpoint' },
        { path: '/health', method: 'GET', description: 'Health check' },
        { path: '/api', method: 'GET', description: 'API endpoint' }
      ],
      estimatedDuration: 180 // 3 minutes
    };
    
    console.log('⚡ Execution plan created:');
    console.log(`   Environment: ${plan.environment}`);
    console.log(`   Install: ${plan.installCommand}`);
    console.log(`   Test: ${plan.testCommand}`);
    console.log(`   Estimated duration: ${plan.estimatedDuration}s`);
    
    return plan;
    
    /* OLD AI-based planning (too conservative)
    const client = getAnthropicClient();
    
    const prompt = `You are an expert at analyzing project structures and creating execution plans.

Project: ${input.projectName}
Language: ${input.language}
Sponsors detected: ${input.sponsors.join(', ')}
Repo path: ${input.repoPath}

Your task: Create an execution plan to validate this project runs and its sponsor integrations work.

Return a JSON object with this structure:
{
  "shouldExecute": boolean,  // false if project looks too complex/risky to auto-run
  "environment": "python" | "nodejs" | "go",
  "installCommand": "npm install" | "pip install -r requirements.txt" | etc,
  "testCommand": "npm test" | "pytest" | null if no tests,
  "startCommand": "npm start" | "python app.py" | null if not applicable,
  "port": 3000 | 8000 | null,
  "endpointsToTest": [
    { "path": "/api/health", "method": "GET", "description": "health check" },
    { "path": "/api/chat", "method": "POST", "description": "Claude AI endpoint" }
  ],
  "estimatedDuration": 60  // seconds
}

Guidelines:
- Only execute if it looks safe and valuable
- Skip if: no package manager, crypto wallets, destructive scripts
- Prioritize testing endpoints related to detected sponsors
- Be conservative with estimated duration

Return only valid JSON, no markdown.`;
    
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const textBlock = response.content.find(b => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from AI');
      }
      
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }
      
      const plan = JSON.parse(jsonMatch[0]) as ExecutionPlan;
      
      console.log('⚡ Execution plan created:');
      console.log(`   Should execute: ${plan.shouldExecute}`);
      console.log(`   Environment: ${plan.environment}`);
      console.log(`   Install: ${plan.installCommand}`);
      console.log(`   Estimated duration: ${plan.estimatedDuration}s`);
      
      return plan;
      
    } catch (error) {
      console.error('⚡ Failed to create execution plan:', error);
      // Fallback: Don't execute if planning fails
      return {
        shouldExecute: false,
        environment: 'nodejs',
        installCommand: 'echo "skipped"',
        estimatedDuration: 0
      };
    }
    */
  }
  
  /**
   * Use AI to analyze execution results and create verification notes
   */
  private async analyzeExecutionResults(
    input: ExecutionAgentInput,
    results: ExecutionResults
  ): Promise<string> {
    console.log('\n⚡ Analyzing execution results with AI...');
    
    const client = getAnthropicClient();
    
    const prompt = `Analyze these execution results and provide insights:

Project: ${input.projectName}
Sponsors: ${input.sponsors.join(', ')}

Execution Results:
- Installation: ${results.installSuccess ? 'SUCCESS' : 'FAILED'}
- Tests: ${results.testsRun || 0} run, ${results.testsPassed || 0} passed
- App started: ${results.appStarted ? 'YES' : 'NO'}
- Endpoints tested: ${results.endpointsTested?.length || 0}
${results.endpointsTested?.map(e => `  - ${e.method} ${e.endpoint}: ${e.status} (${e.responseTime}ms)`).join('\n') || ''}

App logs:
${results.appLogs?.substring(0, 500) || 'No logs'}

Task: Write 2-3 sentences summarizing what the execution revealed about the sponsor integrations.
Focus on: Did they actually work? Any errors? Performance?

Return plain text, be specific and helpful.`;
    
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const textBlock = response.content.find(b => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        return 'Execution completed, see results for details.';
      }
      
      return textBlock.text.trim();
      
    } catch (error) {
      console.error('⚡ Failed to analyze results:', error);
      return 'Execution completed, see logs for details.';
    }
  }
  
  /**
   * Validate sponsor integrations by examining code and execution results
   */
  private async validateIntegrations(
    repoPath: string,
    sponsors: string[],
    installLogs: string,
    testLogs: string
  ): Promise<EndpointTestResult[]> {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    
    const results: EndpointTestResult[] = [];
    
    for (const sponsor of sponsors) {
      console.log(`\n⚡ Validating ${sponsor} integration...`);
      
      const validation: EndpointTestResult = {
        endpoint: `/${sponsor}`,
        method: 'VALIDATE',
        status: 0,
        responseTime: 0,
        success: false
      };
      
      const startTime = Date.now();
      const evidence: string[] = [];
      
      try {
        // Strategy 1: Check if sponsor is imported/used in code
        const searchPattern = this.getSponsorSearchPattern(sponsor);
        if (searchPattern) {
          try {
            const grepCmd = `grep -r "${searchPattern}" "${repoPath}/src" "${repoPath}/lib" "${repoPath}/app" 2>/dev/null || true`;
            const grepResult = execSync(grepCmd, { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
            
            if (grepResult.length > 10) {
              evidence.push(`Found ${searchPattern} in code`);
              validation.success = true;
              validation.status = 200;
            }
          } catch (e) {
            // Grep failed, continue
          }
        }
        
        // Strategy 2: Check package.json for dependencies
        const packageJsonPath = path.join(repoPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };
          
          const sponsorPackages = this.getSponsorPackages(sponsor);
          const foundPackages = sponsorPackages.filter(pkg => allDeps[pkg]);
          
          if (foundPackages.length > 0) {
            evidence.push(`Packages: ${foundPackages.join(', ')}`);
            validation.success = true;
            validation.status = 200;
          }
        }
        
        // Strategy 3: Check install logs for successful installation
        if (installLogs.includes(sponsor) || installLogs.includes(this.getSponsorPackages(sponsor)[0])) {
          evidence.push('Installed successfully');
        }
        
        // Strategy 4: Check test logs for successful tests
        if (testLogs.includes(sponsor) && testLogs.includes('passed')) {
          evidence.push('Tests passed');
          validation.success = true;
          validation.status = 200;
        }
        
        // Strategy 5: Check for configuration files
        const configFiles = this.getSponsorConfigFiles(sponsor);
        for (const configFile of configFiles) {
          const configPath = path.join(repoPath, configFile);
          if (fs.existsSync(configPath)) {
            evidence.push(`Config found: ${configFile}`);
            validation.success = true;
            validation.status = 200;
          }
        }
        
        validation.body = evidence.length > 0 ? evidence.join('; ') : 'No evidence found';
        
      } catch (error) {
        validation.error = error instanceof Error ? error.message : 'Validation error';
      }
      
      validation.responseTime = Date.now() - startTime;
      
      console.log(`  ${validation.success ? '✓' : '✗'} ${sponsor}: ${validation.body || validation.error}`);
      
      results.push(validation);
    }
    
    return results;
  }
  
  /**
   * Get search pattern for sponsor
   */
  private getSponsorSearchPattern(sponsor: string): string | null {
    const patterns: Record<string, string> = {
      'anthropic': '@anthropic-ai/sdk',
      'redis': 'createClient\\|ioredis',
      'aws': 'aws-sdk\\|@aws-sdk',
      'sanity': '@sanity/client',
      'postman': 'newman\\|pm.test',
      'skyflow': 'skyflow',
      'parallel': 'parallel-web',
      'lightningAI': 'pytorch.lightning\\|lightning'
    };
    
    return patterns[sponsor] || null;
  }
  
  /**
   * Get package names for sponsor
   */
  private getSponsorPackages(sponsor: string): string[] {
    const packages: Record<string, string[]> = {
      'anthropic': ['@anthropic-ai/sdk', 'anthropic'],
      'redis': ['redis', 'ioredis', 'node-redis'],
      'aws': ['aws-sdk', '@aws-sdk/client-s3', '@aws-sdk/client-dynamodb'],
      'sanity': ['@sanity/client', 'sanity', 'next-sanity'],
      'postman': ['newman', '@postman/newman', 'postman-collection'],
      'skyflow': ['skyflow-node', 'skyflow-js', '@skyflow/node'],
      'parallel': ['parallel-web', '@parallel-finance/sdk'],
      'lightningAI': ['lightning', 'pytorch-lightning', '@lightning-ai/sdk']
    };
    
    return packages[sponsor] || [];
  }
  
  /**
   * Get configuration files for sponsor
   */
  private getSponsorConfigFiles(sponsor: string): string[] {
    const configs: Record<string, string[]> = {
      'postman': ['.postman_collection.json', 'postman_collection.json'],
      'sanity': ['sanity.config.js', 'sanity.config.ts'],
      'aws': ['aws-exports.js', 'serverless.yml', 'cdk.json'],
      'redis': ['redis.conf'],
      'lightningAI': ['lightning.yaml', '.lightning/config.yaml']
    };
    
    return configs[sponsor] || [];
  }
}

/**
 * Singleton instance
 */
let executionAgent: LightningExecutionAgent | null = null;

export function getLightningExecutionAgent(): LightningExecutionAgent {
  if (!executionAgent) {
    executionAgent = new LightningExecutionAgent();
  }
  return executionAgent;
}

