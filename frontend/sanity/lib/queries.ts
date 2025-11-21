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
    analyzedAt,
    status,
    overallSummary,
    repositoryStats,
    sponsors,
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
    analyzedAt,
    status,
    overallSummary,
    innovativeAspects,
    repositoryStats,
    sponsors,
    team[]-> {
      _id,
      name,
      email,
      githubUsername,
      avatar,
      bio
    },
    judgeNotes[] {
      judgeName,
      judgeRole,
      sponsorAffiliation,
      comment,
      scoreOverride,
      highlightedFor,
      isPublic,
      createdAt
    }
  }
`)

// Get projects filtered by sponsor (using new sponsors object structure)
// To filter by sponsor, check if sponsors.{sponsorName}.detected == true
export const projectsBySponsorQuery = defineQuery(`
  *[_type == "project" && sponsors[$sponsorSlug].detected == true] | order(sponsors[$sponsorSlug].integrationScore desc) {
    _id,
    projectName,
    "slug": slug.current,
    tagline,
    "thumbnail": screenshots[0],
    "sponsorAnalysis": sponsors[$sponsorSlug],
    team[]-> {
      _id,
      name,
      avatar
    }
  }
`)

// Get all judge notes for a specific project (including private ones - for admin view)
// Note: judgeNotes are embedded in the project document, not separate documents
export const allJudgeNotesForProjectQuery = defineQuery(`
  *[_type == "project" && _id == $projectId][0] {
    judgeNotes[] {
      judgeName,
      judgeRole,
      sponsorAffiliation,
      comment,
      scoreOverride,
      isPublic,
      highlightedFor,
      createdAt
    }
  }.judgeNotes
`)

// Get slugs for static generation
export const projectSlugsQuery = defineQuery(`
  *[_type == "project" && defined(slug.current)]
  {"slug": slug.current}
`)
