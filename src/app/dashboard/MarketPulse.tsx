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
  neutral: { color: 'text-[#B0AAA0]', bg: 'bg-[#F2F0ED]/50 border-[#D0CCC6]/30', icon: <Info className="w-3.5 h-3.5" /> },
  negative: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: <AlertCircle className="w-3.5 h-3.5" /> },
}

const CATEGORY_COLORS: Record<string, string> = {
  FDA: 'bg-blue-500/20 text-blue-300',
  Research: 'bg-[#1A8A9E]/12 text-[#1A8A9E]',
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
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to fetch')
      setData(json)
      setLastFetched(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load market pulse. Try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPulse()
  }, [])

  return (
    <div className="bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E5E0] bg-gradient-to-r from-[#1A8A9E]/8 to-transparent">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#1A8A9E]" />
          <h2 className="font-semibold text-[#1A1915]">Market Pulse</h2>
          <span className="text-xs text-[#1A8A9E] bg-[#1A8A9E]/8 px-2 py-0.5 rounded-full">AI</span>
        </div>
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-xs text-[#B0AAA0] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchPulse}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#B0AAA0] hover:text-[#1A1915] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-[#1A8A9E] animate-spin" />
            <p className="text-[#B0AAA0] text-sm">Loading peptide market pulse...</p>
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
                <p className="text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                  Trending Peptides
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.trendingPeptides.map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A8A9E]/8 border border-[#1A8A9E]/20 rounded-full text-xs text-[#1A8A9E] font-medium"
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
                <p className="text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-3">
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
                              <p className="text-sm font-semibold text-[#1A1915] leading-tight">{h.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[h.category] ?? 'bg-[#F2F0ED] text-[#3A3730]'}`}>
                                {h.category}
                              </span>
                            </div>
                            <p className="text-xs text-[#B0AAA0]">{h.summary}</p>
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
                  <p className="text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider">
                    FDA Watch
                  </p>
                  <Link href="/regulatory" className="text-xs text-[#1A8A9E] hover:text-[#1A8A9E] flex items-center gap-1">
                    Full status page <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {data.fdaWatch.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-[#F2F0ED] rounded-lg px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#1A1915]">{item.peptide}</p>
                          <span className="text-xs text-[#B0AAA0]">{item.status}</span>
                        </div>
                        <p className="text-xs text-[#B0AAA0] mt-0.5">{item.update}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-[#B0AAA0] text-center">
              AI-generated summary · For informational purposes only · Not financial or medical advice
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
