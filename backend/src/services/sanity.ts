// Sanity client service for storing analysis results

import { createClient, SanityClient } from '@sanity/client';
import { AnalysisResult } from '../types';

let sanityClient: SanityClient | null = null;

export function getSanityClient(): SanityClient {
  if (!sanityClient) {
    const projectId = process.env.SANITY_PROJECT_ID;
    const dataset = process.env.SANITY_DATASET || 'production';
    const token = process.env.SANITY_TOKEN;
    
    if (!projectId || !token) {
      throw new Error('SANITY_PROJECT_ID and SANITY_TOKEN must be set');
    }
    
    sanityClient = createClient({
      projectId,
      dataset,
      token,
      apiVersion: '2024-01-01',
      useCdn: false
    });
    
    console.log('✓ Sanity client initialized');
  }
  
  return sanityClient;
}

/**
 * Generate a slug from project name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Save analysis result to Sanity
 */
export async function saveSponsorAnalysis(analysis: AnalysisResult): Promise<string> {
  const client = getSanityClient();
  
  try {
    const slug = slugify(analysis.projectName);
    
    const doc = {
      _type: 'project',  // Changed from 'team' to 'project'
      projectName: analysis.projectName,
      slug: {
        _type: 'slug',
        current: slug,
      },
      githubUrl: analysis.githubUrl,
      submittedAt: analysis.analyzedAt,  // Use analyzedAt as submittedAt
      analyzedAt: analysis.analyzedAt,
      status: 'analyzed',  // Set status to 'analyzed'
      repositoryStats: analysis.repositoryStats,
      sponsors: analysis.sponsors,
      overallSummary: analysis.overallSummary,
      innovativeAspects: analysis.innovativeAspects || [],
      // Optional: Add teamName as description or tagline
      description: `Analyzed project by ${analysis.teamName}`,
    };
    
    const result = await client.create(doc);
    console.log(`✓ Saved analysis to Sanity: ${result._id}`);
    
    return result._id;
  } catch (error) {
    console.error('Failed to save analysis to Sanity:', error);
    throw error;
  }
}

/**
 * Update existing analysis in Sanity
 */
export async function updateSponsorAnalysis(documentId: string, analysis: Partial<AnalysisResult>): Promise<void> {
  const client = getSanityClient();
  
  try {
    await client.patch(documentId).set(analysis).commit();
    console.log(`✓ Updated analysis in Sanity: ${documentId}`);
  } catch (error) {
    console.error('Failed to update analysis in Sanity:', error);
    throw error;
  }
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(documentId: string): Promise<any> {
  const client = getSanityClient();
  
  try {
    const result = await client.getDocument(documentId);
    return result;
  } catch (error) {
    console.error('Failed to get analysis from Sanity:', error);
    throw error;
  }
}

/**
 * Get all project analyses
 */
export async function getAllAnalyses(): Promise<any[]> {
  const client = getSanityClient();
  
  try {
    const query = '*[_type == "project"] | order(analyzedAt desc)';
    const results = await client.fetch(query);
    return results;
  } catch (error) {
    console.error('Failed to get analyses from Sanity:', error);
    throw error;
  }
}

/**
 * Check if Sanity is configured and accessible
 */
export async function checkSanityConnection(): Promise<boolean> {
  try {
    const client = getSanityClient();
    await client.fetch('*[_type == "project"][0]');
    return true;
  } catch (error) {
    console.error('Sanity connection check failed:', error);
    return false;
  }
}

