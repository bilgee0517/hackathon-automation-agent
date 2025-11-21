// Parallel AI service for web search and dynamic sponsor learning

import Parallel from 'parallel-web';

let parallelClient: Parallel | null = null;

/**
 * Get Parallel AI client instance
 */
function getParallelClient(): Parallel | null {
  if (!process.env.PARALLEL_API_KEY) {
    return null;
  }
  
  if (!parallelClient) {
    parallelClient = new Parallel({ 
      apiKey: process.env.PARALLEL_API_KEY 
    });
    console.log('✓ Parallel AI client initialized');
  }
  
  return parallelClient;
}

/**
 * Search the web using Parallel AI
 */
export async function searchWithParallel(query: string): Promise<string> {
  const client = getParallelClient();
  
  if (!client) {
    console.warn('⚠️  PARALLEL_API_KEY not set, skipping web search');
    return 'Web search unavailable (PARALLEL_API_KEY not set)';
  }

  try {
    console.log(`🌐 Searching web via Parallel AI: "${query}"`);
    
    const search = await client.beta.search({
      objective: query,
      search_queries: [query],
      max_results: 5,
      max_chars_per_result: 5000
    });

    if (!search || !search.results || search.results.length === 0) {
      return `No web search results found for "${query}"`;
    }

    // Format results for the agent
    let formattedResults = `Web search results for "${query}":\n\n`;
    
    search.results.forEach((result: any, index: number) => {
      formattedResults += `${index + 1}. ${result.title || 'Result'}\n`;
      if (result.url) formattedResults += `   URL: ${result.url}\n`;
      if (result.content) {
        formattedResults += `   ${result.content.substring(0, 300)}...\n`;
      }
      formattedResults += '\n';
    });
    
    console.log(`✓ Got ${search.results.length} results from Parallel AI`);
    return formattedResults;
    
  } catch (error) {
    console.error('Error searching with Parallel AI:', error);
    return `Error searching web: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Learn about a sponsor using web search
 */
export async function learnAboutSponsor(sponsorName: string, aspect: string): Promise<string> {
  const client = getParallelClient();
  
  if (!client) {
    return 'Web search unavailable (PARALLEL_API_KEY not set)';
  }
  
  try {
    // Build smart objective and queries based on what we want to learn
    let objective = '';
    let queries: string[] = [];
    
    if (aspect.toLowerCase().includes('package') || aspect.toLowerCase().includes('sdk')) {
      objective = `Find official npm packages, SDKs, and libraries for ${sponsorName}`;
      queries = [
        `${sponsorName} npm package SDK`,
        `${sponsorName} official SDK library`,
        `${sponsorName} developer documentation`
      ];
    } else if (aspect.toLowerCase().includes('api')) {
      objective = `Find ${sponsorName} API documentation, endpoints, and authentication methods`;
      queries = [
        `${sponsorName} API documentation`,
        `${sponsorName} API authentication`,
        `${sponsorName} API endpoints`
      ];
    } else if (aspect.toLowerCase().includes('integration')) {
      objective = `Find how to integrate ${sponsorName} in applications`;
      queries = [
        `how to integrate ${sponsorName}`,
        `${sponsorName} integration guide`,
        `${sponsorName} quickstart tutorial`
      ];
    } else {
      objective = `Find information about ${sponsorName} ${aspect}`;
      queries = [`${sponsorName} ${aspect}`];
    }
    
    console.log(`🌐 Learning about ${sponsorName}: ${aspect}`);
    
    const search = await client.beta.search({
      objective,
      search_queries: queries,
      max_results: 5,
      max_chars_per_result: 3000
    });
    
    if (!search || !search.results || search.results.length === 0) {
      return `Could not find information about ${sponsorName} ${aspect}`;
    }
    
    // Format results
    let formattedResults = `Information about ${sponsorName} (${aspect}):\n\n`;
    
    search.results.forEach((result: any, index: number) => {
      formattedResults += `${index + 1}. ${result.title || 'Source'}\n`;
      if (result.url) formattedResults += `   URL: ${result.url}\n`;
      if (result.content) {
        formattedResults += `   ${result.content.substring(0, 400)}...\n`;
      }
      formattedResults += '\n';
    });
    
    console.log(`✓ Found ${search.results.length} results for ${sponsorName}`);
    return formattedResults;
    
  } catch (error) {
    console.error(`Error learning about ${sponsorName}:`, error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Check if Parallel AI is configured
 */
export function isParallelConfigured(): boolean {
  return !!process.env.PARALLEL_API_KEY;
}

