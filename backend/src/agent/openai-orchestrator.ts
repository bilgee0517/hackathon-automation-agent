// OpenAI-specific agent implementation

import OpenAI from 'openai';
import { AnalysisResult } from '../types';
import { tools, executeToolCall } from './tools';
import { getAnalysisSystemPrompt, getInitialAnalysisPrompt } from './prompts';
import { v4 as uuidv4 } from 'uuid';
import { validateAnalysisResult } from './orchestrator';
import { runReflectionLoop } from '../services/reflection';

// Convert tools to OpenAI function format
function convertToolsToOpenAIFormat() {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema
    }
  }));
}

/**
 * Run analysis using OpenAI (GPT-4)
 */
export async function runOpenAIAnalysis(
  client: OpenAI,
  repoPath: string,
  teamName: string,
  projectName: string,
  githubUrl: string,
  onProgress?: (progress: string) => void
): Promise<AnalysisResult> {
  
  const analysisStartTime = Date.now();
  const systemPrompt = await getAnalysisSystemPrompt();
  const initialPrompt = await getInitialAnalysisPrompt(repoPath, teamName, projectName);
  
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: initialPrompt }
  ];
  
  const openAITools = convertToolsToOpenAIFormat();
  
  let continueLoop = true;
  let iterationCount = 0;
  let totalToolCalls = 0;
  const maxIterations = 50;
  
  console.log('🤖 Starting OpenAI (GPT-4) agent analysis...');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Repository: ${repoPath}`);
  console.log(`Team: ${teamName}`);
  console.log(`Project: ${projectName}`);
  console.log('═══════════════════════════════════════════════════════\n');
  onProgress?.('Starting analysis with GPT-4...');
  
  while (continueLoop && iterationCount < maxIterations) {
    iterationCount++;
    
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📍 ITERATION ${iterationCount}`);
      console.log('='.repeat(80));
      console.log(`Messages in conversation: ${messages.length}`);
      console.log(`Requesting response from GPT-4...`);
      onProgress?.(`[Iteration ${iterationCount}] Requesting response from GPT-4...`);
      
      const requestStart = Date.now();
      
      // Add retry logic for rate limits
      let response: OpenAI.Chat.Completions.ChatCompletion | null = null;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts && !response) {
        try {
          response = await client.chat.completions.create({
            model: 'gpt-4-turbo',  // Use gpt-4-turbo for larger context (128k tokens)
            messages: messages,
            tools: openAITools,
            tool_choice: 'auto',
            max_tokens: 4096,
            temperature: 0.7
          });
          
        } catch (error: any) {
          // Check if it's a rate limit error
          if (error.code === 'rate_limit_exceeded') {
            attempt++;
            
            if (attempt < maxAttempts) {
              const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
              console.log(`⚠️  Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${maxAttempts}...`);
              onProgress?.(`Rate limit hit, retrying in ${waitTime/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              console.error('❌ Rate limit exceeded after all retries');
              throw new Error('OpenAI rate limit exceeded. Try again in a few minutes or use Anthropic (ANTHROPIC_API_KEY) instead.');
            }
          } else {
            // Not a rate limit error, throw immediately
            throw error;
          }
        }
      }
      
      if (!response) {
        throw new Error('Failed to get response from OpenAI');
      }
      
      const requestTime = Date.now() - requestStart;
      const choice = response.choices[0];
      console.log(`✓ Response received in ${requestTime}ms`);
      console.log(`Finish reason: ${choice.finish_reason}`);
      
      if (!choice.message) {
        throw new Error('No message in response');
      }
      
      // Add assistant message to conversation
      messages.push(choice.message);
      
      // Check if agent wants to use tools
      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
        const toolCalls = choice.message.tool_calls;
        
        const toolNames = toolCalls
          .filter(tc => tc.type === 'function')
          .map(tc => tc.function.name)
          .join(', ');
        
        console.log(`\n🔧 Agent wants to use tools: ${toolNames}`);
        onProgress?.(`[Iteration ${iterationCount}] Using tools: ${toolNames}`);
        
        // Execute all tool calls
        let toolIndex = 0;
        for (const toolCall of toolCalls) {
          if (toolCall.type === 'function') {
            toolIndex++;
            const toolName = toolCall.function.name;
            
            console.log(`\n  ┌─ Tool ${toolIndex}: ${toolName}`);
            console.log(`  │ Input: ${toolCall.function.arguments.split('\n').map((line, i) => i === 0 ? line : '  │        ' + line).join('\n')}`);
            onProgress?.(`  → ${toolName}: ${toolCall.function.arguments.substring(0, 50)}...`);
            
            const args = JSON.parse(toolCall.function.arguments);
            
            const toolStart = Date.now();
            const result = await executeToolCall(toolCall.function.name, args, repoPath);
            const toolTime = Date.now() - toolStart;
            
            const resultLines = result.split('\n');
            const resultPreview = resultLines.slice(0, 5).join('\n  │        ');
            const hasMore = resultLines.length > 5;
            
            console.log(`  │ Result (${toolTime}ms, ${result.length} chars, ${resultLines.length} lines):`);
            console.log(`  │        ${resultPreview}${hasMore ? '\n  │        ... (' + (resultLines.length - 5) + ' more lines)' : ''}`);
            console.log(`  └─ Done`);
            
            // Add tool result to conversation
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result
            });
          }
        }
        
      } else if (choice.finish_reason === 'stop') {
        // Agent finished - extract the analysis
        continueLoop = false;
        
        const responseText = choice.message.content;
        if (!responseText) {
          console.error('❌ No content in final response');
          throw new Error('No content in final response');
        }
        
        console.log('\n✓ Agent completed analysis');
        console.log('Response length:', responseText.length, 'characters');
        console.log('Response preview:', responseText.substring(0, 300) + '...');
        onProgress?.('Parsing analysis results...');
        
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
        
        const result = validateAnalysisResult(completeAnalysis);
        
        console.log('✓ Analysis complete');
        onProgress?.('Analysis complete!');
        
        return result;
        
      } else {
        console.warn(`Unexpected finish reason: ${choice.finish_reason}`);
        continueLoop = false;
        throw new Error(`Agent stopped unexpectedly: ${choice.finish_reason}`);
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
  let jsonText = responseText;
  
  // Remove markdown code blocks if present
  const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  } else {
    // Try to find JSON object in the text
    const objectMatch = responseText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonText = objectMatch[0];
    }
  }
  
  try {
    const parsed = JSON.parse(jsonText);
    
    if (!parsed.repositoryStats || !parsed.sponsors) {
      throw new Error('Invalid analysis structure');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse analysis JSON:', error);
    console.error('Response text:', responseText);
    throw new Error('Failed to parse agent response as JSON');
  }
}

