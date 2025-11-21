// Agent Reflection System - Self-improvement after each analysis
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AnalysisResult } from '../types';
import { getAnthropicClient, getOpenAIClient, getAvailableProvider } from '../agent/provider';
import { memorySystem, AgentMemory, SponsorPattern } from './memory';
import { v4 as uuidv4 } from 'uuid';

export interface ReflectionResult {
  confidence: Record<string, number>; // Per sponsor confidence
  effectiveStrategies: string[];
  newPatterns: Record<string, string[]>; // New patterns discovered
  improvements: string[];
  uncertainAreas: string[];
  performanceMetrics: {
    accuracy: number;
    confidence: number;
    toolCallsUsed: number;
    iterationCount: number;
  };
}

/**
 * Run reflection loop after analysis to learn from performance
 */
export async function runReflectionLoop(
  analysis: AnalysisResult,
  metadata: {
    repoPath: string;
    toolCallsUsed: number;
    iterationCount: number;
    timeMs: number;
  }
): Promise<ReflectionResult> {
  
  console.log('\n🔍 Starting reflection loop...');
  console.log('═══════════════════════════════════════════════════════');
  
  const provider = getAvailableProvider();
  if (!provider) {
    console.log('⚠️  No AI provider available for reflection, using basic analysis');
    return createBasicReflection(analysis, metadata);
  }

  try {
    const reflectionPrompt = createReflectionPrompt(analysis, metadata);
    
    let reflectionText: string;
    
    if (provider === 'anthropic') {
      reflectionText = await runAnthropicReflection(reflectionPrompt);
    } else {
      reflectionText = await runOpenAIReflection(reflectionPrompt);
    }
    
    const reflection = parseReflectionResponse(reflectionText);
    
    // Store learnings in memory
    await storeReflectionLearnings(analysis, reflection, metadata);
    
    console.log('✓ Reflection complete');
    console.log(`  - Average confidence: ${reflection.performanceMetrics.confidence.toFixed(2)}`);
    console.log(`  - New patterns discovered: ${Object.keys(reflection.newPatterns).length}`);
    console.log(`  - Improvement suggestions: ${reflection.improvements.length}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    return reflection;
    
  } catch (error) {
    console.error('Error in reflection loop:', error);
    return createBasicReflection(analysis, metadata);
  }
}

/**
 * Create reflection prompt for the agent
 */
function createReflectionPrompt(analysis: AnalysisResult, metadata: any): string {
  const sponsorSummary = Object.entries(analysis.sponsors || {})
    .map(([name, data]) => `  - ${name}: score ${data.integrationScore}/10, confidence ${data.confidence}`)
    .join('\n');

  return `You just completed a hackathon repository analysis. Reflect critically on your performance to improve future analyses.

## Your Analysis Results
${sponsorSummary}

## Analysis Metadata
- Tool calls used: ${metadata.toolCallsUsed}
- Iterations: ${metadata.iterationCount}
- Time taken: ${metadata.timeMs}ms
- Repository: ${metadata.repoPath}

## Reflection Questions

### 1. Confidence Assessment
For each sponsor you analyzed, how confident are you in your score?
- What evidence was strong and definitive?
- What evidence was weak, ambiguous, or missing?
- What additional searches could you have performed but didn't?
- Were there areas of the codebase you didn't explore thoroughly?

### 2. Strategy Evaluation
- Which tools were most effective (read_file, search_code, etc.)?
- Which search patterns found useful results?
- Which search patterns found nothing (and why)?
- Did you use learn_about_sponsor effectively before searching?
- Were you efficient, or did you make redundant tool calls?

### 3. Pattern Discovery
- What new package names, APIs, or patterns did you discover?
- Were there any unexpected integrations or creative uses?
- What sponsor detection patterns should be added to your knowledge base?
- What false positives did you encounter (things that looked like integrations but weren't)?

### 4. Self-Improvement
- What would you do differently next time?
- What additional tools or capabilities would help?
- Which sponsors were hardest to detect (and why)?
- What assumptions did you make that turned out wrong?

### 5. Accuracy Estimation
- Overall, how accurate do you think this analysis is? (0-1 scale)
- Which sponsor detections are you most confident about?
- Which sponsor detections are you least confident about?

## Output Format
Return a JSON object with this structure:

{
  "confidence": {
    "aws": 0.95,
    "redis": 0.6,
    "anthropic": 0.85,
    ...
  },
  "effectiveStrategies": [
    "Used learn_about_sponsor before searching",
    "Checked package.json first for quick wins",
    "Searched for import patterns in source files"
  ],
  "newPatterns": {
    "redis": ["ioredis", "redis.createClient()"],
    "anthropic": ["@anthropic-ai/sdk", "messages.create"]
  },
  "improvements": [
    "Should search Docker files for service configurations",
    "Need to check environment variable files more thoroughly",
    "Could use get_file_tree earlier to understand project structure"
  ],
  "uncertainAreas": [
    "Skyflow - couldn't find clear integration patterns",
    "TRM Labs - no documentation found about their SDK"
  ],
  "performanceMetrics": {
    "accuracy": 0.85,
    "confidence": 0.78,
    "toolCallsUsed": ${metadata.toolCallsUsed},
    "iterationCount": ${metadata.iterationCount}
  }
}

Be honest and critical. The goal is to learn and improve!`;
}

/**
 * Run reflection using Anthropic (Claude)
 */
async function runAnthropicReflection(prompt: string): Promise<string> {
  const client = getAnthropicClient();
  
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
}

/**
 * Run reflection using OpenAI (GPT-4)
 */
async function runOpenAIReflection(prompt: string): Promise<string> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Parse reflection response JSON
 */
function parseReflectionResponse(text: string): ReflectionResult {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    
    // Find JSON object boundaries
    const startIdx = jsonText.indexOf('{');
    const endIdx = jsonText.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error('No JSON object found in response');
    }
    
    const cleanJson = jsonText.substring(startIdx, endIdx + 1);
    return JSON.parse(cleanJson);
    
  } catch (error) {
    console.error('Failed to parse reflection response:', error);
    console.log('Response text:', text.substring(0, 500));
    
    // Return default reflection
    return {
      confidence: {},
      effectiveStrategies: [],
      newPatterns: {},
      improvements: [],
      uncertainAreas: [],
      performanceMetrics: {
        accuracy: 0.5,
        confidence: 0.5,
        toolCallsUsed: 0,
        iterationCount: 0
      }
    };
  }
}

/**
 * Create basic reflection without AI (fallback)
 */
function createBasicReflection(
  analysis: AnalysisResult,
  metadata: any
): ReflectionResult {
  
  const confidence: Record<string, number> = {};
  let totalConfidence = 0;
  let count = 0;
  
  if (analysis.sponsors) {
    for (const [sponsor, data] of Object.entries(analysis.sponsors)) {
      confidence[sponsor] = data.confidence || 0.5;
      totalConfidence += data.confidence || 0.5;
      count++;
    }
  }
  
  return {
    confidence,
    effectiveStrategies: ['Pattern-based detection'],
    newPatterns: {},
    improvements: ['Add more detection patterns', 'Improve search strategies'],
    uncertainAreas: [],
    performanceMetrics: {
      accuracy: 0.5,
      confidence: count > 0 ? totalConfidence / count : 0.5,
      toolCallsUsed: metadata.toolCallsUsed,
      iterationCount: metadata.iterationCount
    }
  };
}

/**
 * Store reflection learnings in memory system
 */
async function storeReflectionLearnings(
  analysis: AnalysisResult,
  reflection: ReflectionResult,
  metadata: any
): Promise<void> {
  
  try {
    // Build sponsor patterns from new discoveries
    const sponsorPatterns: Record<string, SponsorPattern> = {};
    
    for (const [sponsor, patterns] of Object.entries(reflection.newPatterns)) {
      sponsorPatterns[sponsor] = {
        packages: patterns.filter(p => !p.includes('(') && !p.includes('.')), // Package names
        apis: patterns.filter(p => p.includes('.') || p.includes('()')), // API methods
        envVars: [],
        keywords: [],
        confidence: reflection.confidence[sponsor] || 0.5,
        successCount: analysis.sponsors?.[sponsor]?.detected ? 1 : 0,
        failureCount: analysis.sponsors?.[sponsor]?.detected ? 0 : 1,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Also extract patterns from detected sponsors
    if (analysis.sponsors) {
      for (const [sponsor, data] of Object.entries(analysis.sponsors)) {
        if (data.detected && data.evidence) {
          if (!sponsorPatterns[sponsor]) {
            sponsorPatterns[sponsor] = {
              packages: [],
              apis: [],
              envVars: [],
              keywords: [],
              confidence: data.confidence || 0.5,
              successCount: 1,
              failureCount: 0,
              lastUpdated: new Date().toISOString()
            };
          }
          
          // Extract patterns from evidence
          const files = data.evidence.files || [];
          const snippets = data.evidence.codeSnippets || [];
          
          // Package files
          const packageFiles = files.filter(f => 
            f.includes('package.json') || 
            f.includes('requirements.txt') ||
            f.includes('go.mod') ||
            f.includes('Cargo.toml')
          );
          
          if (packageFiles.length > 0) {
            // Mark that this sponsor was found in package files
            sponsorPatterns[sponsor].successCount++;
          }
        }
      }
    }
    
    // Create memory entry
    const memory: AgentMemory = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      analysisId: analysis.teamId || uuidv4(),
      learnings: {
        sponsorPatterns,
        detectionStrategies: reflection.effectiveStrategies.map(s => ({
          name: s,
          description: s,
          successRate: 0.5,
          totalUses: 1,
          successfulUses: 1,
          averageTimeMs: metadata.timeMs,
          exampleRepos: [metadata.repoPath]
        })),
        commonMistakes: [],
        newDiscoveries: Object.values(reflection.newPatterns).flat()
      },
      performance: {
        accuracy: reflection.performanceMetrics.accuracy,
        confidence: reflection.performanceMetrics.confidence,
        toolCallsUsed: metadata.toolCallsUsed,
        iterationCount: metadata.iterationCount,
        timeMs: metadata.timeMs,
        sponsorsDetected: Object.values(analysis.sponsors || {}).filter(s => s.detected).length,
        sponsorsMissed: Object.values(analysis.sponsors || {}).filter(s => !s.detected).length
      }
    };
    
    // Store in memory system
    await memorySystem.storeLearning(memory);
    
    console.log('✓ Stored learnings in memory system');
    
  } catch (error) {
    console.error('Error storing reflection learnings:', error);
  }
}

