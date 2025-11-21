'use client'

import {useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      projectName: formData.get('projectName') as string,
      githubUrl: formData.get('githubUrl') as string,
      tagline: formData.get('tagline') as string,
      description: formData.get('description') as string,
      teamEmails: (formData.get('teamEmails') as string)
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
    }

    try {
      // TODO: Implement Sanity document creation via API route
      // For now, just redirect to dashboard
      console.log('Project submission:', data)
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      router.push('/')
    } catch (err) {
      setError('Failed to submit project. Please try again.')
      setLoading(false)
    }
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
          <h1 className="text-4xl font-bold text-gray-900">Submit Your Project</h1>
          <p className="mt-2 text-lg text-gray-600">
            Share your hackathon project and get AI-powered analysis
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="projectName" className="mb-2 block font-semibold text-gray-900">
                Project Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="projectName"
                name="projectName"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="My Awesome Project"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="githubUrl" className="mb-2 block font-semibold text-gray-900">
                GitHub Repository URL <span className="text-red-600">*</span>
              </label>
              <input
                type="url"
                id="githubUrl"
                name="githubUrl"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://github.com/username/repo"
              />
              <p className="mt-1 text-sm text-gray-600">
                We'll analyze your code to understand how you used sponsor tools
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="tagline" className="mb-2 block font-semibold text-gray-900">
                Tagline
              </label>
              <input
                type="text"
                id="tagline"
                name="tagline"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="One-line description of your project"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="mb-2 block font-semibold text-gray-900">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Tell us more about your project..."
              />
            </div>

            <div className="mb-6">
              <label htmlFor="teamEmails" className="mb-2 block font-semibold text-gray-900">
                Team Member Emails
              </label>
              <input
                type="text"
                id="teamEmails"
                name="teamEmails"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="mt-1 text-sm text-gray-600">
                Comma-separated list of team member emails
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Submitting...' : 'Submit Project'}
              </button>
              <Link
                href="/"
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 font-semibold text-blue-900">What happens after submission?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Your project status will be set to "Analyzing"</li>
              <li>• Our AI agent will analyze your repository</li>
              <li>• We'll detect which sponsor tools you used and how</li>
              <li>• You'll get a detailed technical analysis</li>
              <li>• Judges can review and leave feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

