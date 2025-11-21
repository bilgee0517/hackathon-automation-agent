// Test Generation Agent
// AI-powered sub-agent that generates tests when none exist

import { getAnthropicClient } from './provider';
import fs from 'fs/promises';
import path from 'path';

interface TestGenerationInput {
  repoPath: string;
  language: string;
  mainFiles: string[];  // Key files to test
  detectedSponsors: string[];
  hasPackageJson?: boolean;
  hasApiEndpoints?: boolean;
}

interface GeneratedTest {
  filename: string;
  content: string;
  framework: string;  // jest, pytest, go test, etc.
  description: string;
}

/**
 * Test Generation Agent
 * Uses Claude to intelligently generate tests for repos without them
 */
export class TestGeneratorAgent {
  
  /**
   * Main entry point - generates tests based on repo analysis
   */
  async generateTests(input: TestGenerationInput): Promise<GeneratedTest[]> {
    console.log('\n🧪═════════════════════════════════════════════════════');
    console.log('🧪 Test Generation Agent Starting');
    console.log('🧪═════════════════════════════════════════════════════');
    console.log(`Language: ${input.language}`);
    console.log(`Sponsors: ${input.detectedSponsors.join(', ')}`);
    console.log(`Main files: ${input.mainFiles.length}`);
    
    const tests: GeneratedTest[] = [];
    
    try {
      // Read key source files
      const sourceCode = await this.readSourceFiles(input.repoPath, input.mainFiles);
      
      // Determine test strategy
      const strategy = this.determineTestStrategy(input);
      console.log(`Test strategy: ${strategy.type}`);
      
      // Generate tests using Claude
      const testCode = await this.generateTestCode(sourceCode, strategy, input);
      
      tests.push(testCode);
      
      console.log(`✓ Generated test: ${testCode.filename}`);
      console.log(`  Framework: ${testCode.framework}`);
      console.log(`  Type: ${testCode.description}`);
      
      return tests;
      
    } catch (error) {
      console.error('Test generation failed:', error);
      return [];
    }
  }
  
  /**
   * Read source files to analyze
   */
  private async readSourceFiles(repoPath: string, mainFiles: string[]): Promise<Record<string, string>> {
    const sources: Record<string, string> = {};
    
    for (const file of mainFiles.slice(0, 5)) {  // Limit to 5 files
      try {
        const fullPath = path.join(repoPath, file);
        const content = await fs.readFile(fullPath, 'utf-8');
        sources[file] = content.substring(0, 3000);  // First 3000 chars
      } catch (error) {
        console.log(`  ⚠️  Could not read ${file}`);
      }
    }
    
    return sources;
  }
  
  /**
   * Determine what kind of tests to generate
   */
  private determineTestStrategy(input: TestGenerationInput): {
    type: string;
    focus: string[];
  } {
    const { language, hasApiEndpoints, detectedSponsors } = input;
    
    if (hasApiEndpoints) {
      return {
        type: 'api-integration',
        focus: ['HTTP endpoints', 'API responses', 'Sponsor SDK calls']
      };
    }
    
    if (detectedSponsors.length > 0) {
      return {
        type: 'sponsor-validation',
        focus: ['Sponsor SDK initialization', 'API connectivity', 'Configuration']
      };
    }
    
    if (language.toLowerCase().includes('python') || language.toLowerCase().includes('node')) {
      return {
        type: 'basic-functionality',
        focus: ['Module imports', 'Core functions', 'Startup validation']
      };
    }
    
    return {
      type: 'smoke-test',
      focus: ['Application starts', 'No runtime errors']
    };
  }
  
  /**
   * Use Claude to generate test code
   */
  private async generateTestCode(
    sourceCode: Record<string, string>,
    strategy: { type: string; focus: string[] },
    input: TestGenerationInput
  ): Promise<GeneratedTest> {
    
    const client = getAnthropicClient();
    
    // Build prompt for Claude
    const prompt = this.buildTestGenerationPrompt(sourceCode, strategy, input);
    
    console.log('🧪 Calling Claude to generate tests...');
    
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }
    
    // Extract code from response
    const testCode = this.extractCodeFromResponse(textContent.text);
    
    // Determine filename and framework
    const { filename, framework } = this.determineTestFileInfo(input.language);
    
