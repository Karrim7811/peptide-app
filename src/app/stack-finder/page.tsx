'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Layers, Search, Sparkles, ChevronRight, Bot,
  Loader2, AlertCircle, FlaskConical, ArrowRight, X
} from 'lucide-react'
import { PEPTIDE_KNOWLEDGE, PEPTIDE_CATEGORIES } from '@/lib/peptide-knowledge'
import Link from 'next/link'

const GOAL_OPTIONS = [
  'Weight loss / metabolic health',
  'Muscle building / performance',
  'Healing / injury recovery',
  'Anti-aging / longevity',
  'Cognitive enhancement',
  'Better sleep',
  'Immune support',
  'Sexual health',
  'General wellness',
]

const CATEGORY_COLORS: Record<string, string> = {
  'Metabolic/Weight':   'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Healing/Recovery':   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'GH Axis':            'bg-[#1A8A9E]/12 text-[#1A8A9E] border-[#1A8A9E]/30',
  'Muscle/Performance': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Longevity':          'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Cognition/Mood':     'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Sleep':              'bg-slate-400/20 text-[#3A3730] border-slate-400/30',
  'Immune/Anti-inf':    'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Skin/Hair':          'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Sexual Health':      'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'Cardio/Vascular':    'bg-red-500/20 text-red-300 border-red-500/30',
  'GI/Bone/Other':      'bg-lime-500/20 text-lime-300 border-lime-500/30',
}

const ALL_NAMES = PEPTIDE_KNOWLEDGE.map(p => p.name)

export default function StackFinderPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string>('')
  const [goal, setGoal] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [peptideData, setPeptideData] = useState<typeof PEPTIDE_KNOWLEDGE[0] | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query || query === selected) {
      setSuggestions([])
      return
    }
    const q = query.toLowerCase()
    const matches = ALL_NAMES.filter(n => n.toLowerCase().includes(q)).slice(0, 8)
    setSuggestions(matches)
  }, [query, selected])

  function selectPeptide(name: string) {
    setSelected(name)
    setQuery(name)
    setSuggestions([])
    setResult('')
    setError('')
    setPeptideData(null)
  }

  async function handleSearch() {
    const peptideName = selected || query.trim()
    if (!peptideName) return
    setLoading(true)
    setResult('')
    setError('')
    setPeptideData(null)

    try {
      const res = await fetch('/api/stack-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peptideName, goal }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong.')
      } else {
        setResult(data.reply)
        setPeptideData(data.peptideData)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Quick picks — most popular
  const QUICK_PICKS = ['BPC-157 (research)', 'TB-500 (Thymosin beta-4 fragment, research)', 'Semaglutide (Wegovy/Ozempic)', 'CJC-1295 (research)', 'Ipamorelin (research)', 'GHK-Cu (Copper peptide)']

  function renderResult(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-[#1A1915] font-bold text-base mt-5 mb-2 first:mt-0">{line.slice(3)}</h3>
      }
      if (line.startsWith('**') && line.includes('**')) {
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={i} className="text-[#3A3730] text-sm mb-1">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="text-[#1A1915] font-semibold">{part.slice(2, -2)}</strong>
                : <span key={j}>{part}</span>
            )}
          </p>
        )
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} className="text-[#3A3730] text-sm ml-4 mb-1 list-disc">{line.slice(2)}</li>
      }
      if (!line.trim()) return <div key={i} className="h-1" />
      return <p key={i} className="text-[#3A3730] text-sm mb-1 leading-relaxed">{line}</p>
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-[#1A8A9E]/12 p-2 rounded-xl">
            <Layers className="w-5 h-5 text-[#1A8A9E]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1915]">Stack Finder</h1>
        </div>
        <p className="text-[#B0AAA0] text-sm ml-12">
          Enter any peptide — get AI-powered stacking recommendations tailored to your goals.
        </p>
      </div>

      {/* Search card */}
      <div className="bg-white border border-[#E8E5E0] rounded-2xl p-6">
        <div className="space-y-4">
          {/* Peptide search */}
          <div>
            <label className="block text-sm font-medium text-[#3A3730] mb-2">
              Which peptide are you running?
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0AAA0]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected('') }}
                onKeyDown={e => e.key === 'Enter' && suggestions.length === 0 && handleSearch()}
                placeholder="Search peptide (e.g. Retatrutide, BPC-157, Semaglutide...)"
                className="w-full pl-10 pr-10 py-3 bg-[#F2F0ED] border border-[#D0CCC6] focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E]/50 rounded-xl text-[#1A1915] placeholder-slate-400 outline-none transition-colors text-sm"
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setSelected(''); setSuggestions([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0AAA0] hover:text-[#1A1915]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Autocomplete */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#F2F0ED] border border-[#D0CCC6] rounded-xl overflow-hidden shadow-xl z-10">
                  {suggestions.map(name => {
                    const p = PEPTIDE_KNOWLEDGE.find(x => x.name === name)
                    return (
                      <button
                        key={name}
                        onClick={() => selectPeptide(name)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#E8E5E0] text-left transition-colors"
                      >
                        <div>
                          <p className="text-[#1A1915] text-sm font-medium">{name}</p>
                          <p className="text-[#B0AAA0] text-xs">{p?.goalCategory}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#B0AAA0] shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick picks */}
            <div className="mt-3">
              <p className="text-xs text-[#B0AAA0] mb-2">Popular picks:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PICKS.map(name => (
                  <button
                    key={name}
                    onClick={() => selectPeptide(name)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      selected === name
                        ? 'bg-[#1A8A9E]/15 border-[#1A8A9E]/50 text-[#1A8A9E]'
                        : 'bg-[#F2F0ED] border-[#D0CCC6] text-[#3A3730] hover:border-[#1A8A9E]/40 hover:text-[#1A1915]'
                    }`}
                  >
                    {name.replace(' (research)', '').replace(/\s*\(.*?\)\s*/g, match =>
                      match.includes('research') ? '' : match
                    ).trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Goal selector */}
          <div>
            <label className="block text-sm font-medium text-[#3A3730] mb-2">
              What&apos;s your primary goal? <span className="text-[#B0AAA0] font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(g => (
                <button
                  key={g}
                  onClick={() => setGoal(goal === g ? '' : g)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    goal === g
                      ? 'bg-[#1A8A9E]/15 border-[#1A8A9E]/50 text-[#1A8A9E]'
                      : 'bg-[#F2F0ED] border-[#D0CCC6] text-[#3A3730] hover:border-[#B0AAA0]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSearch}
            disabled={loading || (!query.trim() && !selected)}
            className="w-full flex items-center justify-center gap-2 bg-[#1A8A9E] hover:bg-[#1A8A9E] disabled:bg-[#F2F0ED] disabled:text-[#B0AAA0] text-[#1A1915] py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing stack options...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Find Compatible Stacks</>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Selected peptide info card */}
      {peptideData && (
        <div className="bg-white border border-[#E8E5E0] rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-[#1A8A9E]/12 p-2 rounded-lg shrink-0">
              <FlaskConical className="w-4 h-4 text-[#1A8A9E]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[#1A1915] font-bold">{peptideData.name}</h3>
              <p className="text-[#B0AAA0] text-xs mt-0.5">{peptideData.primaryPurpose}</p>
            </div>
            <div className="flex items-center gap-1 bg-[#F2F0ED] rounded-lg px-2 py-1">
              <span className="text-xs text-[#B0AAA0]">CV</span>
              <span className={`text-xs font-bold ${peptideData.cvRating >= 4 ? 'text-emerald-400' : peptideData.cvRating >= 2 ? 'text-yellow-400' : 'text-[#B0AAA0]'}`}>
                {peptideData.cvRating}/5
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {peptideData.goalCategories.map(cat => (
              <span key={cat} className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[cat] ?? 'bg-[#F2F0ED] text-[#3A3730] border-[#D0CCC6]'}`}>
                {cat}
              </span>
            ))}
          </div>
          <p className="text-[#B0AAA0] text-xs leading-relaxed">{peptideData.whatItDoes}</p>

          {/* Quick stack suggestions from knowledge base */}
          {peptideData.stacksWellWith.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E8E5E0]">
              <p className="text-xs text-[#B0AAA0] font-medium uppercase tracking-wider mb-2">
                Complementary categories
              </p>
              <div className="flex flex-wrap gap-2">
                {peptideData.stacksWellWith.slice(0, 6).map(name => {
                  const p = PEPTIDE_KNOWLEDGE.find(x => x.name === name)
                  return (
                    <button
                      key={name}
                      onClick={() => selectPeptide(name)}
                      className="flex items-center gap-1.5 text-xs bg-[#F2F0ED] hover:bg-[#E8E5E0] border border-[#D0CCC6] text-[#3A3730] px-2.5 py-1.5 rounded-lg transition-colors"
                      title={`Switch to ${name}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p?.goalCategories[0] ? (CATEGORY_COLORS[p.goalCategories[0]] ?? '').split(' ')[0] : 'bg-slate-400'}`} />
                      {name.replace(' (research)', '').replace(/\s*\(.*\)\s*/g, m => m.includes('research') ? '' : m).trim()}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Result */}
      {result && (
        <div className="bg-white border border-[#E8E5E0] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E8E5E0]">
            <div className="bg-[#1A8A9E]/12 p-1.5 rounded-lg">
              <Bot className="w-4 h-4 text-[#1A8A9E]" />
            </div>
            <span className="text-[#1A1915] font-semibold text-sm">PeptideAI Stack Analysis</span>
            <span className="text-xs text-[#B0AAA0] ml-auto">Based on 58-peptide knowledge base</span>
          </div>
          <div className="space-y-0.5">
            {renderResult(result)}
          </div>

          {/* CTA row */}
          <div className="mt-5 pt-4 border-t border-[#E8E5E0] flex flex-wrap gap-3">
            <Link
              href="/checker"
              className="flex items-center gap-2 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-lg transition-colors"
            >
              Check interactions
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/ai-chat"
              className="flex items-center gap-2 text-sm bg-[#1A8A9E]/12 hover:bg-[#1A8A9E]/15 border border-[#1A8A9E]/30 text-[#1A8A9E] px-4 py-2 rounded-lg transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              Ask PeptideAI for more detail
            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="bg-white/50 border border-[#E8E5E0] border-dashed rounded-2xl p-8 text-center">
          <Layers className="w-10 h-10 text-[#B0AAA0] mx-auto mb-3" />
          <p className="text-[#B0AAA0] text-sm font-medium mb-1">Search any peptide to get started</p>
          <p className="text-[#B0AAA0] text-xs">
            AI analyzes your peptide against all 58 compounds in the knowledge base and suggests optimal combinations.
          </p>
        </div>
      )}
    </div>
  )
}
