import { useState } from 'react'
import { Building2, Sparkles, CheckCircle2, AlertCircle, Trash2, ArrowRight, Layers, FileText } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { useJdList, useParseJd, useAnalyzeMatch, useDeleteJd, useMatchHistory } from '../hooks/useJobMatch'
import type { JobMatch } from '../types/job'

export default function JobMatchPage() {
  const [title, setTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [rawText, setRawText] = useState('')
  const [selectedJdId, setSelectedJdId] = useState<string | null>(null)
  const [activeMatch, setActiveMatch] = useState<JobMatch | null>(null)

  const { data: jds, isLoading: loadingJds } = useJdList()
  const { data: matchHistory } = useMatchHistory()
  const parseJdMutation = useParseJd()
  const analyzeMatchMutation = useAnalyzeMatch()
  const deleteJdMutation = useDeleteJd()

  const handleSaveAndMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawText.trim()) return

    try {
      // Step 1: Save JD
      const parsedJd = await parseJdMutation.mutateAsync({
        title: title || 'Software Engineer',
        company_name: companyName || 'Target Company',
        raw_text: rawText,
      })
      setSelectedJdId(parsedJd.id)

      // Step 2: Analyze Match
      const match = await analyzeMatchMutation.mutateAsync({
        jd_id: parsedJd.id,
      })
      setActiveMatch(match)
    } catch {
      // Error handled by mutation toast
    }
  }

  const handleQuickMatch = async (jdId: string) => {
    try {
      setSelectedJdId(jdId)
      const match = await analyzeMatchMutation.mutateAsync({ jd_id: jdId })
      setActiveMatch(match)
    } catch {
      // Toast handles error
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary-400" />
          Job Description Matcher
        </h1>
        <p className="text-slate-400 mt-1">
          Compare your uploaded resume against target Job Descriptions to get live match scores, gap analysis, and tailored tips.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & History */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Target Job Description
            </h2>

            <form onSubmit={handleSaveAndMatch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Job Title"
                  placeholder="e.g. Full Stack Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                  label="Company Name (Optional)"
                  placeholder="e.g. Google, Microsoft"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Job Description Text
                </label>
                <textarea
                  rows={8}
                  className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y"
                  placeholder="Paste the full job description text here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={parseJdMutation.isPending || analyzeMatchMutation.isPending}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Analyze Resume Match
              </Button>
            </form>
          </Card>

          {/* Saved JDs List */}
          <Card padding="md">
            <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-400" />
              Saved Job Descriptions ({jds?.length ?? 0})
            </h3>

            {loadingJds ? (
              <Skeleton className="h-20 w-full" />
            ) : jds?.length === 0 ? (
              <p className="text-xs text-slate-400">No saved job descriptions yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {jds?.map((jd) => (
                  <div
                    key={jd.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      selectedJdId === jd.id
                        ? 'border-primary-500/80 bg-primary-500/10'
                        : 'border-dark-border bg-dark-surface/50 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{jd.title}</p>
                      <p className="text-xs text-slate-400">{jd.company_name ?? 'Target Company'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleQuickMatch(jd.id)}
                        isLoading={analyzeMatchMutation.isPending && selectedJdId === jd.id}
                      >
                        Match <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                      <button
                        type="button"
                        onClick={() => deleteJdMutation.mutate(jd.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-dark-card transition-colors"
                        title="Delete JD"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Match Report */}
        <div className="lg:col-span-5 space-y-6">
          {analyzeMatchMutation.isPending ? (
            <Card padding="lg" className="text-center space-y-4 py-12">
              <Skeleton className="h-28 w-28 rounded-full mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <p className="text-sm text-slate-400">Comparing your skills against Job Description...</p>
            </Card>
          ) : activeMatch ? (
            <Card padding="lg" className="space-y-6">
              {/* Score Gauge Header */}
              <div className="text-center pb-4 border-b border-dark-border">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-primary-500/40 bg-primary-500/10 text-3xl font-extrabold text-white mb-2 shadow-glow-primary">
                  {activeMatch.match_score}%
                </div>
                <h3 className="text-lg font-bold text-white">Job Match Score</h3>
                <p className="text-xs text-slate-400 mt-1">{activeMatch.fit_summary}</p>
              </div>

              {/* Matching Skills */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Matching Skills ({activeMatch.matching_skills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeMatch.matching_skills.map((skill, idx) => (
                    <Badge key={idx} variant="success">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Missing Skills ({activeMatch.missing_skills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeMatch.missing_skills.map((skill, idx) => (
                    <Badge key={idx} variant="danger">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
                  Actionable Recommendations
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeMatch.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary-400">►</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ) : (
            <Card padding="lg" className="text-center py-16 space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-300">No Match Report Generated Yet</h3>
              <p className="text-xs text-slate-400">
                Paste a Job Description on the left and click "Analyze Resume Match" to view complete compatibility insights.
              </p>
            </Card>
          )}

          {/* Recent Match History */}
          {matchHistory && matchHistory.length > 0 && (
            <Card padding="md">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Recent Match History
              </h4>
              <div className="space-y-2">
                {matchHistory.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-dark-card border border-dark-border text-xs"
                  >
                    <span className="text-slate-300">Match Analysis</span>
                    <Badge variant={m.match_score >= 70 ? 'success' : 'warning'}>
                      {m.match_score}% Match
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
