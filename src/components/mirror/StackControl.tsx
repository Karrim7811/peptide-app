'use client'

// Owning a compound: adding it, removing it, and recording the vial.
//
// Inventory is not bookkeeping here — vial size and what is left are the inputs
// the supply arithmetic reads. So the two live together: a compound you own is
// a vial you have.
//
// Kept to three questions, asked the way people mix and measure: vial size,
// water added, and how much per shot — in syringe units or mcg. Units are
// converted to mcg here from the mix (src/lib/mirror/mix.ts); only mcg is
// stored, so nothing new is written to the database. The water choices describe
// the solution, never an amount to take (CLAUDE.md §16.9, §16.9a).

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { addStackItem, removeStackItem, setInventory, setStackDose } from '@/app/dashboard/actions'
import type { Compound, StackEntry } from '@/lib/catalog'
import { NO_DOSE_LINE, doseSource, doseState } from '@/lib/dosing'
import {
  DEFAULT_WATER_ML,
  VIAL_SIZES_MG,
  WATER_CHOICES,
  amountToMcg,
  fmtMcg,
  mcgPerUnit,
  type Measure,
} from '@/lib/mirror/mix'

interface StackControlProps {
  compound: Compound
  /** Tier-blind — a locked compound is still owned, and still editable. */
  entry: StackEntry | null
  /** Start expanded — used when adding is the point of the view. */
  defaultOpen?: boolean
}

const num = (v: string) => Number.parseFloat(v)
const PRESET_VIALS: readonly number[] = VIAL_SIZES_MG

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-[44px] flex-1 basis-[90px] flex-col items-center justify-center gap-[2px] border px-2 py-2 text-center ${
        selected ? 'border-accent bg-panelHi text-ink' : 'border-hair bg-panel text-dim hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Question({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11px] tracking-[0.14em] text-faint">{children}</span>
}

const inputClass =
  'min-h-[44px] w-full border border-hair bg-panelHi px-3 font-mono text-[14px] text-ink outline-none focus:border-accent'

