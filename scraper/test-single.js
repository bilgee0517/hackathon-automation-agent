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
    const description = extractDescription($);
    console.log('✓ Description length:', description.length, 'characters');
    
    // Extract all images
    const images = extractImages($);
    console.log('✓ Images found:', images.length);
    
    // Extract video URL
    const videoURL = extractVideoURL($);
    console.log('✓ Video URL:', videoURL || 'None');
    
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
    
    // Extract team members with avatars
    const teamMembers = extractTeamMembers($);
    console.log('✓ Team members:', teamMembers.length);
    
    // Extract full award information
    const awards = extractAwards($);
    console.log('✓ Awards:', awards);
    
    // Determine status based on awards
    const status = awards.some(a => a.isWinner) ? 'winner' : 'analyzing';
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
    
    // Extract links with better categorization
    const links = extractLinks($);
    console.log('✓ Links - GitHub:', links.github.length, 'Demo:', links.demo.length, 'Video:', links.video.length);
    
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
    console.error('❌ Error scraping project:', error.message);
    throw error;
  }
}

// Run test
async function main() {
  console.log('=== Testing Enhanced Scraper ===');
  console.log('Target:', TEST_URL);
  
  try {
    const projectData = await scrapeProject(TEST_URL);
    
    console.log('\n=== ✅ SUCCESS ===\n');
    
    // Save to file
    const outputDir = path.join(__dirname, 'projects');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `${projectData.slug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(projectData, null, 2), 'utf-8');
    
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n✨ Test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();

