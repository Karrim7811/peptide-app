'use client'

// The Mirror's narration panel — layers 1, 2 and 3.
//
// Layer 1  WHOLE     region list, labs input, free-tier upsell, unmapped regions
// Layer 2  REGION    region stat tiles, marker touch, compound list
// Layer 3  COMPOUND  36px heading, prose fields, evidence, edges, tools
//
// Ported from design_handoff_peptide_cortex/Peptide Cortex Mirror.dc.html
// (renderVals(), narration + panel sections, ~line 1309–1583). The prototype
// re-derives its own "mine"/"locked"/"labs" logic; here every one of those
// answers comes from a single call into `ent` (src/lib/entitlement.ts) so this
// component cannot reproduce the eight paywall leaks the README documents.
//
// Layer 4 is NOT this component — see VerifyTabs.tsx.

import Link from 'next/link'
import {
  CATEGORIES,
  COMPOUNDS,
  GRADE_ORDER,
  MARKERS,
  COUNTS,
  CYCLE,
  compoundsInCategory,
  taxonomyMismatch,
  type Category,
  type Compound,
} from '@/lib/catalog'
import type { Entitlements } from '@/lib/entitlement'
import { hueVar } from '@/lib/design/grounds'
import { money, MONTHLY_PRICE } from '@/lib/pricing'
import type { MirrorLayer, VerifyTab } from '@/lib/mirror/useMirrorNav'
import LogDoseButton from '@/components/mirror/LogDoseButton'

export interface MirrorPanelProps {
  layer: MirrorLayer
  regionId: string | null
  compoundId: string | null
  ent: Entitlements
  onSelectCompound: (id: string) => void
  onOpenVerify: (tab: VerifyTab) => void
  /**
   * Region rows (layer 1's "YOUR REGIONS · CLICK TO ENTER" list and its
   * unmapped-regions tiles) call this when given. Optional and additive to
   * the contract this component was briefed against — the field's own nodes
   * are the primary way into a region, so a caller that has not wired region
   * navigation yet still gets a working panel, just a non-interactive list.
   */
  onSelectRegion?: (id: string) => void
}

const DISCLAIMER =
  'EDUCATIONAL REFERENCE ONLY · CORTEX DESCRIBES HOW COMPOUNDS ARE STUDIED · IT DOES NOT DIAGNOSE, TREAT OR PRESCRIBE.'

// ── shared helpers (ported verbatim from the prototype) ─────────────────────

function bestGrade(list: Compound[]): string {
  let best: number | null = null
  for (const c of list) {
    const i = GRADE_ORDER.indexOf(c.grade)
    if (best === null || i < best) best = i
  }
  return best === null ? '—' : GRADE_ORDER[best]!
}

function heldLabel(n: number): string {
  return n === 1 ? '1 OF YOURS' : `${n} OF YOURS`
}

function isAre(n: number): string {
  return n === 1 ? 'is' : 'are'
}

/**
 * The library's evidenceLevel is a taxonomy label, not a sentence — never
 * concatenate it into prose. Ported verbatim from the prototype's
 * `evidenceProse()` (Peptide Cortex Mirror.dc.html ~line 841). Matched by
 * pattern so a reworded enum still lands.
 */
function evidenceProse(evidence: string): string {
  if (/FDA-approved/.test(evidence)) return 'it carries an approved label'
  if (/Region-specific/.test(evidence)) return 'it is approved in some regions and not others'
  if (/Mixed\/unclear/.test(evidence)) return 'its regulatory standing is unsettled'
  if (/Physiology\/diagnostic/.test(evidence)) return 'it is studied diagnostically rather than therapeutically'
  return 'nothing behind it carries an approved indication'
}

function markerOff(m: { value: number; low: number; high: number }): boolean {
  return m.value < m.low || m.value > m.high
}

function markerLabel(m: { value: number; low: number; high: number }): string {
  if (m.value < m.low) return 'LOW'
  if (m.value > m.high) return 'ELEVATED'
  return 'IN RANGE'
}

// ── narration header, shared across all three layers ────────────────────────

