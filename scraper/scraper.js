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

// Helper function to extract all images
function extractImages($) {
  const images = [];
  
  // Cover image
  const coverImage = $('meta[property="og:image"]').attr('content');
  if (coverImage) {
    images.push({
      url: coverImage,
      type: 'cover',
      alt: 'Project cover image'
    });
  }
  
  // Gallery and content images
  $('#gallery img, #app-details-left img, .software-list img').each((i, elem) => {
    const src = $(elem).attr('src') || $(elem).attr('data-src');
    const alt = $(elem).attr('alt') || '';
    
    if (src && !images.find(img => img.url === src)) {
      images.push({
        url: src,
        type: 'screenshot',
        alt: alt
      });
    }
  });
  
  // Linked images
  $('#app-details-left a').each((i, elem) => {
    const href = $(elem).attr('href');
    if (href && (href.includes('.png') || href.includes('.jpg') || href.includes('.jpeg') || href.includes('.gif') || href.includes('.webp'))) {
      if (!images.find(img => img.url === href)) {
        images.push({
          url: href,
          type: 'screenshot',
          alt: $(elem).find('img').attr('alt') || ''
        });
      }
    }
  });
  
  return images;
}

// Helper function to extract full story content
function extractDescription($) {
  const storySection = $('#app-details-left');
  
  if (storySection.length > 0) {
    let text = storySection.text().trim();
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }
  
  return '';
}

// Helper function to extract categorized links
function extractLinks($) {
  const links = {
    github: [],
    demo: [],
    video: [],
    other: []
  };
  
  $('#app-details-left a, .software-links a, .app-links a').each((i, elem) => {
    const href = $(elem).attr('href');
    const text = $(elem).text().trim();
    
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    
    const linkData = { url: href, text: text };
    
    if (href.includes('github.com') || href.includes('gitlab.com') || href.includes('bitbucket.org')) {
      if (!links.github.find(l => l.url === href)) {
        links.github.push(linkData);
      }
    } else if (href.includes('youtube.com') || href.includes('youtu.be') || href.includes('vimeo.com') || href.includes('loom.com')) {
      if (!links.video.find(l => l.url === href)) {
        links.video.push(linkData);
      }
    } else if (text.toLowerCase().includes('demo') || text.toLowerCase().includes('try') || text.toLowerCase().includes('live')) {
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

// Helper function to extract team members with avatars
function extractTeamMembers($) {
  const teamMembers = [];
  
  $('#app-team li.software-team-member').each((i, elem) => {
    const $member = $(elem);
    const nameLink = $member.find('a.user-profile-link');
    const name = nameLink.text().trim();
    const profileURL = nameLink.attr('href');
    const avatar = $member.find('img').attr('src') || null;
    
    let role = '';
    const bubble = $member.find('.bubble p');
    if (bubble.length > 0) {
      role = bubble.text().trim();
    }
    
    if (name) {
      teamMembers.push({
        name,
        role: role || null,
        profileURL: profileURL ? `https://devpost.com${profileURL}` : null,
        avatar: avatar
      });
    }
  });
  
  return teamMembers;
}

// Helper function to extract awards
function extractAwards($) {
  const awards = [];
  
  $('#submissions .software-list-content .winner, span.winner').each((i, elem) => {
    const awardText = $(elem).text().trim();
    if (awardText && awardText.length > 0 && !awardText.startsWith('Submitted')) {
      if (!awards.find(a => a.title === awardText)) {
        awards.push({
          title: awardText,
          isWinner: true
        });
      }
    }
  });
  
  return awards;
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
    const description = extractDescription($);
    
    // Extract all images
    const images = extractImages($);
    
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
    
    // Extract team members with avatars
    const teamMembers = extractTeamMembers($);
    
    // Extract full award information
    const awards = extractAwards($);
    
    // Determine status based on awards
    const status = awards.some(a => a.isWinner) ? 'winner' : 'analyzing';
    
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
    
    // Extract submission date
    const submittedDate = $('#submissions time').attr('datetime') || new Date().toISOString();
    
    const projectData = {
      title,
      slug,
      url,
      tagline,
      description,
      images,
      videoURL,
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
      submittedAt: submittedDate,
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

