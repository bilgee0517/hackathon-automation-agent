/**
 * Test scraper on a single project (Farmer OP)
 * This validates that our selectors and extraction logic work correctly
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_URL = 'https://devpost.com/software/farmer-op';

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

// Main scrape function
async function scrapeProject(url) {
  console.log(`\nScraping: ${url}\n`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract project name from title tag
    const title = $('title').text().trim().replace(' | Devpost', '');
    console.log('✓ Title:', title);
    
    // Extract short tagline from og:description meta tag
    const tagline = $('meta[property="og:description"]').attr('content')?.trim() || '';
    console.log('✓ Tagline:', tagline);
    
    // Extract full story content for description
    const description = extractStoryContent($);
    console.log('✓ Description length:', description.length, 'characters');
    
    // Extract video URL
    const videoURL = extractVideoURL($);
    console.log('✓ Video URL:', videoURL || 'None found');
    
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
    console.log('✓ Technologies:', technologies);
    
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
    console.log('✓ Team members:', teamMembers);
    
    // Extract awards/prizes
    const awards = [];
    $('span.winner.label, .winner').each((i, elem) => {
      const awardText = $(elem).text().trim();
      if (awardText && awardText.length > 0 && !awardText.startsWith('Submitted')) {
        awards.push(awardText);
      }
    });
    console.log('✓ Awards:', awards);
    
    // Determine status based on awards
    const status = awards.length > 0 ? 'winner' : 'analyzing';
    console.log('✓ Status:', status);
    
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
    console.log('✓ Hackathon:', hackathonName);
    
    // Extract links (GitHub, demo, etc.)
    const links = extractLinks($);
    console.log('✓ GitHub:', links.github || 'None found');
    console.log('✓ Demo:', links.demo || 'None found');
    
    // Extract project slug from URL
    const slug = url.split('/software/')[1] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Extract likes and comments
    const likes = parseInt($('.like-count').text().trim()) || 0;
    const comments = parseInt($('.comment-count').text().trim()) || 0;
    console.log('✓ Stats: Likes:', likes, 'Comments:', comments);
    
    // Extract cover image
    const coverImage = $('meta[property="og:image"]').attr('content') || null;
    console.log('✓ Cover image:', coverImage ? 'Found' : 'None');
    
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
    console.error('❌ Error scraping project:', error.message);
    throw error;
  }
}

// Run the test
async function main() {
  console.log('=== Testing Devpost Scraper ===');
  console.log('Target:', TEST_URL);
  
  try {
    const projectData = await scrapeProject(TEST_URL);
    
    console.log('\n=== ✅ SUCCESS ===\n');
    console.log('Full project data:');
    console.log(JSON.stringify(projectData, null, 2));
    
    // Save to file
    const outputDir = path.join(__dirname, 'projects');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `${projectData.slug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(projectData, null, 2), 'utf-8');
    
    console.log(`\n📁 Saved to: ${outputPath}`);
    console.log('\n✨ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();

