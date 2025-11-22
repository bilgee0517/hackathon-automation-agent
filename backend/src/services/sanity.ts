// Sanity client service for storing analysis results

import { createClient, SanityClient } from '@sanity/client';
import { AnalysisResult, SponsorAnalysis, SponsorName } from '../types';

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
 * Convert sponsor name to readable format
 */
function getSponsorDisplayName(sponsorKey: SponsorName): string {
  const displayNames: Record<SponsorName, string> = {
    liquidMetalAI: 'LiquidMetal AI',
    fastinoLabs: 'Fastino Labs',
    freepik: 'Freepik',
    gladly: 'Gladly',
    frontegg: 'Frontegg',
    googleDeepMind: 'Google DeepMind',
    forethought: 'Forethought',
    lovable: 'Lovable',
    airia: 'Airia',
    campfire: 'Campfire',
    linkup: 'Linkup',
    daft: 'Daft',
    senso: 'Senso',
    crosby: 'Crosby',
    mcpTotal: 'MCP Total'
    // OLD SPONSORS (COMMENTED OUT)
    // anthropic: 'Anthropic',
    // aws: 'AWS',
    // redis: 'Redis',
    // sanity: 'Sanity',
    // postman: 'Postman',
    // skyflow: 'Skyflow',
    // finsterAI: 'Finster AI',
    // trmLabs: 'TRM Labs',
    // coder: 'Coder',
    // lightpanda: 'Lightpanda',
    // lightningAI: 'Lightning AI',
    // parallel: 'Parallel',
    // cleric: 'Cleric'
  };
  return displayNames[sponsorKey] || sponsorKey;
}

/**
 * Convert sponsor analysis to detailed integration format
 */
function convertToSponsorIntegration(sponsorKey: SponsorName, analysis: SponsorAnalysis) {
  if (!analysis.detected) {
    return null;
  }

  return {
    _type: 'sponsorIntegration',
    sponsorSlug: sponsorKey,
    sponsorName: getSponsorDisplayName(sponsorKey),
    aiSummary: analysis.technicalSummary,
    integrationDepth: analysis.integrationScore >= 8 ? 'core' :
                      analysis.integrationScore >= 6 ? 'significant' :
                      analysis.integrationScore >= 4 ? 'supporting' : 'minimal',
    toolsUsed: analysis.evidence.keyFindings.slice(0, 5), // Top 5 findings as tools
    technicalScore: analysis.integrationScore,
    creativityScore: Math.round(analysis.integrationScore * 0.9), // Slightly lower for creativity
    codeEvidence: analysis.evidence.files.map((file, idx) => 
      `${file}: ${analysis.evidence.keyFindings[idx] || 'Integration detected'}`
    ).slice(0, 5),
    userFacingFeatures: analysis.plainEnglishSummary
      .split('.')
      .filter(s => s.trim().length > 10)
      .slice(0, 5)
  };
}

/**
 * Generate a slug from project name
 */
function generateSlug(projectName: string): string {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Save analysis result to Sanity in the project format (matching mock data)
 */
export async function saveSponsorAnalysis(
  analysis: AnalysisResult, 
  teamMembers?: Array<{name: string; email?: string; githubUsername?: string; bio?: string}>
): Promise<string> {
  const client = getSanityClient();
  
  try {
    console.log('\n📝 Creating project in Sanity...');
    
    // Step 1: Create team members (hackers) if provided
    const teamMemberRefs: Array<{_type: string; _ref: string}> = [];
    if (teamMembers && teamMembers.length > 0) {
      console.log(`Creating ${teamMembers.length} team members...`);
      for (const member of teamMembers) {
        try {
          const hackerDoc = await client.create({
            _type: 'hacker',
            name: member.name,
            email: member.email,
            githubUsername: member.githubUsername,
            bio: member.bio
          });
          console.log(`  ✅ Created: ${member.name} (ID: ${hackerDoc._id})`);
          teamMemberRefs.push({
            _type: 'reference',
            _ref: hackerDoc._id
          });
        } catch (error) {
          console.warn(`  ⚠️  Failed to create team member ${member.name}:`, error);
        }
      }
    }
    
    // Step 2: Convert sponsor analyses to integrations
    const sponsorIntegrations = Object.entries(analysis.sponsors)
      .map(([key, data]) => convertToSponsorIntegration(key as SponsorName, data))
      .filter(Boolean);

    // Step 3: Create project document (matching mock data structure)
    const projectData: any = {
      _type: 'project',
      projectName: analysis.projectName,
      slug: {
        _type: 'slug',
        current: generateSlug(analysis.projectName)
      },
      tagline: analysis.overallSummary.split('.')[0] || 'Hackathon project',
      description: analysis.overallSummary,
      githubUrl: analysis.githubUrl,
      githubData: {
        stars: 0,
        forks: 0,
        language: analysis.repositoryStats.mainLanguage,
        lastCommit: new Date().toISOString()
      },
      analysisData: {
        aiSummaryForJudges: analysis.overallSummary,
        latestAnalysisAt: analysis.analyzedAt,
        tags: [
          ...analysis.innovativeAspects.slice(0, 3),
          analysis.repositoryStats.mainLanguage.toLowerCase(),
          ...Object.keys(analysis.sponsors)
            .filter(k => analysis.sponsors[k as SponsorName].detected)
            .slice(0, 5)
        ].filter((v, i, a) => a.indexOf(v) === i) // unique tags
      },
      sponsorIntegrations,
      submittedAt: analysis.analyzedAt,
      status: 'analyzed'
    };
    
    // Add team references if any were created
    if (teamMemberRefs.length > 0) {
      projectData.team = teamMemberRefs;
    }
    
    const result = await client.create(projectData);
    console.log(`✓ Created project in Sanity: ${result.projectName} (ID: ${result._id})`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Sponsor integrations: ${sponsorIntegrations.length}`);
    if (teamMemberRefs.length > 0) {
      console.log(`  Team members: ${teamMemberRefs.length}`);
    }
    
    // Also save to legacy team format for backward compatibility
    const teamDoc = {
      _type: 'team',
      teamName: analysis.teamName,
      projectName: analysis.projectName,
      githubUrl: analysis.githubUrl,
      analyzedAt: analysis.analyzedAt,
      repositoryStats: analysis.repositoryStats,
      sponsors: analysis.sponsors,
      overallSummary: analysis.overallSummary,
      innovativeAspects: analysis.innovativeAspects || []
    };
    
    const teamResult = await client.create(teamDoc);
    console.log(`✓ Created team document for compatibility: ${teamResult._id}`);
    
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
 * Get all team analyses
 */
export async function getAllAnalyses(): Promise<any[]> {
  const client = getSanityClient();
  
  try {
    const query = '*[_type == "team"] | order(analyzedAt desc)';
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
    await client.fetch('*[_type == "team"][0]');
    return true;
  } catch (error) {
    console.error('Sanity connection check failed:', error);
    return false;
  }
}

