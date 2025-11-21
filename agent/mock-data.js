/**
 * Mock data for CryptoGuard Pro project
 * This simulates what an AI agent would generate after analyzing a GitHub repo
 */

export const mockTeamMembers = [
  {
    name: 'Sarah Johnson',
    email: 'sarah@cryptoguard.io',
    githubUsername: 'sarahjdev',
    bio: 'Full-stack developer specializing in blockchain security',
  },
  {
    name: 'Michael Chen',
    email: 'michael@cryptoguard.io',
    githubUsername: 'mchen',
    bio: 'Security researcher and smart contract auditor',
  },
  {
    name: 'Elena Rodriguez',
    email: 'elena@cryptoguard.io',
    githubUsername: 'elenarodriguez',
    bio: 'Frontend engineer with expertise in Web3 UIs',
  },
]

export const mockProject = {
  projectName: 'CryptoGuard Pro',
  slug: {
    _type: 'slug',
    current: 'cryptoguard-pro',
  },
  tagline: 'Enterprise-grade crypto transaction security and compliance monitoring',
  description:
    'CryptoGuard Pro is an advanced security platform that provides real-time monitoring and compliance checking for cryptocurrency transactions. It integrates multiple blockchain intelligence APIs to detect suspicious activities, flag high-risk addresses, and ensure regulatory compliance before transactions are executed.',
  githubUrl: 'https://github.com/cryptoguard/cryptoguard-pro',
  githubData: {
    stars: 127,
    forks: 23,
    language: 'TypeScript',
    lastCommit: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  analysisData: {
    aiSummaryForJudges:
      'CryptoGuard Pro demonstrates exceptional integration of multiple sponsor technologies to create a production-ready security platform. The project uses TRM Labs for blockchain intelligence, Redis for high-performance caching of risk assessments, and Postman for API testing and documentation. The architecture is well-designed with proper separation of concerns, comprehensive error handling, and scalable infrastructure. The team has built sophisticated features including real-time transaction monitoring, compliance dashboards, and automated alert systems. This project shows deep technical competence and practical understanding of enterprise security requirements.',
    latestAnalysisAt: new Date().toISOString(),
    tags: ['security', 'blockchain', 'trm', 'redis', 'postman', 'compliance', 'fintech'],
  },
  sponsorIntegrations: [
    {
      _type: 'sponsorIntegration',
      sponsorSlug: 'trm',
      sponsorName: 'TRM Labs',
      aiSummary:
        'CryptoGuard Pro leverages TRM Labs as its core blockchain intelligence engine. The integration is sophisticated and goes beyond basic API calls. The system queries TRM for real-time risk scores on wallet addresses, transaction patterns, and entity relationships. It implements custom risk aggregation algorithms that combine TRM data with internal heuristics to provide nuanced security assessments. The team has built a caching layer to optimize API usage while maintaining data freshness for critical checks. TRM data feeds directly into the compliance dashboard, alerting system, and transaction blocking mechanisms.',
      integrationDepth: 'core',
      toolsUsed: [
        'TRM Risk API',
        'TRM Screening API',
        'TRM Address Intelligence',
        'TRM Entity Resolution API',
      ],
      technicalScore: 9.2,
      creativityScore: 8.7,
      codeEvidence: [
        'src/services/trm-client.ts: Comprehensive TRM API wrapper with retry logic',
        'src/features/risk-assessment/trm-analyzer.ts: Custom risk scoring algorithms',
        'src/hooks/useTRMRealtime.ts: WebSocket integration for live updates',
        'tests/trm-integration.test.ts: 95% test coverage for TRM features',
      ],
      userFacingFeatures: [
        'Real-time wallet risk scoring with visual indicators',
        'Interactive compliance dashboard showing TRM risk metrics',
        'Transaction approval workflow with TRM-based blocking',
        'Historical risk trend analysis and reporting',
        'Automated alert system for high-risk transactions',
      ],
    },
    {
      _type: 'sponsorIntegration',
      sponsorSlug: 'redis',
      sponsorName: 'Redis',
      aiSummary:
        'Redis serves as the critical performance layer in CryptoGuard Pro. The team has implemented a sophisticated caching strategy that dramatically reduces API latency and costs. Risk assessments from TRM are cached with intelligent TTL values based on risk levels - high-risk addresses have shorter cache times for fresher data, while low-risk addresses cache longer. The system uses Redis pub/sub for real-time notifications across distributed instances. Additionally, Redis Streams are used for queuing and processing high volumes of transaction checks. The implementation shows deep understanding of Redis capabilities and best practices.',
      integrationDepth: 'core',
      toolsUsed: ['Redis Cache', 'Redis Pub/Sub', 'Redis Streams', 'Redis Cluster'],
      technicalScore: 8.8,
      creativityScore: 7.9,
      codeEvidence: [
        'src/lib/redis-client.ts: Connection pooling and cluster configuration',
        'src/middleware/cache.ts: Smart TTL strategy based on risk levels',
        'src/services/notification-service.ts: Pub/Sub implementation for alerts',
        'src/queue/transaction-processor.ts: Redis Streams for job queuing',
      ],
      userFacingFeatures: [
        'Sub-100ms response times for cached risk checks',
        'Real-time notification delivery across multiple devices',
        'High-throughput transaction processing (1000+ TPS)',
        'Seamless experience during high traffic periods',
      ],
    },
    {
      _type: 'sponsorIntegration',
      sponsorSlug: 'postman',
      sponsorName: 'Postman',
      aiSummary:
        'Postman is used extensively for API development, testing, and documentation in CryptoGuard Pro. The team has created comprehensive Postman Collections for all internal and external APIs, with automated tests that run on every deployment. Mock servers built in Postman enabled parallel frontend and backend development. The API documentation generated from Postman Collections serves as the single source of truth for the development team and external integrators. Newman (Postman CLI) is integrated into the CI/CD pipeline, running 500+ API tests on every commit.',
      integrationDepth: 'significant',
      toolsUsed: [
        'Postman Collections',
        'Newman CLI',
        'Postman Mock Servers',
        'Postman Monitors',
        'Postman API Documentation',
      ],
      technicalScore: 8.3,
      creativityScore: 7.2,
      codeEvidence: [
        'postman/collections/: 15+ comprehensive API collections',
        '.github/workflows/api-tests.yml: Newman integration in CI/CD',
        'postman/environments/: Production, staging, and dev environments',
        'docs/api/: Auto-generated API documentation from Postman',
      ],
      userFacingFeatures: [
        'Well-documented public API for third-party integrations',
        'Reliable API with 99.9% uptime (monitored via Postman)',
        'Consistent API contract across all environments',
      ],
    },
  ],
  submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  status: 'analyzed',
}

export const mockJudgeNotes = [
  {
    judgeName: 'Alex Martinez (Head Judge)',
    judgeRole: 'head',
    comment:
      'CryptoGuard Pro is one of the most technically impressive projects in this hackathon. The integration depth across multiple sponsor tools is exceptional, and the final product feels production-ready. The security architecture is sound, and the team has clearly thought through edge cases and failure scenarios. This is exactly the kind of project that could scale into a real business.',
    scoreOverride: 9.5,
    isPublic: true,
    highlightedFor: 'best-overall',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    judgeName: 'Jessica Kim (TRM Labs Judge)',
    judgeRole: 'sponsor',
    sponsorAffiliation: 'TRM Labs',
    comment:
      'Outstanding use of TRM Labs APIs. The team has gone far beyond basic integration to build custom risk analysis algorithms that genuinely add value. The caching strategy is smart and shows understanding of API costs and performance. The compliance dashboard is intuitive and would be useful in a real enterprise setting. Strong contender for Best Use of TRM.',
    scoreOverride: 9.3,
    isPublic: true,
    highlightedFor: 'best-use-of-trm',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
  },
  {
    judgeName: 'David Park (Technical Judge)',
    judgeRole: 'technical',
    comment:
      'The code quality is excellent. Clean architecture, comprehensive tests, good documentation. The Redis implementation is particularly impressive - the team clearly understands caching strategies and has implemented them thoughtfully. API testing with Postman is thorough. My only minor critique is that the frontend could use a bit more polish in terms of animations and micro-interactions.',
    scoreOverride: 8.9,
    isPublic: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  },
]

