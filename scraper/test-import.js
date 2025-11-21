#!/usr/bin/env node

/**
 * Test Single Project Import
 * 
 * Quick test to verify the Devpost → Backend → Sanity pipeline
 * with just one project
 * 
 * Usage: node test-import.js <devpost-project-url>
 * Example: node test-import.js https://devpost.com/software/farmer-op
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2025-09-25',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extract team members
function extractTeamMembers($) {
  const teamMembers = [];
  
  $('#app-team li.software-team-member').each((i, elem) => {
    const $member = $(elem);
    const nameLink = $member.find('a.user-profile-link');
    const name = nameLink.text().trim();
    const avatar = $member.find('img').attr('src') || null;
    const bubble = $member.find('.bubble p');
    const role = bubble.length > 0 ? bubble.text().trim() : '';
    
    if (name) {
      teamMembers.push({
        name,
        email: null,
        githubUsername: null,
        bio: role || 'Team member',
        devpostAvatar: avatar
      });
    }
  });
  
  return teamMembers;
}

// Extract links
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

// Extract awards
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

// Scrape Devpost project
async function scrapeDevpostProject(url) {
  console.log('\n📋 Step 1: Scraping Devpost...');
  console.log(`URL: ${url}`);
  
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
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const title = $('title').text().trim().replace(' | Devpost', '');
    const tagline = $('meta[property="og:description"]').attr('content')?.trim() || '';
    const coverImage = $('meta[property="og:image"]').attr('content');
    const videoURL = $('iframe[src*="youtube"], iframe[src*="vimeo"]').attr('src') || null;
    
    // Technologies
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
    
    console.log('✅ Scraping complete!');
    console.log(`   Title: ${title}`);
    console.log(`   Tagline: ${tagline.substring(0, 60)}...`);
    console.log(`   Team members: ${teamMembers.length}`);
    console.log(`   Technologies: ${technologies.length}`);
    console.log(`   Awards: ${awards.length}`);
    console.log(`   GitHub URLs: ${links.github.length}`);
    
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
    console.error(`❌ Failed to scrape Devpost: ${error.message}`);
    throw error;
  }
}

// Analyze with backend
async function analyzeWithBackend(githubUrl, projectName, teamMembers) {
  console.log('\n🤖 Step 2: Sending to backend for AI analysis...');
  console.log(`GitHub URL: ${githubUrl}`);
  
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubUrl,
        teamName: teamMembers.length > 0 ? `${teamMembers[0].name}'s Team` : 'Test Team',
        projectName,
        teamMembers
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    const jobId = result.jobId;
    console.log(`✅ Job created: ${jobId}`);
    console.log('⏳ Waiting for analysis (this may take a few minutes)...');
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    while (attempts < maxAttempts) {
      await delay(5000);
      
      const statusRes = await fetch(`${BACKEND_API_URL}/api/status/${jobId}`);
      const status = await statusRes.json();
      
      if (status.progress) {
        console.log(`   ${status.progress}`);
      }
      
      if (status.status === 'complete') {
        console.log('✅ Analysis complete!');
        
        const resultsRes = await fetch(`${BACKEND_API_URL}/api/results/${jobId}`);
        const analysisResult = await resultsRes.json();
        
        const analysis = analysisResult.result || analysisResult;
        
        // Count detected sponsors
        let sponsorCount = 0;
        if (analysis.sponsors) {
          sponsorCount = Object.values(analysis.sponsors).filter(s => s.detected).length;
        }
        
        console.log(`   Sponsors detected: ${sponsorCount}`);
        console.log(`   Main language: ${analysis.repositoryStats?.mainLanguage || 'Unknown'}`);
        console.log(`   Total files: ${analysis.repositoryStats?.totalFiles || 0}`);
        
        return analysis;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Analysis failed');
      }
      
      attempts++;
    }
    
    throw new Error('Analysis timeout');
    
  } catch (error) {
    console.error(`❌ Backend analysis failed: ${error.message}`);
    return null;
  }
}

// Create Sanity document - MERGES Devpost + AI Analysis
async function createSanityDocument(devpostData, aiAnalysis) {
  console.log('\n💾 Step 3: Merging data and creating Sanity documents...');
  console.log('\n📊 Data Merge Summary:');
  console.log('   FROM DEVPOST:');
  console.log(`     ├─ Title: ${devpostData.title}`);
  console.log(`     ├─ Tagline: ${devpostData.tagline.substring(0, 50)}...`);
  console.log(`     ├─ Team members: ${devpostData.teamMembers.length}`);
  console.log(`     ├─ Technologies: ${devpostData.technologies.length}`);
  console.log(`     ├─ Awards: ${devpostData.awards.length}`);
  console.log(`     ├─ Likes: ${devpostData.stats.likes}`);
  console.log(`     ├─ Cover image: ${devpostData.coverImage ? 'Yes' : 'No'}`);
  console.log(`     └─ Video: ${devpostData.videoURL ? 'Yes' : 'No'}`);
  
  if (aiAnalysis) {
    console.log('   FROM AI ANALYSIS:');
    const detectedSponsors = Object.values(aiAnalysis.sponsors || {}).filter(s => s.detected);
    console.log(`     ├─ Sponsor integrations: ${detectedSponsors.length}`);
    console.log(`     ├─ Main language: ${aiAnalysis.repositoryStats?.mainLanguage || 'Unknown'}`);
    console.log(`     ├─ Total files: ${aiAnalysis.repositoryStats?.totalFiles || 0}`);
    console.log(`     ├─ Has tests: ${aiAnalysis.repositoryStats?.hasTests ? 'Yes' : 'No'}`);
    console.log(`     ├─ Innovative aspects: ${aiAnalysis.innovativeAspects?.length || 0}`);
    console.log(`     └─ AI summary: ${aiAnalysis.overallSummary?.substring(0, 50)}...`);
  }
  
  console.log('\n🔀 Merging strategy:');
  console.log('   ├─ Description: Using AI summary (if available) > Devpost tagline');
  console.log('   ├─ Tags: Combining Devpost technologies + AI innovative aspects');
  console.log('   ├─ Team: Using Devpost team with avatars');
  console.log('   ├─ Status: "winner" if has awards, else "analyzed"');
  console.log('   └─ Sponsor integrations: From AI analysis with detailed scores\n');
  
  try {
    // Create team members (from Devpost)
    console.log('📝 Creating team members from Devpost data...');
    const teamMemberRefs = [];
    for (const member of devpostData.teamMembers) {
      const hackerDoc = await sanityClient.create({
        _type: 'hacker',
        name: member.name,
        email: member.email,
        githubUsername: member.githubUsername,
        bio: member.bio,
        devpostAvatar: member.devpostAvatar
      });
      console.log(`   ✅ Created hacker: ${member.name} (Devpost avatar: ${member.devpostAvatar ? 'Yes' : 'No'})`);
      teamMemberRefs.push({ _type: 'reference', _ref: hackerDoc._id });
    }
    
    // Convert AI sponsor analyses to Sanity sponsor integrations
    console.log('\n🤖 Converting AI sponsor analysis to Sanity format...');
    const sponsorIntegrations = [];
    if (aiAnalysis && aiAnalysis.sponsors) {
      for (const [key, data] of Object.entries(aiAnalysis.sponsors)) {
        if (data.detected) {
          const integration = {
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
          };
          sponsorIntegrations.push(integration);
          console.log(`   ✅ ${integration.sponsorName}: Score ${integration.technicalScore}/10 (${integration.integrationDepth})`);
        }
      }
    } else {
      console.log('   ⚠️  No AI analysis, skipping sponsor integrations');
    }
    
    // Merge tags from both sources
    const mergedTags = [
      ...devpostData.technologies.slice(0, 5),
      ...(aiAnalysis ? aiAnalysis.innovativeAspects.slice(0, 3) : [])
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
    
    console.log(`\n🏷️  Combined tags (${mergedTags.length} total):`);
    console.log(`   Devpost tech: ${devpostData.technologies.slice(0, 5).join(', ')}`);
    if (aiAnalysis) {
      console.log(`   AI aspects: ${aiAnalysis.innovativeAspects.slice(0, 3).join(', ')}`);
    }
    
    // Create enriched project document - COMBINES BOTH SOURCES
    console.log('\n📦 Creating enriched project document...');
    const projectDoc = {
      _type: 'project',
      
      // From Devpost
      projectName: devpostData.title,
      slug: {
        _type: 'slug',
        current: devpostData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      },
      tagline: devpostData.tagline, // Devpost tagline
      devpostUrl: devpostData.devpostUrl,
      coverImage: devpostData.coverImage,
      videoURL: devpostData.videoURL,
      devpostLikes: devpostData.stats.likes,
      awards: devpostData.awards, // Devpost awards
      submittedAt: devpostData.submittedAt,
      
      // From AI Analysis (or fallback to Devpost)
      description: aiAnalysis ? aiAnalysis.overallSummary : devpostData.tagline,
      githubUrl: devpostData.links.github[0]?.url || null,
      githubData: aiAnalysis ? {
        language: aiAnalysis.repositoryStats?.mainLanguage || 'Unknown',
        totalFiles: aiAnalysis.repositoryStats?.totalFiles || 0,
        hasTests: aiAnalysis.repositoryStats?.hasTests || false,
        lastCommit: new Date().toISOString()
      } : null,
      
      // Merged data
      team: teamMemberRefs, // Devpost team members
      analysisData: {
        aiSummaryForJudges: aiAnalysis ? aiAnalysis.overallSummary : devpostData.tagline,
        latestAnalysisAt: new Date().toISOString(),
        tags: mergedTags // Combined from both sources
      },
      sponsorIntegrations, // From AI analysis
      
      // Status based on Devpost awards
      status: devpostData.awards.length > 0 ? 'winner' : 'analyzed'
    };
    
    const result = await sanityClient.create(projectDoc);
    
    console.log('\n✅ ENRICHED project created in Sanity!');
    console.log('   📊 Final document contains:');
    console.log(`      Project ID: ${result._id}`);
    console.log(`      ├─ Devpost: title, tagline, team (${teamMemberRefs.length}), awards (${devpostData.awards.length}), likes, media`);
    console.log(`      ├─ AI Analysis: ${aiAnalysis ? `sponsor integrations (${sponsorIntegrations.length}), code stats, summary` : 'Not available'}`);
    console.log(`      └─ Merged: ${mergedTags.length} combined tags, enriched description, status: ${projectDoc.status}`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to create Sanity documents: ${error.message}`);
    throw error;
  }
}

// Main test
async function main() {
  console.log('🧪 Testing Devpost to Sanity Integration');
  console.log('='.repeat(60));
  
  // Get project URL from args
  const projectUrl = process.argv[2];
  
  if (!projectUrl) {
    console.error('\n❌ Error: Please provide a Devpost project URL');
    console.log('\nUsage:');
    console.log('  node test-import.js <devpost-url>');
    console.log('\nExample:');
    console.log('  node test-import.js https://devpost.com/software/farmer-op');
    process.exit(1);
  }
  
  if (!projectUrl.includes('devpost.com/software/')) {
    console.error('\n❌ Error: Invalid Devpost project URL');
    console.log('URL should be like: https://devpost.com/software/project-name');
    process.exit(1);
  }
  
  // Check Sanity config
  if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_WRITE_TOKEN) {
    console.error('\n❌ Error: Sanity not configured!');
    console.log('Please set SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env');
    process.exit(1);
  }
  
  // Check backend
  try {
    const healthRes = await fetch(`${BACKEND_API_URL}/api/health`);
    if (!healthRes.ok) {
      throw new Error('Backend not responding');
    }
    console.log(`✅ Backend available: ${BACKEND_API_URL}`);
  } catch (error) {
    console.error(`\n❌ Error: Backend not available at ${BACKEND_API_URL}`);
    console.log('Please start the backend: cd ../backend && npm run dev');
    process.exit(1);
  }
  
  console.log(`✅ Sanity configured: ${process.env.SANITY_PROJECT_ID}`);
  console.log(`\n📦 Processing: ${projectUrl}\n`);
  
  try {
    // Step 1: Scrape Devpost
    const devpostData = await scrapeDevpostProject(projectUrl);
    
    // Step 2: Analyze with backend (if GitHub URL exists)
    let aiAnalysis = null;
    if (devpostData.links.github.length > 0) {
      const githubUrl = devpostData.links.github[0].url;
      aiAnalysis = await analyzeWithBackend(
        githubUrl,
        devpostData.title,
        devpostData.teamMembers
      );
    } else {
      console.log('\n⚠️  No GitHub URL found, skipping AI analysis');
    }
    
    // Step 3: Create in Sanity
    const sanityResult = await createSanityDocument(devpostData, aiAnalysis);
    
    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('✨ SUCCESS! Test completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Project: ${devpostData.title}`);
    console.log(`   Sanity ID: ${sanityResult._id}`);
    console.log(`   Has AI analysis: ${aiAnalysis ? 'Yes ✅' : 'No (Devpost only)'}`);
    console.log(`   Team members: ${devpostData.teamMembers.length}`);
    console.log(`   Sponsor integrations: ${aiAnalysis ? Object.values(aiAnalysis.sponsors).filter(s => s.detected).length : 0}`);
    console.log('\n🔗 View in Sanity Studio:');
    console.log(`   http://localhost:3333/structure/project;${sanityResult._id}`);
    console.log('\n');
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error(`\nError: ${error.message}`);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

main();

