import { useState } from 'react'
import { MessageSquare, Eye, GripVertical } from 'lucide-react'

const COLUMNS = [
  { id: 'Applied', title: 'Applied', color: 'blue', border: 'border-blue-500/20', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  { id: 'Interviewing', title: 'Interviewing', color: 'amber', border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  { id: 'Shortlisted', title: 'Shortlisted', color: 'emerald', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'Hired', title: 'Hired', color: 'purple', border: 'border-purple-500/20', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
  { id: 'Rejected', title: 'Rejected', color: 'red', border: 'border-red-500/20', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' }
]

function getNormalizedStatus(rawStatus) {
  if (!rawStatus) return 'applied'
  const s = String(rawStatus).toLowerCase().trim()
  if (s === 'new' || s === 'applied' || s === 'pending') return 'applied'
  if (s === 'interviewing' || s === 'interview') return 'interviewing'
  if (s === 'shortlisted' || s === 'shortlist') return 'shortlisted'
  if (s === 'hired' || s === 'accepted') return 'hired'
  if (s === 'rejected' || s === 'declined') return 'rejected'
  return 'applied'
}

export default function KanbanBoard({ candidates, onCandidateClick, onStatusChange, onOutreachClick }) {
  const [draggedCandidateId, setDraggedCandidateId] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  const handleDragStart = (e, candidateId) => {
    setDraggedCandidateId(candidateId)
    e.dataTransfer.setData('text/plain', String(candidateId))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId)
    }
  }

  const handleDragLeave = (e, columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (e, columnId) => {
    e.preventDefault()
    setDragOverColumn(null)
    const candidateId = e.dataTransfer.getData('text/plain') || draggedCandidateId
    if (candidateId && onStatusChange) {
      onStatusChange(Number(candidateId), columnId)
    }
    setDraggedCandidateId(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colCandidates = candidates.filter(
          (c) => getNormalizedStatus(c.status) === col.id.toLowerCase()
        )
        const isTarget = dragOverColumn === col.id

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`bg-white dark:bg-zinc-950 border rounded-2xl p-4 flex flex-col min-h-[550px] transition-all ${
              isTarget
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10'
                : 'border-zinc-200 dark:border-zinc-900 shadow-sm'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${col.bg} ${col.text} border ${col.border}`}>
                  {col.title}
                </span>
              </div>
              <span className="text-xs font-extrabold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                {colCandidates.length}
              </span>
            </div>

            {/* Candidate Cards List */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {colCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-xl text-zinc-400 text-xs">
                  <span>No candidates</span>
                </div>
              ) : (
                colCandidates.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    className={`bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing group relative ${
                      draggedCandidateId === c.id ? 'opacity-40 border-dashed' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4
                          onClick={() => onCandidateClick(c)}
                          className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors truncate cursor-pointer"
                        >
                          {c.full_name || 'N/A'}
                        </h4>
                        <p className="text-xs text-blue-500 font-semibold truncate">{c.applied_position || 'N/A'}</p>
                      </div>
                      <GripVertical className="w-4 h-4 text-zinc-400 shrink-0 opacity-40 group-hover:opacity-100" />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] text-zinc-500">
                      {c.applications_count > 1 && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded font-extrabold">
                          {c.applications_count} Submissions
                        </span>
                      )}
                      {c.nationality && (
                        <span className="px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800 rounded font-semibold text-zinc-700 dark:text-zinc-300">
                          {c.nationality}
                        </span>
                      )}
                      {c.experience && (
                        <span className="px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800 rounded font-semibold text-zinc-700 dark:text-zinc-300">
                          {c.experience}
                        </span>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-850 text-xs">
                      <button
                        onClick={() => onCandidateClick(c)}
                        className="flex items-center gap-1 text-zinc-500 hover:text-blue-500 font-semibold text-[11px] transition-colors"
                        title="View candidate drawer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {onOutreachClick && (
                        <button
                          onClick={() => onOutreachClick(c)}
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-[11px] transition-colors"
                          title="Send WhatsApp or Email"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Outreach</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
