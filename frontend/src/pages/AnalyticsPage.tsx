import { useState } from 'react'
import {
  TrendingUp, Target, FileText, Brain, Compass,
  CheckCircle, AlertTriangle, Lightbulb, Clock, BarChart2,
  ShieldCheck
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAnalyticsSummary } from '../hooks/useAnalytics'
import Badge from '../components/ui/Badge'
import type { ScoreTrendPoint } from '../types/analytics'

// ── Circular Gauge Component ──────────────────────────────────────────────────
function ReadinessGauge({ score, category }: { score: number; category: string }) {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e1e3f" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-white">{score}%</span>
        <span className="text-[11px] font-semibold tracking-wider mt-0.5" style={{ color }}>
          {category}
        </span>
      </div>
    </div>
  )
}

// ── Interactive Trend Visualizer ──────────────────────────────────────────────
function TrendBarChart({ title, points, color }: { title: string; points: ScoreTrendPoint[]; color: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
        <span className="text-[11px] text-slate-400 font-medium">
          {points.length} Data {points.length === 1 ? 'Point' : 'Points'}
        </span>
      </div>

      {points.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-xs text-slate-500 border border-dashed border-[#1e1e3f] rounded-xl">
          No historical data recorded yet
        </div>
      ) : (
        <div className="space-y-2">
          {/* Tooltip display */}
          <div className="h-5 text-right">
            {hoveredIdx !== null ? (
              <span className="text-xs font-semibold text-white animate-fade-in">
                {points[hoveredIdx].label}: <span className="text-indigo-400">{points[hoveredIdx].score}%</span> ({points[hoveredIdx].date})
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Hover bars to view details</span>
            )}
          </div>

          {/* Bar Chart Container */}
          <div className="h-28 flex items-end gap-2 pt-2 border-b border-[#1e1e3f]">
            {points.map((p, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center gap-1 group cursor-pointer h-full justify-end"
              >
                <div
                  className={clsx(
                    'w-full rounded-t-md transition-all duration-300 group-hover:brightness-125',
                    color
                  )}
                  style={{ height: `${Math.max(12, p.score)}%` }}
                />
              </div>
            ))}
          </div>

          {/* Dates row */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>{points[0]?.date}</span>
            {points.length > 1 && <span>{points[points.length - 1]?.date}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Analytics Page Component ─────────────────────────────────────────────
export default function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsSummary()

  if (isLoading || !data) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="glass-card h-48 rounded-2xl bg-[#1e1e3f]/40" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card h-28 rounded-2xl bg-[#1e1e3f]/40" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card h-48 rounded-2xl bg-[#1e1e3f]/40" />
          ))}
        </div>
      </div>
    )
  }

  const kpis = [
    { label: 'Resume ATS', value: data.current_ats !== null ? `${data.current_ats}/100` : '—', icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Job Match Score', value: data.latest_job_match !== null ? `${data.latest_job_match}%` : '—', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Avg Interview Score', value: data.average_interview_score !== null ? `${data.average_interview_score}%` : '—', icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Learning Progress', value: `${data.learning_progress_percentage}%`, icon: Compass, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Skills Mastered', value: data.mastered_skills.length, icon: ShieldCheck, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ]

  const competencies = [
    { name: 'HR & Behavioral', score: data.competency_breakdown.hr, color: 'bg-indigo-500' },
    { name: 'Technical System Design', score: data.competency_breakdown.technical, color: 'bg-violet-500' },
    { name: 'DSA & Algorithms', score: data.competency_breakdown.dsa, color: 'bg-emerald-500' },
    { name: 'Communication Skills', score: data.competency_breakdown.communication, color: 'bg-amber-500' },
    { name: 'Problem Solving', score: data.competency_breakdown.problem_solving, color: 'bg-cyan-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Executive Analytics</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Placement Readiness & Progress Dashboard</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Deterministic readiness evaluation aggregating your Resume, Job Matches, Mock Interviews, and Learning Roadmaps.
        </p>
      </div>

      {/* 1. Placement Readiness Hero Card */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 z-10">
          <ReadinessGauge score={data.overall_readiness_score} category={data.readiness_category} />

          <div className="space-y-3 text-center md:text-left max-w-xl">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Badge variant={data.overall_readiness_score >= 70 ? 'success' : 'primary'} size="sm">
                Category: {data.readiness_category}
              </Badge>
              <span className="text-[11px] text-slate-400 font-mono">Weighted Placement Index</span>
            </div>

            <p className="text-sm md:text-base font-semibold text-slate-200 leading-relaxed">
              {data.motivational_summary}
            </p>

            {/* Weighted Index Pill Legend */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-[10px] font-mono text-slate-400 pt-1">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">Resume (30%)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">Job Match (30%)</span>
              <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">Interview (20%)</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">Roadmap (20%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 5 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className="glass-card p-4 hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-medium truncate">{k.label}</span>
              <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', k.bg)}>
                <k.icon className={clsx('w-3.5 h-3.5', k.color)} />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* 3. Historical Trends Section */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" /> Historical Performance Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TrendBarChart title="Resume ATS Score History" points={data.ats_trend} color="bg-indigo-500" />
          <TrendBarChart title="Company Job Match History" points={data.job_match_trend} color="bg-emerald-500" />
          <TrendBarChart title="Mock Interview Score History" points={data.interview_trend} color="bg-violet-500" />
        </div>
      </div>

      {/* 4. Competency Breakdown & Recommendations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Competency Breakdown Bars */}
        <div className="lg:col-span-6 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e1e3f] pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Interview Competency Breakdown</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{data.total_interviews} Sessions</span>
          </div>

          <div className="space-y-3.5">
            {competencies.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{c.name}</span>
                  <span className="text-indigo-300 font-mono">{c.score}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#1e1e3f] rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-1000', c.color)}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="lg:col-span-6 glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1e1e3f] pb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Targeted Next Steps & Recommendations</h3>
          </div>

          <div className="space-y-2.5">
            {data.recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                All metrics are performing at top levels! Keep maintaining your current interview and coding momentum.
              </p>
            ) : (
              data.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#0f0f20] border border-[#1e1e3f] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{rec.category}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{rec.action}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Skill Intelligence Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Mastered Skills */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e1e3f] pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Top Mastered Candidate Skills</h3>
            </div>
            <Badge variant="success" size="sm">{data.mastered_skills.length} Skills</Badge>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {data.mastered_skills.length === 0 ? (
              <p className="text-xs text-slate-500">Upload a resume to detect verified mastered skills.</p>
            ) : (
              data.mastered_skills.map((item) => (
                <span
                  key={item.skill}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2"
                >
                  <span>{item.skill}</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-200">
                    ×{item.frequency}
                  </span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Skills To Improve */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e1e3f] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Skills to Improve & Target</h3>
            </div>
            <Badge variant="warning" size="sm">{data.skills_to_improve.length} Gaps</Badge>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {data.skills_to_improve.length === 0 ? (
              <p className="text-xs text-slate-500">No critical skill gaps detected.</p>
            ) : (
              data.skills_to_improve.map((item) => (
                <span
                  key={item.skill}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-2"
                >
                  <span>{item.skill}</span>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-200">
                    {item.priority}
                  </span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Placement Activity Timeline */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1e1e3f] pb-3">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Placement Preparation Timeline</h3>
        </div>

        <div className="space-y-3">
          {data.recent_activities.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No recent activity logged.</p>
          ) : (
            data.recent_activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs p-2.5 rounded-xl bg-[#0f0f20]/60 border border-[#1e1e3f]/60">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <p className="font-semibold text-white truncate">{act.title}</p>
                    {act.detail && <p className="text-[11px] text-slate-400 mt-0.5">{act.detail}</p>}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{act.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
