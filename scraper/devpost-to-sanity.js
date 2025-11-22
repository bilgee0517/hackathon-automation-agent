#!/usr/bin/env node

/**
 * Devpost to Sanity Integration
 * 
 * This script:
 * 1. Scrapes projects from Devpost hackathon gallery
 * 2. For each project with a GitHub URL:
 *    - Sends it to the backend for AI analysis
 *    - Combines Devpost data with AI analysis
 *    - Injects enriched data into Sanity
 * 
 * Usage: node devpost-to-sanity.js [hackathon-url]
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const DELAY_MS = 2000; // 2 seconds between requests
const MAX_CONCURRENT = 3; // Process 3 projects at once

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2025-09-25',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchHTML(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      if (i < retries - 1) {
        await delay(DELAY_MS * (i + 1));
      } else {
        throw error;
      }
    }
  }
}

// Scrape functions (extracted from scraper.js)
function extractTeamMembers($) {
  const teamMembers = [];
  
  $('#app-team li.software-team-member').each((i, elem) => {
    const $member = $(elem);
    const nameLink = $member.find('a.user-profile-link');
    const name = nameLink.text().trim();
    const avatar = $member.find('img').attr('src') || null;
    
    let role = '';
    const bubble = $member.find('.bubble p');
    if (bubble.length > 0) {
      role = bubble.text().trim();
    }
    
    if (name) {
      teamMembers.push({
        name,
        email: null, // Devpost doesn't expose emails
        githubUsername: null, // Could be extracted from GitHub link if available
        bio: role || 'Team member',
        devpostAvatar: avatar
      });
    }
  });
  
  return teamMembers;
}

function extractLinks($) {
  const links = { github: [], demo: [], video: [], other: [] };
  
  $('#app-details-left a, .software-links a, .app-links a').each((i, elem) => {
    const href = $(elem).attr('href');
    const text = $(elem).text().trim();
    
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    
    const linkData = { url: href, text: text };
    
    if (href.includes('github.com') || href.includes('gitlab.com')) {
      if (!links.github.find(l => l.url === href)) {
        links.github.push(linkData);
      }
    } else if (href.includes('youtube.com') || href.includes('youtu.be') || href.includes('vimeo.com')) {
      if (!links.video.find(l => l.url === href)) {
        links.video.push(linkData);
      }
    } else if (text.toLowerCase().includes('demo') || text.toLowerCase().includes('try')) {
      if (!links.demo.find(l => l.url === href)) {
        links.demo.push(linkData);
      }
    } else if (href.startsWith('http') && !href.includes('devpost.com')) {
      if (!links.other.find(l => l.url === href)) {
        links.other.push(linkData);
      }
    }
  });
  
  return links;
}

function extractAwards($) {
  const awards = [];
  
  $('#submissions .software-list-content .winner, span.winner').each((i, elem) => {
    const awardText = $(elem).text().trim();
    if (awardText && awardText.length > 0 && !awardText.startsWith('Submitted')) {
      if (!awards.find(a => a.title === awardText)) {
        awards.push({ title: awardText, isWinner: true });
      }
    }
  });
  
  return awards;
}

// Scrape single Devpost project
async function scrapeDevpostProject(url) {
  try {
    console.log(`  Scraping Devpost: ${url}`);
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    
    const title = $('title').text().trim().replace(' | Devpost', '');
    const tagline = $('meta[property="og:description"]').attr('content')?.trim() || '';
    const coverImage = $('meta[property="og:image"]').attr('content');
    const videoURL = $('iframe[src*="youtube"], iframe[src*="vimeo"]').attr('src') || null;
    
    // Extract technologies
    const technologies = [];
    $('h2, h3').each((i, elem) => {
      if ($(elem).text().trim().includes('Built With')) {
        $(elem).nextAll('ul').first().find('li span').each((j, tag) => {
          const tech = $(tag).text().trim();
          if (tech && !technologies.includes(tech)) {
            technologies.push(tech);
          }
        });
      }
    });
    
    const teamMembers = extractTeamMembers($);
    const links = extractLinks($);
    const awards = extractAwards($);
    const likes = parseInt($('.like-count').text().trim()) || 0;
    const submittedDate = $('#submissions time').attr('datetime') || new Date().toISOString();
    
    return {
      title,
      tagline,
      coverImage,
      videoURL,
      technologies,
      teamMembers,
      links,
      awards,
      stats: { likes },
      submittedAt: submittedDate,
      devpostUrl: url
    };
    
  } catch (error) {
    console.error(`  ❌ Failed to scrape Devpost: ${error.message}`);
    return null;
  }
}

// Submit to backend for AI analysis
async function analyzeWithBackend(githubUrl, projectName, teamMembers) {
  try {
    console.log(`  Submitting to backend for AI analysis...`);
    
    const response = await fetch(`${BACKEND_API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubUrl,
        teamName: teamMembers.length > 0 ? `${teamMembers[0].name}'s Team` : 'Unknown Team',
        projectName,
        teamMembers
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    const jobId = result.jobId;
    console.log(`  ⏳ Job ID: ${jobId}, waiting for analysis...`);
    
    // Poll for completion (max 5 minutes)
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    while (attempts < maxAttempts) {
      await delay(5000); // Check every 5 seconds
      
      const statusRes = await fetch(`${BACKEND_API_URL}/api/status/${jobId}`);
      const status = await statusRes.json();
      
      if (status.status === 'complete') {
        console.log(`  ✅ Analysis complete`);
        
        // Get full results
        const resultsRes = await fetch(`${BACKEND_API_URL}/api/results/${jobId}`);
        const analysisResult = await resultsRes.json();
        
        return analysisResult.result || analysisResult;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Analysis failed');
      }
      
      attempts++;
    }
    
    throw new Error('Analysis timeout');
    
  } catch (error) {
    console.error(`  ❌ Backend analysis failed: ${error.message}`);
    return null;
  }
}

// Merge Devpost data with AI analysis and create enriched Sanity document
async function createEnrichedSanityDocument(devpostData, aiAnalysis) {
  try {
    console.log(`  Creating enriched Sanity document...`);
    
    // Combine team members from both sources
    const enrichedTeamMembers = devpostData.teamMembers.map((member, idx) => {
      const aiMember = aiAnalysis && aiAnalysis.teamMembers ? aiAnalysis.teamMembers[idx] : null;
      return {
        ...member,
        ...(aiMember || {})
      };
    });
    
    // Create hacker documents
    const teamMemberRefs = [];
    for (const member of enrichedTeamMembers) {
      const hackerDoc = await sanityClient.create({
        _type: 'hacker',
        name: member.name,
        email: member.email,
        githubUsername: member.githubUsername,
        bio: member.bio,
        devpostAvatar: member.devpostAvatar
      });
      console.log(`    ✅ Created hacker: ${member.name}`);
      teamMemberRefs.push({ _type: 'reference', _ref: hackerDoc._id });
    }
    
    // Convert AI sponsor analyses to integrations
    console.log(`    🤖 Converting AI sponsor analysis (${aiAnalysis ? Object.keys(aiAnalysis.sponsors || {}).length : 0} sponsors checked)...`);
    const sponsorIntegrations = [];
    if (aiAnalysis && aiAnalysis.sponsors) {
      for (const [key, data] of Object.entries(aiAnalysis.sponsors)) {
        if (data.detected) {
          sponsorIntegrations.push({
            _type: 'sponsorIntegration',
            sponsorSlug: key,
            sponsorName: key.charAt(0).toUpperCase() + key.slice(1),
            aiSummary: data.technicalSummary,
            integrationDepth: data.integrationScore >= 8 ? 'core' : 
                            data.integrationScore >= 6 ? 'significant' : 'supporting',
            toolsUsed: data.evidence.keyFindings.slice(0, 5),
            technicalScore: data.integrationScore,
            creativityScore: Math.round(data.integrationScore * 0.9),
            codeEvidence: data.evidence.files.slice(0, 5),
            userFacingFeatures: data.plainEnglishSummary.split('.').filter(s => s.trim().length > 10).slice(0, 5)
          });
          console.log(`       ✅ ${key}: Score ${data.integrationScore}/10`);
        }
      }
    }
    
    // Merge tags from both sources
    const mergedTags = [
      ...devpostData.technologies.slice(0, 5),
      ...(aiAnalysis ? aiAnalysis.innovativeAspects.slice(0, 3) : [])
    ].filter((v, i, a) => a.indexOf(v) === i); // unique
    
    // Create ENRICHED project document - COMBINES BOTH SOURCES
    console.log(`    📦 Creating enriched project (${devpostData.technologies.length} Devpost tech + ${aiAnalysis ? aiAnalysis.innovativeAspects?.length || 0 : 0} AI aspects)...`);
    const projectDoc = {
      _type: 'project',
      
      // FROM DEVPOST - User-submitted data
      projectName: devpostData.title,
      slug: {
        _type: 'slug',
        current: devpostData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      },
      tagline: devpostData.tagline, // Short tagline from Devpost
      devpostUrl: devpostData.devpostUrl,
      coverImage: devpostData.coverImage,
      videoURL: devpostData.videoURL,
      devpostLikes: devpostData.stats.likes,
      awards: devpostData.awards, // Awards from Devpost
      submittedAt: devpostData.submittedAt,
      
      // FROM AI ANALYSIS - Code analysis results
      description: aiAnalysis ? aiAnalysis.overallSummary : devpostData.tagline, // Use AI summary if available
      githubUrl: devpostData.links.github[0]?.url || null,
      githubData: aiAnalysis ? {
        language: aiAnalysis.repositoryStats?.mainLanguage || 'Unknown',
        totalFiles: aiAnalysis.repositoryStats?.totalFiles || 0,
        hasTests: aiAnalysis.repositoryStats?.hasTests || false,
        lastCommit: new Date().toISOString()
      } : null,
      sponsorIntegrations, // AI-detected integrations with scores
      
      // MERGED DATA - Combined from both sources
      team: teamMemberRefs, // Team from Devpost with avatars
      analysisData: {
        aiSummaryForJudges: aiAnalysis ? aiAnalysis.overallSummary : devpostData.tagline,
        latestAnalysisAt: new Date().toISOString(),
        tags: mergedTags // Devpost technologies + AI innovative aspects
      },
      
      // COMPUTED - Based on Devpost awards
      status: devpostData.awards.length > 0 ? 'winner' : 'analyzed'
    };
    
    const result = await sanityClient.create(projectDoc);
    console.log(`  ✅ ENRICHED project created: ${result.projectName} (ID: ${result._id})`);
    console.log(`     📋 Devpost: ${devpostData.awards.length} awards, ${devpostData.stats.likes} likes, ${teamMemberRefs.length} team, ${devpostData.technologies.length} tech`);
    console.log(`     🤖 AI: ${sponsorIntegrations.length} sponsors, ${aiAnalysis?.repositoryStats?.totalFiles || 0} files analyzed`);
    console.log(`     🔀 Merged: ${mergedTags.length} combined tags, status: ${projectDoc.status}`);
    
    return result._id;
    
  } catch (error) {
    console.error(`  ❌ Failed to create Sanity document: ${error.message}`);
    return null;
  }
}

// Process a single project
async function processProject(projectUrl) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${projectUrl}`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Scrape Devpost
    const devpostData = await scrapeDevpostProject(projectUrl);
    if (!devpostData) {
      console.log('  ⚠️  Skipping: Failed to scrape Devpost');
      return { success: false, reason: 'scrape_failed' };
    }
    
    // Step 2: Check for GitHub URL
    const githubUrl = devpostData.links.github[0]?.url;
    if (!githubUrl) {
      console.log('  ⚠️  No GitHub URL found, using Devpost data only');
      // Still create project in Sanity with just Devpost data
      const sanityId = await createEnrichedSanityDocument(devpostData, null);
      return { success: !!sanityId, sanityId, hasAnalysis: false };
    }
    
    console.log(`  📦 GitHub: ${githubUrl}`);
    
    // Step 3: Analyze with backend
    const aiAnalysis = await analyzeWithBackend(
      githubUrl,
      devpostData.title,
      devpostData.teamMembers
    );
    
    // Step 4: Create enriched Sanity document
    const sanityId = await createEnrichedSanityDocument(devpostData, aiAnalysis);
    
    return { 
      success: !!sanityId, 
      sanityId, 
      hasAnalysis: !!aiAnalysis 
    };
    
  } catch (error) {
    console.error(`  ❌ Error processing project: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

// Collect project URLs from Devpost gallery
async function collectProjectURLs(hackathonUrl) {
  const projectURLs = [];
  const galleryUrl = `${hackathonUrl}/project-gallery`;
  
  console.log(`\n🔍 Collecting projects from: ${galleryUrl}\n`);
  
  try {
    // Fetch multiple pages
    for (let page = 1; page <= 5; page++) {
      const url = page === 1 ? galleryUrl : `${galleryUrl}?page=${page}`;
      
      try {
        const html = await fetchHTML(url);
        const $ = cheerio.load(html);
        
        let foundOnPage = 0;
        $('a.link-to-software').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && href.startsWith('/software/')) {
            const fullURL = `https://devpost.com${href}`;
            if (!projectURLs.includes(fullURL)) {
              projectURLs.push(fullURL);
              foundOnPage++;
            }
          }
        });
        
        console.log(`  Page ${page}: Found ${foundOnPage} projects (total: ${projectURLs.length})`);
        
        if (foundOnPage === 0) {
          break; // No more pages
        }
        
        await delay(DELAY_MS);
        
      } catch (error) {
        console.error(`  ⚠️  Page ${page} failed: ${error.message}`);
        break;
      }
    }
    
    return projectURLs;
    
  } catch (error) {
    console.error(`❌ Failed to collect project URLs: ${error.message}`);
    return [];
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Devpost to Sanity Integration');
  console.log('='.repeat(60));
  
  // Get hackathon URL from args or use default
  const hackathonUrl = process.argv[2] || 'https://self-evolving-agents-hack.devpost.com';
  console.log(`Hackathon: ${hackathonUrl}`);
  
  // Verify Sanity is configured
  if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_WRITE_TOKEN) {
    console.error('\n❌ Sanity not configured!');
    console.error('Please set SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
    process.exit(1);
  }
  
  // Verify backend is running
  try {
    const healthRes = await fetch(`${BACKEND_API_URL}/api/health`);
    if (!healthRes.ok) {
      throw new Error('Backend not responding');
    }
    console.log(`✅ Backend API: ${BACKEND_API_URL}\n`);
  } catch (error) {
    console.error(`\n❌ Backend not available at ${BACKEND_API_URL}`);
    console.error('Please start the backend first: npm run dev');
    process.exit(1);
  }
  
  // Step 1: Collect all project URLs
  const projectURLs = await collectProjectURLs(hackathonUrl);
  console.log(`\n📊 Total projects found: ${projectURLs.length}\n`);
  
  if (projectURLs.length === 0) {
    console.error('❌ No projects found. Exiting.');
    return;
  }
  
  // Step 2: Process each project
  const results = {
    total: projectURLs.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    withAnalysis: 0,
    withoutAnalysis: 0
  };
  
  for (let i = 0; i < projectURLs.length; i++) {
    const url = projectURLs[i];
    console.log(`\n[${i + 1}/${projectURLs.length}] ${url}`);
    
    const result = await processProject(url);
    
    if (result.success) {
      results.successful++;
      if (result.hasAnalysis) {
        results.withAnalysis++;
      } else {
        results.withoutAnalysis++;
      }
    } else {
      results.failed++;
    }
    
    // Delay between projects
    if (i < projectURLs.length - 1) {
      await delay(DELAY_MS);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ INTEGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total projects: ${results.total}`);
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`   - With AI analysis: ${results.withAnalysis}`);
  console.log(`   - Devpost only: ${results.withoutAnalysis}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('\n🔗 View in Sanity Studio: http://localhost:3333/structure/project');
  console.log('\n');
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

