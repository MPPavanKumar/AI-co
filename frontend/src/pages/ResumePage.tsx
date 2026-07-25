import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, CheckCircle, XCircle, Lightbulb,
  TrendingUp, AlertTriangle, Target, Clock, ChevronDown,
  ChevronUp, Sparkles, RefreshCw, Star, Trash2, Edit2, Check, X,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  useUploadResume,
  useResumeAnalyses,
  useResumeById,
  useRenameResume,
  useSetActiveResume,
  useDeleteResumeAnalysis,
} from '../hooks/useResume'
import type { ResumeAnalysis, ResumeListItem } from '../types/resume'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

// ── ATS Score Ring ────────────────────────────────────────────────────────────
function ATSScoreRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label =
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e1e3f" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">ATS Score</p>
        <p className="text-xs mt-0.5 font-medium" style={{ color }}>{label}</p>
      </div>
    </div>
  )
}

// ── Skill Chip ────────────────────────────────────────────────────────────────
function SkillChip({ label, variant }: { label: string; variant: 'found' | 'missing' }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all',
      variant === 'found'
        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
        : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'
    )}>
      {variant === 'found' ? '✓' : '✗'} {label}
    </span>
  )
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUpload, isUploading }: { onUpload: (f: File) => void; isUploading: boolean }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDropAccepted: (files) => onUpload(files[0]),
    onDropRejected: () => {
      import('react-hot-toast').then(({ default: toast }) =>
        toast.error('Please upload a PDF under 5 MB.')
      )
    },
    disabled: isUploading,
  })

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300',
        isDragActive
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
          : 'border-[#1e1e3f] hover:border-indigo-500/50 hover:bg-indigo-500/5',
        isUploading && 'opacity-60 cursor-not-allowed pointer-events-none'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2.5">
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
          isDragActive ? 'bg-indigo-500/20 scale-110' : 'bg-[#0f0f20]'
        )}>
          {isUploading
            ? <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            : <Upload className={clsx('w-6 h-6 transition-colors', isDragActive ? 'text-indigo-400' : 'text-gray-500')} />
          }
        </div>

        {isUploading ? (
          <div className="space-y-1">
            <p className="text-white font-semibold text-xs">Analyzing resume with OpenRouter AI...</p>
            <div className="w-36 h-1 bg-[#1e1e3f] rounded-full overflow-hidden mx-auto mt-2">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-white font-semibold text-xs">
              {isDragActive ? 'Drop file here!' : 'Upload New Resume PDF'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">PDF only · Max 5 MB</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── History / Management Item ──────────────────────────────────────────────────
function HistoryItem({
  item,
  isSelected,
  onClick,
  onSetActive,
  onRename,
  onDelete,
}: {
  item: ResumeListItem
  isSelected: boolean
  onClick: () => void
  onSetActive: () => void
  onRename: (newName: string) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [renameText, setRenameText] = useState(item.display_name || item.filename)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleSaveRename = (e: React.FormEvent) => {
    e.stopPropagation()
    if (renameText.trim()) {
      onRename(renameText.trim())
    }
    setIsEditing(false)
  }

  const scoreColor = (s: number | null) => {
    if (!s) return 'text-gray-500'
    if (s >= 80) return 'text-emerald-400'
    if (s >= 60) return 'text-indigo-400'
    if (s >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'w-full p-3.5 rounded-xl border transition-all duration-200 space-y-2',
        isSelected
          ? 'bg-indigo-500/15 border-indigo-500/40'
          : 'bg-[#0f0f20]/60 hover:bg-[#0f0f20] border-[#1e1e3f]'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-[#1e1e3f] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <form onSubmit={handleSaveRename} className="flex items-center gap-1">
                <input
                  type="text"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-dark-card border border-indigo-500/60 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-full"
                  autoFocus
                />
                <button
                  type="submit"
                  onClick={handleSaveRename}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(false)
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-white truncate">
                  {item.display_name || item.filename}
                </p>

                {item.is_active && (
                  <Badge variant="success" size="sm">
                    ⭐ Active
                  </Badge>
                )}
              </div>
            )}

            <p className="text-[10px] text-slate-400 mt-0.5">
              Uploaded: {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={clsx('text-sm font-extrabold', scoreColor(item.ats_score))}>
            {item.ats_score ?? '—'}
          </span>
        </div>
      </div>

      {/* Action buttons bar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1e1e3f]/60 text-[11px]">
        {!item.is_active ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSetActive()
            }}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> Set Active
          </button>
        ) : (
          <span className="text-emerald-400 font-medium text-[10px]">Active for AI Modules</span>
        )}

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="text-slate-400 hover:text-white flex items-center gap-1"
              title="Rename Resume"
            >
              <Edit2 className="w-3 h-3" /> Rename
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowConfirmDelete(true)
            }}
            className="text-slate-400 hover:text-red-400 flex items-center gap-1"
            title="Delete Resume"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>

      {/* Confirmation Dialog Overlay */}
      {showConfirmDelete && (
        <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/40 space-y-2 mt-2">
          <p className="text-[11px] font-semibold text-red-200">Delete this resume?</p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirmDelete(false)
              }}
              className="px-2 py-0.5 rounded bg-dark-card text-slate-300 text-[10px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirmDelete(false)
                onDelete()
              }}
              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Analysis Results ──────────────────────────────────────────────────────────
function AnalysisResults({ analysis }: { analysis: ResumeAnalysis }) {
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  const stats = [
    { label: 'Skills Found', value: analysis.skills_detected.length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Missing Keywords', value: analysis.missing_keywords.length, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'AI Suggestions', value: analysis.suggestions.length, icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score ring */}
        <div className="glass-card p-6 flex items-center justify-center">
          <ATSScoreRing score={analysis.ats_score ?? 0} />
        </div>

        {/* Quick stats */}
        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass-card p-4">
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                <s.icon className={clsx('w-4 h-4', s.color)} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* File info strip */}
      <div className="glass-card px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-sm text-white font-medium truncate">
            {analysis.display_name || analysis.filename}
          </span>
          {analysis.is_active && <Badge variant="success">Active Resume</Badge>}
        </div>
        {analysis.file_size && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            {(analysis.file_size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {/* Skills detected */}
      {analysis.skills_detected.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white text-sm">Skills Detected</h3>
            <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
              {analysis.skills_detected.length} found
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.skills_detected.map((skill) => (
              <SkillChip key={skill} label={skill} variant="found" />
            ))}
          </div>
        </div>
      )}

      {/* Missing keywords */}
      {analysis.missing_keywords.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="font-semibold text-white text-sm">Missing Keywords</h3>
            <span className="ml-auto text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
              {analysis.missing_keywords.length} missing
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_keywords.map((kw) => (
              <SkillChip key={kw} label={kw} variant="missing" />
            ))}
          </div>
        </div>
      )}

      {/* Strengths + Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white text-sm">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0 font-bold">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="font-semibold text-white text-sm">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {analysis.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-red-400 mt-0.5 flex-shrink-0 font-bold">!</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-semibold text-white text-sm">AI Suggestions</h3>
            <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
              {analysis.suggestions.length} tips
            </span>
          </div>
          <ol className="space-y-3">
            {(showAllSuggestions ? analysis.suggestions : analysis.suggestions.slice(0, 4)).map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
              </li>
            ))}
          </ol>
          {analysis.suggestions.length > 4 && (
            <button
              onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              className="mt-4 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAllSuggestions
                ? <><ChevronUp className="w-4 h-4" /> Show less</>
                : <><ChevronDown className="w-4 h-4" /> Show {analysis.suggestions.length - 4} more</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card h-44 rounded-2xl bg-[#1e1e3f]/40" />
        <div className="col-span-3 grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card h-28 rounded-2xl bg-[#1e1e3f]/40" />
          ))}
        </div>
      </div>
      <div className="glass-card h-32 rounded-2xl bg-[#1e1e3f]/40" />
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card h-40 rounded-2xl bg-[#1e1e3f]/40" />
        <div className="glass-card h-40 rounded-2xl bg-[#1e1e3f]/40" />
      </div>
      <div className="glass-card h-48 rounded-2xl bg-[#1e1e3f]/40" />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResumePage() {
  const { mutate: uploadResume, isPending: isUploading, data: uploadResult } = useUploadResume()
  const { data: analyses } = useResumeAnalyses()
  const renameMutation = useRenameResume()
  const setActiveMutation = useSetActiveResume()
  const deleteAnalysisMutation = useDeleteResumeAnalysis()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: selectedAnalysis } = useResumeById(selectedId)

  const activeResume = analyses?.find((r) => r.is_active)
  const displayAnalysis = selectedAnalysis ?? uploadResult?.analysis ?? (activeResume ? null : null)

  const handleUpload = useCallback(
    (file: File) => {
      setSelectedId(null)
      uploadResume(file)
    },
    [uploadResume]
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">AI Powered</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Resume Management & Analyzer</h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload multiple resumes, set an active resume for AI placement modules, rename entries, and review ATS scores.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Upload + History / Resume Management List */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-card p-4">
            <UploadZone onUpload={handleUpload} isUploading={isUploading} />
          </div>

          {/* Resume History List */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e1e3f] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">My Resumes</span>
              </div>
              <Badge variant="primary" size="sm">
                {analyses?.length ?? 0} Uploaded
              </Badge>
            </div>

            {!analyses || analyses.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                No resumes uploaded yet. Upload a PDF resume above to get started!
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {analyses.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    isSelected={selectedId === item.id || (!selectedId && Boolean(item.is_active))}
                    onClick={() => setSelectedId(item.id)}
                    onSetActive={() => setActiveMutation.mutate(item.id)}
                    onRename={(newName) => renameMutation.mutate({ id: item.id, display_name: newName })}
                    onDelete={() => {
                      if (selectedId === item.id) setSelectedId(null)
                      deleteAnalysisMutation.mutate(item.id)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Results */}
        <div className="lg:col-span-8">
          {isUploading && <LoadingSkeleton />}

          {!isUploading && displayAnalysis && (
            <AnalysisResults analysis={displayAnalysis} />
          )}

          {!isUploading && !displayAnalysis && (
            <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <Target className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a Resume to View AI Analysis</h3>
              <p className="text-gray-400 text-xs max-w-sm">
                Select any resume from your history list on the left or upload a new PDF resume to view ATS scores, skill gaps, and AI improvement suggestions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
