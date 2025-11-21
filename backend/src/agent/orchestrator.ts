// AI Agent Orchestrator - Core analysis engine using Claude or OpenAI

import { AnalysisResult, SponsorName, ExecutionResults } from '../types';
import { tools, executeToolCall } from './tools';
import { getAnalysisSystemPrompt, getInitialAnalysisPrompt } from './prompts';
import { v4 as uuidv4 } from 'uuid';
import { getAvailableProvider, getAnthropicClient, getOpenAIClient, getProviderName } from './provider';
import { runOpenAIAnalysis } from './openai-orchestrator';
import { runReflectionLoop } from '../services/reflection';
import { getLightningExecutionAgent } from './lightning-executor';
import { isLightningExecutionEnabled } from '../services/lightning';

interface Message {
  role: 'user' | 'assistant';
  content: any;
}

/**
 * Run the AI agent to analyze a repository (supports both Anthropic and OpenAI)
 */
export async function runAgentAnalysis(
  repoPath: string,
  teamName: string,
  projectName: string,
  githubUrl: string,
  onProgress?: (progress: string) => void
): Promise<AnalysisResult> {
  
  // Determine which AI provider to use
  const provider = getAvailableProvider();
  
  if (!provider) {
    throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY');
  }
  
  console.log(`🤖 Using AI provider: ${getProviderName(provider)}`);
  
  // Route to appropriate implementation
  if (provider === 'openai') {
    const client = getOpenAIClient();
    return await runOpenAIAnalysis(client, repoPath, teamName, projectName, githubUrl, onProgress);
  }
  
  // Default to Anthropic (Claude)
  return await runClaudeAnalysis(repoPath, teamName, projectName, githubUrl, onProgress);
}

/**
 * Run analysis using Anthropic (Claude)
 */
