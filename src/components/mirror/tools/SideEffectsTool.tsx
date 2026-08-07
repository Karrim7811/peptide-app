'use client'

// Layer-3 contextual tool: log a side effect against a compound.
//
// Ported forward from src/app/side-effects/page.tsx into an inline-expand
// control matching LogDoseButton.tsx's pattern. This is the one tool in the
// set that is structurally different from the other two: it is NEVER
// tier-gated (see logSideEffect's doc comment in dashboard/actions.ts) and
// must never even appear to be. There is no lock icon, no "Pro" badge, no
// upgrade prompt anywhere in this file, on purpose — withholding a safety
// signal behind a paywall is the one thing this product must not do.

import { useMemo, useState, useTransition } from 'react'
import { logSideEffect, removeSideEffect } from '@/app/dashboard/actions'
import type { CompoundRecords } from '@/lib/mirror/load'

interface SideEffectsToolProps {
  compoundId: string
  sideEffects: CompoundRecords['sideEffects']
}

const SEVERITIES = [1, 2, 3, 4, 5] as const

function severityLabel(severity: number): string {
  if (severity <= 2) return 'MILD'
  if (severity === 3) return 'MODERATE'
  return 'SEVERE'
}

/** Background colour class for a severity level, full literal names so
 *  Tailwind's static scanner can find them (a `bg-${x}` template would not
 *  be picked up by content scanning). `go` also doubles as the field's
 *  tension colour (see grounds.ts) — reused here on purpose so a severe
 *  entry reads with the same urgency as a thinning supply. */
function severityBgClass(severity: number): string {
  if (severity <= 2) return 'bg-hue-gr'
  if (severity === 3) return 'bg-gold'
  return 'bg-hue-go'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

export default function SideEffectsTool({ compoundId, sideEffects }: SideEffectsToolProps) {
  const [open, setOpen] = useState(false)
  const [effect, setEffect] = useState('')
  const [severity, setSeverity] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Newest first. load.ts already orders by logged_at desc, but the tool
  // does not assume its caller preserved that order.
  const sorted = useMemo(
    () => [...sideEffects].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()),
    [sideEffects],
  )

  function submit() {
    setError(null)
    startTransition(async () => {
      const outcome = await logSideEffect({ compoundId, effect, severity, notes: notes || undefined })
      if (outcome.ok) {
        setEffect('')
        setSeverity(1)
        setNotes('')
      } else {
        setError(outcome.error ?? 'Could not log that effect.')
      }
    })
  }

  function remove(id: string) {
    setError(null)
    setRemovingId(id)
    startTransition(async () => {
      const outcome = await removeSideEffect(id)
      if (!outcome.ok) setError(outcome.error ?? 'Could not remove that entry.')
      setRemovingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-px bg-hair">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 bg-panel px-[14px] font-mono text-[9.5px] tracking-[0.1em] text-dim hover:text-ink"
      >
        <span>SIDE EFFECTS{sideEffects.length ? ` · ${sideEffects.length}` : ''}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-[14px] bg-panel p-[14px]">
          <div className="flex flex-col gap-[10px]">
            <input
              type="text"
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              placeholder="WHAT HAPPENED — E.G. HEADACHE, WATER RETENTION"
              className="min-h-[44px] bg-panelHi px-3 font-mono text-[9.5px] tracking-[0.06em] text-ink placeholder:text-faintest"
            />

            <div className="flex flex-col gap-[6px]">
              <span className="font-mono text-[9px] tracking-[0.22em] text-faint">SEVERITY</span>
              <div className="flex gap-px bg-hair">
                {SEVERITIES.map((s) => {
                  const active = severity === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      aria-pressed={active}
                      className={`min-h-[44px] flex-1 font-mono text-[12px] ${
                        active ? `${severityBgClass(s)} text-ground` : 'bg-panelHi text-dim hover:text-ink'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
              <span className="font-mono text-[9px] tracking-[0.06em] text-faintest">
                1–2 MILD · 3 MODERATE · 4–5 SEVERE
              </span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context (optional)"
              rows={2}
              className="w-full resize-none bg-panelHi p-3 text-[13.5px] leading-[1.6] text-ink placeholder:text-faintest"
            />

            <button
              type="button"
              onClick={submit}
              disabled={pending || !effect.trim()}
              className="min-h-[44px] bg-accent font-mono text-[9.5px] tracking-[0.14em] text-ground disabled:opacity-50"
            >
              {pending && !removingId ? 'SAVING…' : 'LOG EFFECT'}
            </button>
          </div>

          {sorted.length > 0 && (
            <div className="flex flex-col gap-px bg-hair">
              {sorted.map((s) => {
                const severe = s.severity >= 4
                return (
                  <div key={s.id} className="flex flex-col gap-[6px] bg-panelHi px-[12px] py-[10px]">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-[7px]">
                        <span
                          className={`h-[6px] w-[6px] flex-shrink-0 rounded-full ${severityBgClass(s.severity)}`}
                          style={severe ? { animation: 'cxpulse 2.4s ease-in-out infinite' } : undefined}
                          aria-hidden
                        />
                        <span className="font-mono text-[9.5px] tracking-[0.1em] text-ink">
                          {s.severity} · {severityLabel(s.severity)}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{s.effect}</span>
                      <span className="font-mono text-[9px] tracking-[0.1em] text-faintest">
                        {formatDate(s.loggedAt)}
                      </span>
                    </div>
                    {s.notes && <p className="text-[13px] leading-[1.6] text-dim">{s.notes}</p>}
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      disabled={pending && removingId === s.id}
                      className="self-start font-mono text-[9px] tracking-[0.1em] text-faintest hover:text-gold disabled:opacity-50"
                    >
                      {pending && removingId === s.id ? '…' : 'REMOVE'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {error && (
            <span role="alert" className="font-mono text-[9.5px] tracking-[0.1em] text-gold">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
