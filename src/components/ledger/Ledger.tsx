'use client'

// The Ledger — the plain, sortable record.
//
// Everywhere else in the Mirror is atmosphere: particles, breathing glows,
// narration. The Ledger deliberately drops all of it. Per the design handoff
// (Peptide Cortex Mirror.dc.html, ~line 507): "The form is for understanding.
// The Ledger is for proving. Records get no atmosphere, no motion and no
// interpretation — they are searchable, sortable and boring on purpose."
//
// CRITICAL: the record itself is TIER-BLIND. History is an ownership-facing
// surface — the tier withholds resolution, never ownership — and the pricing
// page lists the dose log and injection-site record as open on Free. So this
// reads `ent.history()`, not a `held()`-filtered log.
//
// What IS gated is the maths built on that history: rotation counts and supply
// comparison, which filter through `ent.siteUsage()`. The two are supposed to
// disagree — a free user sees every row they logged, and fewer rotation counts.
// Never reimplement either check locally; always go through the accessor.
//
// Esc closes this overlay via the shell's nav hook (useMirrorNav), which
// already listens for Escape and calls onClose through setLedgerOpen(false).
// This component must NOT add its own `keydown` listener — that would
// double-handle the same keystroke.

import { useMemo, useState } from 'react'
import { COMPOUNDS } from '@/lib/catalog'
import type { Entitlements } from '@/lib/entitlement'

interface LedgerProps {
  ent: Entitlements
  onClose: () => void
}

type SortKey = 'when' | 'name' | 'dose' | 'site'
type SortDir = 'asc' | 'desc'

interface Row {
  when: string
  name: string
  dose: string
  site: string
  whenSort: number
  doseSort: number
}

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
}

/** "06 AUG 07:34" -> a comparable timestamp. Year is arbitrary — only relative
 *  order within the log matters, and every row shares the same format. */
function whenToSortable(when: string): number {
  const m = /^(\d{1,2})\s+([A-Z]{3})\s+(\d{1,2}):(\d{2})$/.exec(when.trim())
  if (!m) return 0
  const [, day, mon, hh, mm] = m
  const month = MONTHS[mon] ?? 0
  return Date.UTC(2000, month, Number(day), Number(hh), Number(mm))
}

/** "250 mcg" / "2 mg" -> a comparable mcg value, so 2 mg sorts above 250 mcg. */
function doseToSortable(dose: string): number {
  const m = /([\d.]+)\s*(mcg|mg)/i.exec(dose)
  if (!m) return 0
  const value = parseFloat(m[1])
  return m[2].toLowerCase() === 'mg' ? value * 1000 : value
}

const ROUTES = ['/log', '/reminders', '/inventory', '/side-effects', '/notes', '/cycle', '/sites', '/bloodwork']

const DATA_NOTE =
  'STACK → stack_items · LOG → dose_logs · LABS → bloodwork_results · CYCLE → cycles · SITES → injection_sites'

const COLUMNS: ReadonlyArray<{ key: SortKey; label: string; width: string }> = [
  { key: 'when', label: 'WHEN', width: '120px' },
  { key: 'name', label: 'COMPOUND', width: 'auto' },
  { key: 'dose', label: 'DOSE', width: '110px' },
  { key: 'site', label: 'SITE', width: '90px' },
]

