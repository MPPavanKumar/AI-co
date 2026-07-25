import { useState, useRef, useEffect } from 'react'
import {
  Send, Bot, User as UserIcon, Sparkles, Trash2, RefreshCw,
  Copy, Check, FileText, Target, Award, Calendar, Lightbulb,
  Zap, Code2, DollarSign, BookOpen, Compass, ChevronRight, MessageSquare
} from 'lucide-react'
import { clsx } from 'clsx'
import { useChatHistory, useCopilotContext, useSendMessage, useClearChatHistory } from '../hooks/useChat'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

// ── Simple Markdown Renderer Helper ───────────────────────────────────────────
function SimpleMarkdown({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Split by code blocks ```
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2 text-xs md:text-sm text-slate-200 leading-relaxed">
      {parts.map((part, idx) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n')
          const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : ''
          const codeText = language ? lines.slice(1).join('\n') : lines.join('\n')

          return (
            <div key={idx} className="my-3 rounded-xl border border-indigo-500/30 bg-[#0a0a16] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#121226] border-b border-indigo-500/20 text-[11px] text-slate-400 font-mono">
                <span>{language || 'code'}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeText, idx)}
                  className="flex items-center gap-1 text-indigo-400 hover:text-white transition-colors"
                >
                  {copiedIndex === idx ? (
                    <><Check className="w-3 h-3 text-emerald-400" /> Copied!</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-xs font-mono text-indigo-200 leading-normal">
                <code>{codeText}</code>
              </pre>
            </div>
          )
        }

        // Render standard paragraph text with bold, bullet points, headers
        const lines = part.split('\n')
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (line.startsWith('### ')) {
                return <h4 key={lIdx} className="text-sm font-bold text-white mt-2 mb-1">{line.replace('### ', '')}</h4>
              }
              if (line.startsWith('## ')) {
                return <h3 key={lIdx} className="text-base font-bold text-indigo-300 mt-3 mb-1">{line.replace('## ', '')}</h3>
              }
              if (line.startsWith('# ')) {
                return <h2 key={lIdx} className="text-lg font-extrabold text-white mt-4 mb-2">{line.replace('# ', '')}</h2>
              }
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const bulletText = line.trim().substring(2)
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-indigo-400 mt-1 font-bold">•</span>
                    <span>{parseBold(bulletText)}</span>
                  </div>
                )
              }
              if (line.trim() === '') return <div key={lIdx} className="h-1" />

              return <p key={lIdx}>{parseBold(line)}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// ── Quick Prompt Items ────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  {
    label: 'ATS Optimization',
    prompt: 'How can I optimize my Active Resume ATS score for target roles?',
    icon: FileText,
    category: 'resume',
  },
  {
    label: 'Skill Gap Analysis',
    prompt: 'Analyze my skill gaps based on my Active Resume and Target Role.',
    icon: Compass,
    category: 'skills',
  },
  {
    label: 'Interview Questions',
    prompt: 'Give me 5 behavioral and technical interview questions based on my weak areas.',
    icon: Zap,
    category: 'interview',
  },
  {
    label: 'Portfolio Project Ideas',
    prompt: 'Suggest 3 impressive full-stack portfolio projects that cover my missing skills.',
    icon: Code2,
    category: 'skills',
  },
  {
    label: 'Salary Guidance',
    prompt: 'Provide salary negotiation benchmarks and tips for my target role.',
    icon: DollarSign,
    category: 'salary',
  },
  {
    label: 'Daily Study Plan',
    prompt: 'Create a 7-day intensive study plan focusing on my learning roadmap objectives.',
    icon: BookOpen,
    category: 'roadmap',
  },
]

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const { data: historyData, isLoading: historyLoading } = useChatHistory()
  const { data: contextData } = useCopilotContext()
  const { mutate: sendMessage, isPending: isSending } = useSendMessage()
  const { mutate: clearHistory, isPending: isClearing } = useClearChatHistory()

  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const messages = historyData?.messages ?? []

  // Auto-scroll to bottom of chat thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const handleSend = (textToSend?: string, category: string = 'general') => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isSending) return

    sendMessage({ message: text, category })
    if (!textToSend) setInputMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Top Banner: Context Overview */}
      <div className="glass-card p-3.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">AI Career Copilot</h1>
              <Badge variant="primary" size="sm">gpt-oss-20b</Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Personalized career advisor referencing your Active Resume, Job Matches & Roadmaps.
            </p>
          </div>
        </div>

        {/* Context Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {contextData?.resume_name ? (
            <div className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1.5 text-indigo-300">
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px] font-medium">{contextData.resume_name}</span>
              {contextData.ats_score !== null && (
                <span className="font-extrabold text-emerald-400 ml-1">({contextData.ats_score} ATS)</span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">No active resume</span>
          )}

          {contextData?.target_role && (
            <div className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center gap-1.5 text-violet-300">
              <Target className="w-3.5 h-3.5" />
              <span className="font-medium">{contextData.target_role}</span>
            </div>
          )}

          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearHistory()}
              disabled={isClearing}
              className="text-slate-400 hover:text-red-400 border-[#1e1e3f]"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="glass-card flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Chat Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {historyLoading ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="w-2/3 h-16 bg-[#1e1e3f]/40 rounded-2xl" />
              <div className="w-3/4 h-24 bg-[#1e1e3f]/40 rounded-2xl ml-auto" />
            </div>
          ) : messages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-base font-bold text-white">How can I help your placement prep today?</h3>
                <p className="text-xs text-slate-400">
                  Ask any career question or pick a quick action below. Career Copilot automatically analyzes your Active Resume and placement data.
                </p>
              </div>

              {/* Quick Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 w-full max-w-2xl pt-2">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSend(item.prompt, item.category)}
                    className="p-3 rounded-xl border border-[#1e1e3f] bg-[#0f0f20]/60 hover:bg-indigo-500/10 hover:border-indigo-500/40 text-left transition-all group flex items-start gap-2.5"
                  >
                    <item.icon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-indigo-300">{item.label}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  'flex gap-3 max-w-4xl mx-auto',
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-indigo-500/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={clsx(
                    'p-4 rounded-2xl max-w-[85%] space-y-1 transition-all',
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                      : 'bg-[#0f0f20] border border-[#1e1e3f] text-slate-200 rounded-tl-none'
                  )}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 mb-1">
                    <span className="font-semibold tracking-wider">
                      {msg.sender === 'user' ? 'You' : 'Career Copilot'}
                    </span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.sender === 'user' ? (
                    <p className="text-xs md:text-sm whitespace-pre-wrap">{msg.message}</p>
                  ) : (
                    <SimpleMarkdown content={msg.message} />
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[#1e1e3f] flex items-center justify-center flex-shrink-0 mt-1">
                    <UserIcon className="w-4 h-4 text-indigo-300" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isSending && (
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0f0f20] border border-[#1e1e3f] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Career Copilot is thinking & analyzing context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-[#1e1e3f] bg-[#0f0f20]/90 space-y-2">
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-500 font-semibold uppercase flex-shrink-0 mr-1">Prompts:</span>
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSend(item.prompt, item.category)}
                  className="px-2.5 py-1 rounded-full bg-[#1e1e3f]/60 hover:bg-indigo-500/20 text-[11px] text-slate-300 hover:text-indigo-300 transition-all flex-shrink-0 flex items-center gap-1 border border-transparent hover:border-indigo-500/30"
                >
                  <item.icon className="w-3 h-3 text-indigo-400" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Career Copilot about ATS tips, skill gaps, interview questions, salary advice..."
              rows={2}
              className="flex-1 bg-[#0a0a16] border border-[#1e1e3f] rounded-xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            <Button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isSending}
              variant="primary"
              className="h-11 px-4 flex-shrink-0"
            >
              {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
