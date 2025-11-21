// Agent Memory System - Store and retrieve learnings from past analyses
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

export interface SponsorPattern {
  packages: string[];
  apis: string[];
  envVars: string[];
  keywords: string[];
  confidence: number;
  successCount: number;
  failureCount: number;
  lastUpdated: string;
}

export interface DetectionStrategy {
  name: string;
  description: string;
  successRate: number;
  totalUses: number;
  successfulUses: number;
  averageTimeMs: number;
  exampleRepos: string[];
}

export interface AgentMemory {
  id: string;
  timestamp: string;
  analysisId: string;
  
  // What the agent learned
  learnings: {
    sponsorPatterns: Record<string, SponsorPattern>;
    
    detectionStrategies: DetectionStrategy[];
    
    commonMistakes: {
      mistake: string;
      correction: string;
      occurrences: number;
    }[];
    
    newDiscoveries: string[];
  };
  
  // Performance metrics
  performance: {
    accuracy: number;
    confidence: number;
    toolCallsUsed: number;
    iterationCount: number;
    timeMs: number;
    sponsorsDetected: number;
    sponsorsMissed: number;
  };
}

export interface LearningsSummary {
  totalAnalyses: number;
  averageAccuracy: number;
  averageConfidence: number;
  totalPatternsLearned: number;
  topPatterns: Array<{
    sponsor: string;
    pattern: string;
    confidence: number;
  }>;
  improvementRate: number;
}

class AgentMemorySystem {
  private client: RedisClientType | null = null;
  private connected: boolean = false;

  constructor() {
    // Will be initialized lazily
  }

