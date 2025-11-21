import {NextResponse} from 'next/server'
import {client} from '@/sanity/lib/client'
import {token} from '@/sanity/lib/token'

/**
 * Seed API endpoint to populate the database with sample data
 * Visit /api/seed to create sample projects, hackers, and judge notes
 */

export async function GET() {
  if (!token) {
    return NextResponse.json(
      {error: 'Missing SANITY_API_TOKEN. Cannot create documents.'},
      {status: 500},
    )
  }

  const writeClient = client.withConfig({token})

  try {
    // Create sample hackers (team members)
    const hacker1 = await writeClient.create({
      _type: 'hacker',
      name: 'Alice Chen',
      email: 'alice@walletguardian.dev',
      githubUsername: 'alicechen',
    })

    const hacker2 = await writeClient.create({
      _type: 'hacker',
      name: 'Bob Smith',
      email: 'bob@walletguardian.dev',
      githubUsername: 'bobsmith',
    })

    const hacker3 = await writeClient.create({
      _type: 'hacker',
      name: 'Carol Davis',
      email: 'carol@walletguardian.dev',
      githubUsername: 'caroldavis',
    })

    // Create Wallet Guardian project
    const walletGuardianProject = await writeClient.create({
      _type: 'project',
      projectName: 'Wallet Guardian',
      slug: {
        _type: 'slug',
        current: 'wallet-guardian',
      },
      tagline: 'Real-time crypto wallet risk monitoring powered by TRM',
      description:
        'Wallet Guardian is a security tool that monitors cryptocurrency wallet addresses in real-time. It integrates TRM blockchain intelligence to flag risky addresses at signup and before large transfers, helping users avoid interacting with compromised or sanctioned wallets.',
      githubUrl: 'https://github.com/example/wallet-guardian',
      githubData: {
        stars: 42,
        forks: 7,
        language: 'TypeScript',
        lastCommit: new Date().toISOString(),
      },
      team: [
        {_type: 'reference', _ref: hacker1._id},
        {_type: 'reference', _ref: hacker2._id},
        {_type: 'reference', _ref: hacker3._id},
      ],
      analysisData: {
        aiSummaryForJudges:
          "Wallet Guardian is a real-time crypto wallet monitoring tool that uses TRM's blockchain intelligence to flag risky addresses at signup and before large transfers. The app presents risk scores in a simple dashboard that non-technical users can understand and caches results in Redis to keep checks fast and affordable. Technically, the project wires TRM into the main user flows and uses Redis for practical caching, showing a solid, focused use of both sponsors.",
        latestAnalysisAt: new Date().toISOString(),
        tags: ['trm', 'wallet', 'security', 'redis', 'blockchain'],
      },
      sponsorIntegrations: [
        {
          _type: 'sponsorIntegration',
          sponsorSlug: 'trm',
          sponsorName: 'TRM Labs',
          aiSummary:
            "Wallet Guardian integrates TRM directly into the user's journey. On wallet signup and before a high-value transfer, it calls TRM's risk APIs to fetch risk scores and labels, and then uses those results to block or warn the user. The team built a dedicated UI to visualize TRM's risk signals, making them understandable for non-technical users. This is a concrete, user-facing integration rather than a background test script.",
          integrationDepth: 'core',
          toolsUsed: ['TRM Risk API', 'TRM Screening API', 'TRM Address Intelligence'],
          technicalScore: 8.5,
          creativityScore: 7.5,
          codeEvidence: [
            "src/lib/trm-client.ts: import { TRMClient } from '@trmlabs/api'",
            'src/components/WalletRiskDashboard.tsx: displays TRM risk scores',
            'src/api/check-wallet/route.ts: calls TRM.screenAddress()',
            'src/hooks/useTRMRiskCheck.ts: real-time risk checking',
          ],
          userFacingFeatures: [
            'Wallet risk dashboard with visual indicators',
            'Real-time transfer warnings before transactions',
            'Risk score visualization with severity levels',
            'Detailed risk breakdown from TRM data',
          ],
        },
        {
          _type: 'sponsorIntegration',
          sponsorSlug: 'redis',
          sponsorName: 'Redis',
          aiSummary:
            'For Redis, Wallet Guardian implements straightforward but meaningful caching of TRM responses. When the same wallet is checked repeatedly, the app serves risk results from Redis instead of calling TRM every time, reducing latency and API cost. Keys expire after a configured TTL to avoid stale data. This use of Redis clearly supports performance and reliability for the core product flow.',
          integrationDepth: 'significant',
          toolsUsed: ['Redis Cache', 'TTL Management', 'Redis Cloud'],
          technicalScore: 7.0,
          creativityScore: 6.0,
          codeEvidence: [
            'src/lib/redis.ts: Redis client configuration with TTL',
            'src/api/check-wallet/route.ts: caching layer implementation',
            'src/middleware/cache.ts: cache-first strategy',
          ],
          userFacingFeatures: [
            'Fast wallet checks (sub-100ms from cache)',
            'Reduced API costs through intelligent caching',
            'Improved reliability with fallback mechanisms',
          ],
        },
      ],
      submittedAt: new Date().toISOString(),
      status: 'analyzed',
    })

    // Create another sample project - SponsorSync Agent
    const hacker4 = await writeClient.create({
      _type: 'hacker',
      name: 'David Kim',
      email: 'david@sponsorsync.dev',
      githubUsername: 'davidkim',
    })

    const hacker5 = await writeClient.create({
      _type: 'hacker',
      name: 'Emma Wilson',
      email: 'emma@sponsorsync.dev',
      githubUsername: 'emmawilson',
    })

    const sponsorSyncProject = await writeClient.create({
      _type: 'project',
      projectName: 'SponsorSync Agent',
      slug: {
        _type: 'slug',
        current: 'sponsorsync-agent',
      },
      tagline: 'AI agent that analyzes hackathon projects for sponsor tool usage',
      description:
        'A meta-tool that helps hackathon organizers and sponsors understand how their tools are being used. It automatically analyzes GitHub repositories to detect API integrations, generates detailed reports, and provides insights for judging.',
      githubUrl: 'https://github.com/example/sponsorsync-agent',
      githubData: {
        stars: 28,
        forks: 5,
        language: 'Python',
        lastCommit: new Date().toISOString(),
      },
      team: [{_type: 'reference', _ref: hacker4._id}, {_type: 'reference', _ref: hacker5._id}],
      analysisData: {
        aiSummaryForJudges:
          'SponsorSync Agent is a clever meta-application that solves a real problem in hackathons - understanding sponsor tool integration depth. It uses Postman for API testing, Sanity for content management, and Skyflow for handling sensitive data. The project demonstrates sophisticated understanding of multiple APIs and provides genuine value to hackathon organizers.',
        latestAnalysisAt: new Date().toISOString(),
        tags: ['postman', 'sanity', 'skyflow', 'ai', 'meta'],
      },
      sponsorIntegrations: [
        {
          _type: 'sponsorIntegration',
          sponsorSlug: 'postman',
          sponsorName: 'Postman',
          aiSummary:
            'Uses Postman Collections to test and validate API integrations found in project repositories. The agent automatically generates test cases and runs them to verify that APIs are actually functional, not just imported.',
          integrationDepth: 'core',
          toolsUsed: ['Postman API', 'Newman CLI', 'Collection Runner'],
          technicalScore: 8.0,
          creativityScore: 8.5,
        },
        {
          _type: 'sponsorIntegration',
          sponsorSlug: 'sanity',
          sponsorName: 'Sanity',
          aiSummary:
            'Stores all analysis results, project metadata, and generated reports in Sanity CMS. Provides a clean dashboard for organizers to review findings and make judging decisions.',
          integrationDepth: 'significant',
          toolsUsed: ['Sanity Studio', 'GROQ Queries', 'Real-time API'],
          technicalScore: 7.5,
          creativityScore: 7.0,
        },
        {
          _type: 'sponsorIntegration',
          sponsorSlug: 'skyflow',
          sponsorName: 'Skyflow',
          aiSummary:
            'Detects and protects PII found in repositories (like API keys, emails, personal data). Routes sensitive information through Skyflow vault to ensure privacy compliance.',
          integrationDepth: 'moderate',
          toolsUsed: ['Skyflow Data Privacy Vault', 'Tokenization API'],
          technicalScore: 6.5,
          creativityScore: 7.5,
        },
      ],
      submittedAt: new Date().toISOString(),
      status: 'analyzed',
    })

    // Create judge notes for Wallet Guardian
    const judgeNote1 = await writeClient.create({
      _type: 'judgeNote',
      project: {_type: 'reference', _ref: walletGuardianProject._id},
      judgeName: 'Carol (TRM Judge)',
      judgeRole: 'sponsor',
      sponsorAffiliation: 'TRM Labs',
      comment:
        'Solid TRM integration directly in the user flow. Dashboard is simple but clear. Could score higher on autonomy if more checks were automated without user clicks.',
      scoreOverride: 8.2,
      isPublic: true,
      highlightedFor: 'best-use-of-trm',
      createdAt: new Date().toISOString(),
    })

    const judgeNote2 = await writeClient.create({
      _type: 'judgeNote',
      project: {_type: 'reference', _ref: walletGuardianProject._id},
      judgeName: 'David (Technical Judge)',
      judgeRole: 'technical',
      comment:
        'Well-architected application with proper separation of concerns. The Redis caching strategy is smart and the error handling is robust. Would like to see more comprehensive test coverage.',
      scoreOverride: 8.5,
      isPublic: true,
      createdAt: new Date().toISOString(),
    })

    // Create judge notes for SponsorSync
    const judgeNote3 = await writeClient.create({
      _type: 'judgeNote',
      project: {_type: 'reference', _ref: sponsorSyncProject._id},
      judgeName: 'Alice (Head Judge)',
      judgeRole: 'head',
      comment:
        'Super clever meta-idea. This actually helps sponsors and organizers understand their own hackathon. Good depth on Postman and Sanity; would love to see even more Skyflow use in v2.',
      scoreOverride: 9.3,
      isPublic: true,
      createdAt: new Date().toISOString(),
    })

    const judgeNote4 = await writeClient.create({
      _type: 'judgeNote',
      project: {_type: 'reference', _ref: sponsorSyncProject._id},
      judgeName: 'Bob (Skyflow Judge)',
      judgeRole: 'sponsor',
      sponsorAffiliation: 'Skyflow',
      comment:
        'Nice demonstration of detecting PII and routing it through Skyflow. Feels like a strong contender for Best Use of Skyflow, especially because it highlights privacy to other teams.',
      scoreOverride: 9.0,
      isPublic: false,
      highlightedFor: 'best-use-of-skyflow',
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully!',
      data: {
        hackers: [hacker1, hacker2, hacker3, hacker4, hacker5],
        projects: [walletGuardianProject, sponsorSyncProject],
        judgeNotes: [judgeNote1, judgeNote2, judgeNote3, judgeNote4],
      },
    })
  } catch (error) {
    console.error('Error creating sample data:', error)
    return NextResponse.json(
      {
        error: 'Failed to create sample data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500},
    )
  }
}

