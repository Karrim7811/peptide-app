'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  X,
  MapPin,
  Clock,
  Check,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InjectionSite {
  id: string
  user_id: string
  site: string
  peptide_name: string | null
  notes: string | null
  logged_at: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SITES = [
  'Left Abdomen',
  'Right Abdomen',
  'Left Thigh',
  'Right Thigh',
  'Left Deltoid',
  'Right Deltoid',
  'Left Glute',
  'Right Glute',
  'Left Lat',
  'Right Lat',
] as const

type SiteName = (typeof SITES)[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHrs = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDotColor(lastUsed: string | null): string {
  if (!lastUsed) return 'bg-slate-600'
  const diffHrs = (Date.now() - new Date(lastUsed).getTime()) / 3_600_000
  if (diffHrs < 24) return 'bg-red-500'
  if (diffHrs < 72) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SitesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [logs, setLogs] = useState<InjectionSite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<SiteName | null>(null)

  // Form state
  const [formPeptide, setFormPeptide] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formDatetime, setFormDatetime] = useState(toLocalDatetimeValue(new Date()))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('injection_sites')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(200)

    setLogs(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // ── Derived data ────────────────────────────────────────────────────────────

  // Map site → most recent log entry
  const lastUsedBySite: Record<string, InjectionSite | undefined> = {}
  for (const log of logs) {
    if (!lastUsedBySite[log.site]) {
      lastUsedBySite[log.site] = log
    }
  }

  // Rotation suggestion: the site(s) used least recently (or never)
  const rotationSuggestion = (() => {
    let oldest: { site: string; lastUsed: string | null; daysAgo: number | null } | null = null

    for (const site of SITES) {
      const last = lastUsedBySite[site]
      if (!last) {
        // Never used → top priority
        oldest = { site, lastUsed: null, daysAgo: null }
        break
      }
      const daysAgo = (Date.now() - new Date(last.logged_at).getTime()) / 86_400_000
      if (!oldest || oldest.daysAgo === null || daysAgo > (oldest.daysAgo ?? 0)) {
        oldest = { site, lastUsed: last.logged_at, daysAgo }
      }
    }
    return oldest
  })()

  // ── Form actions ────────────────────────────────────────────────────────────

  function openForm(site: SiteName) {
    setSelectedSite(site)
    setFormPeptide('')
    setFormNotes('')
    setFormDatetime(toLocalDatetimeValue(new Date()))
    setSaveError('')
    setJustSaved(false)
  }

  function closeForm() {
    setSelectedSite(null)
    setSaveError('')
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSite) return
    setSaving(true)
    setSaveError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaveError('Not authenticated.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('injection_sites').insert({
      user_id: user.id,
      site: selectedSite,
      peptide_name: formPeptide.trim() || null,
      notes: formNotes.trim() || null,
      logged_at: new Date(formDatetime).toISOString(),
    })

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1800)
    setSelectedSite(null)
    fetchLogs()
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const recentLogs = logs.slice(0, 20)

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-400" />
            Injection Site Tracker
          </h1>
          <p className="text-slate-400 mt-1">Rotate injection sites and log each session.</p>
        </div>
      </div>

      {/* ── Rotation Suggestion Banner ── */}
      {rotationSuggestion && (
        <div className="flex items-start gap-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl px-5 py-4">
          <RotateCcw className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-300">
            <span className="font-semibold text-indigo-200">Recommended next site: </span>
            {rotationSuggestion.site}
            {rotationSuggestion.daysAgo !== null
              ? ` (last used ${Math.round(rotationSuggestion.daysAgo)} day${Math.round(rotationSuggestion.daysAgo) === 1 ? '' : 's'} ago)`
              : ' (never used)'}
          </p>
        </div>
      )}

      {/* ── Body Site Grid ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Injection Sites
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {SITES.map((site) => {
              const last = lastUsedBySite[site]
              const isSelected = selectedSite === site
              const dotColor = getDotColor(last?.logged_at ?? null)

              return (
                <button
                  key={site}
                  onClick={() => (isSelected ? closeForm() : openForm(site))}
                  className={`relative text-left bg-slate-800 border rounded-xl px-4 py-3.5 transition-all group ${
                    isSelected
                      ? 'border-indigo-500 ring-1 ring-indigo-500/40'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white font-medium text-sm leading-snug">{site}</span>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                  </div>
                  <div className="mt-1.5 text-xs text-slate-500">
                    {last ? (
                      <span>Last: {formatDateTime(last.logged_at)}</span>
                    ) : (
                      <span className="text-slate-600">Never used</span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <X className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Inline Log Form ── */}
      {selectedSite && (
        <div className="bg-slate-800 border border-indigo-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Log Injection —{' '}
              <span className="text-indigo-300">{selectedSite}</span>
            </h2>
            <button
              onClick={closeForm}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleLog} className="space-y-4">
            {saveError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Peptide Name <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formPeptide}
                  onChange={(e) => setFormPeptide(e.target.value)}
                  placeholder="e.g. BPC-157"
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={formDatetime}
                  onChange={(e) => setFormDatetime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Dosage, reaction, batch number…"
                rows={2}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging…
                  </>
                ) : justSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Logged!
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Log Injection
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="text-slate-400 hover:text-white px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Rotation History ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Rotation History
          {recentLogs.length > 0 && (
            <span className="text-slate-600 font-normal">— last {recentLogs.length}</span>
          )}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No injections logged yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              Select a site above to record your first injection.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[17px] top-3 bottom-3 w-px bg-slate-700" />

            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start">
                  {/* Timeline dot */}
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 relative z-10">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  </div>

                  <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Site chip */}
                      <span className="inline-flex items-center gap-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {log.site}
                      </span>
                      {log.peptide_name && (
                        <span className="text-sm text-slate-300 font-medium">
                          {log.peptide_name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span>{formatDateTime(log.logged_at)}</span>
                      <span className="text-slate-600">·</span>
                      <span>{formatTimeAgo(log.logged_at)}</span>
                    </div>

                    {log.notes && (
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
