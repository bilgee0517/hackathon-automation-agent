// Lightning Execution Agent
// Specialized AI agent that runs projects in Lightning AI cloud and validates integrations

import { getLightningManager } from '../services/lightning';
import { getAnthropicClient } from './provider';
import { ExecutionResults, EndpointTestResult, SponsorName } from '../types';

interface ExecutionAgentInput {
  repoPath: string;
  language: string;
  sponsors: string[]; // List of detected sponsors to validate
  projectName: string;
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
   * Main execution flow
   */
  async executeAnalysis(input: ExecutionAgentInput): Promise<ExecutionResults> {
    console.log('\n⚡═════════════════════════════════════════════════════');
    console.log('⚡ Lightning Execution Agent Starting');
    console.log('⚡═════════════════════════════════════════════════════');
    console.log(`Project: ${input.projectName}`);
    console.log(`Language: ${input.language}`);
    console.log(`Sponsors to validate: ${input.sponsors.join(', ')}`);
    
    const startTime = Date.now();
    
    try {
      // Step 1: Get execution plan from AI
      const plan = await this.createExecutionPlan(input);
      
      if (!plan.shouldExecute) {
        console.log('⚡ Agent decided not to execute (not enough value)');
        return {
          tested: false,
          verificationNotes: 'Project structure not suitable for automated execution'
        };
      }
      
      // Step 2: Create Lightning Studio
      const studioId = await this.lightning.createStudio({
        name: `execution-${input.projectName}-${Date.now()}`,
        environment: plan.environment,
        hardware: 'cpu'
      });
      
      // Step 3: Upload repo
      await this.lightning.uploadRepo(studioId, input.repoPath);
      
      // Step 4: Install dependencies
      console.log('\n⚡ Installing dependencies...');
      const installResult = await this.lightning.executeCommand(
        studioId,
        plan.installCommand
      );
      
      const results: ExecutionResults = {
        tested: true,
        cloudEnvironment: 'Lightning AI Studio',
        studioId,
        installSuccess: installResult.success,
        installLogs: installResult.stdout + '\n' + installResult.stderr
      };
      
      if (!installResult.success) {
        console.log('⚡ Installation failed, stopping execution');
        await this.lightning.deleteStudio(studioId);
        return results;
      }
      
      // Step 5: Run tests (if available)
      if (plan.testCommand) {
        console.log('\n⚡ Running tests...');
        const testResult = await this.lightning.executeCommand(
          studioId,
          plan.testCommand
        );
        
        results.testsRun = this.parseTestCount(testResult.stdout);
        results.testsPassed = testResult.success ? results.testsRun : 0;
        results.testsFailed = testResult.success ? 0 : results.testsRun;
        results.testLogs = testResult.stdout.substring(0, 2000);
      }
      
      // Step 6: Start application (if applicable)
      if (plan.startCommand && plan.port) {
        console.log('\n⚡ Starting application...');
        
        try {
          const appUrl = await this.lightning.startApp(
            studioId,
            plan.startCommand,
            plan.port
          );
          
          results.appStarted = true;
          results.appUrl = appUrl;
          
          // Wait a bit for app to fully start
          await this.sleep(5000);
          
          // Step 7: Test endpoints
          if (plan.endpointsToTest && plan.endpointsToTest.length > 0) {
            console.log('\n⚡ Testing API endpoints...');
            results.endpointsTested = [];
            
            for (const endpoint of plan.endpointsToTest) {
              const testResult = await this.lightning.testEndpoint(
                `${appUrl}${endpoint.path}`,
                endpoint.method
              );
              results.endpointsTested.push(testResult);
              
              console.log(`  ${testResult.success ? '✓' : '✗'} ${endpoint.method} ${endpoint.path} - ${testResult.status} (${testResult.responseTime}ms)`);
            }
            
            // Calculate performance metrics
            const successfulTests = results.endpointsTested.filter(t => t.success);
            if (successfulTests.length > 0) {
              results.performanceMetrics = {
                avgResponseTime: Math.round(
                  successfulTests.reduce((sum, t) => sum + t.responseTime, 0) / successfulTests.length
                )
              };
            }
          }
          
          // Get app logs
          results.appLogs = await this.lightning.getLogs(studioId, 50);
          
        } catch (error) {
          console.error('⚡ Failed to start/test app:', error);
          results.appStarted = false;
        }
      }
      
      // Step 8: AI Analysis of execution results
      results.verificationNotes = await this.analyzeExecutionResults(
        input,
        results
      );
      
      // Cleanup
      await this.lightning.deleteStudio(studioId);
      
      const duration = Date.now() - startTime;
      console.log('\n⚡═════════════════════════════════════════════════════');
      console.log(`⚡ Execution complete in ${duration}ms`);
      console.log('⚡═════════════════════════════════════════════════════\n');
      
      return results;
      
    } catch (error) {
      console.error('⚡ Execution agent failed:', error);
      return {
        tested: true,
        verificationNotes: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Use AI to create an execution plan
   */
  private async createExecutionPlan(input: ExecutionAgentInput): Promise<ExecutionPlan> {
    console.log('\n⚡ Creating execution plan with AI...');
    
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
   * Helper: Parse test count from test output
   */
  private parseTestCount(output: string): number {
    // Look for common test output patterns
    const patterns = [
      /(\d+) passing/,
      /(\d+) tests? passed/,
      /OK: (\d+)/,
      /Tests run: (\d+)/
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
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

