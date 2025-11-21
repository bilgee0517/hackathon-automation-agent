// Shared TypeScript types for the hackathon analyzer

export interface AnalysisRequest {
  githubUrl: string;
  teamName: string;
  projectName: string;
  branch?: string;
  teamMembers?: string[];
  hackathonId?: string;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  progress?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface RepositoryStats {
  mainLanguage: string;
  totalFiles: number;
  hasTests: boolean;
  testsPassed: boolean | null;
  dependencies: string[];
}

export interface EndpointTestResult {
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
  body?: string;
}

export interface ExecutionResults {
  tested: boolean;
  cloudEnvironment?: string;
  studioId?: string;
  installSuccess?: boolean;
  installLogs?: string;
  testsRun?: number;
  testsPassed?: number;
  testsFailed?: number;
  testLogs?: string;
  appStarted?: boolean;
  appUrl?: string;
  appLogs?: string;
  endpointsTested?: EndpointTestResult[];
  performanceMetrics?: {
    avgResponseTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  screenshots?: string[];
  verificationNotes?: string;
}

export interface SponsorAnalysis {
  detected: boolean;
  integrationScore: number; // 0-10
  technicalSummary: string;
  plainEnglishSummary: string;
  evidence: {
    files: string[];
    codeSnippets: string[];
    keyFindings: string[];
  };
  prizeEligible: boolean;
  confidence: number; // 0-1
  suggestions: string[];
  executionResults?: ExecutionResults; // NEW: Results from Lightning AI execution
}

export type SponsorName = 
  | 'aws'
  | 'skyflow'
  | 'postman'
  | 'redis'
  | 'forethought'
  | 'finsterAI'
  | 'senso'
  | 'anthropic'
  | 'sanity'
  | 'trmLabs'
  | 'coder'
  | 'lightpanda'
  | 'lightningAI'
  | 'parallel'
  | 'cleric';

export interface AnalysisResult {
  teamId: string;
  teamName: string;
  projectName: string;
  githubUrl: string;
  analyzedAt: string;
  repositoryStats: RepositoryStats;
  sponsors: Record<SponsorName, SponsorAnalysis>;
  overallSummary: string;
  innovativeAspects: string[];
  executionSummary?: {
    enabled: boolean;
    success: boolean;
    cloudPlatform?: string;
    duration?: number;
    error?: string;
  };
}

export interface QueueJob {
  jobId: string;
  githubUrl: string;
  teamName: string;
  projectName: string;
  branch?: string;
  teamMembers?: string[];
  hackathonId?: string;
}

