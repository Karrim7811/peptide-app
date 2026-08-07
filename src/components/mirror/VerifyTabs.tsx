'use client'

// The Mirror's Layer-4 verify surface — one tab's content at a time.
//
// MirrorShell already renders the THE MATH / THE RECORD / ROTATION / CYCLE tab
// buttons (see VERIFY_TABS in src/lib/mirror/useMirrorNav.ts); this component
// renders only what sits below them.
//
// Layer 4 drops ALL atmosphere on purpose — no particles, no motion, hard-edged
// data. It is the surface a user checks against the vial in their hand, so
// nothing here interprets; it shows the working.
//
// Ported from design_handoff_peptide_cortex/Peptide Cortex Mirror.dc.html,
// the tabMath / tabRotation / tabCycle blocks (~lines 138–243) and the math /
// rotation / cycle builders in renderVals() (~lines 1363–1444) — with two
// deliberate departures from the prototype, both dictated by the build brief:
//
//   1. THE RECORD is the compound's own dose log here, not the prototype's
//      "what the grade rests on" evidence block — that prose (purpose, action,
//      evidence level, effects, cautions, interactions, bottomLine) now lives
//      entirely in MirrorPanel's layer-3 compound view instead.
//   2. The cardiovascular score is shown exactly once across the whole surface
//      — in MirrorPanel's layer-3 view — so it is deliberately absent here to
//      avoid a second, driftable copy.
//
// THE MATH is never gated, for locked compounds too — it reads
// `ent.ownedEntry()`, which is tier-blind, never `ent.held()`.

import { useState } from 'react'
import { COMPOUNDS, type Compound, type StackEntry } from '@/lib/catalog'
import type { Entitlements } from '@/lib/entitlement'
import { hueVar } from '@/lib/design/grounds'
import type { VerifyTab } from '@/lib/mirror/useMirrorNav'

export interface VerifyTabsProps {
  tab: VerifyTab
  compoundId: string | null
  ent: Entitlements
}

function TabLabel({ children, color = 'var(--accent)' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="font-mono text-[9.5px] tracking-[0.28em]" style={{ color }}>
      {children}
    </span>
  )
}

function Headline({ children }: { children: React.ReactNode }) {
  return <span className="font-display text-[30px] font-light leading-[1.2] text-ink">{children}</span>
}

// ── THE MATH ──────────────────────────────────────────────────────────────
// Reconstitution arithmetic. NEVER gated — `entry` comes from `ownedEntry()`,
// which answers regardless of tier, so a locked compound's math still shows.
//
// ── Framing is load-bearing, not cosmetic ─────────────────────────────────
// Apple rejected the iOS app under Guideline 1.4.2 for a dose calculator, and
// the same exposure applies on the web under US law: a specific dose
// calculation directed at an individual is materially different from
// describing the chemistry of a solution. Per the resolved product decision
// (CLAUDE.md §16.9) the maths stays and the framing changes:
//
//   * ASK for the concentration being prepared, not "your dose".
//   * DESCRIBE what the resulting solution contains per unit on a U-100
//     syringe — a property of the liquid, not an instruction to a person.
//   * CARRY the disclaimer banner above the arithmetic, always.
//
// Do not reword these toward second-person dosing language ("draw X for your
// dose"). That is the exact edit that recreates the legal exposure.

const MATH_DISCLAIMER =
  'For research and reference purposes only. Not intended as dosing instructions for ' +
  'human or animal use. Consult a licensed physician before any medical decisions.'

