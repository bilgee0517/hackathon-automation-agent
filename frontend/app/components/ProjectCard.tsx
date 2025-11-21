import Link from 'next/link'
import Image from 'next/image'
import {urlForImage} from '@/sanity/lib/utils'

type SponsorAnalysis = {
  detected: boolean
  integrationScore: number
  technicalSummary: string
  plainEnglishSummary: string
  evidence: {
    files: string[]
    codeSnippets: string[]
    keyFindings: string[]
  }
  prizeEligible: boolean
  confidence: number
  suggestions: string[]
}

type Project = {
  _id: string
  projectName: string
  slug: string
  tagline?: string
  description?: string
  thumbnail?: any
  status: string
  submittedAt: string
  analyzedAt?: string
  sponsors?: Record<string, SponsorAnalysis>
  team?: Array<{
    _id: string
    name: string
    githubUsername?: string
    avatar?: any
  }>
}

export function ProjectCard({project}: {project: Project}) {
  const {projectName, slug, tagline, status, sponsors, team, thumbnail} = project

  // Extract detected sponsors from the sponsors object
  const detectedSponsors = sponsors
    ? Object.entries(sponsors)
        .filter(([_, data]) => data?.detected)
        .map(([key, data]) => ({
          slug: key,
          name: formatSponsorName(key),
          score: data.integrationScore,
        }))
        .sort((a, b) => (b.score || 0) - (a.score || 0))
    : []

  const statusColors = {
    analyzing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    analyzed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    winner: 'bg-purple-100 text-purple-800 border-purple-200',
  }

  const statusLabels = {
    analyzing: '⏳ Analyzing',
    analyzed: '✅ Analyzed',
    failed: '❌ Failed',
    winner: '🏆 Winner',
  }

  // Helper function to format sponsor names
  function formatSponsorName(slug: string): string {
    const names: Record<string, string> = {
      aws: 'AWS',
      skyflow: 'Skyflow',
      postman: 'Postman',
      redis: 'Redis',
      forethought: 'Forethought',
      finsterAI: 'Finster AI',
      senso: 'Senso',
      anthropic: 'Anthropic',
      sanity: 'Sanity',
      trmLabs: 'TRM Labs',
      coder: 'Coder',
      lightpanda: 'Lightpanda',
      lightningAI: 'Lightning AI',
      parallel: 'Parallel',
      cleric: 'Cleric',
    }
    return names[slug] || slug
  }

  return (
    <article className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
      <Link href={`/projects/${slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {projectName}</span>
      </Link>

      {/* Thumbnail */}
      {thumbnail && (
        <div className="mb-4 aspect-video overflow-hidden rounded-md bg-gray-100">
          <Image
            src={urlForImage(thumbnail)?.width(400).height(225).url() || ''}
            alt={thumbnail.alt || projectName}
            width={400}
            height={225}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}

      {/* Status Badge - Only show for winners */}
      {status === 'winner' && (
        <div className="mb-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
              statusColors.winner
            }`}
          >
            {statusLabels.winner}
          </span>
        </div>
      )}

      {/* Title & Tagline */}
      <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-blue-600">
        {projectName}
      </h3>
      {tagline && <p className="mb-4 text-sm text-gray-600 line-clamp-2">{tagline}</p>}

      {/* Sponsor Tools */}
      {detectedSponsors.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {detectedSponsors.slice(0, 3).map((sponsor, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {sponsor.name}
              {sponsor.score && (
                <span className="ml-1 text-[10px] font-bold">{sponsor.score}/10</span>
              )}
            </div>
          ))}
          {detectedSponsors.length > 3 && (
            <div className="flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              +{detectedSponsors.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* Team */}
      {team && team.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {team.slice(0, 4).map((member) => (
              <div
                key={member._id}
                className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-gray-200"
              >
                {member.avatar ? (
                  <Image
                    src={urlForImage(member.avatar)?.width(32).height(32).url() || ''}
                    alt={member.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-600">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
            {team.length > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-bold text-gray-600">
                +{team.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {team.length} {team.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      )}
    </article>
  )
}

