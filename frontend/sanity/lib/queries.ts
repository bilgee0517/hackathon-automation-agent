import {defineQuery} from 'next-sanity'

/**
 * GROQ queries for the hackathon dashboard
 */

// Get all projects with summary data
export const allProjectsQuery = defineQuery(`
  *[_type == "project"] | order(submittedAt desc) {
    _id,
    projectName,
    "slug": slug.current,
    tagline,
    description,
    githubUrl,
    demoUrl,
    "thumbnail": screenshots[0],
    submittedAt,
    status,
    analysisData {
      aiSummaryForJudges,
      latestAnalysisAt,
      tags
    },
    sponsorIntegrations[] {
      sponsorSlug,
      sponsorName,
      integrationDepth,
      technicalScore,
      creativityScore,
      toolsUsed
    },
    team[]-> {
      _id,
      name,
      githubUsername,
      avatar
    }
  }
`)

// Get single project with full details including judge notes
export const projectQuery = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    projectName,
    tagline,
    description,
    githubUrl,
    demoUrl,
    videoUrl,
    screenshots,
    githubData,
    submittedAt,
    status,
    analysisData {
      aiSummaryForJudges,
      latestAnalysisAt,
      tags
    },
    sponsorIntegrations[] {
      sponsorSlug,
      sponsorName,
      aiSummary,
      integrationDepth,
      technicalScore,
      creativityScore,
      toolsUsed,
      codeEvidence,
      userFacingFeatures
    },
    team[]-> {
      _id,
      name,
      email,
      githubUsername,
      avatar,
      bio
    },
    "judgeNotes": *[_type == "judgeNote" && project._ref == ^._id && isPublic == true] | order(createdAt desc) {
      _id,
      judgeName,
      judgeRole,
      sponsorAffiliation,
      comment,
      scoreOverride,
      highlightedFor,
      createdAt
    }
  }
`)

// Get projects filtered by sponsor
export const projectsBySponsorQuery = defineQuery(`
  *[_type == "project" && $sponsorSlug in sponsorIntegrations[].sponsorSlug] | order(sponsorIntegrations[sponsorSlug == $sponsorSlug][0].technicalScore desc) {
    _id,
    projectName,
    "slug": slug.current,
    tagline,
    "thumbnail": screenshots[0],
    "sponsorIntegration": sponsorIntegrations[sponsorSlug == $sponsorSlug][0] {
      aiSummary,
      integrationDepth,
      technicalScore,
      creativityScore,
      toolsUsed
    },
    team[]-> {
      _id,
      name,
      avatar
    }
  }
`)

// Get all judge notes for a specific project (including private ones - for admin view)
export const allJudgeNotesForProjectQuery = defineQuery(`
  *[_type == "judgeNote" && project._ref == $projectId] | order(createdAt desc) {
    _id,
    judgeName,
    judgeRole,
    sponsorAffiliation,
    comment,
    scoreOverride,
    isPublic,
    highlightedFor,
    createdAt
  }
`)

// Get slugs for static generation
export const projectSlugsQuery = defineQuery(`
  *[_type == "project" && defined(slug.current)]
  {"slug": slug.current}
`)
