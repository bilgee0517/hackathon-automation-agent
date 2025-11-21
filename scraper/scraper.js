/**
 * Full Devpost Scraper
 * Scrapes all projects from the Self-Evolving Agents Hack gallery
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'https://self-evolving-agents-hack.devpost.com';
const GALLERY_PATH = '/project-gallery';
const OUTPUT_DIR = path.join(__dirname, 'projects');
const DELAY_MS = 1000; // 1 second delay between requests

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Utility function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to safely fetch HTML
async function fetchHTML(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      return html;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i < retries - 1) {
        await delay(DELAY_MS * (i + 1)); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

// Helper function to extract video URL
function extractVideoURL($) {
  let videoURL = null;
  
  // Check for embedded YouTube video
  $('iframe').each((i, elem) => {
    const src = $(elem).attr('src');
    if (src && (src.includes('youtube.com') || src.includes('youtu.be') || src.includes('vimeo.com'))) {
      videoURL = src;
      return false; // break
    }
  });
  
  // Check for video tag
  if (!videoURL) {
    const videoSrc = $('video source').attr('src');
    if (videoSrc) {
      videoURL = videoSrc;
    }
  }
  
  return videoURL;
}

// Helper function to extract full story content
function extractStoryContent($) {
  // Look for the main content div
  const storySection = $('#app-details-left');
  
  if (storySection.length > 0) {
    // Get plain text version
    let text = storySection.text().trim();
    // Clean up excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
  
  return '';
}

// Helper function to extract links (GitHub, Try it out, etc.)
function extractLinks($) {
  const links = {
    github: null,
    demo: null,
    other: []
  };
  
  // Look for links in various sections
  $('#app-details-left a, .software-links a, .app-links a').each((i, elem) => {
    const href = $(elem).attr('href');
    const text = $(elem).text().trim();
    
    if (!href) return;
    
    if (href.includes('github.com')) {
      links.github = href;
    } else if (text.toLowerCase().includes('demo') || text.toLowerCase().includes('try')) {
      links.demo = href;
    } else if (href.startsWith('http') && !href.includes('devpost.com')) {
      links.other.push({
        url: href,
        text: text
      });
    }
  });
  
  return links;
}

// Step 1: Collect all project URLs from gallery pages
async function collectProjectURLs() {
  const projectURLs = [];
  
  // Fetch both pages
  for (let page = 1; page <= 2; page++) {
    const url = page === 1 
      ? `${BASE_URL}${GALLERY_PATH}`
      : `${BASE_URL}${GALLERY_PATH}?page=${page}`;
    
    try {
      const html = await fetchHTML(url);
      const $ = cheerio.load(html);
      
      // Find all project links with class 'link-to-software'
      $('a.link-to-software').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.startsWith('/software/')) {
          const fullURL = `https://devpost.com${href}`;
          if (!projectURLs.includes(fullURL)) {
            projectURLs.push(fullURL);
          }
        }
      });
      
      console.log(`Found ${projectURLs.length} projects after page ${page}`);
      await delay(DELAY_MS);
      
    } catch (error) {
      console.error(`Error fetching gallery page ${page}:`, error.message);
    }
  }
  
  return projectURLs;
}

// Step 2: Scrape individual project page
async function scrapeProjectPage(url) {
  try {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    
    // Extract project name from title tag
    const title = $('title').text().trim().replace(' | Devpost', '');
    
    // Extract short tagline from og:description meta tag
    const tagline = $('meta[property="og:description"]').attr('content')?.trim() || '';
    
    // Extract full story content for description
    const description = extractStoryContent($);
    
    // Extract video URL
    const videoURL = extractVideoURL($);
    
    // Extract technologies (Built With)
    const technologies = [];
    $('h2, h3').each((i, elem) => {
      const headerText = $(elem).text().trim();
      if (headerText === 'Built With' || headerText.includes('Built With')) {
        // Find the next ul with tags
        const techList = $(elem).nextAll('ul').first();
        techList.find('li span.cp-tag, li a span').each((j, tag) => {
          const tech = $(tag).text().trim();
          if (tech && !technologies.includes(tech)) {
            technologies.push(tech);
          }
        });
      }
    });
    
    // Extract team members (as simple strings)
    const teamMembers = [];
    $('#app-team li.software-team-member').each((i, elem) => {
      const $member = $(elem);
      const nameLink = $member.find('a.user-profile-link');
      const name = nameLink.text().trim();
      
      if (name) {
        teamMembers.push(name);
      }
    });
    
    // Extract awards/prizes
    const awards = [];
    $('span.winner.label, .winner').each((i, elem) => {
      const awardText = $(elem).text().trim();
      if (awardText && awardText.length > 0 && !awardText.startsWith('Submitted')) {
        awards.push(awardText);
      }
    });
    
    // Determine status based on awards
    const status = awards.length > 0 ? 'winner' : 'analyzing';
    
    // Extract hackathon submission info
    let hackathonName = '';
    let hackathonURL = '';
    $('#submissions .software-list-content h5 a, #submissions h5 a').each((i, elem) => {
      const text = $(elem).text().trim();
      const href = $(elem).attr('href');
      if (text && !text.includes('Winner')) {
        hackathonName = text;
        hackathonURL = href ? `https://devpost.com${href}` : '';
        return false; // break
      }
    });
    
    // Extract links (GitHub, demo, etc.)
    const links = extractLinks($);
    
    // Extract project slug from URL
    const slug = url.split('/software/')[1] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Extract likes and comments
    const likes = parseInt($('.like-count').text().trim()) || 0;
    const comments = parseInt($('.comment-count').text().trim()) || 0;
    
    // Extract cover image
    const coverImage = $('meta[property="og:image"]').attr('content') || null;
    
    const projectData = {
      title,
      slug,
      url,
      tagline,
      description,
      videoURL,
      coverImage,
      technologies,
      teamMembers,
      awards,
      status,
      links,
      hackathon: {
        name: hackathonName,
        url: hackathonURL
      },
      stats: {
        likes,
        comments
      },
      scrapedAt: new Date().toISOString()
    };
    
    return projectData;
    
  } catch (error) {
    console.error(`Error scraping project ${url}:`, error.message);
    return null;
  }
}

// Step 3: Save project data to JSON file
function saveProjectData(projectData) {
  if (!projectData) return;
  
  const filename = `${projectData.slug}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(projectData, null, 2), 'utf-8');
  console.log(`✓ Saved: ${filename}`);
}

// Main execution
async function main() {
  console.log('=== Devpost Project Scraper ===\n');
  
  // Step 1: Collect all project URLs
  console.log('Step 1: Collecting project URLs from gallery...');
  const projectURLs = await collectProjectURLs();
  console.log(`\nFound ${projectURLs.length} total projects\n`);
  
  if (projectURLs.length === 0) {
    console.error('No projects found. Exiting.');
    return;
  }
  
  // Save the list of URLs
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_project-urls.json'),
    JSON.stringify(projectURLs, null, 2),
    'utf-8'
  );
  
  // Step 2: Scrape each project
  console.log('Step 2: Scraping individual projects...\n');
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < projectURLs.length; i++) {
    const url = projectURLs[i];
    console.log(`[${i + 1}/${projectURLs.length}] Scraping: ${url}`);
    
    const projectData = await scrapeProjectPage(url);
    
    if (projectData) {
      saveProjectData(projectData);
      successCount++;
    } else {
      failCount++;
    }
    
    // Be polite: add delay between requests
    if (i < projectURLs.length - 1) {
      await delay(DELAY_MS);
    }
  }
  
  // Summary
  console.log('\n=== Scraping Complete ===');
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  // Create a summary file
  const summary = {
    totalProjects: projectURLs.length,
    successful: successCount,
    failed: failCount,
    scrapedAt: new Date().toISOString(),
    outputDirectory: OUTPUT_DIR
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );
}

// Run the scraper
main().catch(console.error);

