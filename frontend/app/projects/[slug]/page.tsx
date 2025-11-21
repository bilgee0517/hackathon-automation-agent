import {notFound} from 'next/navigation'
import {Suspense} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {sanityFetch} from '@/sanity/lib/live'
import {projectQuery, projectSlugsQuery} from '@/sanity/lib/queries'
import {SponsorIntegrationCard} from '@/app/components/SponsorIntegrationCard'
import {JudgeNoteCard} from '@/app/components/JudgeNoteCard'
import {urlForImage} from '@/sanity/lib/utils'
import type {Metadata} from 'next'

type Props = {
  params: Promise<{slug: string}>
}

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: projectSlugsQuery,
    perspective: 'published',
    stega: false,
  })
  return data || []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const {data: project} = await sanityFetch({
    query: projectQuery,
    params,
    stega: false,
  })

  return {
    title: project?.projectName || 'Project',
    description: project?.tagline || project?.description,
  }
}

export default async function ProjectPage(props: Props) {
  const params = await props.params
  const {data: project} = await sanityFetch({
    query: projectQuery,
    params,
  })

  if (!project?._id) {
    return notFound()
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="mb-3 text-5xl font-bold text-gray-900">{project.projectName}</h1>
              {project.tagline && <p className="mb-4 text-xl text-gray-600">{project.tagline}</p>}

              {/* Status Badge - Only show for winners */}
              {project.status === 'winner' && (
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusColors.winner}`}
                  >
                    {statusLabels.winner}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                🚀 Live Demo
              </a>
            )}
            {project.videoUrl && (
              <a
                href={project.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                🎥 Video
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2">
            {/* Description */}
            {project.description && (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">About</h2>
                <p className="leading-relaxed text-gray-700">{project.description}</p>
              </section>
            )}

            {/* AI Summary */}
            {project.analysisData?.aiSummaryForJudges && (
              <section className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h2 className="mb-3 text-sm font-semibold uppercase text-blue-900">
                  🤖 AI Analysis
                </h2>
                <p className="leading-relaxed text-gray-700">
                  {project.analysisData.aiSummaryForJudges}
                </p>
              </section>
            )}

            {/* Sponsor Integrations */}
            {project.sponsorIntegrations && project.sponsorIntegrations.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-6 text-3xl font-bold text-gray-900">Sponsor Integrations</h2>
                <div className="grid gap-6">
                  {project.sponsorIntegrations.map((integration, i) => (
                    <SponsorIntegrationCard key={i} integration={integration} />
                  ))}
                </div>
              </section>
            )}

            {/* Judge Notes */}
            {project.judgeNotes && project.judgeNotes.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-6 text-3xl font-bold text-gray-900">Judge Feedback</h2>
                <div className="space-y-4">
                  {project.judgeNotes.map((note) => (
                    <JudgeNoteCard key={note._id} note={note} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Screenshots */}
            {project.screenshots && project.screenshots.length > 0 && (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Screenshots</h3>
                <div className="space-y-4">
                  {project.screenshots.map((screenshot, i) => (
                    <div key={i} className="overflow-hidden rounded-lg">
                      <Image
                        src={urlForImage(screenshot)?.width(400).url() || ''}
                        alt={screenshot.alt || `Screenshot ${i + 1}`}
                        width={400}
                        height={300}
                        className="h-auto w-full"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Team */}
            {project.team && project.team.length > 0 && (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Team</h3>
                <div className="space-y-4">
                  {project.team.map((member) => (
                    <div key={member._id} className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                        {member.avatar ? (
                          <Image
                            src={urlForImage(member.avatar)?.width(48).height(48).url() || ''}
                            alt={member.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-600">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{member.name}</div>
                        {member.githubUsername && (
                          <a
                            href={`https://github.com/${member.githubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            @{member.githubUsername}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {project.analysisData?.tags && project.analysisData.tags.length > 0 && (
              <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.analysisData.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* GitHub Data */}
            {project.githubData && (
              <section className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Repository Stats</h3>
                <div className="space-y-2 text-sm">
                  {project.githubData.language && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Language:</span>
                      <span className="font-semibold">{project.githubData.language}</span>
                    </div>
                  )}
                  {project.githubData.stars !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stars:</span>
                      <span className="font-semibold">⭐ {project.githubData.stars}</span>
                    </div>
                  )}
                  {project.githubData.forks !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Forks:</span>
                      <span className="font-semibold">🍴 {project.githubData.forks}</span>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

