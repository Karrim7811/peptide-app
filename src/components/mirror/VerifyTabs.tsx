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

import { COMPOUNDS, DOSE_LOG, type Compound, type StackEntry } from '@/lib/catalog'
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

  const conc = entry.vialMg / entry.waterMl
  const doseMg = entry.doseMcg / 1000
  const draw = doseMg / conc
  const units = Math.round(draw * 100)
  const doseLabel = entry.doseMcg >= 1000 ? `${entry.doseMcg / 1000} mg` : `${entry.doseMcg} mcg`
  const hasSyringe = units <= 100

  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <div className="flex flex-col gap-2">
        <TabLabel color="var(--gold)">RECONSTITUTION · WORKING SHOWN</TabLabel>
        <Headline>
          {draw.toFixed(2)} mL per {doseLabel} dose
        </Headline>
      </div>

      <div className="flex flex-col gap-px bg-hair">
        <Row k="VIAL CONTENTS" v={`${entry.vialMg} mg`} />
        <Row k="BACTERIOSTATIC WATER ADDED" v={`${entry.waterMl} mL`} />
        <Row k={`CONCENTRATION · ${entry.vialMg} mg ÷ ${entry.waterMl} mL`} v={`${conc} mg / mL`} />
        <Row k="TARGET DOSE · AS YOU LOG IT" v={`${doseLabel} = ${doseMg} mg`} />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-[6px] border-l-2 border-gold bg-panelHot px-[18px] py-[17px]">
          <span className="font-mono text-[11px] tracking-[0.08em] text-gold">
            DRAW · {doseMg} mg ÷ {conc} mg/mL
          </span>
          <span className="whitespace-nowrap font-mono text-[19px] text-gold">{draw.toFixed(2)} mL</span>
        </div>
      </div>

      {hasSyringe && (
        <div className="flex flex-col gap-[10px]">
          <span className="font-mono text-[10px] tracking-[0.22em] text-faint">ON A U-100 SYRINGE</span>
          <div className="flex h-[44px] items-stretch border border-hair">
            <div
              className="border-r-2 border-gold"
              style={{ width: `${Math.min(100, units)}%`, backgroundColor: hueVar('go'), opacity: 0.28 }}
            />
            <div className="flex-1" />
          </div>
          <span className="font-mono text-[10.5px] tracking-[0.08em] text-dim">= {units} UNITS</span>
        </div>
      )}

      <span className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">
        CHECK AGAINST YOUR VIAL LABEL BEFORE DRAWING · RESEARCH-GRADE COMPOUNDS ONLY · NOT A PRESCRIPTION
      </span>
    </div>
  )
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

function RecordTab({ compound }: { compound: Compound }) {
  const entries = DOSE_LOG.filter((row) => row.id === compound.id)

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
  return <RecordTab compound={compound} />
}