export default function Ledger({ ent, onClose }: LedgerProps) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('when')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // The user's live history, tier-blind. The Ledger is the record of what they
  // took, and the tier withholds resolution rather than ownership — the pricing
  // page lists the dose log as open on Free. Rotation and supply comparison are
  // the surfaces that filter, and they do so through siteUsage().
  const rows = useMemo<Row[]>(() => {
    return ent.history().map((entry) => ({
      when: entry.when,
      name: COMPOUNDS[entry.id]?.name ?? entry.id,
      dose: entry.dose,
      site: entry.site,
      whenSort: whenToSortable(entry.when),
      doseSort: doseToSortable(entry.dose),
    }))
  }, [ent])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = q
      ? rows.filter(
          (row) =>
            row.name.toLowerCase().includes(q) ||
            row.site.toLowerCase().includes(q) ||
            row.dose.toLowerCase().includes(q) ||
            row.when.toLowerCase().includes(q),
        )
      : rows

    const dir = sortDir === 'asc' ? 1 : -1
    return [...matched].sort((a, b) => {
      switch (sortKey) {
        case 'when':
          return (a.whenSort - b.whenSort) * dir
        case 'dose':
          return (a.doseSort - b.doseSort) * dir
        case 'name':
          return a.name.localeCompare(b.name) * dir
        case 'site':
          return a.site.localeCompare(b.site) * dir
        default:
          return 0
      }
    })
  }, [rows, query, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'when' ? 'desc' : 'asc')
    }
  }

  // Inventory feed — tier-blind ownership (Rule 2: ownership never hides
  // behind the tier gate). `ent.owned()` is the ground truth for what the user
  // owns; `ent.held()` only decides whether a row's real numbers are readable
  // or withheld as LOCKED, exactly as the handoff's inventory panel does.
  const inventory = useMemo(() => {
    return [...ent.owned()]
      .sort((a, b) => a.supplyDays - b.supplyDays)
      .map((entry) => {
        const compound = COMPOUNDS[entry.id]
        const held = ent.held(entry.id)
        return {
          id: entry.id,
          name: `${compound?.name ?? entry.id} ${entry.vialMg} mg`,
          left: held ? `${entry.supplyDays} DAYS` : 'LOCKED',
          pct: held ? Math.max(0, Math.min(100, entry.supply)) : 0,
          thin: held && entry.supplyDays <= 7,
        }
      })
  }, [ent])

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ground">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-hair px-[14px] py-3">
        <span className="font-mono text-[11px] tracking-[0.24em] text-ink">LEDGER</span>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-[44px] items-center border border-hair px-4 font-mono text-[10px] tracking-[0.14em] text-dim hover:border-accent hover:text-ink"
        >
          CLOSE · ESC
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-wrap overflow-auto">
        {/* Dose log — sortable, searchable table */}
        <div className="flex flex-[1_1_460px] min-w-[300px] flex-col gap-4 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-display text-[28px] font-light leading-none text-ink">Dose log</span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-faint">
              {filteredRows.length} {filteredRows.length === 1 ? 'ENTRY' : 'ENTRIES'}
            </span>
          </div>

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the record — compound, dose, site…"
            className="min-h-[44px] border border-hair bg-panel px-3 font-mono text-[12px] text-ink placeholder:text-faintest focus:border-accent focus:outline-none"
          />

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hair">
                  {COLUMNS.map((col) => {
                    const active = sortKey === col.key
                    return (
                      <th key={col.key} style={{ width: col.width }} className="p-0">
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={`flex min-h-[44px] w-full items-center gap-1 whitespace-nowrap px-2 font-mono text-[10px] tracking-[0.14em] ${
                            active ? 'text-ink' : 'text-faint hover:text-dim'
                          }`}
                          aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          {col.label}
                          <span className="text-[9px]" aria-hidden>
                            {active ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                          </span>
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr key={`${row.when}-${row.name}-${i}`} className="border-b border-hair">
                    <td className="px-2 py-3 font-mono text-[11px] text-faint">{row.when}</td>
                    <td className="px-2 py-3 font-sans text-[14px] text-ink">{row.name}</td>
                    <td className="whitespace-nowrap px-2 py-3 font-mono text-[12px] text-dim">
                      {row.dose}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right font-mono text-[10px] text-faintest">
                      {row.site}
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-8 text-center font-mono text-[11px] text-faint">
                      {rows.length === 0 ? 'NOTHING RESOLVED YET' : 'NO MATCHES'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <span className="font-mono text-[10px] tracking-[0.1em] text-faint">
            A LOCKED COMPOUND&rsquo;S ROWS NEVER APPEAR HERE ON FREE
          </span>
        </div>

        {/* Inventory + explanation + provenance */}
        <div className="flex flex-[1_1_340px] min-w-[300px] flex-col gap-6 border-l border-hair p-6">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[9px] tracking-[0.24em] text-faint">
              INVENTORY · WHAT FEEDS THE TENSION
            </span>
            <div className="flex flex-col gap-px bg-hair">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex min-h-[44px] items-center gap-3 bg-panel px-[15px] py-3"
                >
                  <span className="min-w-0 flex-1 truncate text-[14.5px] text-ink">{item.name}</span>
                  <div className="h-1 w-[78px] flex-shrink-0 bg-hair">
                    <div
                      className={`h-full ${item.thin ? 'bg-hue-go' : 'bg-faint'}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <span
                    className={`w-[62px] flex-shrink-0 text-right font-mono text-[10.5px] ${
                      item.thin ? 'text-hue-go' : 'text-faint'
                    }`}
                  >
                    {item.left}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[11px]">
            <span className="font-mono text-[9px] tracking-[0.24em] text-faint">WHY THE LEDGER IS PLAIN</span>
            <span className="text-[14.5px] leading-[1.8] text-dim">
              The form is for understanding. The Ledger is for proving. Records get no atmosphere,
              no motion and no interpretation — they are searchable, sortable and boring on
              purpose.
            </span>
          </div>

          <div className="flex flex-col gap-[10px]">
            <span className="font-mono text-[9px] tracking-[0.24em] text-faint">WHERE THIS DATA LIVES</span>
            <div className="flex flex-wrap gap-[6px]">
              {ROUTES.map((route) => (
                <span
                  key={route}
                  className="border border-hair px-[10px] py-[9px] font-mono text-[10px] tracking-[0.08em] text-dim"
                >
                  {route}
                </span>
              ))}
            </div>
            <span className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">
              {DATA_NOTE}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
