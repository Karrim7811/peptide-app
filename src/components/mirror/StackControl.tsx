'use client'

// Owning a compound: adding it, removing it, and recording the vial.
//
// Inventory is not bookkeeping here — vial size and quantity remaining are the
// inputs the supply arithmetic reads. Without them, "4 days of supply against
// 15 days left in the cycle" has nothing behind it, and the field cannot show
// tension. So the two live together: a compound you own is a vial you have.

import { useState, useTransition } from 'react'
import { addStackItem, removeStackItem, setInventory } from '@/app/dashboard/actions'
import type { Compound, StackEntry } from '@/lib/catalog'

interface StackControlProps {
  compound: Compound
  /** Tier-blind — a locked compound is still owned, and still editable. */
  entry: StackEntry | null
}

export default function StackControl({ compound, entry }: StackControlProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [dose, setDose] = useState(entry && entry.doseMcg > 0 ? String(entry.doseMcg) : '')
  const [vialMg, setVialMg] = useState(entry && entry.vialMg > 0 ? String(entry.vialMg) : '')
  const [remaining, setRemaining] = useState(
    entry && entry.vialMg > 0 ? String(((entry.supply / 100) * entry.vialMg).toFixed(2)) : '',
  )

  function run(work: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await work()
      if (result.ok) setOpen(false)
      else setError(result.error ?? 'Something went wrong.')
    })
  }

  function save() {
    run(async () => {
      if (!entry) {
        const added = await addStackItem({ compoundId: compound.id, dose, unit: 'mcg' })
        if (!added.ok) return added
      }
      const vial = Number.parseFloat(vialMg)
      const left = Number.parseFloat(remaining)
      if (Number.isFinite(vial) && vial > 0 && Number.isFinite(left) && left >= 0) {
        return setInventory({
          compoundId: compound.id,
          vialSizeMg: vial,
          quantityRemaining: left,
        })
      }
      return { ok: true }
    })
  }

  return (
    <div className="flex flex-col gap-px bg-hair">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-[44px] items-center justify-between bg-panel px-[18px] font-mono text-[9.5px] tracking-[0.14em] text-dim hover:text-ink"
      >
        <span>{entry ? 'YOUR VIAL · EDIT' : 'ADD TO YOUR STACK'}</span>
        <span className="text-faintest">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-[14px] bg-panel p-[18px]">
          <span className="font-mono text-[9px] leading-[1.8] tracking-[0.12em] text-faintest">
            VIAL SIZE AND WHAT IS LEFT ARE WHAT THE SUPPLY ARITHMETIC READS · WITHOUT THEM THE
            FIELD CANNOT SHOW THIS COMPOUND THINNING
          </span>

          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] tracking-[0.16em] text-faint">
              AMOUNT YOU RECORD PER DOSE · mcg
            </span>
            <input
              inputMode="decimal"
              value={dose}
              onChange={(event) => setDose(event.target.value)}
              placeholder="e.g. 250"
              className="min-h-[44px] border border-hair bg-panelHi px-3 font-mono text-[14px] text-ink outline-none focus:border-accent"
            />
          </label>

          <div className="flex flex-wrap gap-[10px]">
            <label className="flex min-w-[130px] flex-1 flex-col gap-1">
              <span className="font-mono text-[9px] tracking-[0.16em] text-faint">VIAL SIZE · mg</span>
              <input
                inputMode="decimal"
                value={vialMg}
                onChange={(event) => setVialMg(event.target.value)}
                placeholder="e.g. 5"
                className="min-h-[44px] border border-hair bg-panelHi px-3 font-mono text-[14px] text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="flex min-w-[130px] flex-1 flex-col gap-1">
              <span className="font-mono text-[9px] tracking-[0.16em] text-faint">REMAINING · mg</span>
              <input
                inputMode="decimal"
                value={remaining}
                onChange={(event) => setRemaining(event.target.value)}
                placeholder="e.g. 3.5"
                className="min-h-[44px] border border-hair bg-panelHi px-3 font-mono text-[14px] text-ink outline-none focus:border-accent"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-px bg-hair">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="min-h-[44px] flex-1 basis-[130px] bg-accent font-mono text-[9.5px] tracking-[0.14em] text-ground disabled:opacity-50"
            >
              {pending ? 'SAVING…' : entry ? 'SAVE' : 'ADD TO STACK'}
            </button>
            {entry && (
              <button
                type="button"
                onClick={() => run(() => removeStackItem(compound.id))}
                disabled={pending}
                className="min-h-[44px] basis-[130px] bg-panelHi font-mono text-[9.5px] tracking-[0.14em] text-gold hover:text-ink disabled:opacity-50"
              >
                REMOVE
              </button>
            )}
          </div>

          {entry && (
            <span className="font-mono text-[9px] leading-[1.8] tracking-[0.1em] text-faintest">
              REMOVING KEEPS YOUR DOSE HISTORY · THE RECORD IS NOT REWRITTEN
            </span>
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