export default function StackControl({ compound, entry, defaultOpen = false }: StackControlProps) {
  // The bench's Edit link lands here with ?compound=<id>&edit=1.
  const params = useSearchParams()
  const editing = params?.get('edit') === '1' && params?.get('compound') === compound.id
  const [open, setOpen] = useState(defaultOpen || editing)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const startVial = entry && entry.vialMg > 0 ? entry.vialMg : 5
  const [vialChoice, setVialChoice] = useState<number | 'other'>(
    PRESET_VIALS.includes(startVial) ? startVial : 'other',
  )
  const [vialOther, setVialOther] = useState(PRESET_VIALS.includes(startVial) ? '' : String(startVial))
  const [waterChoice, setWaterChoice] = useState<number | 'other'>(DEFAULT_WATER_ML)
  const [waterOther, setWaterOther] = useState('')
  // An existing entry is stored in mcg and its mix is not, so it edits in mcg.
  const [measure, setMeasure] = useState<Measure>(entry ? 'mcg' : 'units')
  const [amount, setAmount] = useState(entry && entry.doseMcg > 0 ? String(entry.doseMcg) : '')
  const [opened, setOpened] = useState(Boolean(entry))
  const [remaining, setRemaining] = useState(
    entry && entry.vialMg > 0 ? String(Number(((entry.supply / 100) * entry.vialMg).toFixed(2))) : '',
  )

  const vialMg = vialChoice === 'other' ? num(vialOther) : vialChoice
  const waterMl = waterChoice === 'other' ? num(waterOther) : waterChoice
  const perUnit = mcgPerUnit(vialMg, waterMl)
  const amountNum = num(amount)
  const mcg = amountToMcg(amountNum, measure, vialMg, waterMl)

  // Only a published entry may render a figure; the rest render the sentence.
  const state = doseState(compound)
  const source = doseSource(compound)
  const reference = state === 'none' ? NO_DOSE_LINE : `${compound.dosage} — ${source.kind}: ${source.ref}`

  // What just happened, said plainly, with the two places people go next.
  // Saving used to just collapse the form, which read as nothing happening.
  const [done, setDone] = useState<string | null>(null)

  function run(work: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    setError(null)
    setDone(null)
    startTransition(async () => {
      const result = await work()
      if (result.ok) {
        setOpen(false)
        setDone(message)
      } else setError(result.error ?? 'Something went wrong.')
    })
  }

  function save() {
    if (!(vialMg > 0)) return setError('How big is the vial?')
    if (measure === 'units' && !(waterMl > 0)) return setError('How much water did you add?')
    const left = opened ? num(remaining) : vialMg
    if (!(Number.isFinite(left) && left >= 0)) return setError('About how much is left in the vial?')

    const dose = mcg > 0 ? String(Math.round(mcg * 10) / 10) : ''
    const notes =
      measure === 'units' && amountNum > 0
        ? `${amountNum} units per shot · ${vialMg} mg in ${waterMl} mL`
        : undefined

    run(async () => {
      const saved = entry
        ? dose
          ? await setStackDose({ compoundId: compound.id, dose, unit: 'mcg', notes })
          : { ok: true }
        : await addStackItem({ compoundId: compound.id, dose, unit: 'mcg', notes })
      if (!saved.ok) return saved
      return setInventory({ compoundId: compound.id, vialSizeMg: vialMg, quantityRemaining: left })
    }, entry ? `${compound.name} saved.` : `${compound.name} is on your bench.`)
  }

  return (
    <div className="flex flex-col gap-px bg-hair">
      <button
        type="button"
        onClick={() => {
          setDone(null)
          setOpen((prev) => !prev)
        }}
        aria-expanded={open}
        className="flex min-h-[44px] items-center justify-between bg-panel px-[18px] font-mono text-[9.5px] tracking-[0.14em] text-dim hover:text-ink"
      >
        <span>{entry ? 'YOUR VIAL · EDIT' : 'ADD TO YOUR STACK'}</span>
        <span className="text-faintest">{open ? '−' : '+'}</span>
      </button>

      {done && !open && (
        <div role="status" className="flex flex-col gap-3 bg-panelHi p-[18px]">
          <span className="font-display text-[20px] leading-[1.3] text-ink">✓ {done}</span>
          <div className="flex flex-wrap gap-px bg-hair">
            <Link
              href="/dashboard"
              className="flex min-h-[44px] flex-1 basis-[150px] items-center justify-center bg-accent font-mono text-[10px] tracking-[0.14em] text-ground"
            >
              ← BACK TO YOUR BENCH
            </Link>
            {/* A full load, not a client transition: the Mirror reads where to
                start only on mount, so a same-route Link would stay here. */}
            <a
              href="/mirror"
              className="flex min-h-[44px] flex-1 basis-[150px] items-center justify-center bg-panel font-mono text-[10px] tracking-[0.14em] text-ink hover:bg-panelHi"
            >
              + ADD ANOTHER PEPTIDE
            </a>
          </div>
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-[18px] bg-panel p-[18px]">
          {/* 1 — the vial */}
          <div className="flex flex-col gap-2">
            <Question>1 · HOW BIG IS THE VIAL?</Question>
            <div className="flex flex-wrap gap-2">
              {VIAL_SIZES_MG.map((mg) => (
                <Chip key={mg} selected={vialChoice === mg} onClick={() => setVialChoice(mg)}>
                  <span className="font-mono text-[13px]">{mg} mg</span>
                </Chip>
              ))}
              <Chip selected={vialChoice === 'other'} onClick={() => setVialChoice('other')}>
                <span className="font-mono text-[13px]">Other</span>
              </Chip>
            </div>
            {vialChoice === 'other' && (
              <input
                inputMode="decimal"
                value={vialOther}
                onChange={(e) => setVialOther(e.target.value)}
                placeholder="mg in the vial"
                aria-label="Vial size in mg"
                className={inputClass}
              />
            )}
          </div>

          {/* 2 — the water. Only needed to turn units into mcg. */}
          {measure === 'units' && (
            <div className="flex flex-col gap-2">
              <Question>2 · HOW MUCH BACTERIOSTATIC WATER DID YOU ADD?</Question>
              <div className="flex flex-wrap gap-2">
                {WATER_CHOICES.map((w) => (
                  <Chip key={w.ml} selected={waterChoice === w.ml} onClick={() => setWaterChoice(w.ml)}>
                    <span className="font-mono text-[13px]">{w.ml} mL</span>
                    <span className="text-[11px] leading-tight text-faint">{w.label}</span>
                    {vialMg > 0 && (
                      <span className="font-mono text-[10px] text-faint">
                        10 units = {fmtMcg(mcgPerUnit(vialMg, w.ml) * 10)} mcg
                      </span>
                    )}
                  </Chip>
                ))}
                <Chip selected={waterChoice === 'other'} onClick={() => setWaterChoice('other')}>
                  <span className="font-mono text-[13px]">Other</span>
                </Chip>
              </div>
              {waterChoice === 'other' && (
                <input
                  inputMode="decimal"
                  value={waterOther}
                  onChange={(e) => setWaterOther(e.target.value)}
                  placeholder="mL of water"
                  aria-label="Water added in mL"
                  className={inputClass}
                />
              )}
            </div>
          )}

          {/* 3 — per shot */}
          <div className="flex flex-col gap-2">
            <Question>{measure === 'units' ? '3' : '2'} · HOW MUCH PER SHOT?</Question>
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={measure === 'units' ? 'e.g. 20' : 'e.g. 250'}
                aria-label="Amount per shot"
                className={inputClass}
              />
              <div className="flex flex-shrink-0 gap-px bg-hair">
                {(['units', 'mcg'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMeasure(m)}
                    aria-pressed={measure === m}
                    className={`min-h-[44px] px-3 font-mono text-[10px] tracking-[0.12em] ${
                      measure === m ? 'bg-accent text-ground' : 'bg-panelHi text-dim hover:text-ink'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {measure === 'units' && amountNum > 0 && perUnit > 0 && (
              <span className="font-mono text-[11px] text-ink">
                {amountNum} units = {amountNum / 100} mL = {fmtMcg(mcg)} mcg
              </span>
            )}
            <span className="text-[12.5px] leading-[1.6] text-faint">
              <span className="font-mono text-[9px] tracking-[0.14em]">WHAT THE LIBRARY SAYS · </span>
              <span className={state === 'none' ? 'italic' : ''}>{reference}</span>
            </span>
          </div>

          {/* A new vial is full, so only ask what is left when it is not. */}
          {opened ? (
            <label className="flex flex-col gap-2">
              <Question>ABOUT HOW MUCH IS LEFT IN THE VIAL? (mg)</Question>
              <input
                inputMode="decimal"
                value={remaining}
                onChange={(e) => setRemaining(e.target.value)}
                placeholder={vialMg > 0 ? `up to ${vialMg}` : 'mg left'}
                className={inputClass}
              />
              {entry && (
                // Finishing one vial and opening the next is the common edit.
                <button
                  type="button"
                  onClick={() => setOpened(false)}
                  className="self-start font-mono text-[9.5px] tracking-[0.12em] text-accent underline hover:text-ink"
                >
                  STARTED A NEW VIAL
                </button>
              )}
            </label>
          ) : (
            <div className="flex flex-col gap-1">
              {entry && (
                <span className="font-mono text-[10px] tracking-[0.1em] text-ink">
                  NEW VIAL · {vialMg > 0 ? `${vialMg} mg` : ''} FULL
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpened(true)}
                className="self-start font-mono text-[9.5px] tracking-[0.12em] text-faint underline hover:text-ink"
              >
                NOT A NEW VIAL?
              </button>
            </div>
          )}

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
                onClick={() => run(() => removeStackItem(compound.id), `${compound.name} removed from your bench.`)}
                disabled={pending}
                className="min-h-[44px] basis-[130px] bg-panelHi font-mono text-[9.5px] tracking-[0.14em] text-gold hover:text-ink disabled:opacity-50"
              >
                REMOVE
              </button>
            )}
          </div>

          {entry && (
            <span className="font-mono text-[9px] leading-[1.8] tracking-[0.1em] text-faintest">
              REMOVING IT KEEPS YOUR DOSE HISTORY
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
