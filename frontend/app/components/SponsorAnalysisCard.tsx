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

type Props = {
  sponsorSlug: string
  analysis: SponsorAnalysis
}

export function SponsorAnalysisCard({sponsorSlug, analysis}: Props) {
  const sponsorNames: Record<string, string> = {
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

  const sponsorName = sponsorNames[sponsorSlug] || sponsorSlug

  const scoreColor =
    analysis.integrationScore >= 8
      ? 'bg-green-100 text-green-800 border-green-200'
      : analysis.integrationScore >= 5
        ? 'bg-blue-100 text-blue-800 border-blue-200'
        : 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-xl font-bold text-gray-900">{sponsorName}</h3>
          {analysis.prizeEligible && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
              🏆 Prize Eligible
            </span>
          )}
        </div>
        <div className={`rounded-full border px-4 py-2 text-center ${scoreColor}`}>
          <div className="text-2xl font-bold">{analysis.integrationScore}</div>
          <div className="text-xs">out of 10</div>
        </div>
      </div>

      {/* Plain English Summary */}
      {analysis.plainEnglishSummary && (
        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <p className="text-sm leading-relaxed text-gray-700">{analysis.plainEnglishSummary}</p>
        </div>
      )}

      {/* Technical Summary */}
      {analysis.technicalSummary && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Technical Details</h4>
          <p className="text-sm leading-relaxed text-gray-700">{analysis.technicalSummary}</p>
        </div>
      )}

      {/* Evidence */}
      {analysis.evidence && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Evidence</h4>

          {/* Files */}
          {analysis.evidence.files && analysis.evidence.files.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-gray-600">Files:</div>
              <div className="flex flex-wrap gap-1">
                {analysis.evidence.files.slice(0, 5).map((file, i) => (
                  <code
                    key={i}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                  >
                    {file}
                  </code>
                ))}
                {analysis.evidence.files.length > 5 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{analysis.evidence.files.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Key Findings */}
          {analysis.evidence.keyFindings && analysis.evidence.keyFindings.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-gray-600">Key Findings:</div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-gray-700">
                {analysis.evidence.keyFindings.map((finding, i) => (
                  <li key={i}>{finding}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Code Snippets */}
          {analysis.evidence.codeSnippets && analysis.evidence.codeSnippets.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-gray-600">Code Snippets:</div>
              <div className="space-y-2">
                {analysis.evidence.codeSnippets.slice(0, 2).map((snippet, i) => (
                  <pre
                    key={i}
                    className="overflow-x-auto rounded bg-gray-900 p-2 text-xs text-gray-100"
                  >
                    <code>{snippet}</code>
                  </pre>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-yellow-900">💡 Suggestions</h4>
          <ul className="list-disc space-y-1 pl-5 text-xs text-yellow-800">
            {analysis.suggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence */}
      <div className="mt-4 text-xs text-gray-500">
        AI Confidence: {Math.round(analysis.confidence * 100)}%
      </div>
    </article>
  )
}

