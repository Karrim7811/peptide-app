'use client'

import { useState, useTransition } from 'react'
import { logDose } from '@/app/dashboard/actions'
import { SITES, type StackEntry } from '@/lib/catalog'

interface LogDoseButtonProps {
  compoundId: string
  /** The user's entry, when they own this compound. Tier-blind — a locked
   *  compound is still theirs, and still loggable. */
  entry: StackEntry | null
}

/**
 * Logs a dose in place.
 *
 * Deliberately NOT tier-gated: the tier withholds resolution, never ownership.
 * A locked compound is still the user's, and recording what they took is not a
 * paid feature.
 */
export default function LogDoseButton({ compoundId, entry }: LogDoseButtonProps) {
  const [open, setOpen] = useState(false)
  const [site, setSite] = useState<string>(entry?.site && entry.site !== '—' ? entry.site : '')
  const [result, setResult] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!entry) {
    return (
      <span className="flex min-h-[44px] flex-1 basis-[130px] items-center justify-center bg-panel font-mono text-[9.5px] tracking-[0.1em] text-faintest">
        NOT IN YOUR STACK
      </span>
    )
  }

  const doseLabel = entry.doseMcg > 0 ? `${entry.doseMcg} mcg` : ''

  function submit() {
    setResult(null)
    startTransition(async () => {
      const outcome = await logDose({
        compoundId,
        dose: doseLabel,
        site: site || undefined,
      })
      if (outcome.ok) {
        setOpen(false)
        setResult('LOGGED')
      } else {
        setResult(outcome.error ?? 'Could not log that dose.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-[44px] flex-1 basis-[130px] items-center justify-center bg-panel font-mono text-[9.5px] tracking-[0.1em] text-dim hover:text-ink"
      >
        {result === 'LOGGED' && !open ? 'LOGGED ✓' : 'LOG A DOSE'}
      </button>

      {open && (
        <div className="flex w-full flex-col gap-[10px] bg-panel p-[14px]">
          <span className="font-mono text-[9px] tracking-[0.16em] text-faintest">
            {doseLabel ? `RECORDING ${doseLabel.toUpperCase()}` : 'RECORDING ONE DOSE'}
          </span>

          <div className="flex flex-wrap gap-px bg-hair">
            {SITES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSite(option.label)}
                aria-pressed={site === option.label}
                className={`min-h-[44px] flex-1 basis-[96px] px-2 font-mono text-[9px] tracking-[0.1em] ${
                  site === option.label ? 'bg-ink text-ground' : 'bg-panelHi text-dim hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex gap-px bg-hair">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="min-h-[44px] flex-1 bg-accent font-mono text-[9.5px] tracking-[0.14em] text-ground disabled:opacity-50"
            >
              {pending ? 'SAVING…' : 'CONFIRM'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-[44px] basis-[96px] bg-panelHi font-mono text-[9.5px] tracking-[0.14em] text-dim hover:text-ink"
            >
              CANCEL
            </button>
          </div>

          {result && result !== 'LOGGED' && (
            <span role="alert" className="font-mono text-[9.5px] tracking-[0.1em] text-gold">
              {result}
            </span>
          )}
        </div>
      )}
    </>
  )
}
