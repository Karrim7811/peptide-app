'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Loader2,
  FlaskConical,
  Sparkles,
  RotateCcw,
} from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  "What's the best time of day to inject BPC-157?",
  'How do I reconstitute a 5mg vial of TB-500?',
  "What's a good beginner peptide stack for recovery?",
  'Can I stack Ipamorelin with CJC-1295?',
  'How long should I cycle on/off peptides?',
]

const WELCOME_MESSAGE =
  "Hi! I'm **PeptideAI** — your expert assistant for peptide protocols, dosing, reconstitution, and stack advice.\n\nI can see your active stack and tailor answers to what you're running. Ask me anything, or try one of the questions below."

export default function AiChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stackContext, setStackContext] = useState('')
  const [stackNames, setStackNames] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch user's active stack on mount
  useEffect(() => {
    async function fetchStack() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('stack_items')
        .select('name, type, dose, unit')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        const contextLines = data.map(
          (item: { name: string; type: string; dose?: string; unit?: string }) => {
            const dosePart = item.dose ? ` ${item.dose}${item.unit ? ' ' + item.unit : ''}` : ''
            return `- ${item.name}${dosePart} (${item.type})`
          }
        )
        setStackContext(contextLines.join('\n'))
        setStackNames(data.map((item: { name: string }) => item.name))
      }
    }
    fetchStack()
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const maxH = 96 // ~3 rows
    ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px'
  }, [input])

  const handleSend = useCallback(
    async (overrideInput?: string) => {
      const text = (overrideInput ?? input).trim()
      if (!text || loading) return

      const userMsg: Message = { role: 'user', content: text }
      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)
      setInput('')
      setLoading(true)

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updatedMessages, stackContext }),
        })

        const data = await res.json()

        if (!res.ok || data.error) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.error ?? 'Something went wrong. Please try again.',
            },
          ])
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Network error. Please check your connection and try again.',
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [input, loading, messages, stackContext]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSuggestion(question: string) {
    if (loading) return
    handleSend(question)
  }

  function handleClear() {
    setMessages([])
    setInput('')
  }

  // Render assistant content — bold **text** handling
  function renderContent(text: string) {
    // Simple bold markdown replacement
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500/20 p-2 rounded-xl">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">PeptideAI</h1>
              <p className="text-xs text-slate-400 mt-0.5">Expert peptide assistant</p>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Stack context banner */}
      {stackNames.length > 0 && (
        <div className="flex items-start gap-2.5 bg-indigo-500/10 border border-indigo-500/25 rounded-xl px-4 py-3 mb-4 shrink-0">
          <FlaskConical className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-300">
            <span className="font-medium text-indigo-200">Your active stack detected:</span>{' '}
            <span className="text-indigo-300/80">{stackNames.join(', ')}</span>
          </p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-slate-800/50 border border-slate-700 flex flex-col">
        <div className="flex-1 px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            /* Welcome state */
            <div className="flex flex-col h-full">
              {/* Welcome bubble */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] border border-slate-700">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {renderContent(WELCOME_MESSAGE)}
                  </p>
                </div>
              </div>

              {/* Suggested questions */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Suggested questions
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestion(q)}
                      disabled={loading}
                      className="text-sm bg-slate-700/60 hover:bg-indigo-600/30 border border-slate-600 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-200 px-3 py-2 rounded-xl transition-all duration-150 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Message list */
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600/30 border border-indigo-500/40'
                        : 'bg-slate-700 border border-slate-600'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-indigo-300" />
                    ) : (
                      <Bot className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm border border-slate-700'
                    }`}
                  >
                    {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center mt-0.5">
                    <Bot className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area — pinned inside the scrollable card */}
        <div className="shrink-0 border-t border-slate-700 bg-slate-800/80 px-4 py-3 rounded-b-xl">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about dosing, protocols, stacking…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-slate-700 border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition-colors disabled:opacity-50 min-h-[42px] max-h-24 leading-relaxed"
              style={{ overflow: 'hidden' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
              title="Send message"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press <kbd className="bg-slate-700 text-slate-400 px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send
            &nbsp;·&nbsp;
            <kbd className="bg-slate-700 text-slate-400 px-1 py-0.5 rounded text-[10px]">Shift+Enter</kbd> for newline
          </p>
        </div>
      </div>
    </div>
  )
}
