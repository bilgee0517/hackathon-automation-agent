'use client'

import {useState, useMemo} from 'react'
import Link from 'next/link'
import {ProjectCard} from '@/app/components/ProjectCard'

type FilterStatus = 'all' | 'winner'

interface DashboardClientProps {
  projects: any[]
}

export function DashboardClient({projects}: DashboardClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all')

  // Filter projects based on selected status
  const filteredProjects = useMemo(() => {
    if (selectedFilter === 'all') {
      return projects
    }
    return projects.filter((project) => project.status === selectedFilter)
  }, [projects, selectedFilter])

  // Count projects by status
  const statusCounts = useMemo(() => {
    return {
      all: projects.length,
      winner: projects.filter((p) => p.status === 'winner').length,
    }
  }, [projects])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Hackathon Projects</h1>
              <p className="mt-2 text-lg text-gray-600">
                {filteredProjects.length} {selectedFilter === 'winner' ? 'winner' : 'project'}
                {filteredProjects.length !== 1 ? 's' : ''} 
                {selectedFilter === 'all' && ` submitted`}
              </p>
            </div>
            <Link
              href="/submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Submit Project
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Status Filter Tabs */}
        <div className="mb-8 flex gap-4 overflow-x-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`whitespace-nowrap rounded-lg px-4 py-2 transition-colors ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Projects ({statusCounts.all})
          </button>
          <button
            onClick={() => setSelectedFilter('winner')}
            className={`whitespace-nowrap rounded-lg px-4 py-2 transition-colors ${
              selectedFilter === 'winner'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏆 Winners ({statusCounts.winner})
          </button>
        </div>

        {/* Projects Grid */}
        {filteredProjects && filteredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : selectedFilter !== 'all' ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto max-w-md">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                No winners yet
              </h2>
              <p className="mb-6 text-gray-600">
                Winners will be announced soon. Check back later!
              </p>
              <button
                onClick={() => setSelectedFilter('all')}
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                View All Projects
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto max-w-md">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">No projects yet</h2>
              <p className="mb-6 text-gray-600">
                Be the first to submit your hackathon project!
              </p>
              <Link
                href="/submit"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Submit Your Project
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

