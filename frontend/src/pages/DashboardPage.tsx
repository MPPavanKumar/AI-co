import {
  FileText,
  Building2,
  Brain,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  Compass,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  ListTodo,
  Check,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuthStore } from '../store/authStore'
import { useDashboardSummary } from '../hooks/useDashboard'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: summary, isLoading } = useDashboardSummary()

  const statsCards = [
    {
      label: 'Resume Score',
      value: summary?.resume_score !== null && summary?.resume_score !== undefined ? `${summary.resume_score}%` : '—',
      subtext: summary?.avg_ats_score !== null ? `Avg: ${summary?.avg_ats_score}% (${summary?.total_resumes ?? 0} Total)` : 'No Resumes Yet',
      icon: FileText,
      color: 'text-primary-400',
      bg: 'bg-primary-500/10',
      border: 'border-primary-500/30',
    },
    {
      label: 'Latest Job Match',
      value: summary?.latest_job_match_score !== null && summary?.latest_job_match_score !== undefined ? `${summary.latest_job_match_score}%` : '—',
      subtext: summary?.avg_match_score !== null ? `Avg Match: ${summary?.avg_match_score}%` : 'No Matches Yet',
      icon: Building2,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
    },
    {
      label: 'Interviews Completed',
      value: summary?.interviews_completed ? `${summary.interviews_completed}` : '0',
      subtext: `Avg Score: ${summary?.avg_interview_score ?? '—'}${summary?.avg_interview_score ? '%' : ''}`,
      icon: Brain,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    },
    {
      label: 'Avg Interview Score',
      value: summary?.avg_interview_score !== null && summary?.avg_interview_score !== undefined ? `${summary.avg_interview_score}%` : '—',
      subtext: `Total Sessions: ${summary?.total_interviews ?? 0}`,
      icon: Award,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    {
      label: 'Learning Progress',
      value: summary?.learning_progress_percentage !== undefined ? `${summary.learning_progress_percentage}%` : '0%',
      subtext: summary?.active_roadmap ? summary.active_roadmap.target_role : 'No Active Roadmap',
      icon: Compass,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
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
    {
      title: 'AI Learning Roadmap',
      description: 'Step-by-step 4-week learning curriculum tailored to your missing skills.',
      href: '/roadmap',
      icon: Compass,
      badge: 'Personalized',
      badgeVariant: 'info' as const,
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'resume':
        return <FileText className="w-4 h-4 text-primary-400" />
      case 'job_match':
        return <Building2 className="w-4 h-4 text-violet-400" />
      case 'interview':
        return <Brain className="w-4 h-4 text-emerald-400" />
      case 'roadmap':
        return <Compass className="w-4 h-4 text-cyan-400" />
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />
    }
  }

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'resume':
        return 'primary' as const
      case 'job_match':
        return 'warning' as const
      case 'interview':
        return 'success' as const
      case 'roadmap':
        return 'info' as const
      default:
        return 'neutral' as const
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900/60 via-dark-card to-violet-950/40 border border-primary-500/20 p-6 md:p-8">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-300">
              <Sparkles className="w-3.5 h-3.5" />
              Placement Readiness Engine
            </div>
            {summary?.active_roadmap && (
              <Badge variant="info" size="sm">
                Target Role: {summary.active_roadmap.target_role}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, {user?.full_name ?? user?.email ?? 'Candidate'} 👋
          </h1>
          <p className="text-sm text-slate-300">
            Track your ATS score, company job matches, mock interview performance, and AI learning progress in one unified view.
          </p>
        </div>
      </div>

      {/* 5 Top Metric Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card key={idx} padding="md" hoverable className={`border ${card.border}`}>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                      {card.label}
                    </p>
                    <p className="text-2xl font-black text-white mt-1">{card.value}</p>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{card.subtext}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.bg} flex-shrink-0 ml-2`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* 2-Column Grid: Active Assets & Learning Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Resume & Active Roadmap */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Resume Card */}
          <Card padding="lg" className="space-y-4 border-primary-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                Active Resume Details
              </h3>
              <Link
                to="/resume"
                className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1"
              >
                Manage Resumes <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : summary?.active_resume ? (
              <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{summary.active_resume.filename}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Uploaded {new Date(summary.active_resume.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={summary.active_resume.ats_score && summary.active_resume.ats_score >= 75 ? 'success' : 'warning'}>
                    ATS Score: {summary.active_resume.ats_score ?? 'N/A'}/100
                  </Badge>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>ATS Optimization Level</span>
                    <span>{summary.active_resume.ats_score ?? 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-dark-surface rounded-full overflow-hidden border border-dark-border">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full"
                      style={{ width: `${summary.active_resume.ats_score ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-dark-border rounded-xl space-y-2">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No active resume uploaded yet.</p>
                <Link to="/resume">
                  <Button size="sm" variant="outline" className="mt-2">
                    Upload Resume
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Active Learning Roadmap Widget */}
          <Card padding="lg" className="space-y-4 border-cyan-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                Active Learning Roadmap
              </h3>
              <Link
                to="/roadmap"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                Open Roadmap <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : summary?.active_roadmap ? (
              <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      Target Role
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {summary.active_roadmap.target_role}
                    </h4>
                  </div>
                  <Badge variant="info" className="capitalize">
                    {summary.active_roadmap.status}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Curriculum Completion</span>
                    <span className="font-bold text-emerald-400">
                      {summary.active_roadmap.progress_percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-dark-surface rounded-full overflow-hidden border border-dark-border">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${summary.active_roadmap.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-dark-border rounded-xl space-y-2">
                <Compass className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No active learning roadmap generated.</p>
                <Link to="/roadmap">
                  <Button size="sm" variant="outline" className="mt-2">
                    Generate AI Roadmap
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Upcoming Tasks & Visual Progress Meters */}
        <div className="lg:col-span-6 space-y-6">
          {/* Upcoming Learning Tasks Section */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-violet-400" />
                Upcoming Learning Tasks
              </h3>
              <span className="text-xs text-slate-400">Active Week Objectives</span>
            </div>

            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : summary?.upcoming_learning_tasks && summary.upcoming_learning_tasks.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-violet-300">
                  {summary.upcoming_learning_tasks[0].title}
                </p>
                {summary.upcoming_learning_tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-dark-card border border-dark-border text-xs text-slate-200"
                  >
                    <div
                      className={`p-1 rounded-md flex-shrink-0 mt-0.5 ${
                        task.is_completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-surface text-slate-400'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={task.is_completed ? 'line-through text-slate-400' : 'text-slate-200'}>
                      {task.objective}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No active learning tasks. Generate a learning roadmap to receive weekly objectives.
              </div>
            )}
          </Card>

          {/* Visual Score Meters */}
          <Card padding="lg" className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-dark-border">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Readiness Performance Meters
            </h3>

            <div className="space-y-3">
              {/* ATS Metric Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>ATS Resume Score</span>
                  <span>{summary?.resume_score ?? 0}%</span>
                </div>
                <div className="h-2 w-full bg-dark-surface rounded-full overflow-hidden border border-dark-border">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${summary?.resume_score ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Job Match Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Latest Job Match Score</span>
                  <span>{summary?.latest_job_match_score ?? 0}%</span>
                </div>
                <div className="h-2 w-full bg-dark-surface rounded-full overflow-hidden border border-dark-border">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${summary?.latest_job_match_score ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Interview Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Mock Interview Average</span>
                  <span>{summary?.avg_interview_score ?? 0}%</span>
                </div>
                <div className="h-2 w-full bg-dark-surface rounded-full overflow-hidden border border-dark-border">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${summary?.avg_interview_score ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Roadmap Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Roadmap Completion</span>
                  <span>{summary?.learning_progress_percentage ?? 0}%</span>
                </div>
                <div className="h-2 w-full bg-dark-surface rounded-full overflow-hidden border border-dark-border">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${summary?.learning_progress_percentage ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Preparation Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-400" />
          Career Acceleration Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon
            return (
              <Card key={idx} padding="lg" hoverable className="flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant={action.badgeVariant} size="sm">
                      {action.badge}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-white">{action.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{action.description}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-dark-border">
                  <Link
                    to={action.href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Launch <ArrowRight className="w-3.5 h-3.5" />
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
          Recent Activity Timeline
        </h2>
        <Card padding="md">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !summary?.recent_activity || summary.recent_activity.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No recent activity yet. Upload a resume or generate a learning roadmap to get started!
            </div>
          ) : (
            <div className="space-y-2.5">
              {summary.recent_activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-border text-xs hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-dark-surface border border-dark-border flex-shrink-0">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{item.title}</p>
                      <p className="text-slate-400 text-[11px]">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <Badge variant={getActivityBadgeVariant(item.type)} size="sm" className="capitalize">
                      {item.type.replace('_', ' ')}
                    </Badge>
                    {item.score !== null && item.score !== undefined && (
                      <Badge variant={item.score >= 70 ? 'success' : 'warning'} size="sm">
                        Score: {item.score}%
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