function SolutionMath({ compound, entry }: { compound: Compound; entry: StackEntry }) {
  // Seeded from the stored volume when one exists; otherwise blank, so the
  // surface asks rather than invents.
  const [waterMl, setWaterMl] = useState<string>(entry.waterMl > 0 ? String(entry.waterMl) : '')

  const volume = Number.parseFloat(waterMl)
  const hasVolume = Number.isFinite(volume) && volume > 0
  const concentration = hasVolume ? entry.vialMg / volume : 0

  // The reference amount is what the user records for this compound. It is
  // described as a quantity of solution, never prescribed.
  const referenceMg = entry.doseMcg / 1000
  const perUnitMcg = hasVolume ? (concentration * 1000) / 100 : 0
  const volumeForReference = hasVolume && concentration > 0 ? referenceMg / concentration : 0
  const units = Math.round(volumeForReference * 100)
  const fitsSyringe = hasVolume && units > 0 && units <= 100
  const referenceLabel =
    entry.doseMcg >= 1000 ? `${entry.doseMcg / 1000} mg` : `${entry.doseMcg} mcg`

  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <div className="border-l-2 border-gold bg-panelHot px-[18px] py-[15px]">
        <p className="font-mono text-[10px] leading-[1.9] tracking-[0.08em] text-gold">
          {MATH_DISCLAIMER.toUpperCase()}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <TabLabel color="var(--gold)">SOLUTION CHEMISTRY · WORKING SHOWN</TabLabel>
        <Headline>
          {hasVolume
            ? `${concentration.toFixed(2)} mg per mL of solution`
            : `What volume are you preparing ${compound.name} at?`}
        </Headline>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.16em] text-faint">
          BACTERIOSTATIC WATER ADDED TO THE VIAL · mL
        </span>
        <input
          inputMode="decimal"
          value={waterMl}
          onChange={(event) => setWaterMl(event.target.value)}
          placeholder="e.g. 2"
          className="min-h-[44px] border border-hair bg-panelHi px-3 font-mono text-[14px] text-ink outline-none focus:border-accent"
        />
      </label>

      {!hasVolume ? (
        <span className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">
          NOTHING IN YOUR RECORD STORES THE MIXING VOLUME · ENTER IT TO SEE THE CONCENTRATION
        </span>
      ) : (
        <>
          <div className="flex flex-col gap-px bg-hair">
            <Row k="VIAL CONTENTS" v={`${entry.vialMg} mg`} />
            <Row k="WATER ADDED" v={`${volume} mL`} />
            <Row
              k={`CONCENTRATION · ${entry.vialMg} mg ÷ ${volume} mL`}
              v={`${concentration.toFixed(2)} mg / mL`}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-[6px] border-l-2 border-gold bg-panelHot px-[18px] py-[17px]">
              <span className="font-mono text-[11px] tracking-[0.08em] text-gold">
                EACH UNIT ON A U-100 SYRINGE CONTAINS
              </span>
              <span className="whitespace-nowrap font-mono text-[19px] text-gold">
                {perUnitMcg.toFixed(1)} mcg
              </span>
            </div>
          </div>

          {entry.doseMcg > 0 && (
            <div className="flex flex-col gap-[10px]">
              <span className="font-mono text-[10px] tracking-[0.22em] text-faint">
                THE {referenceLabel.toUpperCase()} YOU RECORD FOR THIS COMPOUND CORRESPONDS TO
              </span>
              <span className="font-mono text-[14px] text-dim">
                {volumeForReference.toFixed(2)} mL of this solution
                {fitsSyringe ? ` · ${units} units` : ''}
              </span>
              {fitsSyringe && (
                <div className="flex h-[44px] items-stretch border border-hair">
                  <div
                    className="border-r-2 border-gold"
                    style={{
                      width: `${Math.min(100, units)}%`,
                      backgroundColor: hueVar('go'),
                      opacity: 0.28,
                    }}
                  />
                  <div className="flex-1" />
                </div>
              )}
              {!fitsSyringe && units > 100 && (
                <span className="font-mono text-[10px] tracking-[0.08em] text-gold">
                  EXCEEDS ONE U-100 SYRINGE AT THIS CONCENTRATION
                </span>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">
          CHECK AGAINST YOUR VIAL LABEL · RESEARCH-GRADE COMPOUNDS ONLY · NOT A PRESCRIPTION
        </span>
        {compound.dosage && (
          <span className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faintest">
            LIBRARY DOSAGE FIELD · {compound.dosage.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}

function MathTab({ compound, entry }: { compound: Compound; entry: StackEntry | null }) {
  if (!entry) {
    return (
      <div className="flex max-w-[640px] flex-col gap-5">
        <div className="flex flex-col gap-2">
          <TabLabel color="var(--gold)">RECONSTITUTION · WORKING SHOWN</TabLabel>
          <Headline>No vial recorded for {compound.name}</Headline>
        </div>
        <div className="flex flex-col gap-px bg-hair">
          <Row k="IN YOUR STACK" v="no" />
          <Row k="LIBRARY DOSAGE FIELD" v={compound.dosage || 'N/A'} />
        </div>
        <span className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">
          ADD IT TO YOUR STACK TO SEE THE ARITHMETIC
        </span>
      </div>
    )
  }

  // Reconstitution volume is not stored anywhere — nothing in the schema
  // records how much water went into a vial — so it is ASKED FOR rather than
  // assumed. A default here would print a concentration the user never mixed.
  return <SolutionMath compound={compound} entry={entry} />
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-[6px] bg-panel px-[18px] py-[15px]">
      <span className="min-w-0 font-mono text-[11px] leading-[1.6] tracking-[0.08em] text-dim">{k}</span>
      <span className="whitespace-nowrap font-mono text-[15px] text-ink">{v}</span>
    </div>
  )
}

// ── THE RECORD ────────────────────────────────────────────────────────────
// The dose log for the focused compound. History is ownership-facing, not
// resolution-facing — it stays visible for a locked compound too (README:
// "the arithmetic and the record below stay open regardless").

function RecordTab({ compound, ent }: { compound: Compound; ent: Entitlements }) {
  // The user's live history, read through the accessor. Tier-blind: this is
  // the record of what they took, not a comparison the tier withholds.
  const entries = ent.history(compound.id)

  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <div className="flex flex-col gap-2">
        <TabLabel>THE RECORD · DOSE LOG</TabLabel>
        <Headline>
          {entries.length === 0
            ? `No doses logged for ${compound.name}.`
            : `${entries.length} logged dose${entries.length === 1 ? '' : 's'} for ${compound.name}.`}
        </Headline>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-col gap-px bg-hair">
          {entries.map((row, i) => (
            <div
              key={`${row.when}-${i}`}
              className="flex min-h-[44px] items-center gap-[14px] bg-panel px-[15px] py-[13px]"
            >
              <span className="w-[92px] flex-shrink-0 font-mono text-[11px] text-faint">{row.when}</span>
              <span className="min-w-0 flex-1 font-mono text-[12px] text-dim">{row.dose}</span>
              <span className="w-16 flex-shrink-0 text-right font-mono text-[10px] text-faintest">{row.site}</span>
            </div>
          ))}
        </div>
      )}

      <span className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">
        FROM YOUR OWN LOG · OWNERSHIP IS TIER-BLIND, SO THIS STAYS OPEN FOR A LOCKED COMPOUND TOO
      </span>
    </div>
  )
}

// ── ROTATION ──────────────────────────────────────────────────────────────
// `ent.siteUsage()` is already the tier-filtered, derived-at-read-time count —
// this tab never touches SITES or DOSE_LOG directly.

function RotationTab({ ent }: { ent: Entitlements }) {
  const usage = ent.siteUsage()
  const totalInj = usage.reduce((n, x) => n + x.uses, 0)
  const sorted = [...usage].sort((a, b) => b.uses - a.uses)
  const hot = sorted[0]
  const cold = sorted[sorted.length - 1]

  const headline =
    totalInj === 0
      ? 'No injections logged for the compounds I can resolve.'
      : `${hot!.label} has taken ${hot!.uses} of your last ${totalInj} logged injection${totalInj === 1 ? '' : 's'}.`

  const note =
    totalInj === 0
      ? 'Rotation is drawn from your dose log. Nothing here yet for the compounds this tier resolves.'
      : `Cortex suggests ${cold!.label} next — it has taken ${cold!.uses} of the last ${totalInj}.` +
        (ent.isFree
          ? ` Counted from your ${totalInj} resolved injection${totalInj === 1 ? '' : 's'} only; locked compounds are not included.`
          : '') +
        ' Rotation is your record, not a prescription.'

  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <div className="flex flex-col gap-2">
        <TabLabel>ROTATION · LAST INJECTIONS</TabLabel>
        <Headline>{headline}</Headline>
      </div>

      <div className="flex flex-wrap items-start gap-[18px]">
        <div className="relative h-[300px] w-[220px] flex-shrink-0 border border-hair">
          {usage.map((site) => (
            <span
              key={site.id}
              className="absolute flex h-[38px] w-[38px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-mono text-[11px]"
              style={{
                left: `${site.x}%`,
                top: `${site.y}%`,
                borderColor: site.uses >= 3 ? hueVar('go') : 'var(--hair)',
                background: site.uses ? 'rgba(255,255,255,0.04)' : 'transparent',
                color: site.uses >= 3 ? hueVar('go') : site.uses ? 'var(--dim)' : 'var(--faintest)',
              }}
            >
              {site.uses}
            </span>
          ))}
          <span className="absolute bottom-[6px] left-2 font-mono text-[9px] tracking-[0.14em] text-faintest">
            SITE MAP
          </span>
        </div>

        <div className="flex min-w-[240px] flex-1 basis-[260px] flex-col gap-px bg-hair">
          {sorted.map((site) => (
            <div key={site.id} className="flex min-h-[44px] items-center gap-3 bg-panel px-[15px] py-[13px]">
              <span className="min-w-0 flex-1 font-mono text-[11px] tracking-[0.1em] text-dim">{site.label}</span>
              <span
                className="whitespace-nowrap font-mono text-[11px]"
                style={{ color: site.uses >= 3 ? hueVar('go') : 'var(--ink)' }}
              >
                {site.uses}×
              </span>
              <span className="w-[58px] flex-shrink-0 text-right font-mono text-[10px] text-faint">{site.last}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[14.5px] leading-[1.8] text-dim">{note}</p>
    </div>
  )
}

// ── CYCLE ─────────────────────────────────────────────────────────────────
// `adherenceLine` is taken verbatim from ent.cycleReport() — this tab does not
// compute or phrase adherence itself.

function CycleTab({ ent }: { ent: Entitlements }) {
  const report = ent.cycleReport()

  if (!report) {
    return (
      <div className="flex max-w-[660px] flex-col gap-5">
        <TabLabel>CYCLE</TabLabel>
        <Headline>No cycle on record yet.</Headline>
      </div>
    )
  }

  const pct = Math.round((report.day / report.length) * 100)

  return (
    <div className="flex max-w-[660px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <TabLabel>
          CYCLE · {report.start} → {report.washout}
        </TabLabel>
        <Headline>
          Day {report.day} of {report.length}
        </Headline>
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className="flex h-3 bg-hair">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-[10px] tracking-[0.12em] text-faint">{report.start}</span>
          <span className="font-mono text-[10px] tracking-[0.12em] text-gold">WASHOUT {report.washout}</span>
        </div>
      </div>

      <p className="text-[14.5px] leading-[1.8] text-dim">{report.adherenceLine}</p>
    </div>
  )
}

// ── entry point ───────────────────────────────────────────────────────────

export default function VerifyTabs({ tab, compoundId, ent }: VerifyTabsProps) {
  const compound = compoundId ? COMPOUNDS[compoundId] : null

  if (tab === 'rotation') return <RotationTab ent={ent} />
  if (tab === 'cycle') return <CycleTab ent={ent} />

  if (!compound) {
    return (
      <div className="flex max-w-[640px] flex-col gap-3">
        <TabLabel color="var(--faint)">VERIFY</TabLabel>
        <Headline>Select a compound to verify.</Headline>
      </div>
    )
  }

  if (tab === 'math') return <MathTab compound={compound} entry={ent.ownedEntry(compound.id)} />
  return <RecordTab compound={compound} ent={ent} />
}
