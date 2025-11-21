import {format} from 'date-fns'

type JudgeNote = {
  _id: string
  judgeName: string
  judgeRole?: string
  sponsorAffiliation?: string
  comment: string
  scoreOverride?: number
  highlightedFor?: string
  createdAt: string
}

const prizeLabels: Record<string, string> = {
  'best-overall': 'Best Overall',
  'best-use-of-trm': 'Best Use of TRM',
  'best-use-of-redis': 'Best Use of Redis',
  'best-use-of-postman': 'Best Use of Postman',
  'best-use-of-skyflow': 'Best Use of Skyflow',
  'best-use-of-sanity': 'Best Use of Sanity',
  'most-creative': 'Most Creative',
  'best-technical': 'Best Technical Implementation',
  'best-design': 'Best Design',
  'best-social-impact': 'Best Social Impact',
  'fan-favorite': 'Fan Favorite',
}

export function JudgeNoteCard({note}: {note: JudgeNote}) {
  const roleColors = {
    head: 'bg-purple-100 text-purple-800',
    technical: 'bg-blue-100 text-blue-800',
    sponsor: 'bg-green-100 text-green-800',
    community: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900">{note.judgeName}</span>
            {note.judgeRole && (
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  roleColors[note.judgeRole as keyof typeof roleColors] ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {note.judgeRole}
              </span>
            )}
          </div>
          {note.sponsorAffiliation && (
            <span className="text-sm text-gray-600">
              Representing: {note.sponsorAffiliation}
            </span>
          )}
        </div>
        {note.scoreOverride !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{note.scoreOverride}/10</div>
          </div>
        )}
      </div>

      <p className="mb-3 text-gray-700">{note.comment}</p>

      {note.highlightedFor && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
          🏆 {prizeLabels[note.highlightedFor] || note.highlightedFor}
        </div>
      )}

      <div className="text-xs text-gray-500">
        {format(new Date(note.createdAt), 'PPP')}
      </div>
    </div>
  )
}

