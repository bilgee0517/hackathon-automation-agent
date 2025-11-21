#!/usr/bin/env node

/**
 * Learning Dashboard - Show agent improvement over time
 * 
 * Usage:
 *   node scripts/show-learning.js
 */

const Redis = require('ioredis');

async function main() {
  console.log('\n🧠 AGENT LEARNING DASHBOARD\n');
  console.log('═'.repeat(80));
  
  // Connect to Redis
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    // ioredis connects automatically, just check connection
    console.log('✓ Connected to Redis\n');

    // Get all memories
    const memoryIds = await client.zrange('agent:memories:timeline', 0, -1);
    
    if (memoryIds.length === 0) {
      console.log('📭 No analyses found yet.');
      console.log('\nRun your first analysis with:');
      console.log('  node scripts/test-api.js\n');
      return;
    }

    console.log(`📊 Total Analyses: ${memoryIds.length}\n`);

    // Fetch all memories
    const memories = [];
    for (const id of memoryIds) {
      const data = await client.get(`agent:memory:${id}`);
      if (data) {
        memories.push(JSON.parse(data));
      }
    }

    // Calculate metrics
    const avgAccuracy = memories.reduce((sum, m) => sum + m.performance.accuracy, 0) / memories.length;
    const avgConfidence = memories.reduce((sum, m) => sum + m.performance.confidence, 0) / memories.length;
    const avgToolCalls = memories.reduce((sum, m) => sum + m.performance.toolCallsUsed, 0) / memories.length;
    const avgTime = memories.reduce((sum, m) => sum + m.performance.timeMs, 0) / memories.length;

    // Overall performance
    console.log('📈 OVERALL PERFORMANCE\n');
    console.log(`  Accuracy:      ${renderBar(avgAccuracy)} ${(avgAccuracy * 100).toFixed(1)}%`);
    console.log(`  Confidence:    ${renderBar(avgConfidence)} ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`  Avg Tool Calls: ${avgToolCalls.toFixed(1)}`);
    console.log(`  Avg Time:       ${(avgTime / 1000).toFixed(1)}s`);
    console.log();

    // Improvement over time
    if (memories.length >= 5) {
      const first5 = memories.slice(0, 5);
      const last5 = memories.slice(-5);
      
      const firstAccuracy = first5.reduce((sum, m) => sum + m.performance.accuracy, 0) / 5;
      const lastAccuracy = last5.reduce((sum, m) => sum + m.performance.accuracy, 0) / 5;
      
      const firstConfidence = first5.reduce((sum, m) => sum + m.performance.confidence, 0) / 5;
      const lastConfidence = last5.reduce((sum, m) => sum + m.performance.confidence, 0) / 5;
      
      const accuracyImprovement = ((lastAccuracy - firstAccuracy) / firstAccuracy) * 100;
      const confidenceImprovement = ((lastConfidence - firstConfidence) / firstConfidence) * 100;
      
      console.log('🚀 IMPROVEMENT (First 5 vs Last 5)\n');
      console.log(`  Accuracy:   ${firstAccuracy.toFixed(2)} → ${lastAccuracy.toFixed(2)} (${accuracyImprovement >= 0 ? '+' : ''}${accuracyImprovement.toFixed(1)}%)`);
      console.log(`  Confidence: ${firstConfidence.toFixed(2)} → ${lastConfidence.toFixed(2)} (${confidenceImprovement >= 0 ? '+' : ''}${confidenceImprovement.toFixed(1)}%)`);
      console.log();
    }

    // Get learned patterns
    const sponsors = ['aws', 'skyflow', 'postman', 'redis', 'forethought', 'finsterAI', 
                     'senso', 'anthropic', 'sanity', 'trmLabs', 'coder', 'lightpanda', 
                     'lightningAI', 'parallel', 'cleric'];

    console.log('🔍 TOP LEARNED PATTERNS\n');
    
    const learnedPatterns = [];
    for (const sponsor of sponsors) {
      const data = await client.get(`agent:patterns:${sponsor}`);
      if (data) {
        const pattern = JSON.parse(data);
        if (pattern.confidence > 0.5) {
          learnedPatterns.push({
            sponsor,
            pattern,
            score: pattern.confidence * (pattern.successCount / (pattern.successCount + pattern.failureCount))
          });
        }
      }
    }

    learnedPatterns.sort((a, b) => b.score - a.score);
    
    if (learnedPatterns.length === 0) {
      console.log('  No high-confidence patterns learned yet.\n');
    } else {
      learnedPatterns.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.sponsor.toUpperCase()}`);
        console.log(`     Confidence: ${(item.pattern.confidence * 100).toFixed(0)}%`);
        console.log(`     Success rate: ${item.pattern.successCount}/${item.pattern.successCount + item.pattern.failureCount}`);
        
        if (item.pattern.packages.length > 0) {
          console.log(`     Packages: ${item.pattern.packages.slice(0, 3).join(', ')}`);
        }
        
        console.log();
      });
    }

    // Recent analysis history
    console.log('📜 RECENT ANALYSIS HISTORY\n');
    memories.slice(-5).reverse().forEach((memory, i) => {
      const date = new Date(memory.timestamp).toLocaleString();
      console.log(`  ${5 - i}. ${date}`);
      console.log(`     Accuracy: ${(memory.performance.accuracy * 100).toFixed(0)}%, Confidence: ${(memory.performance.confidence * 100).toFixed(0)}%`);
      console.log(`     Sponsors detected: ${memory.performance.sponsorsDetected}, Tool calls: ${memory.performance.toolCallsUsed}`);
      console.log();
    });

    // Summary
    console.log('═'.repeat(80));
    console.log('\n💡 INSIGHTS\n');
    
    if (memories.length < 5) {
      console.log(`  • Run ${5 - memories.length} more analyses to see improvement trends`);
    } else if (avgAccuracy > 0.8) {
      console.log('  • Your agent is performing excellently! 🎉');
    } else if (avgAccuracy > 0.6) {
      console.log('  • Your agent is learning well. Keep going! 📈');
    } else {
      console.log('  • Early stages - the agent needs more experience to improve');
    }
    
    if (learnedPatterns.length > 10) {
      console.log('  • Strong pattern recognition across multiple sponsors ✓');
    } else if (learnedPatterns.length > 5) {
      console.log('  • Building up sponsor knowledge progressively');
    } else {
      console.log('  • Still learning sponsor patterns - run more analyses');
    }
    
    console.log();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    try {
      await client.quit();
    } catch (e) {
      // Ignore quit errors
      client.disconnect();
    }
  }
}

function renderBar(value, width = 20) {
  const filled = Math.round(value * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

main().catch(console.error);

