import { FileText, Building2, Brain, TrendingUp, Zap, ArrowRight, Sparkles, Target, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useAuthStore } from '../store/authStore'

const statsCards = [
  {
    label: 'ATS Score',
    value: '—',
    description: 'Upload your resume to get your score',
    icon: FileText,
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    badge: 'Not analyzed',
    badgeVariant: 'neutral' as const,
  },
  {
    label: 'Company Match',
    value: '—',
    description: 'Match your profile to a job description',
    icon: Building2,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    badge: 'Not matched',
    badgeVariant: 'neutral' as const,
  },
  {
    label: 'Interviews Done',
    value: '0',
    description: 'Practice makes perfect',
    icon: Brain,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    badge: '0 sessions',
    badgeVariant: 'neutral' as const,
  },
  {
    label: 'Prep Score',
    value: '0%',
    description: 'Overall preparation progress',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    badge: 'Just started',
    badgeVariant: 'neutral' as const,
  },
]

const quickActions = [
  {
    to: '/resume',
    icon: FileText,
    title: 'Analyze Resume',
    description: 'Get ATS score and improvement tips',
    color: 'from-primary-600 to-violet-600',
    glow: 'shadow-glow-primary',
  },
  {
    to: '/company-match',
    icon: Target,
    title: 'Match to JD',
    description: 'See how well you fit a job description',
    color: 'from-violet-600 to-purple-600',
    glow: 'shadow-glow-purple',
  },
  {
    to: '/interview',
    icon: Brain,
    title: 'Practice Interview',
    description: 'Get AI feedback on your answers',
    color: 'from-cyan-600 to-blue-600',
    glow: '',
  },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900/60 via-dark-card to-violet-900/40 border border-primary-500/20 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-400" />
                <span className="text-xs text-primary-400 font-medium uppercase tracking-wider">AI Platform</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-dark-muted text-sm max-w-md">
                Your AI-powered placement preparation hub. Analyze your resume, match with companies,
                and ace your interviews.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <Zap className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300 font-medium">Ready to prep</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.label} padding="sm" hoverable className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center border", stat.bg, stat.color, stat.border)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <Badge variant={stat.badgeVariant}>{stat.badge}</Badge>
            </div>
            <p className="text-dark-muted text-sm font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs text-dark-muted mt-auto">{stat.description}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="group block">
              <Card hoverable className="h-full relative overflow-hidden flex flex-col justify-between">
                <div className={clsx("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-20 blur-2xl rounded-full transition-transform duration-500 group-hover:scale-150", action.color)} />
                <div className="relative z-10 mb-4">
                  <action.icon className={clsx("w-8 h-8 mb-4", action.glow ? "text-primary-400" : "text-cyan-400")} />
                  <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                  <p className="text-sm text-dark-muted">{action.description}</p>
                </div>
                <div className="relative z-10 flex items-center text-sm font-medium text-primary-400 group-hover:text-primary-300 transition-colors mt-4">
                  Get started <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
