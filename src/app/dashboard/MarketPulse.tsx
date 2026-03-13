'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Loader2,
  Clock,
  FlaskConical,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface Headline {
  title: string
  summary: string
  category: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'warning'
}

interface FdaWatch {
  peptide: string
  status: string
  update: string
}

interface PulseData {
  lastUpdated: string
  headlines: Headline[]
  fdaWatch: FdaWatch[]
  trendingPeptides: string[]
}

const SENTIMENT_CONFIG = {
  positive: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  neutral: { color: 'text-slate-400', bg: 'bg-slate-700/50 border-slate-600/30', icon: <Info className="w-3.5 h-3.5" /> },
  negative: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: <AlertCircle className="w-3.5 h-3.5" /> },
}

const CATEGORY_COLORS: Record<string, string> = {
  FDA: 'bg-blue-500/20 text-blue-300',
  Research: 'bg-indigo-500/20 text-indigo-300',
  Market: 'bg-emerald-500/20 text-emerald-300',
  Regulatory: 'bg-amber-500/20 text-amber-300',
  Clinical: 'bg-purple-500/20 text-purple-300',
}

export default function MarketPulse() {
  const [data, setData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  async function fetchPulse() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/market-pulse')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
      setLastFetched(new Date())
    } catch {
      setError('Could not load market pulse. Try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPulse()
  }, [])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-500/10 to-transparent">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h2 className="font-semibold text-white">Market Pulse</h2>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">AI</span>
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchPulse}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading peptide market pulse...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Trending peptides */}
            {data.trendingPeptides?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Trending Peptides
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.trendingPeptides.map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-medium"
                    >
                      <FlaskConical className="w-3 h-3" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Headlines */}
            {data.headlines?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Latest Headlines · {data.lastUpdated}
                </p>
                <div className="space-y-3">
                  {data.headlines.map((h, i) => {
                    const cfg = SENTIMENT_CONFIG[h.sentiment] ?? SENTIMENT_CONFIG.neutral
                    return (
                      <div
                        key={i}
                        className={`rounded-xl p-4 border ${cfg.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`${cfg.color} mt-0.5 shrink-0`}>{cfg.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-white leading-tight">{h.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[h.category] ?? 'bg-slate-700 text-slate-300'}`}>
                                {h.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{h.summary}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* FDA Watch */}
            {data.fdaWatch?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    FDA Watch
                  </p>
                  <Link href="/regulatory" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    Full status page <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {data.fdaWatch.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-900/50 rounded-lg px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{item.peptide}</p>
                          <span className="text-xs text-slate-500">{item.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.update}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-600 text-center">
              AI-generated summary · For informational purposes only · Not financial or medical advice
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