function NarrationHeader({ label, text, meta }: { label: string; text: string; meta: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-hair px-[22px] py-5">
      <div className="flex items-center gap-[9px]">
        <span
          className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-accent"
          style={{ animation: 'cxpulse 2.4s ease-in-out infinite' }}
          aria-hidden
        />
        <span className="font-mono text-[9px] tracking-[0.3em] text-accent">{label}</span>
      </div>
      <p className="font-display text-[29px] font-light leading-[1.26] text-ink">{text}</p>
      <p className="font-mono text-[10px] leading-[1.9] tracking-[0.08em] text-faint">{meta}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[9px] tracking-[0.26em] text-faint">{children}</span>
}

// ── Layer 1 — WHOLE ───────────────────────────────────────────────────────

function LayerWhole({ ent, onSelectRegion }: { ent: Entitlements; onSelectRegion?: (id: string) => void }) {
  const owned = CATEGORIES.filter((c) => ent.ownedIn(c.id).length > 0).sort((a, b) => a.order - b.order)
  const empties = CATEGORIES.filter((c) => ent.ownedIn(c.id).length === 0 && compoundsInCategory(c.id).length > 0)

  const regionRows = owned.map((c) => {
    const resolved = ent.resolvedIn(c.id)
    const locked = ent.lockedIn(c.id)
    const worst = [...resolved].sort((a, b) => a.supplyDays - b.supplyDays)[0]
    const marks = ent.markers(MARKERS).filter((m) => m.catId === c.id && markerOff(m))
    const tense = !!worst && worst.supplyDays <= 7

    const sub = resolved
      .map((x) => COMPOUNDS[x.id]?.name ?? x.id)
      .concat(locked.map((x) => `${COMPOUNDS[x.id]?.name ?? x.id} (locked)`))
      .join(' · ')

    const state = tense
      ? 'THINNING'
      : locked.length
        ? `${locked.length} LOCKED`
        : marks.length
          ? 'RE-TUNED'
          : 'STEADY'

    const stateColor = tense ? hueVar('go') : locked.length ? 'var(--faint)' : marks.length ? 'var(--accent)' : 'var(--faint)'
    const dotColor = tense ? hueVar('go') : hueVar(c.hue)

    return { category: c, sub, state, stateColor, dotColor, dotOpacity: resolved.length ? 1 : 0.35 }
  })

  return (
    <div className="flex flex-col gap-5 px-[22px] py-5">
      <div className="flex flex-col gap-3">
        <SectionLabel>YOUR REGIONS · CLICK TO ENTER</SectionLabel>
        <div className="flex flex-col gap-px bg-hair">
          {regionRows.map((r) => (
            <button
              key={r.category.id}
              type="button"
              disabled={!onSelectRegion}
              onClick={() => onSelectRegion?.(r.category.id)}
              className="flex min-h-[44px] items-center gap-[14px] bg-panel px-4 py-[15px] text-left enabled:hover:bg-panelHi enabled:cursor-pointer disabled:cursor-default"
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: r.dotColor, opacity: r.dotOpacity }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="font-mono text-[11px] tracking-[0.16em] text-ink">{r.category.label}</span>
                <span className="truncate text-[13px] leading-[1.5] text-faint">{r.sub}</span>
              </div>
              <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.1em]" style={{ color: r.stateColor }}>
                {r.state}
              </span>
            </button>
          ))}
          {regionRows.length === 0 && (
            <div className="bg-panel px-4 py-[15px] text-[13px] text-faint">Nothing mapped yet.</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>LABS · AN INPUT, NOT A PAGE</SectionLabel>
        {ent.isFree ? (
          <div className="flex flex-col gap-[9px] border border-hair p-[18px]">
            <span className="font-mono text-[10px] tracking-[0.16em] text-faint">BLOODWORK · PRO</span>
            <p className="text-[13.5px] leading-[1.75] text-dim">
              Bloodwork re-tunes the whole form against your real values. It needs the full stack to be worth
              reading, so it unlocks with Pro.
            </p>
          </div>
        ) : ent.labsOn ? (
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[10px] tracking-[0.12em] text-accent">
              {ent.markers(MARKERS).length} MARKERS · FORM RE-TUNED
            </span>
            <div className="flex flex-col gap-px bg-hair">
              {ent.markers(MARKERS).map((m) => {
                const off = markerOff(m)
                const span = m.high - m.low || 1
                const pct = Math.max(4, Math.min(100, Math.round(((m.value - m.low) / span) * 100)))
                return (
                  <div key={m.key} className="flex items-center gap-3 bg-panel px-[15px] py-3">
                    <span className="min-w-0 flex-1 text-[14px] text-ink">{m.label}</span>
                    <span className="whitespace-nowrap font-mono text-[12px] text-ink">
                      {m.value} {m.unit}
                    </span>
                    <div className="h-1 w-14 flex-shrink-0 bg-hair">
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, backgroundColor: off ? hueVar('go') : hueVar('gr') }}
                      />
                    </div>
                    <span
                      className="w-16 flex-shrink-0 text-right font-mono text-[9.5px] tracking-[0.08em]"
                      style={{ color: off ? hueVar('go') : 'var(--faint)' }}
                    >
                      {markerLabel(m)}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">
              REVIEW ALL BLOODWORK WITH A LICENSED PHYSICIAN · CORTEX DESCRIBES, IT DOES NOT DIAGNOSE
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[9px] border border-dashed border-hair p-[18px]">
            <p className="text-[14.5px] leading-[1.6] text-ink">No bloodwork attached yet.</p>
            <p className="text-[13px] leading-[1.7] text-faint">
              Eight markers re-tune the whole form. Regions brighten or thin against your real values instead of
              producing a separate report.
            </p>
          </div>
        )}
      </div>

      {ent.isFree && (
        <div className="flex flex-col gap-[11px] border-l-2 border-gold bg-panelHot px-[18px] py-[17px]">
          <span className="font-mono text-[9.5px] tracking-[0.2em] text-gold">
            {ent.lockedCount} of your compounds are locked
          </span>
          <p className="text-[14px] leading-[1.75] text-dim">
            Free holds one. The rest of your stack is still drawn on the form — dashed, dimmed, and still pulling
            edges toward what you hold — so you can see the shape of what you are not seeing. Unlock to resolve
            them.
          </p>
          <Link
            href="/pricing"
            className="flex min-h-[44px] items-center justify-center bg-gold font-mono text-[10px] tracking-[0.16em] text-ground"
          >
            UNLOCK EVERYTHING · {money(MONTHLY_PRICE)}/MO →
          </Link>
          <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">
            RECONSTITUTION MATH, CAUTIONS AND INTERACTION TEXT STAY FREE AT EVERY TIER
          </p>
        </div>
      )}

      <div className="flex flex-col gap-[10px]">
        <SectionLabel>THE REST OF THE FIELD</SectionLabel>
        <p className="text-[14px] leading-[1.8] text-dim">
          {empties.length} of the library&rsquo;s {COUNTS.categories} regions hold nothing of yours yet &mdash;{' '}
          {COUNTS.compounds - ent.stackCount} compounds you have not mapped. They stay faint on the form until you
          do.
        </p>
        <div className="flex flex-wrap gap-px bg-hair">
          {empties.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={!onSelectRegion}
              onClick={() => onSelectRegion?.(c.id)}
              className="flex min-h-[44px] flex-1 basis-[150px] items-center justify-between gap-[10px] bg-panel px-[14px] py-3 text-left enabled:hover:bg-panelHi enabled:cursor-pointer disabled:cursor-default"
            >
              <span className="font-mono text-[10px] tracking-[0.1em] text-dim">{c.label}</span>
              <span className="font-mono text-[10px] text-faintest">{compoundsInCategory(c.id).length}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Layer 2 — REGION ─────────────────────────────────────────────────────

function LayerRegion({ ent, regionId, onSelectCompound }: { ent: Entitlements; regionId: string | null; onSelectCompound: (id: string) => void }) {
  const mine = CATEGORIES.filter((c) => ent.resolvedIn(c.id).length > 0).sort((a, b) => a.order - b.order)
  const region: Category = CATEGORIES.find((c) => c.id === regionId) ?? mine[0] ?? CATEGORIES[0]!

  const catalogHere = compoundsInCategory(region.id)
  const mineHere = ent.resolvedIn(region.id)
  const ownedHere = ent.ownedIn(region.id)
  const lockedHere = ent.lockedIn(region.id)
  const marksHere = ent.markers(MARKERS).filter((m) => m.catId === region.id)
  const worstHere = [...mineHere].sort((a, b) => a.supplyDays - b.supplyDays)[0]

  const narration = worstHere && worstHere.supplyDays <= 7
    ? `${COMPOUNDS[worstHere.id]?.name ?? worstHere.id} runs this region down in ${worstHere.supplyDays} days. Everything else here is steady.`
    : mineHere.length
      ? `This region is steady. ${mineHere.length} of the library’s ${catalogHere.length} compounds here ${isAre(mineHere.length)} yours.`
      : lockedHere.length
        ? `${lockedHere.length} compounds here ${isAre(lockedHere.length)} yours, ${lockedHere.length === 1 ? 'and it is' : 'and they are'} locked. I can list them and read each one — I cannot weigh them against each other yet.`
        : `You hold nothing in this region yet. ${catalogHere.length} compounds sit here in the library.`

  const meta = `${catalogHere.length} IN CATALOG · ${
    lockedHere.length ? `${mineHere.length} RESOLVED · ${lockedHere.length} LOCKED` : heldLabel(ownedHere.length)
  } · BEST GRADE ${bestGrade(catalogHere)}`

  const grade = bestGrade(catalogHere)
  const mineCaption = lockedHere.length ? `YOURS · ${lockedHere.length} LOCKED` : 'IN YOUR STACK'
  const supplyDays = worstHere ? worstHere.supplyDays : lockedHere.length ? 'PRO' : '—'
  const tenseTile = worstHere && worstHere.supplyDays <= 7

  const rows = catalogHere.map((c) => {
    const held = ent.held(c.id)
    const heldEntry = held ? ent.ownedEntry(c.id) : null
    const lockedEntry = ent.lockedEntry(c.id)
    const tense = !!heldEntry && heldEntry.supplyDays <= 7
    const tag = tense ? `${heldEntry!.supplyDays}D` : heldEntry ? 'YOURS' : lockedEntry ? 'LOCKED' : '—'
    const tagColor = tense ? hueVar('go') : heldEntry ? hueVar(region.hue) : lockedEntry ? 'var(--faint)' : 'var(--faintest)'
    const dotColor = heldEntry || lockedEntry ? (tense ? hueVar('go') : hueVar(region.hue)) : 'var(--faintest)'
    const dotOpacity = heldEntry ? 1 : lockedEntry ? 0.45 : 0.5
    return { c, tag, tagColor, dotColor, dotOpacity }
  })

  return (
    <div className="flex flex-col gap-5">
      <NarrationHeader label={`CORTEX · REGION ${region.label}`} text={narration} meta={meta} />
      <div className="flex flex-col gap-5 px-[22px] pb-5">
        <div className="flex flex-col gap-[11px]">
          <SectionLabel>REGION STATE</SectionLabel>
          <div className="flex flex-wrap gap-5">
            <Stat value={grade} label="BEST EVIDENCE" color="var(--accent)" />
            <Stat value={String(catalogHere.length)} label="IN CATALOG" />
            <Stat value={String(ownedHere.length)} label={mineCaption} color={ownedHere.length ? 'var(--ink)' : 'var(--faint)'} />
            <Stat value={String(supplyDays)} label="DAYS OF SUPPLY" color={tenseTile ? hueVar('go') : 'var(--ink)'} />
          </div>
        </div>

        {marksHere.length > 0 && (
          <div className="flex flex-col gap-[10px] border-l-2 border-gold pl-[14px]">
            <span className="font-mono text-[9px] tracking-[0.24em] text-gold">YOUR LABS TOUCH THIS REGION</span>
            {marksHere.map((m) => (
              <span key={m.key} className="text-[14px] leading-[1.7] text-dim">
                {m.label} · {m.value} {m.unit} · {markerLabel(m)} (range {m.low}–{m.high})
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-[10px]">
          <SectionLabel>COMPOUNDS · CLICK TO RESOLVE</SectionLabel>
          <div className="flex flex-col gap-px bg-hair">
            {rows.map(({ c, tag, tagColor, dotColor, dotOpacity }) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCompound(c.id)}
                className="flex min-h-[44px] items-center gap-3 bg-panel px-4 py-[14px] text-left hover:bg-panelHi"
              >
                <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full" style={{ backgroundColor: dotColor, opacity: dotOpacity }} />
                <span className="min-w-0 flex-1 text-[15px] text-ink">{c.name}</span>
                <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.1em] text-faint">{c.grade}</span>
                <span className="w-14 flex-shrink-0 text-right font-mono text-[9.5px] tracking-[0.08em]" style={{ color: tagColor }}>
                  {tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="font-sans text-[32px] font-extralight leading-none" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="font-mono text-[8.5px] tracking-[0.14em] text-faint">{label}</span>
    </div>
  )
}

// ── Layer 3 — COMPOUND ───────────────────────────────────────────────────

function LayerCompound({ ent, compoundId, onOpenVerify }: { ent: Entitlements; compoundId: string | null; onOpenVerify: (tab: VerifyTab) => void }) {
  const compound = compoundId ? COMPOUNDS[compoundId] : null

  if (!compound) {
    return (
      <div className="flex flex-col gap-5">
        <NarrationHeader label="CORTEX" text="Select a compound to focus it." meta="NOTHING FOCUSED" />
      </div>
    )
  }

  const entry = ent.ownedEntry(compound.id) // tier-blind — reconstitution math and history are never gated
  const held = ent.held(compound.id)
  const heldEntry = held ? entry : null
  const lockedEntry = ent.lockedEntry(compound.id)
  const cycle = ent.cycleReport()

  const narration = heldEntry && heldEntry.supplyDays <= 7
    ? `This is the thinning node — ${heldEntry.supplyDays} days of supply against ${cycle ? cycle.daysLeft : '—'} days left in the cycle.`
    : heldEntry
      ? `This node is stable — ${heldEntry.supplyDays} days of supply against ${heldEntry.days} days logged. On the evidence, ${evidenceProse(compound.evidence)}.`
      : lockedEntry
        ? `This one is yours — ${lockedEntry.days} days logged — but Free will not resolve it. The arithmetic and the record below stay open regardless.`
        : `Not in your stack. ${compound.name} sits adjacent to what you already hold.`

  const meta = `EVIDENCE ${compound.grade} · ${
    heldEntry ? `${heldEntry.supply}% REMAINING` : entry ? 'IN YOUR STACK · LOCKED' : 'NOT IN YOUR STACK'
  }`

  const mismatch = taxonomyMismatch(compound)

  const facts: Array<{ k: string; v: string }> = [
    mismatch
      ? {
          k: 'FLAGGED · LIBRARY DISAGREES WITH ITSELF',
          v: `Filed under ${compound.category}, but its stated purpose — "${compound.purpose}" — points to ${mismatch.name}. The effect text below may carry over from ${compound.category}. Cortex shows the record as written rather than guessing which field is right — worth a look at the source spreadsheet.`,
        }
      : null,
    { k: 'KEY EFFECTS', v: compound.effects },
    { k: 'DOSAGE FIELD · LIBRARY WORDING, UNEDITED', v: compound.dosage || 'N/A' },
    { k: 'CAUTIONS', v: compound.cautions },
    { k: 'DOCUMENTED INTERACTIONS', v: compound.interactions },
  ].filter((f): f is { k: string; v: string } => !!f && !!f.v)

  const historyLabel = entry ? (lockedEntry ? 'YOUR HISTORY · LOCKED' : 'YOUR HISTORY') : 'IN THE LIBRARY'
  const historyValue = entry ? entry.days : compound.stacksWith.length
  const historyUnit = entry ? 'days' : 'links'
  const historyNote = entry
    ? lockedEntry
      ? `${entry.schedule} · ${entry.site} most often. Logged and yours — Free just will not resolve it on the form.`
      : `${entry.schedule} · ${entry.site} most often`
    : `Not in your stack. Adjacent to ${compound.stacksWith.length} compounds you hold or could.`

  const edgeRows = compound.stacksWith
    .map((id) => COMPOUNDS[id])
    .filter((o): o is Compound => !!o)
    .slice(0, 6)
    .map((o) => {
      const oHeld = ent.held(o.id)
      const oEntry = oHeld ? ent.ownedEntry(o.id) : null
      const oLocked = ent.lockedEntry(o.id)
      const tense = !!oEntry && oEntry.supplyDays <= 7
      const color = tense ? hueVar('go') : oEntry ? hueVar(CATEGORIES.find((c) => c.id === o.catId)?.hue ?? 'pu') : 'var(--faint)'
      const kind = tense ? 'TENSION' : oEntry ? 'BOTH YOURS' : oLocked ? 'LOCKED' : 'ADJACENT'
      const label = `${o.name} — ${oEntry ? 'in your stack' : oLocked ? 'in your stack, locked' : o.category.toLowerCase()}`
      return { o, label, kind, color, bold: !!oEntry }
    })

  const bars = [0, 1, 2, 3].map((i) => i < compound.bars)

  return (
    <div className="flex flex-col gap-5">
      <NarrationHeader label={`CORTEX · ${compound.name.toUpperCase()}`} text={narration} meta={meta} />

      <div className="flex flex-col gap-5 px-[22px] pb-5">
        <div className="flex flex-col gap-[7px]">
          <h2 className="font-display text-[36px] font-light leading-[1.05] text-ink">{compound.name}</h2>
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-faint">{compound.purpose}</span>
        </div>

        <p className="text-[15px] leading-[1.8] text-dim">{compound.action}</p>

        <div className="flex flex-wrap gap-[26px]">
          <div className="flex min-w-[140px] flex-col gap-[7px]">
            <span className="font-mono text-[9px] tracking-[0.22em] text-faint">EVIDENCE</span>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-[36px] font-extralight leading-none text-gold">{compound.grade}</span>
              <span className="font-mono text-[9.5px] leading-[1.5] text-faint">{compound.evidence}</span>
            </div>
            <div className="flex gap-[3px]">
              {bars.map((filled, i) => (
                <span key={i} className={`h-[5px] w-[26px] ${filled ? 'bg-gold' : 'bg-hair'}`} />
              ))}
            </div>
          </div>
          <div className="flex min-w-[140px] flex-col gap-[7px]">
            <span className="font-mono text-[9px] tracking-[0.22em] text-faint">{historyLabel}</span>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-[36px] font-extralight leading-none text-ink">{historyValue}</span>
              <span className="font-mono text-[10px] text-faint">{historyUnit}</span>
            </div>
            <span className="text-[13px] leading-[1.6] text-faint">{historyNote}</span>
          </div>
          <div className="flex min-w-[140px] flex-col gap-[7px]">
            <span className="font-mono text-[9px] tracking-[0.22em] text-faint">
              CARDIOVASCULAR · {compound.cv}/5 ON THE LIBRARY&rsquo;S CV SCALE
            </span>
            <p className="text-[13px] leading-[1.7] text-dim">{compound.cvNotes}</p>
          </div>
        </div>

        <p className="border-l-2 border-accent pl-[14px] font-display text-[19px] font-light italic leading-[1.5] text-dim">
          &ldquo;{compound.bottomLine}&rdquo;
        </p>

        <div className="flex flex-col gap-[10px]">
          <SectionLabel>WHAT THE LIBRARY SAYS</SectionLabel>
          <div className="flex flex-col gap-3">
            {facts.map((f) => (
              <div key={f.k} className="flex flex-col gap-[5px]">
                <span className="font-mono text-[9px] tracking-[0.16em] text-faintest">{f.k}</span>
                <p className="text-[14px] leading-[1.75] text-dim">{f.v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[10px]">
          <SectionLabel>EDGES · {compound.stacksWith.length} STACKING RELATIONSHIPS</SectionLabel>
          <div className="flex flex-col gap-[9px]">
            {edgeRows.map(({ o, label, kind, color, bold }) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onOpenVerify('math')}
                className="flex min-h-[44px] items-center gap-[11px] text-left"
              >
                <span className="w-5 flex-shrink-0" style={{ height: bold ? 2 : 1, backgroundColor: color }} />
                <span className="min-w-0 flex-1 text-[14px] text-ink">{label}</span>
                <span className="whitespace-nowrap font-mono text-[9.5px] tracking-[0.1em]" style={{ color }}>
                  {kind}
                </span>
              </button>
            ))}
            {edgeRows.length === 0 && <span className="text-[13px] text-faint">No stacking partners on record.</span>}
          </div>
        </div>

        <div className="flex flex-col gap-[10px]">
          <SectionLabel>TOOLS THIS COMPOUND MAKES RELEVANT</SectionLabel>
          <div className="flex flex-wrap gap-px bg-hair">
            <button
              type="button"
              onClick={() => onOpenVerify('math')}
              className="flex min-h-[44px] flex-1 basis-[130px] items-center justify-center bg-panel font-mono text-[9.5px] tracking-[0.1em] text-gold"
            >
              RECONSTITUTE
            </button>
            <LogDoseButton
              compoundId={compound.id}
              // ownedEntry, not held — a locked compound is still theirs, and
              // recording what they took is not a paid feature.
              entry={ent.ownedEntry(compound.id)}
            />
            <button
              type="button"
              onClick={() => onOpenVerify('rotation')}
              className="flex min-h-[44px] flex-1 basis-[130px] items-center justify-center bg-panel font-mono text-[9.5px] tracking-[0.1em] text-dim"
            >
              ROTATION
            </button>
            <button
              type="button"
              onClick={() => onOpenVerify('record')}
              className="flex min-h-[44px] flex-1 basis-[130px] items-center justify-center bg-panel font-mono text-[9.5px] tracking-[0.1em] text-dim"
            >
              THE RECORD
            </button>
          </div>
          <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  )
}

// ── entry point ───────────────────────────────────────────────────────────

export default function MirrorPanel({
  layer,
  regionId,
  compoundId,
  ent,
  onSelectCompound,
  onOpenVerify,
  onSelectRegion,
}: MirrorPanelProps) {
  if (layer === 1) {
    // Ported verbatim from the prototype's layer-1 narration (renderVals(), ~line 1316).
    const mine = CATEGORIES.filter((c) => ent.resolvedIn(c.id).length > 0)
    const offMarkers = ent.labsOn ? ent.markers(MARKERS).filter(markerOff) : []

    const narration = ent.isFree
      ? `${ent.resolvedCount === 1 ? 'One compound resolved, ' : `${ent.resolvedCount} compounds resolved, `}${ent.lockedCount} held back. The dashed regions are yours — I can see them pulling, I just cannot read them for you yet.`
      : ent.labsOn
        ? `Your labs are attached, and ${offMarkers.length} markers sit outside range. Those regions have thinned; the rest of the form is steady.`
        : `Your ${mine.length} active regions are holding. One is pulling against the rest.`

    const meta = ent.isFree
      ? `FREE · ${ent.resolvedCount} OF ${ent.stackCount} RESOLVED · ${COUNTS.compounds} IN LIBRARY, ALL READABLE`
      : `${CYCLE.day} DAYS · ${ent.stackCount} COMPOUNDS · ${CYCLE.adherence}% LOGGED · ${COUNTS.compounds} IN LIBRARY`

    return (
      <div className="flex flex-col">
        <NarrationHeader label="CORTEX · NARRATING" text={narration} meta={meta} />
        <LayerWhole ent={ent} onSelectRegion={onSelectRegion} />
      </div>
    )
  }

  if (layer === 2) {
    return <LayerRegion ent={ent} regionId={regionId} onSelectCompound={onSelectCompound} />
  }

  if (layer === 3) {
    return <LayerCompound ent={ent} compoundId={compoundId} onOpenVerify={onOpenVerify} />
  }

  return null
}
