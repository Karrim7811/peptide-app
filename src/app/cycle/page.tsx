'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Plus,
  X,
  Layers,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Clock,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cycle {
  id: string
  user_id: string
  name: string
  peptide_names: string[]
  on_weeks: number
  off_weeks: number
  start_date: string // ISO date string YYYY-MM-DD
  status: 'on' | 'off' | 'completed'
  notes: string | null
  created_at: string
}

interface PhaseInfo {
  phase: 'ON' | 'OFF'
  daysElapsedInPhase: number
  totalPhaseDays: number
  daysRemaining: number
  progressPct: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysSince(dateStr: string): number {
  const start = new Date(dateStr)
  const now = new Date()
  // Use UTC to avoid DST shifts
  const diffMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  return Math.max(0, Math.floor(diffMs / 86400000))
}

function computePhase(cycle: Cycle): PhaseInfo {
  const onDays = cycle.on_weeks * 7
  const offDays = cycle.off_weeks * 7
  const totalCycleDays = onDays + offDays
  const elapsed = daysSince(cycle.start_date)
  const posInCycle = totalCycleDays > 0 ? elapsed % totalCycleDays : 0

  if (posInCycle < onDays) {
    const remaining = onDays - posInCycle
    return {
      phase: 'ON',
      daysElapsedInPhase: posInCycle,
      totalPhaseDays: onDays,
      daysRemaining: remaining,
      progressPct: Math.min(100, (posInCycle / onDays) * 100),
    }
  } else {
    const elapsedInOff = posInCycle - onDays
    const remaining = offDays - elapsedInOff
    return {
      phase: 'OFF',
      daysElapsedInPhase: elapsedInOff,
      totalPhaseDays: offDays,
      daysRemaining: remaining,
      progressPct: Math.min(100, (elapsedInOff / offDays) * 100),
    }
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PeptideChip({
  name,
  onRemove,
}: {
  name: string
  onRemove?: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1A8A9E]/12 text-[#1A8A9E] border border-[#1A8A9E]/30">
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-[#1A1915] transition-colors"
          aria-label={`Remove ${name}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

function PhaseBar({ pct, phase }: { pct: number; phase: 'ON' | 'OFF' }) {
  const color = phase === 'ON' ? 'bg-[#1A8A9E]' : 'bg-amber-500'
  return (
    <div className="w-full bg-[#F2F0ED] rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function ActiveCycleCard({
  cycle,
  onComplete,
  completing,
}: {
  cycle: Cycle
  onComplete: (id: string) => void
  completing: boolean
}) {
  const phase = computePhase(cycle)
  const isOn = phase.phase === 'ON'

  const phaseBadgeClass = isOn
    ? 'bg-green-500/20 text-green-300 border-green-500/40'
    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  const borderClass = isOn ? 'border-[#1A8A9E]/30' : 'border-amber-500/30'
  const gradientClass = isOn
    ? 'from-[#1A8A9E]/8 to-transparent'
    : 'from-amber-500/10 to-transparent'

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${borderClass}`}>
      {/* Card header */}
      <div className={`px-5 py-4 border-b border-[#E8E5E0] bg-gradient-to-r ${gradientClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#1A1915] leading-tight truncate">{cycle.name}</h3>
            {cycle.peptide_names.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {cycle.peptide_names.map((p) => (
                  <PeptideChip key={p} name={p} />
                ))}
              </div>
            )}
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${phaseBadgeClass}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}
            />
            {phase.phase} PHASE
          </span>
        </div>
      </div>

      {/* Progress section */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#B0AAA0]">
            Day {phase.daysElapsedInPhase + 1} of {phase.totalPhaseDays}
          </span>
          <span className={`font-semibold ${isOn ? 'text-[#1A8A9E]' : 'text-amber-300'}`}>
            {phase.daysRemaining} day{phase.daysRemaining !== 1 ? 's' : ''} remaining
          </span>
        </div>
        <PhaseBar pct={phase.progressPct} phase={phase.phase} />
        <div className="flex items-center gap-4 text-xs text-[#B0AAA0]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ON: {cycle.on_weeks}w &nbsp;·&nbsp; OFF: {cycle.off_weeks}w
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Started {new Date(cycle.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Notes */}
      {cycle.notes && (
        <div className="px-5 pb-3">
          <p className="text-xs text-[#B0AAA0] leading-relaxed">{cycle.notes}</p>
        </div>
      )}

      {/* Complete button */}
      <div className="px-5 pb-5">
        <button
          onClick={() => onComplete(cycle.id)}
          disabled={completing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F2F0ED] hover:bg-[#E8E5E0] disabled:opacity-50 disabled:cursor-not-allowed text-[#3A3730] hover:text-[#1A1915] text-sm font-medium transition-colors border border-[#D0CCC6]"
        >
          {completing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Mark as Completed
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CyclePage() {
  const router = useRouter()
  const supabase = createClient()

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add form state
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPeptides, setFormPeptides] = useState<string[]>([])
  const [formPeptideInput, setFormPeptideInput] = useState('')
  const [formOnWeeks, setFormOnWeeks] = useState('8')
  const [formOffWeeks, setFormOffWeeks] = useState('4')
  const [formStartDate, setFormStartDate] = useState(todayStr())
  const [formStatus, setFormStatus] = useState<'on' | 'off'>('on')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Completed section
  const [showCompleted, setShowCompleted] = useState(false)

  // Completing a cycle
  const [completing, setCompleting] = useState<string | null>(null)

  // ── Fetch cycles ──────────────────────────────────────────────────────────
  const fetchCycles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('cycles')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setCycles((data as Cycle[]) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cycles')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCycles()
  }, [fetchCycles])

  // ── Derived lists ─────────────────────────────────────────────────────────
  const activeCycles = cycles.filter((c) => c.status !== 'completed')
  const completedCycles = cycles.filter((c) => c.status === 'completed')

  // ── Complete a cycle ──────────────────────────────────────────────────────
  async function handleComplete(id: string) {
    setCompleting(id)
    try {
      const { error: err } = await supabase
        .from('cycles')
        .update({ status: 'completed' })
        .eq('id', id)
      if (err) throw err
      setCycles((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'completed' } : c))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete cycle')
    } finally {
      setCompleting(null)
    }
  }

  // ── Peptide tag input ─────────────────────────────────────────────────────
  function handlePeptideKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = formPeptideInput.trim()
      if (val && !formPeptides.includes(val)) {
        setFormPeptides((prev) => [...prev, val])
      }
      setFormPeptideInput('')
    } else if (e.key === 'Backspace' && !formPeptideInput && formPeptides.length > 0) {
      setFormPeptides((prev) => prev.slice(0, -1))
    }
  }

  function removePeptide(name: string) {
    setFormPeptides((prev) => prev.filter((p) => p !== name))
  }

  function resetForm() {
    setFormName('')
    setFormPeptides([])
    setFormPeptideInput('')
    setFormOnWeeks('8')
    setFormOffWeeks('4')
    setFormStartDate(todayStr())
    setFormStatus('on')
    setFormNotes('')
    setFormError('')
  }

  // ── Save new cycle ────────────────────────────────────────────────────────
  async function handleSaveCycle(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Cycle name is required.')
      return
    }
    setSaving(true)
    setFormError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        user_id: user.id,
        name: formName.trim(),
        peptide_names: formPeptides,
        on_weeks: parseInt(formOnWeeks) || 8,
        off_weeks: parseInt(formOffWeeks) || 4,
        start_date: formStartDate,
        status: formStatus,
        notes: formNotes.trim() || null,
      }

      const { data, error: err } = await supabase
        .from('cycles')
        .insert(payload)
        .select()
        .single()

      if (err) throw err

      setCycles((prev) => [data as Cycle, ...prev])
      resetForm()
      setShowForm(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save cycle')
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-[#E8E5E0] text-[#B0AAA0] hover:text-[#1A1915] hover:border-[#D0CCC6] transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A8A9E]/12 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-[#1A8A9E]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1915] leading-tight">Cycle Tracker</h1>
            <p className="text-[#B0AAA0] text-sm">Track your ON / OFF peptide cycles</p>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={() => {
            setShowForm((v) => !v)
            if (!showForm) resetForm()
          }}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915] text-sm font-semibold transition-colors shrink-0"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Cycle'}
        </button>
      </div>

      {/* Global error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 text-sm">
          {error}
        </div>
      )}

      {/* ── Add New Cycle Form ──────────────────────────────────────────────── */}
      {showForm && (
        <section className="bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[#E8E5E0] bg-gradient-to-r from-[#1A8A9E]/8 to-transparent">
            <Plus className="w-4 h-4 text-[#1A8A9E]" />
            <h2 className="text-base font-semibold text-[#1A1915]">Add New Cycle</h2>
          </div>

          <form onSubmit={handleSaveCycle} className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                Cycle Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. BPC-157 Healing Protocol"
                className="w-full bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-[#1A1915] placeholder-[#B0AAA0] focus:outline-none focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E] transition-colors text-sm"
              />
            </div>

            {/* Peptides multi-tag input */}
            <div>
              <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                Peptides
              </label>
              <div className="bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-3 py-2 focus-within:border-[#1A8A9E] focus-within:ring-1 focus-within:ring-[#1A8A9E] transition-colors min-h-[44px] flex flex-wrap gap-2 items-center">
                {formPeptides.map((p) => (
                  <PeptideChip key={p} name={p} onRemove={() => removePeptide(p)} />
                ))}
                <input
                  type="text"
                  value={formPeptideInput}
                  onChange={(e) => setFormPeptideInput(e.target.value)}
                  onKeyDown={handlePeptideKeyDown}
                  placeholder={formPeptides.length === 0 ? 'Type name + Enter to add…' : ''}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-[#1A1915] placeholder-[#B0AAA0] focus:outline-none"
                />
              </div>
              <p className="text-xs text-[#B0AAA0] mt-1">Press Enter or comma to add each peptide</p>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                  ON Duration (weeks)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formOnWeeks}
                  onChange={(e) => setFormOnWeeks(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-[#1A1915] focus:outline-none focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                  OFF Duration (weeks)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formOffWeeks}
                  onChange={(e) => setFormOffWeeks(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-[#1A1915] focus:outline-none focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Start date + current status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-[#1A1915] focus:outline-none focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E] transition-colors text-sm [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                  Currently
                </label>
                <div className="flex rounded-lg overflow-hidden border border-[#E8E5E0] h-[42px]">
                  <button
                    type="button"
                    onClick={() => setFormStatus('on')}
                    className={`flex-1 text-sm font-semibold transition-colors ${
                      formStatus === 'on'
                        ? 'bg-green-600 text-[#1A1915]'
                        : 'bg-[#FAFAF8] text-[#B0AAA0] hover:text-[#1A1915]'
                    }`}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('off')}
                    className={`flex-1 text-sm font-semibold transition-colors ${
                      formStatus === 'off'
                        ? 'bg-amber-600 text-[#1A1915]'
                        : 'bg-[#FAFAF8] text-[#B0AAA0] hover:text-[#1A1915]'
                    }`}
                  >
                    OFF
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                Notes
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional notes about this cycle…"
                rows={3}
                className="w-full bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-[#1A1915] placeholder-[#B0AAA0] focus:outline-none focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E] transition-colors text-sm resize-none"
              />
            </div>

            {formError && (
              <p className="text-red-400 text-sm">{formError}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A8A9E] hover:bg-[#1A8A9E] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1915] font-semibold transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Cycle
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {/* ── Active Cycles ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1A8A9E]" />
          <h2 className="text-base font-semibold text-[#1A1915]">Active Cycles</h2>
          {activeCycles.length > 0 && (
            <span className="ml-1 text-xs bg-[#1A8A9E]/12 text-[#1A8A9E] border border-[#1A8A9E]/30 px-2 py-0.5 rounded-full font-medium">
              {activeCycles.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-[#E8E5E0] rounded-2xl p-12 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-[#1A8A9E] animate-spin" />
            <p className="text-[#B0AAA0] text-sm">Loading cycles…</p>
          </div>
        ) : activeCycles.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E8E5E0] rounded-2xl p-12 text-center">
            <Layers className="w-10 h-10 text-[#3A3730] mx-auto mb-3" />
            <p className="text-[#B0AAA0] text-sm font-medium">No active cycles</p>
            <p className="text-[#B0AAA0] text-xs mt-1">Add a new cycle to start tracking</p>
          </div>
        ) : (
          activeCycles.map((cycle) => (
            <ActiveCycleCard
              key={cycle.id}
              cycle={cycle}
              onComplete={handleComplete}
              completing={completing === cycle.id}
            />
          ))
        )}
      </section>

      {/* ── Completed Cycles ──────────────────────────────────────────────────── */}
      {completedCycles.length > 0 && (
        <section className="bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F2F0ED]/40 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#3A3730]">
              <Check className="w-4 h-4 text-[#B0AAA0]" />
              Completed Cycles
              <span className="text-xs bg-[#F2F0ED] text-[#B0AAA0] border border-[#D0CCC6] px-2 py-0.5 rounded-full font-medium">
                {completedCycles.length}
              </span>
            </span>
            {showCompleted ? (
              <ChevronUp className="w-4 h-4 text-[#B0AAA0]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#B0AAA0]" />
            )}
          </button>

          {showCompleted && (
            <div className="border-t border-[#E8E5E0] divide-y divide-slate-700/60">
              {completedCycles.map((cycle) => (
                <div key={cycle.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#3A3730] truncate">{cycle.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {cycle.peptide_names.map((p) => (
                        <PeptideChip key={p} name={p} />
                      ))}
                    </div>
                    <p className="text-xs text-[#B0AAA0] mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Started {new Date(cycle.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      &nbsp;·&nbsp; {cycle.on_weeks}w ON / {cycle.off_weeks}w OFF
                    </p>
                    {cycle.notes && (
                      <p className="text-xs text-[#B0AAA0] mt-1 leading-relaxed">{cycle.notes}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs bg-[#F2F0ED] text-[#B0AAA0] border border-[#D0CCC6] px-2.5 py-1 rounded-full font-medium">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
