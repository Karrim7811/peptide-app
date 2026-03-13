'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  Star,
  Filter,
  Trash2,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { ALL_PEPTIDES as PEPTIDE_NAMES } from '@/lib/peptides'

interface SideEffect {
  id: string
  user_id: string
  peptide_name: string
  effect: string
  severity: number
  notes: string | null
  logged_at: string
  created_at: string
}

type SeverityFilter = 'all' | 'mild' | 'moderate' | 'severe'

function getSeverityConfig(severity: number) {
  if (severity <= 2)
    return {
      label: 'Mild',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      starColor: 'text-emerald-400',
    }
  if (severity === 3)
    return {
      label: 'Moderate',
      color: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      starColor: 'text-amber-400',
    }
  return {
    label: 'Severe',
    color: 'text-red-400',
    bg: 'bg-red-500/15 border-red-500/30',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/40',
    starColor: 'text-red-400',
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getLocalDatetimeDefault(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function PeptideAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(
    () =>
      value.trim()
        ? PEPTIDE_NAMES.filter((p) => p.toLowerCase().includes(value.toLowerCase()))
        : PEPTIDE_NAMES,
    [value]
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? 'Search peptide...'}
          className="pr-8"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0AAA0] pointer-events-none" />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 top-full mt-1 w-full bg-white border border-[#D0CCC6] rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {suggestions.map((p) => (
            <button
              key={p}
              type="button"
              onMouseDown={() => {
                onChange(p)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-[#3A3730] hover:bg-[#F2F0ED] hover:text-[#1A1915] transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const cfg = getSeverityConfig(value)

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
            aria-label={`Severity ${star}`}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hovered || value)
                  ? hovered
                    ? getSeverityConfig(hovered).starColor
                    : cfg.starColor
                  : 'text-[#B0AAA0]'
              }`}
              fill={star <= (hovered || value) ? 'currentColor' : 'none'}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
          {cfg.label}
        </span>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  peptide_name: '',
  effect: '',
  severity: 1,
  notes: '',
  logged_at: '',
}

export default function SideEffectsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [logs, setLogs] = useState<SideEffect[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM, logged_at: getLocalDatetimeDefault() })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterPeptide, setFilterPeptide] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState<SeverityFilter>('all')

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
      .from('side_effects')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })

    const fetched = data ?? []
    setLogs(fetched)
    setShowForm(fetched.length === 0)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Unique peptides that have entries (for filter dropdown)
  const uniquePeptides = useMemo(
    () => Array.from(new Set(logs.map((l) => l.peptide_name))).sort(),
    [logs]
  )

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterPeptide !== 'all' && log.peptide_name !== filterPeptide) return false
      if (filterSeverity === 'mild' && log.severity > 2) return false
      if (filterSeverity === 'moderate' && log.severity !== 3) return false
      if (filterSeverity === 'severe' && log.severity < 4) return false
      return true
    })
  }, [logs, filterPeptide, filterSeverity])

  // Summary stats
  const summary = useMemo(() => {
    if (logs.length === 0) return null
    const counts: Record<string, number> = {}
    let totalSeverity = 0
    logs.forEach((l) => {
      counts[l.peptide_name] = (counts[l.peptide_name] ?? 0) + 1
      totalSeverity += l.severity
    })
    const mostAffected = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return {
      total: logs.length,
      mostAffectedName: mostAffected[0],
      mostAffectedCount: mostAffected[1],
      avgSeverity: (totalSeverity / logs.length).toFixed(1),
    }
  }, [logs])

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!form.peptide_name.trim()) {
      setFormError('Please select a peptide.')
      return
    }
    if (!form.effect.trim()) {
      setFormError('Please describe the side effect.')
      return
    }

    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setFormError('Not authenticated.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('side_effects').insert({
      user_id: user.id,
      peptide_name: form.peptide_name.trim(),
      effect: form.effect.trim(),
      severity: form.severity,
      notes: form.notes.trim() || null,
      logged_at: form.logged_at
        ? new Date(form.logged_at).toISOString()
        : new Date().toISOString(),
    })

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    setForm({ ...EMPTY_FORM, logged_at: getLocalDatetimeDefault() })
    setShowForm(false)
    setSaving(false)
    fetchLogs()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this log entry?')) return
    setDeletingId(id)
    await supabase.from('side_effects').delete().eq('id', id)
    setDeletingId(null)
    fetchLogs()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-[#B0AAA0] hover:text-[#1A1915] hover:bg-white transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1915] flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-[#1A8A9E]" />
              Side Effect Log
            </h1>
            <p className="text-[#B0AAA0] mt-0.5 text-sm">
              Track and monitor side effects from your peptides.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm((prev) => !prev)
            setFormError('')
          }}
          className="flex items-center gap-2 bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915] font-semibold px-4 py-2 rounded-lg transition-colors text-sm shrink-0"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Log Effect
            </>
          )}
        </button>
      </div>

      {/* Summary Banner */}
      {!loading && summary && (
        <div className="bg-white border border-[#E8E5E0] rounded-xl px-5 py-4">
          <p className="text-sm text-[#3A3730]">
            <span className="text-[#1A1915] font-semibold">{summary.total}</span> total{' '}
            {summary.total === 1 ? 'event' : 'events'} logged
            <span className="mx-2 text-[#B0AAA0]">·</span>
            Most affected:{' '}
            <span className="text-[#1A8A9E] font-medium">{summary.mostAffectedName}</span>
            {' '}
            <span className="text-[#B0AAA0]">({summary.mostAffectedCount} {summary.mostAffectedCount === 1 ? 'event' : 'events'})</span>
            <span className="mx-2 text-[#B0AAA0]">·</span>
            Average severity:{' '}
            <span className="text-[#1A1915] font-semibold">{summary.avgSeverity}</span>
            <span className="text-[#B0AAA0]">/5</span>
          </p>
        </div>
      )}

      {/* Log New Form */}
      {showForm && (
        <div className="bg-white border border-[#1A8A9E]/30 rounded-xl p-6">
          <h2 className="text-base font-semibold text-[#1A1915] mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#1A8A9E]" />
            Log a Side Effect
          </h2>
          <form onSubmit={handleLog} className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3A3730] mb-2">
                  Peptide <span className="text-red-400">*</span>
                </label>
                <PeptideAutocomplete
                  value={form.peptide_name}
                  onChange={(v) => setForm({ ...form, peptide_name: v })}
                  placeholder="e.g. BPC-157"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3A3730] mb-2">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={form.logged_at}
                  onChange={(e) => setForm({ ...form, logged_at: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Effect <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.effect}
                onChange={(e) => setForm({ ...form, effect: e.target.value })}
                placeholder="e.g. headache, water retention, fatigue..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Severity <span className="text-red-400">*</span>
              </label>
              <StarRating
                value={form.severity}
                onChange={(v) => setForm({ ...form, severity: v })}
              />
              <p className="text-xs text-[#B0AAA0] mt-1.5">
                1–2 = Mild &nbsp;·&nbsp; 3 = Moderate &nbsp;·&nbsp; 4–5 = Severe
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Notes <span className="text-[#B0AAA0]">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional context or observations..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#1A8A9E] hover:bg-[#1A8A9E] disabled:opacity-50 text-[#1A1915] font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Log Effect
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormError('')
                }}
                className="text-[#B0AAA0] hover:text-[#1A1915] px-4 py-2.5 rounded-lg hover:bg-[#F2F0ED] transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      {!loading && logs.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[#B0AAA0] text-sm shrink-0">
            <Filter className="w-4 h-4" />
            Filter:
          </div>

          {/* Peptide filter */}
          <div className="relative">
            <select
              value={filterPeptide}
              onChange={(e) => setFilterPeptide(e.target.value)}
              className="appearance-none pr-8 text-sm py-1.5 min-w-[160px]"
            >
              <option value="all">All Peptides</option>
              {uniquePeptides.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B0AAA0] pointer-events-none" />
          </div>

          {/* Severity filter */}
          <div className="flex gap-1.5">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'mild', label: 'Mild 1–2' },
                { key: 'moderate', label: 'Moderate 3' },
                { key: 'severe', label: 'Severe 4–5' },
              ] as { key: SeverityFilter; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterSeverity(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterSeverity === key
                    ? 'bg-[#1A8A9E] text-[#1A1915]'
                    : 'bg-white border border-[#E8E5E0] text-[#B0AAA0] hover:text-[#1A1915] hover:border-[#D0CCC6]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {(filterPeptide !== 'all' || filterSeverity !== 'all') && (
            <button
              onClick={() => {
                setFilterPeptide('all')
                setFilterSeverity('all')
              }}
              className="flex items-center gap-1 text-xs text-[#B0AAA0] hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1A8A9E] animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-14 text-center">
          <AlertCircle className="w-12 h-12 text-[#B0AAA0] mx-auto mb-3" />
          <p className="text-[#3A3730] font-medium mb-1">No side effects logged yet</p>
          <p className="text-[#B0AAA0] text-sm">
            Start tracking side effects from your peptides.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915] font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Log your first entry
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-10 text-center">
          <Filter className="w-10 h-10 text-[#B0AAA0] mx-auto mb-3" />
          <p className="text-[#B0AAA0]">No entries match the selected filters.</p>
          <button
            onClick={() => {
              setFilterPeptide('all')
              setFilterSeverity('all')
            }}
            className="mt-3 text-[#1A8A9E] hover:text-[#1A8A9E] text-sm transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <SideEffectCard
              key={log.id}
              log={log}
              onDelete={handleDelete}
              deleting={deletingId === log.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SideEffectCard({
  log,
  onDelete,
  deleting,
}: {
  log: SideEffect
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const cfg = getSeverityConfig(log.severity)

  return (
    <div className="bg-white border border-[#E8E5E0] rounded-xl px-5 py-4 flex gap-4 group hover:border-[#D0CCC6] transition-colors">
      {/* Severity indicator stripe */}
      <div
        className={`w-1 rounded-full shrink-0 self-stretch ${
          log.severity <= 2
            ? 'bg-emerald-500'
            : log.severity === 3
            ? 'bg-amber-500'
            : 'bg-red-500'
        }`}
      />

      <div className="flex-1 min-w-0 space-y-2">
        {/* Top row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Peptide chip */}
          <span className="text-xs bg-[#1A8A9E]/12 text-[#1A8A9E] px-2.5 py-0.5 rounded-full border border-[#1A8A9E]/30 font-medium">
            {log.peptide_name}
          </span>

          {/* Severity badge */}
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${cfg.badge}`}>
            <Star className="w-3 h-3" fill="currentColor" />
            {log.severity} · {cfg.label}
          </span>

          {/* Time */}
          <span className="text-xs text-[#B0AAA0] ml-auto">{timeAgo(log.logged_at)}</span>
        </div>

        {/* Effect description */}
        <p className="text-[#1A1915] font-semibold text-sm">{log.effect}</p>

        {/* Optional notes */}
        {log.notes && (
          <p className="text-[#B0AAA0] text-sm leading-relaxed">{log.notes}</p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(log.id)}
        disabled={deleting}
        className="p-1.5 text-[#B0AAA0] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0 self-start opacity-0 group-hover:opacity-100"
        title="Delete entry"
      >
        {deleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
