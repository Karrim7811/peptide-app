'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { deleteDoseLog, logDose } from '@/app/dashboard/actions'
import { SITES, type StackEntry } from '@/lib/catalog'

interface LogDoseButtonProps {
  compoundId: string
  /** The user's entry, when they own this compound. Tier-blind — a locked
   *  compound is still theirs, and still loggable. */
  entry: StackEntry | null
}

/** How long Undo stays on offer after a dose is logged. */
const UNDO_MS = 10_000

/** What was just written, so Undo can remove exactly those rows. */
interface JustLogged {
  logId: string
  siteId?: string
  time: string
}

function clockTime(iso: string | undefined): string {
  const at = iso ? new Date(iso) : new Date()
  return at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Logs a dose in place.
 *
 * Deliberately NOT tier-gated: the tier withholds resolution, never ownership.
 * A locked compound is still the user's, and recording what they took is not a
 * paid feature.
 *
 * The bench's "Log dose" link lands here as ?compound=<id>&log=1, so the form
 * opens itself and scrolls into view — one tap from the bench instead of five.
 *
 * After CONFIRM it says what happened and when, and offers Undo for ten
 * seconds. A mis-tap used to be permanent; the Ledger's Delete covers anything
 * noticed later.
 */
export default function LogDoseButton({ compoundId, entry }: LogDoseButtonProps) {
  const params = useSearchParams()
  const arrivedToLog = params?.get('log') === '1' && params?.get('compound') === compoundId
  const [open, setOpen] = useState(arrivedToLog)
  const [site, setSite] = useState<string>(entry?.site && entry.site !== '—' ? entry.site : '')
  const [error, setError] = useState<string | null>(null)
  const [logged, setLogged] = useState<JustLogged | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [undone, setUndone] = useState(false)
  const [pending, startTransition] = useTransition()
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (arrivedToLog) buttonRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    // Only on arrival: the flag stays in the URL, and re-scrolling on every
    // render would fight the person's own scrolling. `arrivedToLog` is read
    // once, deliberately.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Undo expires rather than lingering, so an old confirmation cannot delete
  // a dose the person has since forgotten about.
  useEffect(() => {
    if (!canUndo) return
    const timer = setTimeout(() => setCanUndo(false), UNDO_MS)
    return () => clearTimeout(timer)
  }, [canUndo])

  if (!entry) {
    return (
      <span className="flex min-h-[44px] flex-1 basis-[130px] items-center justify-center bg-panel font-mono text-[9.5px] tracking-[0.1em] text-faintest">
        NOT IN YOUR STACK
      </span>
    )
  }

  const doseLabel = entry.doseMcg > 0 ? `${entry.doseMcg} mcg` : ''

  function submit() {
    setError(null)
    setUndone(false)
    startTransition(async () => {
      const outcome = await logDose({
        compoundId,
        dose: doseLabel,
        site: site || undefined,
      })
      if (outcome.ok) {
        setOpen(false)
        setLogged(
          outcome.logId
            ? { logId: outcome.logId, siteId: outcome.siteId, time: clockTime(outcome.takenAt) }
            : null,
        )
        setCanUndo(Boolean(outcome.logId))
      } else {
        setError(outcome.error ?? 'Could not log that dose.')
      }
    })
  }

  function undo() {
    if (!logged) return
    setError(null)
    startTransition(async () => {
      const outcome = await deleteDoseLog({ logId: logged.logId, siteId: logged.siteId })
      if (outcome.ok) {
        setLogged(null)
        setCanUndo(false)
        setUndone(true)
      } else {
        setError(outcome.error ?? 'Could not undo that dose.')
      }
    })
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-[44px] flex-1 basis-[130px] items-center justify-center bg-panel font-mono text-[9.5px] tracking-[0.1em] text-dim hover:text-ink"
      >
        {logged && !open ? 'LOGGED ✓' : 'LOG A DOSE'}
      </button>

      {(logged || undone) && !open && (
        <div
          role="status"
          className="flex w-full flex-wrap items-center justify-between gap-3 bg-panel px-[14px] py-[6px]"
        >
          <span className="font-mono text-[12px] text-ink">
            {logged ? `✓ Dose logged — ${logged.time}` : 'Dose removed from your log.'}
          </span>
          {logged && canUndo && (
            <button
              type="button"
              onClick={undo}
              disabled={pending}
              className="min-h-[44px] border border-hair bg-panelHi px-4 font-mono text-[12px] tracking-[0.1em] text-ink hover:border-accent disabled:opacity-50"
            >
              {pending ? 'UNDOING…' : 'UNDO'}
            </button>
          )}
        </div>
      )}

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
        </div>
      )}

      {error && (
        <span role="alert" className="w-full bg-panel px-[14px] py-2 font-mono text-[12px] tracking-[0.06em] text-gold">
          {error}
        </span>
      )}
    </>
  )
}
