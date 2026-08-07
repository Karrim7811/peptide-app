'use client'

// Starting a cycle.
//
// The cycle is what "day 41 of 56" and the washout date are measured against,
// and what adherence is reported over. Nothing displays until one exists, so
// this is the entry point for the whole CYCLE tab.

import { useState, useTransition } from 'react'
import { startCycle } from '@/app/dashboard/actions'

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

export default function CycleControl() {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [onWeeks, setOnWeeks] = useState('8')
  const [offWeeks, setOffWeeks] = useState('4')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await startCycle({
        name,
        startDate,
        onWeeks: Number.parseInt(onWeeks, 10) || 0,
        offWeeks: Number.parseInt(offWeeks, 10) || 0,
      })
      if (!result.ok) setError(result.error ?? 'Could not start that cycle.')
    })
  }

  return (
    <div className="flex max-w-[520px] flex-col gap-[14px] bg-panel p-[18px]">
      <span className="font-mono text-[9px] leading-[1.8] tracking-[0.12em] text-faintest">
        DAY, LENGTH AND WASHOUT ARE ALL DERIVED FROM THESE · NOTHING IS STORED THAT COULD DRIFT
      </span>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] tracking-[0.16em] text-faint">CYCLE NAME</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Recovery block"
          className="min-h-[44px] border border-hair bg-panelHi px-3 font-sans text-[14px] text-ink outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] tracking-[0.16em] text-faint">START DATE</span>
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="min-h-[44px] border border-hair bg-panelHi px-3 font-mono text-[14px] text-ink outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-wrap gap-[10px]">
        <label className="flex min-w-[120px] flex-1 flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.16em] text-faint">ON · WEEKS</span>
          <input
            inputMode="numeric"
            value={onWeeks}
            onChange={(event) => setOnWeeks(event.target.value)}
            className="min-h-[44px] border border-hair bg-panelHi px-3 font-mono text-[14px] text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex min-w-[120px] flex-1 flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.16em] text-faint">OFF · WEEKS</span>
          <input
            inputMode="numeric"
            value={offWeeks}
            onChange={(event) => setOffWeeks(event.target.value)}
            className="min-h-[44px] border border-hair bg-panelHi px-3 font-mono text-[14px] text-ink outline-none focus:border-accent"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="min-h-[44px] bg-accent font-mono text-[9.5px] tracking-[0.14em] text-ground disabled:opacity-50"
      >
        {pending ? 'STARTING…' : 'START CYCLE'}
      </button>

      {error && (
        <span role="alert" className="font-mono text-[9.5px] tracking-[0.1em] text-gold">
          {error}
        </span>
      )}
    </div>
  )
}
