'use client'

// Layer-3 contextual tool: schedule a compound.
//
// Ported forward from src/app/reminders/page.tsx, condensed into an
// inline-expand control that matches LogDoseButton.tsx's pattern rather than
// its own route. The one thing carried over deliberately from the old page's
// intent, restated here because it is easy to lose once this is "just a
// reminder form": cadence is not merely a notification. mapping.ts reads
// days_of_week + time to derive expected doses, which is what turns a raw
// vial count into "N days left" on the field and in the region tiles. Adding
// a schedule here is what makes that number mean anything for this compound.

import { useState, useTransition } from 'react'
import { setReminder, removeReminder } from '@/app/dashboard/actions'
import type { CompoundRecords } from '@/lib/mirror/load'

interface RemindersToolProps {
  compoundId: string
  reminders: CompoundRecords['reminders']
  /** The action rejects a reminder for a compound not in the stack — this
   *  flag lets the UI explain that up front instead of surfacing the reject
   *  as a raw error after a submit. */
  inStack: boolean
}

const DAYS = [
  { label: 'SUN', value: 0 },
  { label: 'MON', value: 1 },
  { label: 'TUE', value: 2 },
  { label: 'WED', value: 3 },
  { label: 'THU', value: 4 },
  { label: 'FRI', value: 5 },
  { label: 'SAT', value: 6 },
] as const

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDays(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 7) return 'DAILY'
  return DAYS.filter((d) => daysOfWeek.includes(d.value))
    .map((d) => d.label)
    .join(' ')
}

export default function RemindersTool({ compoundId, reminders, inStack }: RemindersToolProps) {
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState('08:00')
  const [days, setDays] = useState<number[]>([])
  const [dose, setDose] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  function toggleDay(day: number) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    )
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const outcome = await setReminder({ compoundId, time, daysOfWeek: days, dose: dose || undefined })
      if (outcome.ok) {
        setTime('08:00')
        setDays([])
        setDose('')
      } else {
        setError(outcome.error ?? 'Could not save that reminder.')
      }
    })
  }

  function remove(id: string) {
    setError(null)
    setRemovingId(id)
    startTransition(async () => {
      const outcome = await removeReminder(id)
      if (!outcome.ok) setError(outcome.error ?? 'Could not remove that reminder.')
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
        <span>SCHEDULE{reminders.length ? ` · ${reminders.length}` : ''}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-[14px] bg-panel p-[14px]">
          <p className="text-[13px] leading-[1.7] text-dim">
            A schedule is not just a notification — it is the input the supply-days arithmetic reads. Add one and
            &ldquo;days left&rdquo; on this compound starts meaning something.
          </p>

          {reminders.length > 0 && (
            <div className="flex flex-col gap-px bg-hair">
              {reminders.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 bg-panelHi px-[12px] py-[10px]">
                  <span className="font-mono text-[12px] text-ink">{formatTime(r.time)}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] tracking-[0.1em] text-faint">
                    {formatDays(r.daysOfWeek)}
                  </span>
                  {r.dose && <span className="font-mono text-[9.5px] text-faintest">{r.dose}</span>}
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    disabled={pending && removingId === r.id}
                    className="flex min-h-[32px] items-center px-2 font-mono text-[9px] tracking-[0.1em] text-faintest hover:text-gold disabled:opacity-50"
                  >
                    {pending && removingId === r.id ? '…' : 'REMOVE'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!inStack ? (
            <p className="font-mono text-[9.5px] leading-[1.9] tracking-[0.06em] text-faintest">
              NOT IN YOUR STACK YET · ADD IT TO YOUR STACK FIRST, THEN SCHEDULE IT HERE
            </p>
          ) : (
            <div className="flex flex-col gap-[10px]">
              <div className="flex flex-wrap gap-[10px]">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="min-h-[44px] flex-shrink-0 bg-panelHi px-3 font-mono text-[13px] text-ink"
                />
                <input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="DOSE OVERRIDE (OPTIONAL)"
                  className="min-h-[44px] min-w-0 flex-1 basis-[160px] bg-panelHi px-3 font-mono text-[9.5px] tracking-[0.08em] text-ink placeholder:text-faintest"
                />
              </div>

              <div className="flex flex-wrap gap-px bg-hair">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    aria-pressed={days.includes(d.value)}
                    className={`min-h-[44px] flex-1 basis-[60px] font-mono text-[9px] tracking-[0.1em] ${
                      days.includes(d.value) ? 'bg-ink text-ground' : 'bg-panelHi text-dim hover:text-ink'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="min-h-[44px] bg-accent font-mono text-[9.5px] tracking-[0.14em] text-ground disabled:opacity-50"
              >
                {pending && !removingId ? 'SAVING…' : 'ADD REMINDER'}
              </button>
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
