#!/usr/bin/env node

/**
 * Quick test script to verify the backend is working
 * 
 * Usage: node scripts/test-api.js <github-url>
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const GITHUB_URL = process.argv[2] || 'https://github.com/HomeroRR/PrivateTherapist/tree/MCP_A2A_Hackathon';

console.log('🧪 Testing Hackathon Automation Agent API\n');
console.log(`API URL: ${API_URL}`);
console.log(`GitHub URL: ${GITHUB_URL}\n`);

// Helper to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Main test flow
async function runTest() {
  try {
    // Step 1: Health check
    console.log('1️⃣  Checking API health...');
    const health = await makeRequest(`${API_URL}/api/health`);
    console.log(`✓ ${health.status}\n`);
    
    // Step 2: Submit analysis job
    console.log('2️⃣  Submitting analysis job...');
    const analysisResult = await makeRequest(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        githubUrl: GITHUB_URL,
        teamName: 'Test Team',
        projectName: 'Test Project'
      }
    });
    
    console.log('📦 Analysis response:', JSON.stringify(analysisResult, null, 2));
    
    if (analysisResult.error) {
      console.error('✗ Error:', analysisResult.error);
      console.error('  Details:', analysisResult.details);
      process.exit(1);
    }
    
    // Check if it was cached
    if (analysisResult.cached) {
      console.log('✓ Analysis was cached, returning immediate results\n');
      console.log('📊 Cached Results:\n');
      displayResults(analysisResult.result);
      console.log(`\n✅ Test completed successfully (from cache)!\n`);
      return;
    }
    
    const jobId = analysisResult.jobId;
    if (!jobId) {
      console.error('✗ Error: No jobId in response');
      console.error('Response:', JSON.stringify(analysisResult, null, 2));
      process.exit(1);
    }
    console.log(`✓ Job created: ${jobId}\n`);
    
    // Step 3: Poll for status
    console.log('3️⃣  Waiting for analysis to complete...');
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes
    let lastProgress = '';
    
    while (attempts < maxAttempts) {
      const status = await makeRequest(`${API_URL}/api/status/${jobId}`);
      
      let statusText = 'unknown';
      let progressText = '';
      
      if (!status || status.error) {
        console.log(`   ⚠️  Status unavailable: ${status?.error || 'Unknown error'}`);
        statusText = 'error';
      } else {
        statusText = status.status || 'unknown';
        progressText = status.progress || '';
        
        // Only log if progress changed (reduce noise)
        if (progressText !== lastProgress || attempts % 5 === 0) {
          // Show progress with proper formatting
          if (progressText.startsWith('[Iteration')) {
            // Iteration messages
            console.log(`   ${progressText}`);
          } else if (progressText.startsWith('  →')) {
            // Tool execution details (indented)
            console.log(`     ${progressText}`);
          } else {
            // Other messages
            console.log(`   [${attempts + 1}/${maxAttempts}] ${statusText}: ${progressText}`);
          }
          lastProgress = progressText;
        }
      }
      
      if (status && status.status === 'complete') {
        console.log('\n✅ Analysis complete!\n');
        
        // Step 4: Get results
        console.log('4️⃣  Fetching results...');
        const results = await makeRequest(`${API_URL}/api/results/${jobId}`);
        
        if (results.error) {
          console.error('✗ Error fetching results:', results.error);
          process.exit(1);
        }
        
        displayResults(results.result || results);
        console.log(`\n✅ Test completed successfully!\n`);
        return;
      }
      
      if (status && status.status === 'failed') {
        console.error('\n✗ Analysis failed:', status.error || 'Unknown error');
        process.exit(1);
      }
      
      // Wait based on status
      const waitTime = statusText === 'analyzing' ? 2000 : 5000; // 2s during analysis, 5s otherwise
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempts++;
    }
    
    console.error('\n✗ Timeout waiting for analysis to complete');
    process.exit(1);
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();

// Helper function to display results
function displayResults(result) {
  console.log('\n📊 Analysis Results:\n');
  
  if (!result) {
    console.error('⚠️  No results data');
    return;
  }
  
  console.log(`Team: ${result.teamName || 'N/A'}`);
  console.log(`Project: ${result.projectName || 'N/A'}`);
  
  if (result.repositoryStats) {
    console.log(`Language: ${result.repositoryStats.mainLanguage || 'N/A'}`);
    console.log(`Files: ${result.repositoryStats.totalFiles || 0}`);
    console.log(`Has Tests: ${result.repositoryStats.hasTests ? 'Yes' : 'No'}`);
  }
  
  console.log(`\n🎯 Sponsor Integrations Detected:`);
  
  if (result.sponsors) {
    let detectedCount = 0;
    for (const [name, data] of Object.entries(result.sponsors)) {
      if (data.detected) {
        detectedCount++;
        console.log(`\n  ✅ ${name.toUpperCase()}: Score ${data.integrationScore}/10`);
        console.log(`     Technical: ${data.technicalSummary.substring(0, 100)}${data.technicalSummary.length > 100 ? '...' : ''}`);
        console.log(`     Plain English: ${data.plainEnglishSummary.substring(0, 100)}${data.plainEnglishSummary.length > 100 ? '...' : ''}`);
        console.log(`     Prize Eligible: ${data.prizeEligible ? 'Yes ✓' : 'No'}`);
        console.log(`     Confidence: ${Math.round(data.confidence * 100)}%`);
      }
    }
    
    if (detectedCount === 0) {
      console.log('  (None detected)');
    } else {
      console.log(`\n  Total sponsors detected: ${detectedCount}/15`);
    }
  }
  
  if (result.overallSummary) {
    console.log(`\n📝 Overall Summary:`);
    console.log(`   ${result.overallSummary}`);
  }
  
  if (result.innovativeAspects && result.innovativeAspects.length > 0) {
    console.log(`\n💡 Innovative Aspects:`);
    result.innovativeAspects.forEach((aspect, i) => {
      console.log(`   ${i + 1}. ${aspect}`);
    });
  }
}

