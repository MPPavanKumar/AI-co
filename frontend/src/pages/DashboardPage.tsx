import { FileText, Building2, Brain, TrendingUp, ArrowRight, Sparkles, Clock, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useDashboardSummary } from '../hooks/useDashboard'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: summary, isLoading } = useDashboardSummary()

  const statsCards = [
    {
      label: 'Avg ATS Score',
      value: summary?.avg_ats_score !== null && summary?.avg_ats_score !== undefined ? `${summary.avg_ats_score}%` : '—',
      subtext: `Total Resumes: ${summary?.total_resumes ?? 0}`,
      icon: FileText,
      color: 'text-primary-400',
      bg: 'bg-primary-500/10',
    },
    {
      label: 'Avg Job Match',
      value: summary?.avg_match_score !== null && summary?.avg_match_score !== undefined ? `${summary.avg_match_score}%` : '—',
      subtext: `Saved JDs: ${summary?.total_jds ?? 0}`,
      icon: Building2,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Avg Mock Interview',
      value: summary?.avg_interview_score !== null && summary?.avg_interview_score !== undefined ? `${summary.avg_interview_score}%` : '—',
      subtext: `Total Sessions: ${summary?.total_interviews ?? 0}`,
      icon: Brain,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ]

  const quickActions = [
    {
      title: 'Resume Analyzer',
      description: 'Upload your PDF resume to get ATS scores, missing keywords, and layout tips.',
      href: '/resume',
      icon: FileText,
      badge: 'Core Feature',
      badgeVariant: 'primary' as const,
    },
    {
      title: 'Company Job Match',
      description: 'Compare your resume against specific target Job Descriptions to spot skill gaps.',
      href: '/company-match',
      icon: Building2,
      badge: 'High Impact',
      badgeVariant: 'warning' as const,
    },
    {
      title: 'AI Mock Interview',
      description: 'Practice role-specific interview questions with instant evaluation and model answers.',
      href: '/interview',
      icon: Brain,
      badge: 'Interactive',
      badgeVariant: 'success' as const,
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900/60 via-dark-card to-violet-950/40 border border-primary-500/20 p-6 md:p-8">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-300">
            <Sparkles className="w-3.5 h-3.5" />
            AI Placement Preparation Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, {user?.full_name ?? user?.email ?? 'Candidate'} 👋
          </h1>
          <p className="text-sm text-slate-300">
            Upload your resume, match with target job descriptions, and practice AI mock interviews to maximize your placement readiness.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card key={idx} padding="md" hoverable>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="text-3xl font-black text-white mt-1">{card.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{card.subtext}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          Preparation Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, idx) => {
            const Icon = action.icon
            return (
              <Card key={idx} padding="lg" hoverable className="flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant={action.badgeVariant}>{action.badge}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-white">{action.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{action.description}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-dark-border">
                  <Link
                    to={action.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Launch Module <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Unified Recent Activity Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-violet-400" />
          Recent Activity Feed
        </h2>
        <Card padding="md">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !summary?.recent_activity || summary.recent_activity.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No recent activity yet. Upload a resume or match a job description to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {summary.recent_activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-border text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-slate-400 text-[11px]">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    {item.score !== null && (
                      <Badge variant={item.score >= 75 ? 'success' : 'warning'}>
                        Score: {item.score}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
