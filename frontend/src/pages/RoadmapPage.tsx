import { useState } from 'react'
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  Code2,
  ExternalLink,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  PlusCircle,
  Check,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import {
  useUserRoadmaps,
  useGenerateRoadmap,
  useUpdateRoadmapProgress,
  useDeleteRoadmap,
} from '../hooks/useRoadmap'
import { useResumeAnalyses } from '../hooks/useResume'
import { useMatchHistory } from '../hooks/useJobMatch'
import type { RoadmapResponse } from '../types/roadmap'

export default function RoadmapPage() {
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer')
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [selectedJobMatchId, setSelectedJobMatchId] = useState<string>('')

  // Active Roadmap Selection
  const [activeRoadmap, setActiveRoadmap] = useState<RoadmapResponse | null>(null)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1)
  const [expandedResources, setExpandedResources] = useState<boolean>(true)

  // API Hooks
  const { data: roadmaps, isLoading: loadingRoadmaps } = useUserRoadmaps()
  const { data: resumes } = useResumeAnalyses()
  const { data: matches } = useMatchHistory()

  const generateMutation = useGenerateRoadmap()
  const updateProgressMutation = useUpdateRoadmapProgress()
  const deleteMutation = useDeleteRoadmap()

  // Auto select first roadmap if available and none active
  const currentRoadmap = activeRoadmap || (roadmaps && roadmaps.length > 0 ? roadmaps[0] : null)

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newRoadmap = await generateMutation.mutateAsync({
        target_role: targetRole,
        resume_id: selectedResumeId || undefined,
        job_match_id: selectedJobMatchId || undefined,
      })
      setActiveRoadmap(newRoadmap)
      setExpandedWeek(1)
    } catch {
      // Toast handles error
    }
  }

  const handleProgressChange = async (roadmapId: string, newPercentage: number) => {
    try {
      const updated = await updateProgressMutation.mutateAsync({
        id: roadmapId,
        data: { progress_percentage: newPercentage },
      })
      if (activeRoadmap?.id === roadmapId) {
        setActiveRoadmap(updated)
      }
    } catch {
      // Toast handles error
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Compass className="w-8 h-8 text-primary-400" />
          AI Learning Roadmap
        </h1>
        <p className="text-slate-400 mt-1">
          Personalized 4-week step-by-step learning paths tailored to your resume skill gaps & target job roles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Generator & Roadmap History */}
        <div className="lg:col-span-4 space-y-6">
          {/* Generator Setup Form */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Generate New Roadmap
            </h2>

            <form onSubmit={handleGenerateRoadmap} className="space-y-4">
              <Input
                label="Target Job Role"
                placeholder="e.g. Senior Full Stack Engineer, DevOps Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />

              {/* Optional Resume Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Connect Resume (Optional)
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="">-- Select Resume for Skill Analysis --</option>
                  {resumes?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.filename} (ATS: {r.ats_score ?? 'N/A'}/100)
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Job Match Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Connect Company Match (Optional)
                </label>
                <select
                  value={selectedJobMatchId}
                  onChange={(e) => setSelectedJobMatchId(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="">-- Select Company Match for Gap Analysis --</option>
                  {matches?.map((m) => (
                    <option key={m.id} value={m.id}>
                      Match Score: {m.match_score}% (Missing: {m.missing_skills.length} skills)
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={generateMutation.isPending}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Generate 4-Week AI Roadmap
              </Button>
            </form>
          </Card>

          {/* Past Roadmaps Drawer */}
          <Card padding="md">
            <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-400" />
              Saved Roadmaps ({roadmaps?.length ?? 0})
            </h3>

            {loadingRoadmaps ? (
              <Skeleton className="h-20 w-full" />
            ) : roadmaps?.length === 0 ? (
              <p className="text-xs text-slate-400">No saved roadmaps yet. Generate one above!</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {roadmaps?.map((rm) => {
                  const isActive = currentRoadmap?.id === rm.id
                  return (
                    <div
                      key={rm.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'border-primary-500/80 bg-primary-500/10'
                          : 'border-dark-border bg-dark-surface/50 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className="cursor-pointer flex-1 min-w-0"
                        onClick={() => setActiveRoadmap(rm)}
                      >
                        <p className="text-sm font-medium text-white truncate">{rm.target_role}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{rm.progress_percentage}% Done</span>
                          <span>•</span>
                          <span className="capitalize text-emerald-400">{rm.status}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(rm.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-dark-card transition-colors"
                        title="Delete Roadmap"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Main Column: Interactive Timeline & Learning Roadmap */}
        <div className="lg:col-span-8 space-y-6">
          {generateMutation.isPending ? (
            <Card padding="lg" className="text-center py-20 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <p className="text-base font-semibold text-white">
                Analyzing Skills & Generating 4-Week Personalized Curriculum...
              </p>
              <p className="text-xs text-slate-400">
                Curating week-by-week objectives, recommended courses, and capstone project ideas.
              </p>
            </Card>
          ) : currentRoadmap ? (
            <div className="space-y-6">
              {/* Header Overview Card */}
              <Card padding="lg" className="space-y-6 border-primary-500/30">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-dark-border">
                  <div>
                    <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">
                      Active Learning Roadmap
                    </span>
                    <h2 className="text-2xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                      {currentRoadmap.target_role}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {currentRoadmap.estimated_completion_time}
                      </span>
                      <span>•</span>
                      <Badge variant="primary" className="capitalize">
                        {currentRoadmap.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Ring / Percentage */}
                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-400">
                      {currentRoadmap.progress_percentage}%
                    </span>
                    <span className="text-xs text-slate-400 block">Overall Completion</span>
                  </div>
                </div>

                {/* Interactive Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Progress Tracker</span>
                    <span className="text-slate-400">Click to update week progress</span>
                  </div>

                  <div className="h-3 w-full bg-dark-surface rounded-full overflow-hidden border border-dark-border p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${currentRoadmap.progress_percentage}%` }}
                    />
                  </div>

                  {/* Quick Progress Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    {[0, 25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleProgressChange(currentRoadmap.id, pct)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          currentRoadmap.progress_percentage === pct
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-dark-surface text-slate-400 border-dark-border hover:text-white'
                        }`}
                      >
                        {pct === 0 ? 'Not Started' : pct === 100 ? 'Completed 🎉' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills Analysis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Verified Current Skills */}
                  <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Verified Current Skills ({currentRoadmap.current_skills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {currentRoadmap.current_skills.map((sk, idx) => (
                        <Badge key={idx} variant="success" size="sm">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Target Missing Skills */}
                  <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Target Missing Skills ({currentRoadmap.missing_skills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {currentRoadmap.missing_skills.map((sk, idx) => (
                        <Badge key={idx} variant="warning" size="sm">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 4-Week Timeline UI */}
              <Card padding="lg" className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-violet-400" />
                    4-Week Timeline Roadmap
                  </h3>
                  <span className="text-xs text-slate-400">Step-by-step weekly curriculum</span>
                </div>

                <div className="relative border-l-2 border-primary-500/40 ml-4 space-y-8 pl-6">
                  {currentRoadmap.weekly_plan.map((item) => {
                    const isExpanded = expandedWeek === item.week
                    const weekPct = item.week * 25
                    const isWeekDone = currentRoadmap.progress_percentage >= weekPct

                    return (
                      <div key={item.week} className="relative group">
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                            isWeekDone
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-glow-success'
                              : 'bg-dark-surface text-primary-400 border-primary-500/60'
                          }`}
                        >
                          {isWeekDone ? <Check className="w-4 h-4" /> : `W${item.week}`}
                        </div>

                        {/* Weekly Card */}
                        <div className="p-5 rounded-2xl bg-dark-card border border-dark-border hover:border-primary-500/50 transition-all space-y-3">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedWeek(isExpanded ? null : item.week)}
                          >
                            <div>
                              <span className="text-[11px] font-bold text-primary-400 uppercase tracking-wider">
                                Week {item.week} Focus
                              </span>
                              <h4 className="text-base font-bold text-white mt-0.5">{item.title}</h4>
                            </div>

                            <button type="button" className="p-1 text-slate-400 hover:text-white">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                          {/* Expandable Objectives */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-dark-border space-y-2 animate-fade-in">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Weekly Actionable Objectives:
                              </span>
                              <ul className="space-y-2">
                                {item.objectives.map((obj, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-xs text-slate-200 bg-dark-surface p-2.5 rounded-xl border border-dark-border/60"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span>{obj}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Recommended Courses & Learning Resources */}
              <Card padding="lg" className="space-y-6">
                <div
                  className="flex items-center justify-between cursor-pointer pb-3 border-b border-dark-border"
                  onClick={() => setExpandedResources(!expandedResources)}
                >
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    Recommended Courses & Curated Resources
                  </h3>
                  <button type="button" className="p-1 text-slate-400 hover:text-white">
                    {expandedResources ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {expandedResources && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Courses Grid */}
                    {currentRoadmap.recommended_courses.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Top Online Courses & Specializations
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentRoadmap.recommended_courses.map((course, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-xl bg-dark-card border border-dark-border hover:border-slate-600 transition-all space-y-2 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <Badge variant="primary" size="sm">
                                    {course.provider}
                                  </Badge>
                                  <span className="text-[10px] text-slate-400 font-mono">{course.focus}</span>
                                </div>
                                <h5 className="text-sm font-bold text-white mt-2">{course.title}</h5>
                              </div>

                              {course.link && (
                                <a
                                  href={course.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-semibold pt-2"
                                >
                                  Explore Course <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources Grid */}
                    {currentRoadmap.learning_resources.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Documentation & Interactive Platforms
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentRoadmap.learning_resources.map((res, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-2 flex flex-col justify-between"
                            >
                              <div>
                                <Badge variant="warning" size="sm">
                                  {res.resource_type}
                                </Badge>
                                <h5 className="text-sm font-bold text-white mt-2">{res.title}</h5>
                                <p className="text-xs text-slate-400 mt-1">{res.description}</p>
                              </div>

                              {res.link && (
                                <a
                                  href={res.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold pt-2"
                                >
                                  Access Resource <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Practice Portfolio Projects */}
              {currentRoadmap.practice_projects.length > 0 && (
                <Card padding="lg" className="space-y-4">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2 pb-3 border-b border-dark-border">
                    <Code2 className="w-5 h-5 text-violet-400" />
                    Recommended Portfolio Projects
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentRoadmap.practice_projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            {proj.title}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed mt-2">{proj.description}</p>
                        </div>

                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Key Tech Stack:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {proj.tech_stack.map((t, i) => (
                              <Badge key={i} variant="neutral" size="sm">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card padding="lg" className="text-center py-20 space-y-4">
              <Compass className="w-16 h-16 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Learning Roadmap Active</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Set your target role on the left and click "Generate 4-Week AI Roadmap" to create your personalized curriculum.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