async function runClaudeAnalysis(
  repoPath: string,
  teamName: string,
  projectName: string,
  githubUrl: string,
  onProgress?: (progress: string) => void
): Promise<AnalysisResult> {
  
  const analysisStartTime = Date.now();
  const client = getAnthropicClient();
  const systemPrompt = await getAnalysisSystemPrompt();
  const initialPrompt = await getInitialAnalysisPrompt(repoPath, teamName, projectName);
  
  const messages: Message[] = [
    {
      role: 'user',
      content: initialPrompt
    }
  ];
  
  let continueLoop = true;
  let iterationCount = 0;
  let totalToolCalls = 0;
  const maxIterations = 50; // Safety limit
  
  console.log('🤖 Starting Claude (Anthropic) agent analysis...');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Repository: ${repoPath}`);
  console.log(`Team: ${teamName}`);
  console.log(`Project: ${projectName}`);
  console.log('═══════════════════════════════════════════════════════\n');
  onProgress?.('Starting analysis with Claude...');
  
  while (continueLoop && iterationCount < maxIterations) {
    iterationCount++;
    
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📍 ITERATION ${iterationCount}`);
      console.log('='.repeat(80));
      console.log(`Messages in conversation: ${messages.length}`);
      console.log(`Requesting response from Claude...`);
      onProgress?.(`[Iteration ${iterationCount}] Requesting response from Claude...`);
      
      const requestStart = Date.now();
      const response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022', // Latest Haiku model - faster and cheaper
        max_tokens: 8000,
        system: systemPrompt,
        tools: tools as any,
        messages: messages as any
      });
      const requestTime = Date.now() - requestStart;
      
      console.log(`✓ Response received in ${requestTime}ms`);
      console.log(`Stop reason: ${response.stop_reason}`);
      
      // Check if agent wants to use tools
      if (response.stop_reason === 'tool_use') {
        const toolResults: any[] = [];
        
        // Count and preview tools being used
        const toolNames = response.content
          .filter(block => block.type === 'tool_use')
          .map(block => block.type === 'tool_use' ? block.name : '')
          .join(', ');
        
        console.log(`\n🔧 Agent wants to use tools: ${toolNames}`);
        onProgress?.(`[Iteration ${iterationCount}] Using tools: ${toolNames}`);
        
        // Execute all tool calls
        let toolIndex = 0;
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            toolIndex++;
            totalToolCalls++;
            const toolName = block.name;
            
            console.log(`\n  ┌─ Tool ${toolIndex}: ${toolName}`);
            console.log(`  │ Input: ${JSON.stringify(block.input, null, 2).split('\n').map((line, i) => i === 0 ? line : '  │        ' + line).join('\n')}`);
            onProgress?.(`  → ${toolName}: ${JSON.stringify(block.input).substring(0, 50)}...`);
            
            const toolStart = Date.now();
            const result = await executeToolCall(block.name, block.input, repoPath);
            const toolTime = Date.now() - toolStart;
            
            const resultLines = result.split('\n');
            const resultPreview = resultLines.slice(0, 5).join('\n  │        ');
            const hasMore = resultLines.length > 5;
            
            console.log(`  │ Result (${toolTime}ms, ${result.length} chars, ${resultLines.length} lines):`);
            console.log(`  │        ${resultPreview}${hasMore ? '\n  │        ... (' + (resultLines.length - 5) + ' more lines)' : ''}`);
            console.log(`  └─ Done`);
            
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result
            });
          }
        }
        
        // Add assistant's response and tool results to conversation
        messages.push({
          role: 'assistant',
          content: response.content
        });
        
        messages.push({
          role: 'user',
          content: toolResults
        });
        
      } else if (response.stop_reason === 'end_turn') {
        // Agent finished - extract the analysis
        continueLoop = false;
        
        // Find the text content in the response
        const textBlock = response.content.find(block => block.type === 'text');
        
        if (!textBlock || textBlock.type !== 'text') {
          console.error('❌ No text content in final response');
          console.error('Response content:', JSON.stringify(response.content, null, 2));
          throw new Error('No text response from agent');
        }
        
        const responseText = textBlock.text;
        console.log('\n✅ Agent completed analysis!');
        console.log('═'.repeat(80));
        console.log(`Response length: ${responseText.length} characters`);
        console.log(`First 500 chars:\n${responseText.substring(0, 500)}`);
        console.log(`\nLast 500 chars:\n${responseText.substring(Math.max(0, responseText.length - 500))}`);
        console.log('═'.repeat(80));
        onProgress?.('Parsing analysis results...');
        
        // Check if response contains JSON
        if (!responseText.includes('{') || !responseText.includes('}')) {
          console.warn('⚠️  Response does not contain JSON. Asking agent to provide JSON...');
          
          // Add assistant's response
          messages.push({
            role: 'assistant',
            content: response.content
          });
          
          // Ask for JSON explicitly
          messages.push({
            role: 'user',
            content: 'Please provide your complete analysis in the JSON format specified in the system prompt. Start with { and end with }. Include all sponsors with their scores and evidence.'
          });
          
          continueLoop = true; // Continue to get JSON
          continue;
        }
        
        // Extract JSON from response
        const analysis = parseAnalysisFromResponse(responseText);
        
        // Add metadata
        const completeAnalysis = {
          teamId: uuidv4(),
          teamName,
          projectName,
          githubUrl,
          analyzedAt: new Date().toISOString(),
          ...analysis
        };
        
        // Validate and ensure all required fields are present
        let result = validateAnalysisResult(completeAnalysis);
        
        const analysisTime = Date.now() - analysisStartTime;
        console.log('✓ Static analysis complete');
        console.log(`  - Time taken: ${analysisTime}ms`);
        console.log(`  - Tool calls: ${totalToolCalls}`);
        console.log(`  - Iterations: ${iterationCount}`);
        
        // === NEW: DELEGATE TO LIGHTNING EXECUTION AGENT ===
        if (isLightningExecutionEnabled()) {
          onProgress?.('Running cloud execution validation...');
          
          try {
            const executionResult = await runLightningExecution(
              repoPath,
              result,
              projectName,
              onProgress
            );
            
            // Synthesize execution results into analysis
            result = synthesizeExecutionResults(result, executionResult);
            
          } catch (executionError) {
            console.error('⚡ Lightning execution failed (continuing):', executionError);
            // Don't fail the whole analysis if execution fails
            result.executionSummary = {
              enabled: true,
              success: false,
              error: executionError instanceof Error ? executionError.message : 'Unknown error'
            };
          }
        }
        
        onProgress?.('Analysis complete! Running reflection...');
        
        // Run reflection loop to learn from this analysis
        try {
          await runReflectionLoop(result, {
            repoPath,
            toolCallsUsed: totalToolCalls,
            iterationCount,
            timeMs: analysisTime
          });
        } catch (reflectionError) {
          console.error('Reflection failed (continuing anyway):', reflectionError);
        }
        
        onProgress?.('Done!');
        return result;
        
      } else {
        // Unexpected stop reason
        console.warn(`Unexpected stop reason: ${response.stop_reason}`);
        continueLoop = false;
        throw new Error(`Agent stopped unexpectedly: ${response.stop_reason}`);
      }
      
    } catch (error) {
      console.error(`Error in agent iteration ${iterationCount}:`, error);
      throw error;
    }
  }
  
  if (iterationCount >= maxIterations) {
    throw new Error('Agent exceeded maximum iteration count');
  }
  
  throw new Error('Agent analysis failed');
}

