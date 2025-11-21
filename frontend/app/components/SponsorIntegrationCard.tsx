type SponsorIntegration = {
  sponsorSlug: string
  sponsorName?: string
  aiSummary?: string
  integrationDepth?: string
  technicalScore?: number
  creativityScore?: number
  toolsUsed?: string[]
  codeEvidence?: string[]
  userFacingFeatures?: string[]
}

export function SponsorIntegrationCard({integration}: {integration: SponsorIntegration}) {
  const depthColors = {
    core: 'bg-red-100 border-red-300 text-red-800',
    significant: 'bg-orange-100 border-orange-300 text-orange-800',
    moderate: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    minor: 'bg-green-100 border-green-300 text-green-800',
    mentioned: 'bg-gray-100 border-gray-300 text-gray-800',
  }

  const depthEmoji = {
    core: '🔥',
    significant: '⭐',
    moderate: '💡',
    minor: '📌',
    mentioned: '👀',
  }

  const depth = integration.integrationDepth as keyof typeof depthColors

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">
          {integration.sponsorName || integration.sponsorSlug}
        </h3>
        {integration.integrationDepth && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${
              depthColors[depth] || depthColors.mentioned
            }`}
          >
            {depthEmoji[depth]} {integration.integrationDepth}
          </span>
        )}
      </div>

      {/* AI Summary */}
      {integration.aiSummary && (
        <p className="mb-4 leading-relaxed text-gray-700">{integration.aiSummary}</p>
      )}

      {/* Scores */}
      {(integration.technicalScore !== undefined ||
        integration.creativityScore !== undefined) && (
        <div className="mb-4 flex gap-4">
          {integration.technicalScore !== undefined && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {integration.technicalScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Technical</div>
            </div>
          )}
          {integration.creativityScore !== undefined && (
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {integration.creativityScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Creativity</div>
            </div>
          )}
        </div>
      )}

      {/* Tools Used */}
      {integration.toolsUsed && integration.toolsUsed.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-semibold text-gray-700">Tools Used:</div>
          <div className="flex flex-wrap gap-2">
            {integration.toolsUsed.map((tool: string, i: number) => (
              <span
                key={i}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* User-Facing Features */}
      {integration.userFacingFeatures && integration.userFacingFeatures.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-semibold text-gray-700">User-Facing Features:</div>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            {integration.userFacingFeatures.map((feature: string, i: number) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Code Evidence */}
      {integration.codeEvidence && integration.codeEvidence.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold text-gray-700">Code Evidence:</div>
          <div className="space-y-1">
            {integration.codeEvidence.map((evidence: string, i: number) => (
              <div key={i} className="rounded bg-gray-50 p-2 font-mono text-xs text-gray-800">
                {evidence}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