  /**
   * Initialize Redis connection
   */
  private async ensureConnected(): Promise<void> {
    if (this.connected && this.client) return;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Memory Client Error:', err);
        this.connected = false;
      });

      await this.client.connect();
      this.connected = true;
      console.log('✓ Agent Memory System connected to Redis');
    } catch (error) {
      console.error('Failed to connect Agent Memory System:', error);
      this.connected = false;
      this.client = null;
    }
  }

  /**
   * Store a new learning from an analysis
   */
  async storeLearning(memory: AgentMemory): Promise<void> {
    await this.ensureConnected();
    if (!this.client) return;

    try {
      const key = `agent:memory:${memory.id}`;
      await this.client.set(key, JSON.stringify(memory));
      
      // Add to sorted set for chronological retrieval
      await this.client.zAdd('agent:memories:timeline', {
        score: Date.now(),
        value: memory.id
      });
      
      // Update aggregate patterns
      await this.updateAggregatePatterns(memory);
      
      console.log(`✓ Stored learning: ${memory.id}`);
    } catch (error) {
      console.error('Error storing learning:', error);
    }
  }

  /**
   * Update aggregate patterns with new learnings
   */
  private async updateAggregatePatterns(memory: AgentMemory): Promise<void> {
    if (!this.client) return;

    try {
      for (const [sponsor, pattern] of Object.entries(memory.learnings.sponsorPatterns)) {
        const aggregateKey = `agent:patterns:${sponsor}`;
        
        // Get existing aggregate
        const existingData = await this.client.get(aggregateKey);
        const existing: SponsorPattern = existingData 
          ? JSON.parse(existingData)
          : {
              packages: [],
              apis: [],
              envVars: [],
              keywords: [],
              confidence: 0,
              successCount: 0,
              failureCount: 0,
              lastUpdated: new Date().toISOString()
            };

        // Merge patterns
        const merged: SponsorPattern = {
          packages: [...new Set([...existing.packages, ...pattern.packages])],
          apis: [...new Set([...existing.apis, ...pattern.apis])],
          envVars: [...new Set([...existing.envVars, ...pattern.envVars])],
          keywords: [...new Set([...existing.keywords, ...pattern.keywords])],
          confidence: (existing.confidence * existing.successCount + pattern.confidence) / 
                      (existing.successCount + 1),
          successCount: existing.successCount + pattern.successCount,
          failureCount: existing.failureCount + pattern.failureCount,
          lastUpdated: new Date().toISOString()
        };

        await this.client.set(aggregateKey, JSON.stringify(merged));
      }
    } catch (error) {
      console.error('Error updating aggregate patterns:', error);
    }
  }

  /**
   * Recall relevant learnings for a sponsor
   */
  async recallSponsorPatterns(sponsor: string): Promise<SponsorPattern | null> {
    await this.ensureConnected();
    if (!this.client) return null;

    try {
      const key = `agent:patterns:${sponsor}`;
      const data = await this.client.get(key);
      
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error recalling patterns for ${sponsor}:`, error);
      return null;
    }
  }

  /**
   * Get recent memories (last N analyses)
   */
  async getRecentMemories(count: number = 5): Promise<AgentMemory[]> {
    await this.ensureConnected();
    if (!this.client) return [];

    try {
      // Get most recent memory IDs
      const memoryIds = await this.client.zRange('agent:memories:timeline', -count, -1);
      
      const memories: AgentMemory[] = [];
      for (const id of memoryIds) {
        const key = `agent:memory:${id}`;
        const data = await this.client.get(key);
        if (data) {
          memories.push(JSON.parse(data));
        }
      }
      
      return memories.reverse(); // Most recent first
    } catch (error) {
      console.error('Error getting recent memories:', error);
      return [];
    }
  }

  /**
   * Get all learned patterns for all sponsors
   */
  async getAllPatterns(): Promise<Record<string, SponsorPattern>> {
    await this.ensureConnected();
    if (!this.client) return {};

    try {
      const sponsors = [
        'aws', 'skyflow', 'postman', 'redis', 'forethought', 'finsterAI',
        'senso', 'anthropic', 'sanity', 'trmLabs', 'coder', 'lightpanda',
        'lightningAI', 'parallel', 'cleric'
      ];

      const patterns: Record<string, SponsorPattern> = {};
      
      for (const sponsor of sponsors) {
        const pattern = await this.recallSponsorPatterns(sponsor);
        if (pattern && pattern.confidence > 0.3) {
          patterns[sponsor] = pattern;
        }
      }

      return patterns;
    } catch (error) {
      console.error('Error getting all patterns:', error);
      return {};
    }
  }

  /**
   * Update pattern confidence based on success/failure
   */
  async updatePatternConfidence(
    sponsor: string,
    pattern: string,
    success: boolean
  ): Promise<void> {
    await this.ensureConnected();
    if (!this.client) return;

    try {
      const existing = await this.recallSponsorPatterns(sponsor);
      if (!existing) return;

      // Update confidence based on success/failure
      const confidenceAdjustment = success ? 0.05 : -0.03;
      existing.confidence = Math.max(0, Math.min(1, existing.confidence + confidenceAdjustment));
      
      if (success) {
        existing.successCount++;
      } else {
        existing.failureCount++;
      }
      
      existing.lastUpdated = new Date().toISOString();

      const key = `agent:patterns:${sponsor}`;
      await this.client.set(key, JSON.stringify(existing));
      
      console.log(`Updated ${sponsor} pattern confidence: ${existing.confidence.toFixed(2)}`);
    } catch (error) {
      console.error('Error updating pattern confidence:', error);
    }
  }

  /**
   * Get learning summary and improvement metrics
   */
  async getLearningsSummary(): Promise<LearningsSummary> {
    await this.ensureConnected();
    
    const defaultSummary: LearningsSummary = {
      totalAnalyses: 0,
      averageAccuracy: 0,
      averageConfidence: 0,
      totalPatternsLearned: 0,
      topPatterns: [],
      improvementRate: 0
    };

    if (!this.client) return defaultSummary;

    try {
      const memories = await this.getRecentMemories(100);
      
      if (memories.length === 0) return defaultSummary;

      const totalAccuracy = memories.reduce((sum, m) => sum + m.performance.accuracy, 0);
      const totalConfidence = memories.reduce((sum, m) => sum + m.performance.confidence, 0);
      
      const allPatterns = await this.getAllPatterns();
      const topPatterns = Object.entries(allPatterns)
        .flatMap(([sponsor, pattern]) => 
          pattern.packages.map(pkg => ({
            sponsor,
            pattern: pkg,
            confidence: pattern.confidence
          }))
        )
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);

      // Calculate improvement rate (first 5 vs last 5 analyses)
      let improvementRate = 0;
      if (memories.length >= 10) {
        const first5 = memories.slice(-5);
        const last5 = memories.slice(0, 5);
        const avgFirst = first5.reduce((sum, m) => sum + m.performance.accuracy, 0) / 5;
        const avgLast = last5.reduce((sum, m) => sum + m.performance.accuracy, 0) / 5;
        improvementRate = ((avgLast - avgFirst) / avgFirst) * 100;
      }

      return {
        totalAnalyses: memories.length,
        averageAccuracy: totalAccuracy / memories.length,
        averageConfidence: totalConfidence / memories.length,
        totalPatternsLearned: Object.keys(allPatterns).length,
        topPatterns,
        improvementRate
      };
    } catch (error) {
      console.error('Error getting learnings summary:', error);
      return defaultSummary;
    }
  }

  /**
   * Store detection strategy performance
   */
  async recordStrategyPerformance(
    strategyName: string,
    success: boolean,
    timeMs: number,
    repoUrl: string
  ): Promise<void> {
    await this.ensureConnected();
    if (!this.client) return;

    try {
      const key = `agent:strategy:${strategyName}`;
      const existingData = await this.client.get(key);
      
      const strategy: DetectionStrategy = existingData
        ? JSON.parse(existingData)
        : {
            name: strategyName,
            description: '',
            successRate: 0,
            totalUses: 0,
            successfulUses: 0,
            averageTimeMs: 0,
            exampleRepos: []
          };

      strategy.totalUses++;
      if (success) strategy.successfulUses++;
      strategy.successRate = strategy.successfulUses / strategy.totalUses;
      strategy.averageTimeMs = (strategy.averageTimeMs * (strategy.totalUses - 1) + timeMs) / strategy.totalUses;
      
      if (success && !strategy.exampleRepos.includes(repoUrl)) {
        strategy.exampleRepos.push(repoUrl);
        strategy.exampleRepos = strategy.exampleRepos.slice(-5); // Keep last 5
      }

      await this.client.set(key, JSON.stringify(strategy));
    } catch (error) {
      console.error('Error recording strategy performance:', error);
    }
  }

  /**
   * Clear all memories (for testing)
   */
  async clearAllMemories(): Promise<void> {
    await this.ensureConnected();
    if (!this.client) return;

    try {
      const keys = await this.client.keys('agent:*');
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`✓ Cleared ${keys.length} memory entries`);
      }
    } catch (error) {
      console.error('Error clearing memories:', error);
    }
  }
}

// Export singleton instance
export const memorySystem = new AgentMemorySystem();

