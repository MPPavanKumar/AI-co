import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import {
  Brain, Sparkles, CheckCircle2, Trash2, Award, BookOpen, Layers, Clock, Code2, AlertTriangle, BookmarkCheck, Copy, ShieldCheck
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import {
  useInterviewSessions,
  useGenerateInterview,
  useEvaluateQuestion,
  useCompleteInterview,
  useDeleteInterviewSession,
} from '../hooks/useInterview'
import type {
  InterviewSession,
  ProgrammingLanguage,
  QuestionStatus,
  QuestionFeedback,
} from '../types/interview'

const TIMER_INITIAL_SECONDS = 45 * 60 // 45 minutes

const DEFAULT_STARTER_TEMPLATES: Record<ProgrammingLanguage, string> = {
  python: `# Python 3 Solution\ndef solution():\n    # Write your algorithmic logic here\n    pass\n`,
  javascript: `// JavaScript Solution\nfunction solution() {\n    // Write your algorithmic logic here\n}\n`,
  java: `// Java Solution\nclass Solution {\n    public void solve() {\n        // Write your algorithmic logic here\n    }\n}\n`,
  cpp: `// C++ Solution\n#include <iostream>\nusing namespace std;\n\nvoid solve() {\n    // Write your algorithmic logic here\n}\n`,
}

const PREDEFINED_ROLES = [
  'Full Stack Software Engineer',
  'Frontend Software Engineer',
  'Backend Software Engineer',
  'Data Structures & Algorithms (DSA)',
  'System Design Architect',
  'DevOps & Cloud Engineer',
  'Data Scientist & ML Engineer',
  'Mobile App Developer (Android / iOS)',
  'Custom Role',
]

const PREDEFINED_COMPANIES = [
  'Google',
  'Amazon',
  'Microsoft',
  'Meta',
  'Apple',
  'Netflix',
  'Uber',
  'Atlassian',
  'Flipkart',
  'TCS / Infosys / Wipro',
  'Custom Company',
]

export default function InterviewPage() {
  const [selectedRole, setSelectedRole] = useState('Full Stack Software Engineer')
  const [customRole, setCustomRole] = useState('')
  
  const [selectedCompany, setSelectedCompany] = useState('Google')
  const [customCompany, setCustomCompany] = useState('')

  const effectiveRole = selectedRole === 'Custom Role' ? customRole : selectedRole
  const effectiveCompany = selectedCompany === 'Custom Company' ? customCompany : selectedCompany

  // Active Session & Multi-Question Local State
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)

  // Store Candidate Answers & Code per question_id
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({})
  const [codeMap, setCodeMap] = useState<Record<string, string>>({})
  const [languageMap, setLanguageMap] = useState<Record<number, ProgrammingLanguage>>({})
  const [statusMap, setStatusMap] = useState<Record<number, QuestionStatus>>({})

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState(TIMER_INITIAL_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: sessions, isLoading: loadingSessions } = useInterviewSessions()
  const generateMutation = useGenerateInterview()
  const evaluateQuestionMutation = useEvaluateQuestion()
  const completeMutation = useCompleteInterview()
  const deleteMutation = useDeleteInterviewSession()

  // Start Countdown Timer when session active
  useEffect(() => {
    if (activeSession && activeSession.status === 'in_progress') {
      setTimeLeft(TIMER_INITIAL_SECONDS)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeSession?.id])

  // Auto-sync active session with sessions list to prevent 404 stale session errors
  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      if (activeSession) setActiveSession(null)
      return
    }

    if (!activeSession) {
      setActiveSession(sessions[0])
      return
    }

    // Verify if activeSession still exists in server sessions list
    const exists = sessions.find((s) => s.id === activeSession.id)
    if (!exists) {
      setActiveSession(sessions[0])
    }
  }, [sessions, activeSession?.id])

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteMutation.mutateAsync(sessionId)
      if (activeSession?.id === sessionId) {
        const remaining = sessions?.filter((s) => s.id !== sessionId) ?? []
        setActiveSession(remaining[0] ?? null)
      }
    } catch {
      // Toast handles error
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalRole = effectiveRole.trim() || 'Full Stack Software Engineer'
    const finalCompany = effectiveCompany.trim() || 'Google'

    try {
      const session = await generateMutation.mutateAsync({
        role: finalRole,
        company_name: finalCompany,
      })
      setActiveSession(session)
      setCurrentQIndex(0)
      setAnswersMap({})
      setCodeMap({})
      setLanguageMap({})

      // Initialize status map for Q1..Q5
      const initStatus: Record<number, QuestionStatus> = {}
      session.questions.forEach((q) => {
        initStatus[q.id] = 'pending'
      })
      setStatusMap(initStatus)
    } catch {
      // Toast handles error
    }
  }

  const currentQ = activeSession?.questions[currentQIndex]
  const currentLang = currentQ ? languageMap[currentQ.id] ?? 'python' : 'python'
  const currentCodeKey = currentQ ? `${currentQ.id}_${currentLang}` : ''
  const currentCode = currentQ
    ? codeMap[currentCodeKey] ?? (currentQ.starter_code_templates?.[currentLang] || DEFAULT_STARTER_TEMPLATES[currentLang])
    : ''
  const currentAnswer = currentQ ? answersMap[currentQ.id] ?? '' : ''

  const getQuestionFeedback = (qId: number): QuestionFeedback | undefined => {
    return activeSession?.answers_and_feedback?.find((item) => item.question_id === qId)
  }

  const handleEvaluateCurrentQuestion = async () => {
    if (!activeSession || !currentQ) return
    try {
      const updatedSession = await evaluateQuestionMutation.mutateAsync({
        sessionId: activeSession.id,
        data: {
          question_id: currentQ.id,
          question: currentQ.question,
          question_type: currentQ.question_type,
          candidate_answer: currentAnswer,
          candidate_code: currentQ.question_type === 'dsa' ? currentCode : undefined,
          selected_language: currentLang,
          expected_key_points: currentQ.expected_key_points,
        },
      })
      setActiveSession(updatedSession)
      setStatusMap((prev) => ({ ...prev, [currentQ.id]: 'evaluated' }))
    } catch {
      // Toast handles error
    }
  }

  const handleMarkForReview = () => {
    if (!currentQ) return
    setStatusMap((prev) => ({ ...prev, [currentQ.id]: 'marked_for_review' }))
  }

  const handleSkipQuestion = () => {
    if (!currentQ) return
    setStatusMap((prev) => ({ ...prev, [currentQ.id]: 'skipped' }))
    if (currentQIndex < (activeSession?.questions.length ?? 0) - 1) {
      setCurrentQIndex((prev) => prev + 1)
    }
  }

  const handleAutoSubmit = async () => {
    if (!activeSession) return
    try {
      const finalSession = await completeMutation.mutateAsync(activeSession.id)
      setActiveSession(finalSession)
    } catch {
      // Toast handles error
    }
  }

  const handleCompleteInterview = async () => {
    if (!activeSession) return
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const finalSession = await completeMutation.mutateAsync(activeSession.id)
      setActiveSession(finalSession)
    } catch {
      // Toast handles error
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary-400" />
          Advanced AI Mock Interview
        </h1>
        <p className="text-slate-400 mt-1">
          5-Question Assessment: 1 HR + 1 Technical + 3 DSA Coding Problems with real-time evaluation & code editor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & History */}
        <div className="lg:col-span-4 space-y-6">
          <Card padding="lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              New Interview Setup
            </h2>

            <form onSubmit={handleStartSession} className="space-y-4">
              {/* 1. Target Role Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#1e1e3f]/60 border border-[#2d2d5a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {PREDEFINED_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#0f0f20] text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Role Input */}
              {selectedRole === 'Custom Role' && (
                <Input
                  label="Enter Custom Role"
                  placeholder="e.g. Lead iOS Developer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  required
                />
              )}

              {/* 2. Target Company Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full bg-[#1e1e3f]/60 border border-[#2d2d5a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {PREDEFINED_COMPANIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0f0f20] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Company Input */}
              {selectedCompany === 'Custom Company' && (
                <Input
                  label="Enter Custom Company Name"
                  placeholder="e.g. Google, OpenAI, Stripe"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  required
                />
              )}

              {/* Quick Company Selection Badges */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Quick Select Target Tech Giant:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber'].map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => {
                        setSelectedCompany(comp)
                        setCustomCompany('')
                      }}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                        selectedCompany === comp
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-[#1e1e3f]/40 border-[#2d2d5a] text-slate-400 hover:text-white hover:border-slate-500'
                      )}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={generateMutation.isPending}
                leftIcon={<Brain className="w-4 h-4" />}
              >
                Start 45-Min Interview Session
              </Button>
            </form>
          </Card>

          {/* Past Sessions List */}
          <Card padding="md">
            <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-400" />
              Past Sessions ({sessions?.length ?? 0})
            </h3>

            {loadingSessions ? (
              <Skeleton className="h-20 w-full" />
            ) : sessions?.length === 0 ? (
              <p className="text-xs text-slate-400">No mock interview sessions yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {sessions?.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      activeSession?.id === s.id
                        ? 'border-primary-500/80 bg-primary-500/10'
                        : 'border-dark-border bg-dark-surface/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="cursor-pointer" onClick={() => setActiveSession(s)}>
                      <p className="text-sm font-medium text-white">{s.role}</p>
                      <p className="text-xs text-slate-400">
                        {s.company_name ?? 'Target Tech'} • Score: {s.overall_score ?? 'Pending'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSession(s.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-dark-card transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Q&A Coding Arena & Final Report */}
        <div className="lg:col-span-8 space-y-6">
          {generateMutation.isPending ? (
            <Card padding="lg" className="text-center py-20 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <p className="text-base font-semibold text-white">
                Generating 5-Question Assessment (1 HR, 1 Tech, 3 DSA)...
              </p>
              <p className="text-xs text-slate-400">Structuring multi-language coding problems and test cases.</p>
            </Card>
          ) : activeSession ? (
            activeSession.status === 'completed' || completeMutation.isPending ? (
              /* Completed Session Final Report Screen */
              <Card padding="lg" className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-dark-border">
                  <div>
                    <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                      <Award className="w-6 h-6 text-yellow-400" />
                      Final Interview Performance Report
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Role: {activeSession.role} • {activeSession.company_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-white">
                      {activeSession.overall_score ?? 0}
                    </span>
                    <span className="text-xs text-slate-400 block">Overall Score</span>
                  </div>
                </div>

                {completeMutation.isPending ? (
                  <div className="text-center py-12 space-y-3">
                    <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                    <p className="text-sm text-slate-300">Generating multi-metric performance evaluation...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Score Breakdown Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-dark-card border border-dark-border text-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase">HR Score</span>
                        <p className="text-2xl font-black text-primary-400 mt-1">
                          {activeSession.hr_score ?? '—'}%
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-dark-card border border-dark-border text-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Technical Score</span>
                        <p className="text-2xl font-black text-violet-400 mt-1">
                          {activeSession.technical_score ?? '—'}%
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-dark-card border border-dark-border text-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase">DSA Score</span>
                        <p className="text-2xl font-black text-emerald-400 mt-1">
                          {activeSession.dsa_score ?? '—'}%
                        </p>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Key Strengths
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                          {activeSession.strengths?.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <h4 className="text-xs font-bold text-amber-400 uppercase mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Areas to Improve
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                          {activeSession.weaknesses?.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommended Topics to Study */}
                    {activeSession.recommended_topics && activeSession.recommended_topics.length > 0 && (
                      <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                        <h4 className="text-xs font-bold text-violet-300 uppercase mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" /> Recommended Topics to Study
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {activeSession.recommended_topics.map((topic, idx) => (
                            <Badge key={idx} variant="primary">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ) : (
              /* Live Interview Arena */
              <Card padding="lg" className="space-y-6">
                {/* Top Control Bar: Timer & Finish */}
                <div className="flex items-center justify-between pb-4 border-b border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-bold">
                      <Clock className="w-4 h-4 animate-pulse" />
                      Time Remaining: {formatTimer(timeLeft)}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleCompleteInterview}
                    isLoading={completeMutation.isPending}
                  >
                    Finish & Complete Interview
                  </Button>
                </div>

                {/* Question Palette Navigation Bar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                    Question Palette (Click to Jump)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {activeSession.questions.map((q, idx) => {
                      const st = statusMap[q.id] ?? 'pending'
                      const isCurrent = currentQIndex === idx

                      let badgeBg = 'bg-dark-card border-dark-border text-slate-400'
                      if (st === 'evaluated') badgeBg = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      else if (st === 'marked_for_review') badgeBg = 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      else if (st === 'skipped') badgeBg = 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      else if (st === 'answered') badgeBg = 'bg-primary-500/20 border-primary-500/50 text-primary-300'

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentQIndex(idx)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${badgeBg} ${
                            isCurrent ? 'ring-2 ring-primary-500' : ''
                          }`}
                        >
                          <span>Q{idx + 1}</span>
                          <span className="text-[10px] font-normal capitalize">
                            {q.question_type}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Current Question View */}
                {currentQ && (
                  <div className="space-y-4 pt-2">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">{currentQ.question_type.toUpperCase()}</Badge>
                        <Badge variant="warning">{currentQ.difficulty}</Badge>
                        <Badge variant="neutral">{currentQ.category}</Badge>
                      </div>
                      <span className="text-xs text-slate-400">
                        Status: <strong className="text-white capitalize">{statusMap[currentQ.id] ?? 'pending'}</strong>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-relaxed">
                      {currentQ.id}. {currentQ.question}
                    </h3>

                    {/* DSA Constraints & Test Cases */}
                    {currentQ.question_type === 'dsa' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-dark-card p-3 rounded-xl border border-dark-border">
                        {currentQ.constraints && currentQ.constraints.length > 0 && (
                          <div>
                            <span className="font-semibold text-amber-400">Constraints:</span>
                            <ul className="list-disc pl-4 text-slate-300 mt-0.5 space-y-0.5">
                              {currentQ.constraints.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                        {currentQ.sample_test_cases && currentQ.sample_test_cases.length > 0 && (
                          <div>
                            <span className="font-semibold text-emerald-400">Sample Test Cases:</span>
                            <ul className="list-disc pl-4 text-slate-300 mt-0.5 space-y-0.5">
                              {currentQ.sample_test_cases.map((tc, i) => <li key={i}>{tc}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Answer / DSA Code Input Area */}
                    {currentQ.question_type === 'dsa' ? (
                      <div className="space-y-2">
                        {/* Language Selector */}
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Code2 className="w-4 h-4 text-emerald-400" />
                            DSA Code Editor
                          </label>

                          <div className="flex items-center gap-2">
                            {(['python', 'javascript', 'java', 'cpp'] as ProgrammingLanguage[]).map((lang) => (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => {
                                  setLanguageMap((prev) => ({ ...prev, [currentQ.id]: lang }))
                                  const langKey = `${currentQ.id}_${lang}`
                                  if (!codeMap[langKey]) {
                                    const template = currentQ.starter_code_templates?.[lang] || DEFAULT_STARTER_TEMPLATES[lang]
                                    setCodeMap((prev) => ({ ...prev, [langKey]: template }))
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                                  currentLang === lang
                                    ? 'bg-primary-600 text-white shadow-glow-primary'
                                    : 'bg-dark-surface text-slate-400 hover:text-white'
                                }`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Monospace Code Input */}
                        <textarea
                          rows={12}
                          className="w-full bg-dark-card border border-dark-border rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y leading-relaxed"
                          value={currentCode}
                          onChange={(e) => {
                            setCodeMap((prev) => ({ ...prev, [currentCodeKey]: e.target.value }))
                            setStatusMap((prev) => ({ ...prev, [currentQ.id]: 'answered' }))
                          }}
                        />
                      </div>
                    ) : (
                      /* Oral / Text Response Input */
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Your Response</label>
                        <textarea
                          rows={6}
                          className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-y"
                          placeholder="Type your interview response here..."
                          value={currentAnswer}
                          onChange={(e) => {
                            setAnswersMap((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                            setStatusMap((prev) => ({ ...prev, [currentQ.id]: 'answered' }))
                          }}
                        />
                      </div>
                    )}

                    {/* Question Action Toolbar */}
                    <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={currentQIndex === 0}
                          onClick={() => setCurrentQIndex((prev) => prev - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={currentQIndex === activeSession.questions.length - 1}
                          onClick={() => setCurrentQIndex((prev) => prev + 1)}
                        >
                          Next
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={handleSkipQuestion}>
                          Skip
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleMarkForReview}>
                          <BookmarkCheck className="w-3.5 h-3.5 mr-1" />
                          Mark Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleEvaluateCurrentQuestion}
                          isLoading={evaluateQuestionMutation.isPending}
                          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        >
                          Evaluate Answer
                        </Button>
                      </div>
                    </div>

                    {/* Live Per-Question Evaluation Card */}
                    {getQuestionFeedback(currentQ.id) && (
                      <Card padding="md" className="bg-dark-card/95 border-primary-500/50 space-y-4 mt-6 shadow-2xl animate-fade-in">
                        {/* Header & Hiring Recommendation Badge */}
                        {(() => {
                          const fb = getQuestionFeedback(currentQ.id)
                          if (!fb) return null

                          const rec = fb.hiring_recommendation || 'Hire'
                          let recBg = 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                          if (rec.includes('Strong')) recBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          else if (rec.includes('Lean Hire')) recBg = 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                          else if (rec.includes('No Hire')) recBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40'

                          return (
                            <>
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border pb-3">
                                <div>
                                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary-400" />
                                    AI Interview Feedback & Evaluation
                                  </h4>
                                  {fb.recommendation_reason && (
                                    <p className="text-xs text-slate-400 mt-1">{fb.recommendation_reason}</p>
                                  )}
                                </div>

                                <div className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 ${recBg}`}>
                                  <ShieldCheck className="w-4 h-4" />
                                  Recommendation: {rec}
                                </div>
                              </div>

                              {/* 4 Score Metric Cards with Explanations */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Overall Score */}
                                <div className="p-3 rounded-xl bg-dark-surface border border-dark-border text-center space-y-1">
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Overall Score</span>
                                  <span className="text-2xl font-black text-white">{fb.score}/100</span>
                                </div>

                                {/* Technical Accuracy */}
                                <div className="p-3 rounded-xl bg-dark-surface border border-dark-border text-center space-y-1">
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Technical Accuracy</span>
                                  <span className="text-2xl font-black text-emerald-400">{fb.technical_accuracy ?? fb.score}/100</span>
                                  {fb.technical_accuracy_explanation && (
                                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{fb.technical_accuracy_explanation}</p>
                                  )}
                                </div>

                                {/* Communication Skills */}
                                <div className="p-3 rounded-xl bg-dark-surface border border-dark-border text-center space-y-1">
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Communication</span>
                                  <span className="text-2xl font-black text-violet-400">{fb.communication_skills ?? fb.score}/100</span>
                                  {fb.communication_explanation && (
                                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{fb.communication_explanation}</p>
                                  )}
                                </div>

                                {/* Confidence */}
                                <div className="p-3 rounded-xl bg-dark-surface border border-dark-border text-center space-y-1">
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Confidence</span>
                                  <span className="text-2xl font-black text-primary-400">{fb.confidence ?? fb.score}/100</span>
                                  {fb.confidence_explanation && (
                                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{fb.confidence_explanation}</p>
                                  )}
                                </div>
                              </div>

                              {/* DSA Code Performance Details */}
                              {currentQ.question_type === 'dsa' && (
                                <div className="grid grid-cols-4 gap-2 text-[11px] text-center bg-dark-surface p-2.5 rounded-xl border border-dark-border">
                                  <div>
                                    <span className="text-slate-400 block">Time Complexity</span>
                                    <span className="font-bold text-emerald-400">{fb.time_complexity}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Space Complexity</span>
                                    <span className="font-bold text-violet-400">{fb.space_complexity}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Code Readability</span>
                                    <span className="font-bold text-primary-300">{fb.code_readability}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Edge Cases</span>
                                    <span className="font-bold text-amber-300">{fb.edge_cases}</span>
                                  </div>
                                </div>
                              )}

                              {/* Strengths & Weaknesses */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {fb.strengths && fb.strengths.length > 0 && (
                                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                                    <h5 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths
                                    </h5>
                                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                                      {fb.strengths.map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {fb.weaknesses && fb.weaknesses.length > 0 && (
                                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                                    <h5 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses & Gaps
                                    </h5>
                                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                                      {fb.weaknesses.map((w, idx) => (
                                        <li key={idx}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* Suggestions for Improvement */}
                              {(fb.suggestions_for_improvement || fb.improvement_suggestions) && (
                                <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 space-y-1">
                                  <h5 className="text-xs font-bold text-primary-300 uppercase flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" /> Suggestions for Improvement
                                  </h5>
                                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                                    {(fb.suggestions_for_improvement || fb.improvement_suggestions || []).map((sug, idx) => (
                                      <li key={idx}>{sug}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Better Sample Answer */}
                              {(fb.better_sample_answer || fb.optimal_solution) && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <Code2 className="w-4 h-4" />
                                      Better Sample Answer / Model Solution:
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const textToCopy = fb.better_sample_answer || fb.optimal_solution || ''
                                        navigator.clipboard.writeText(textToCopy)
                                      }}
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy Answer
                                    </Button>
                                  </div>
                                  <pre className="text-xs font-mono text-emerald-300 bg-dark-surface p-4 rounded-xl border border-dark-border overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                    {fb.better_sample_answer || fb.optimal_solution}
                                  </pre>
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </Card>
                    )}
                  </div>
                )}
              </Card>
            )
          ) : (
            <Card padding="lg" className="text-center py-20 space-y-4">
              <Brain className="w-16 h-16 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Active Interview Session</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Set target role and company name on the left, then click "Start 45-Min Interview Session" to enter the live arena.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
