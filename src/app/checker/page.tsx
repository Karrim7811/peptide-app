'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  History,
  X,
} from 'lucide-react'

const COMMON_PEPTIDES = [
  'BPC-157',
  'TB-500',
  'GHK-Cu',
  'Ipamorelin',
  'CJC-1295',
  'Semaglutide',
  'Tirzepatide',
  'Sermorelin',
  'Hexarelin',
  'GHRP-2',
  'GHRP-6',
  'IGF-1 LR3',
  'Melanotan II',
  'PT-141',
  'Epithalon',
  'Thymosin Alpha-1',
  'AOD-9604',
  'NAD+',
  'Selank',
  'Semax',
]

interface InteractionResult {
  level: 'safe' | 'caution' | 'danger' | 'unknown'
  summary: string
  details: string
  recommendations: string[]
}

interface HistoryEntry {
  itemA: string
  itemB: string
  result: InteractionResult
  timestamp: number
}

const LEVEL_CONFIG = {
  safe: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    icon: CheckCircle,
    label: 'Generally Safe',
  },
  caution: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
    icon: AlertTriangle,
    label: 'Use with Caution',
  },
  danger: {
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/40',
    icon: AlertTriangle,
    label: 'Potentially Dangerous',
  },
  unknown: {
    color: 'text-slate-400',
    bg: 'bg-slate-700/50 border-slate-600',
    badge: 'bg-slate-700 text-slate-300 border border-slate-600',
    icon: HelpCircle,
    label: 'Unknown Interaction',
  },
}

function SuggestionDropdown({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const filtered = COMMON_PEPTIDES.filter((p) =>
    p.toLowerCase().includes(value.toLowerCase())
  )

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="pr-8"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p}
              type="button"
              onMouseDown={() => {
                onChange(p)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CheckerPage() {
  const [itemA, setItemA] = useState('')
  const [itemB, setItemB] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InteractionResult | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('interaction-history')
      if (stored) setHistory(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!itemA.trim() || !itemB.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/check-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemA: itemA.trim(), itemB: itemB.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to check interaction')
      }

      const data: InteractionResult = await res.json()
      setResult(data)

      // Save to history (max 5)
      const entry: HistoryEntry = {
        itemA: itemA.trim(),
        itemB: itemB.trim(),
        result: data,
        timestamp: Date.now(),
      }
      const updated = [entry, ...history].slice(0, 5)
      setHistory(updated)
      localStorage.setItem('interaction-history', JSON.stringify(updated))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function loadFromHistory(entry: HistoryEntry) {
    setItemA(entry.itemA)
    setItemB(entry.itemB)
    setResult(entry.result)
    setError('')
    setShowHistory(false)
  }

  function clearHistory() {
    setHistory([])
    localStorage.removeItem('interaction-history')
  }

  const levelCfg = result ? LEVEL_CONFIG[result.level] ?? LEVEL_CONFIG.unknown : null
  const LevelIcon = levelCfg?.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          Interaction Checker
        </h1>
        <p className="text-slate-400 mt-1">
          AI-powered interaction analysis for peptides, medications, and supplements.
        </p>
      </div>

      {/* Checker Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <form onSubmit={handleCheck} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SuggestionDropdown
              value={itemA}
              onChange={setItemA}
              placeholder="e.g. BPC-157"
              label="Compound A"
            />
            <SuggestionDropdown
              value={itemB}
              onChange={setItemB}
              placeholder="e.g. TB-500 or Ibuprofen"
              label="Compound B"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !itemA.trim() || !itemB.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing with Claude AI...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Check Interaction
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-3 text-center">
          For informational purposes only. Always consult a qualified healthcare provider.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && levelCfg && LevelIcon && (
        <div className={`border rounded-xl p-6 space-y-4 ${levelCfg.bg}`}>
          {/* Level Badge + Title */}
          <div className="flex items-center gap-3">
            <LevelIcon className={`w-6 h-6 ${levelCfg.color} shrink-0`} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${levelCfg.badge}`}>
                  {levelCfg.label}
                </span>
                <span className="text-slate-400 text-sm">
                  {itemA} &harr; {itemB}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Summary</h3>
            <p className="text-white text-sm leading-relaxed">{result.summary}</p>
          </div>

          {/* Details */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Details</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{result.details}</p>
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recommendations
              </h3>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-700/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <History className="w-4 h-4 text-indigo-400" />
              Recent Checks ({history.length})
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
            />
          </button>

          {showHistory && (
            <div className="border-t border-slate-700">
              <div className="flex justify-end px-4 py-2">
                <button
                  onClick={clearHistory}
                  className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear history
                </button>
              </div>
              <div className="divide-y divide-slate-700/50">
                {history.map((entry, i) => {
                  const cfg = LEVEL_CONFIG[entry.result.level] ?? LEVEL_CONFIG.unknown
                  return (
                    <button
                      key={i}
                      onClick={() => loadFromHistory(entry)}
                      className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-700/30 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm text-white">
                          {entry.itemA} &harr; {entry.itemB}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Common Peptides Reference */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Common Peptides &amp; Compounds</h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_PEPTIDES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                if (!itemA) setItemA(p)
                else if (!itemB) setItemB(p)
                else setItemA(p)
              }}
              className="text-xs bg-slate-700 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-600 hover:border-indigo-500/40"
            >
              {p}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Click any compound to fill the inputs above.
        </p>
      </div>
    </div>
  )
}