    return {
      filename,
      content: testCode,
      framework,
      description: `${strategy.type} test covering: ${strategy.focus.join(', ')}`
    };
  }
  
  /**
   * Build comprehensive prompt for Claude
   */
  private buildTestGenerationPrompt(
    sourceCode: Record<string, string>,
    strategy: { type: string; focus: string[] },
    input: TestGenerationInput
  ): string {
    
    const lang = input.language.toLowerCase();
    const isNode = lang.includes('javascript') || lang.includes('typescript') || lang.includes('node');
    const isPython = lang.includes('python');
    
    let framework = isNode ? 'Jest' : isPython ? 'pytest' : 'standard library';
    
    const sourceFilesStr = Object.entries(sourceCode)
      .map(([file, code]) => `\n### ${file}\n\`\`\`\n${code}\n\`\`\``)
      .join('\n');
    
    return `You are a senior QA engineer. Generate a comprehensive test file for this codebase.

## Context
- Language: ${input.language}
- Test Framework: ${framework}
- Strategy: ${strategy.type}
- Focus Areas: ${strategy.focus.join(', ')}
- Detected Sponsors: ${input.detectedSponsors.join(', ') || 'None'}

## Source Code
${sourceFilesStr}

## Requirements

Generate a COMPLETE, RUNNABLE test file that:

1. **Tests Core Functionality**: ${strategy.focus[0]}
2. **Validates Sponsor Integrations**: Check if sponsor SDKs initialize correctly (${input.detectedSponsors.join(', ')})
3. **Uses Proper Framework**: ${framework} with proper imports
4. **Includes Multiple Test Cases**: At least 3-5 meaningful tests
5. **Handles Errors Gracefully**: Mock external APIs, use try-catch
6. **Is Self-Contained**: All imports and mocks included

## Test Types to Include

${isNode ? `
- Import/require tests (check modules load)
- Function unit tests (test exported functions)
- ${input.hasApiEndpoints ? 'API endpoint tests (mock HTTP calls)' : 'Startup tests (app initializes)'}
- Sponsor SDK tests (check SDK imports and basic initialization)
` : ''}

${isPython ? `
- Import tests (check modules load)
- Function unit tests (test functions)
- ${input.hasApiEndpoints ? 'API endpoint tests (mock requests)' : 'Startup tests (app runs)'}
- Sponsor SDK tests (check imports and initialization)
` : ''}

## Important Notes

- Use mocks for external APIs (don't make real API calls)
- Don't require actual API keys (mock responses)
- Make tests fast (< 10 seconds total)
- Use descriptive test names
- Include setup/teardown if needed

## Output Format

Return ONLY the complete test file code, no explanations.
Use proper ${framework} syntax.
Include all necessary imports.
Make it production-ready.

Begin your response with the test code:`;
  }
  
  /**
   * Extract code from Claude's response
   */
  private extractCodeFromResponse(response: string): string {
    // Try to extract code block
    const codeBlockMatch = response.match(/```(?:javascript|typescript|python|js|ts|py)?\n([\s\S]*?)\n```/);
    
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // If no code block, assume entire response is code
    return response.trim();
  }
  
  /**
   * Determine test filename and framework based on language
   */
  private determineTestFileInfo(language: string): { filename: string; framework: string } {
    const lang = language.toLowerCase();
    
    if (lang.includes('javascript') || lang.includes('node')) {
      return { filename: 'generated.test.js', framework: 'jest' };
    }
    
    if (lang.includes('typescript')) {
      return { filename: 'generated.test.ts', framework: 'jest' };
    }
    
    if (lang.includes('python')) {
      return { filename: 'test_generated.py', framework: 'pytest' };
    }
    
    if (lang.includes('go')) {
      return { filename: 'generated_test.go', framework: 'go test' };
    }
    
    return { filename: 'test_generated.js', framework: 'jest' };
  }
}

/**
 * Singleton instance
 */
let testGeneratorAgent: TestGeneratorAgent | null = null;

export function getTestGeneratorAgent(): TestGeneratorAgent {
  if (!testGeneratorAgent) {
    testGeneratorAgent = new TestGeneratorAgent();
  }
  return testGeneratorAgent;
}