/**
 * Parse the analysis JSON from the agent's response
 */
function parseAnalysisFromResponse(responseText: string): Partial<AnalysisResult> {
  console.log('\n📝 Parsing agent response...');
  console.log('═'.repeat(80));
  
  let jsonText = responseText;
  
  // Strategy 1: Remove markdown code blocks
  console.log('Strategy 1: Looking for markdown code blocks...');
  const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    console.log('✓ Found JSON in markdown code block');
    jsonText = jsonMatch[1];
  } else {
    console.log('⚠ No markdown code block found');
    
    // Strategy 2: Find JSON object boundaries
    console.log('Strategy 2: Looking for JSON boundaries...');
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = responseText.substring(firstBrace, lastBrace + 1);
      console.log(`✓ Extracted JSON from position ${firstBrace} to ${lastBrace}`);
      
      // Check if there's text before the JSON
      if (firstBrace > 0) {
        const textBefore = responseText.substring(0, firstBrace).trim();
        if (textBefore) {
          console.log(`ℹ️  Text before JSON (${textBefore.length} chars): "${textBefore.substring(0, 100)}..."`);
        }
      }
      
      // Check if there's text after the JSON
      if (lastBrace < responseText.length - 1) {
        const textAfter = responseText.substring(lastBrace + 1).trim();
        if (textAfter) {
          console.log(`ℹ️  Text after JSON (${textAfter.length} chars): "${textAfter.substring(0, 100)}..."`);
        }
      }
    } else {
      console.error('❌ Could not find valid JSON object boundaries');
      console.error('First { at:', firstBrace);
      console.error('Last } at:', lastBrace);
      console.error('Full response (first 1000 chars):');
      console.error(responseText.substring(0, 1000));
      console.error('\nFull response (last 1000 chars):');
      console.error(responseText.substring(Math.max(0, responseText.length - 1000)));
      throw new Error('No valid JSON object found in response');
    }
  }
  
  // Clean up common JSON issues
  jsonText = jsonText.trim();
  
  console.log(`\nExtracted JSON (${jsonText.length} chars)`);
  console.log('First 500 chars of JSON:');
  console.log(jsonText.substring(0, 500));
  
  try {
    console.log('\nAttempting to parse JSON...');
    const parsed = JSON.parse(jsonText);
    console.log('✅ JSON parsed successfully!');
    
    // Validate the structure
    console.log('\nValidating structure...');
    const hasRepoStats = !!parsed.repositoryStats;
    const hasSponsors = !!parsed.sponsors;
    
    console.log(`  repositoryStats: ${hasRepoStats ? '✓' : '✗'}`);
    console.log(`  sponsors: ${hasSponsors ? '✓' : '✗'}`);
    
    if (parsed.repositoryStats) {
      console.log(`  - mainLanguage: ${parsed.repositoryStats.mainLanguage || 'missing'}`);
      console.log(`  - totalFiles: ${parsed.repositoryStats.totalFiles || 0}`);
    }
    
    if (parsed.sponsors) {
      const sponsorKeys = Object.keys(parsed.sponsors);
      console.log(`  - sponsors found: ${sponsorKeys.length}`);
      const detected = sponsorKeys.filter(k => parsed.sponsors[k]?.detected);
      console.log(`  - sponsors detected: ${detected.length}`);
      if (detected.length > 0) {
        console.log(`    ${detected.join(', ')}`);
      }
    }
    
    if (!hasRepoStats || !hasSponsors) {
      console.error('❌ Invalid analysis structure - missing required fields');
      console.error('Available keys:', Object.keys(parsed));
      throw new Error('Invalid analysis structure: missing repositoryStats or sponsors');
    }
    
    console.log('✅ Analysis structure validated!');
    console.log('═'.repeat(80));
    return parsed;
    
  } catch (error) {
    console.error('\n❌ JSON Parse Error!');
    console.error('═'.repeat(80));
    console.error('Error:', error);
    
    if (error instanceof SyntaxError) {
      console.error('\nSyntax Error Details:');
      console.error(error.message);
      
      // Try to find the error position
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const start = Math.max(0, pos - 200);
        const end = Math.min(jsonText.length, pos + 200);
        console.error(`\nContext around position ${pos}:`);
        console.error('...' + jsonText.substring(start, end) + '...');
        console.error(' '.repeat(pos - start + 3) + '^');
      }
    }
    
    console.error('\nAttempted to parse:');
    console.error(jsonText.substring(0, 2000));
    console.error('═'.repeat(80));
    
    throw new Error(`Failed to parse agent response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a default/empty sponsor analysis
 */
function createEmptySponsorAnalysis() {
  return {
    detected: false,
    integrationScore: 0,
    technicalSummary: 'Not detected in this project',
    plainEnglishSummary: 'This technology was not used in the project',
    evidence: {
      files: [],
      codeSnippets: [],
      keyFindings: []
    },
    prizeEligible: false,
    confidence: 1.0,
    suggestions: []
  };
}

/**
 * Validate and fill in any missing sponsor analyses
 */
export function validateAnalysisResult(result: Partial<AnalysisResult>): AnalysisResult {
  const allSponsors: SponsorName[] = [
    'aws', 'skyflow', 'postman', 'redis', 'forethought', 'finsterAI',
    'senso', 'anthropic', 'sanity', 'trmLabs', 'coder', 'lightpanda',
    'lightningAI', 'parallel', 'cleric'
  ];
  
  // Ensure all sponsors are present
  if (!result.sponsors) {
    result.sponsors = {} as Record<SponsorName, any>;
  }
  
  const sponsors = result.sponsors as Record<SponsorName, any>;
  for (const sponsor of allSponsors) {
    if (!sponsors[sponsor]) {
      sponsors[sponsor] = createEmptySponsorAnalysis();
    }
  }
  
  // Set defaults
  if (!result.repositoryStats) {
    result.repositoryStats = {
      mainLanguage: 'Unknown',
      totalFiles: 0,
      hasTests: false,
      testsPassed: null,
      dependencies: []
    };
  }
  
  if (!result.overallSummary) {
    result.overallSummary = 'Analysis completed';
  }
  
  if (!result.innovativeAspects) {
    result.innovativeAspects = [];
  }
  
  return result as AnalysisResult;
}

/**
 * Run Lightning AI execution validation
 */
async function runLightningExecution(
  repoPath: string,
  staticAnalysis: AnalysisResult,
  projectName: string,
  onProgress?: (progress: string) => void
): Promise<ExecutionResults | null> {
  console.log('\n⚡════════════════════════════════════════════════');
  console.log('⚡ DELEGATING TO LIGHTNING EXECUTION AGENT');
  console.log('⚡════════════════════════════════════════════════');
  
  const startTime = Date.now();
  
  try {
    // Determine which sponsors are worth validating
    const detectedSponsors: string[] = [];
    for (const [sponsor, analysis] of Object.entries(staticAnalysis.sponsors)) {
      if (analysis.detected && analysis.integrationScore >= 5) {
        detectedSponsors.push(sponsor);
      }
    }
    
    if (detectedSponsors.length === 0) {
      console.log('⚡ No sponsors worth validating, skipping execution');
      return null;
    }
    
    console.log(`⚡ Sponsors to validate: ${detectedSponsors.join(', ')}`);
    onProgress?.(`Testing ${detectedSponsors.length} sponsor integrations in cloud...`);
    
    // Get the execution agent and run
    const executionAgent = getLightningExecutionAgent();
    
    const executionResults = await executionAgent.executeAnalysis({
      repoPath,
      language: staticAnalysis.repositoryStats.mainLanguage,
      sponsors: detectedSponsors,
      projectName
    });
    
    const duration = Date.now() - startTime;
    console.log(`⚡ Lightning execution completed in ${duration}ms`);
    
    return executionResults;
    
  } catch (error) {
    console.error('⚡ Lightning execution failed:', error);
    throw error;
  }
}

/**
 * Synthesize execution results into the analysis
 */
function synthesizeExecutionResults(
  staticAnalysis: AnalysisResult,
  executionResults: ExecutionResults | null
): AnalysisResult {
  if (!executionResults || !executionResults.tested) {
    return staticAnalysis;
  }
  
  console.log('\n⚡ Synthesizing execution results into analysis...');
  
  // Add execution summary
  staticAnalysis.executionSummary = {
    enabled: true,
    success: true,
    cloudPlatform: 'Lightning AI',
    duration: 0 // Could calculate from executionResults
  };
  
  // For each detected sponsor, add execution results
  for (const [sponsorName, analysis] of Object.entries(staticAnalysis.sponsors)) {
    if (analysis.detected) {
      // Add execution results to sponsor analysis
      analysis.executionResults = executionResults;
      
      // Adjust score based on execution
      if (executionResults.appStarted && executionResults.endpointsTested) {
        const successfulTests = executionResults.endpointsTested.filter(t => t.success);
        const successRate = successfulTests.length / executionResults.endpointsTested.length;
        
        if (successRate >= 0.8) {
          // Boost score if execution validated the integration
          const originalScore = analysis.integrationScore;
          analysis.integrationScore = Math.min(10, originalScore + 1);
          console.log(`  ⚡ ${sponsorName}: ${originalScore} → ${analysis.integrationScore} (execution verified)`);
        } else if (successRate < 0.5) {
          // Lower score if execution showed issues
          const originalScore = analysis.integrationScore;
          analysis.integrationScore = Math.max(0, originalScore - 2);
          console.log(`  ⚡ ${sponsorName}: ${originalScore} → ${analysis.integrationScore} (execution issues)`);
        }
      }
      
      // Update confidence based on execution
      if (executionResults.appStarted) {
        analysis.confidence = Math.min(1.0, analysis.confidence + 0.1);
      }
      
      // Enhance technical summary with execution info
      if (executionResults.verificationNotes) {
        analysis.technicalSummary += `\n\nExecution Verification: ${executionResults.verificationNotes}`;
      }
    }
  }
  
  console.log('⚡ Synthesis complete!');
  
  return staticAnalysis;
}


