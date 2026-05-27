'use client'

import IpamorelinMolecule from '@/components/peptides/IpamorelinMolecule'
import Microscope from '@/components/peptides/Microscope'
import SectionHeader from '@/components/peptides/SectionHeader'
import Reveal from '@/components/peptides/Reveal'
import EvidenceRating from '@/components/peptides/EvidenceRating'
import BookplatePaywall from '@/components/peptides/BookplatePaywall'

// Ipamorelin specimen sheet — Phase 1 prototype for the apothecary
// redesign. Data here is sourced from src/lib/peptide-knowledge.ts where
// available; field gaps (formula, weight, sequence, dose specifics,
// half-life) are reasonable inferences from established Ipamorelin
// literature, flagged in REDESIGN-NOTES.md for backfill into the
// knowledge module before Phase 2.

const IDENTITY = [
  { label: 'Formula',  value: 'C₃₈H₄₉N₉O₅' },
  { label: 'Weight',   value: '711.9 Da' },
  { label: 'Sequence', value: 'Aib-His-D-2-Nal-D-Phe-Lys-NH₂' },
  { label: 'Class',    value: 'Pentapeptide · GHS-R1a agonist' },
]

const USE = [
  {
    label: 'Clinical Use',
    value:
      'Investigated for growth-hormone deficiency and post-operative ileus. Not FDA-approved for any human indication; classified as a research peptide.',
  },
  { label: 'Typical Dose', value: '200–300 mcg SC · 1–3× daily' },
  { label: 'Half-Life',    value: '~2 hours' },
  { label: 'Route',        value: 'Subcutaneous injection' },
]

const CAUTIONS = [
  {
    label: 'Side Effects',
    value:
      'Transient flushing, light-headedness, headache, injection-site reactions. Pulsatile GH release may produce mild water retention or transient glucose elevation.',
  },
  {
    label: 'Contraindications',
    value:
      'Active malignancy (theoretical — IGF-1 axis activation). Pregnancy & lactation. Untreated hypothyroidism. Avoid combining with other GH secretagogues without clinical oversight.',
  },
  {
    label: 'Drug Interactions',
    value:
      'No well-established interaction profile. Theoretical caution with corticosteroids, somatostatin analogues, and other GHS compounds. Discuss every concurrent medication with a clinician.',
  },
]

export default function IpamorelinSpecimen() {
  return (
    <>
      <Microscope />

      {/* Page content sits above the fixed microscope */}
      <main className="relative z-10 mx-auto max-w-specimen px-6 md:px-8 pt-24 pb-24">
        {/* ── HERO ───────────────────────────────────────────────────── */}
        <Reveal as="header" className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-specimen-caps text-apo-brass">
            Growth Hormone Axis · Pentapeptide
          </p>

          <h1 className="mt-6 font-display font-light italic text-apo-ink leading-[0.95] text-[clamp(4rem,12vw,9rem)]">
            Ipamorelin
          </h1>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="block h-px w-12 bg-apo-brass" />
            <span className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass">
              Research Compound
            </span>
            <span className="block h-px w-12 bg-apo-brass" />
          </div>
        </Reveal>

        {/* ── MOLECULE ───────────────────────────────────────────────── */}
        <Reveal delay={0.15} className="mt-16 mb-12 flex justify-center">
          <IpamorelinMolecule
            className="w-full max-w-[560px] h-auto text-apo-ink"
            stroke="currentColor"
            accent="#A88B5E"
          />
        </Reveal>

        {/* ── DESCRIPTOR ─────────────────────────────────────────────── */}
        <Reveal delay={0.25}>
          <p className="font-display italic text-2xl md:text-3xl text-apo-ink/85 leading-snug text-center max-w-xl mx-auto">
            A selective ghrelin mimetic — isolated for growth-hormone
            release without cortisol stimulation.
          </p>
        </Reveal>

        {/* ── IDENTITY ───────────────────────────────────────────────── */}
        <SectionHeader label="Identity" />
        <Reveal>
          <dl className="grid grid-cols-1 gap-y-5">
            {IDENTITY.map(row => (
              <div
                key={row.label}
                className="grid grid-cols-[8rem_1fr] md:grid-cols-[10rem_1fr] gap-x-6 items-baseline border-b border-apo-brass/20 pb-4"
              >
                <dt className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass">
                  {row.label}
                </dt>
                <dd className="font-mono text-base text-apo-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ── ACTION ─────────────────────────────────────────────────── */}
        <SectionHeader label="Action" />
        <Reveal>
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass mb-3">
                Mechanism
              </p>
              <p className="font-display text-xl md:text-2xl text-apo-ink/90 leading-relaxed">
                Selective agonist of the growth-hormone secretagogue receptor
                (GHS-R1a). Binds the pituitary somatotroph as ghrelin would,
                triggering pulsatile growth-hormone release —{' '}
                <em>but without</em> measurable rise in cortisol, prolactin,
                or aldosterone, distinguishing it from earlier-generation
                GHRPs (GHRP-2, GHRP-6).
              </p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass mb-3">
                Key Effects
              </p>
              <p className="font-display text-lg md:text-xl text-apo-ink/80 leading-relaxed">
                Signals the GH axis; downstream effects on body composition,
                tissue repair, and glucose metabolism follow from elevated
                GH/IGF-1 — not from any direct hormonal action of the
                peptide itself.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── PAYWALL ────────────────────────────────────────────────── */}
        <BookplatePaywall />

        {/* ── USE ────────────────────────────────────────────────────── */}
        <SectionHeader label="Use" />
        <Reveal>
          <dl className="grid grid-cols-1 gap-y-6">
            {USE.map(row => (
              <div
                key={row.label}
                className="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-x-6 gap-y-2 border-b border-apo-brass/20 pb-5"
              >
                <dt className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass pt-1">
                  {row.label}
                </dt>
                <dd
                  className={
                    row.label === 'Typical Dose' || row.label === 'Half-Life'
                      ? 'font-mono text-base md:text-lg text-apo-ink'
                      : 'font-display text-lg md:text-xl text-apo-ink/85 leading-relaxed'
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ── CAUTIONS ───────────────────────────────────────────────── */}
        <SectionHeader label="Cautions" />
        <Reveal>
          <dl className="grid grid-cols-1 gap-y-6">
            {CAUTIONS.map(row => (
              <div
                key={row.label}
                className="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-x-6 gap-y-2 border-b border-apo-brass/20 pb-5"
              >
                <dt className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass pt-1">
                  {row.label}
                </dt>
                <dd className="font-display text-lg md:text-xl text-apo-ink/85 leading-relaxed">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ── EVIDENCE ───────────────────────────────────────────────── */}
        <SectionHeader label="Evidence" />
        <Reveal>
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass mb-3">
                Clinical Trials
              </p>
              <p className="font-display text-lg md:text-xl text-apo-ink/85 leading-relaxed">
                Small early-phase human studies in the 1990s–2000s
                established short-term safety and confirmed GH release
                without cortisol elevation. A Phase 2b trial in
                post-operative ileus (Helsinn / NMI Health) was discontinued
                after failing to meet its primary endpoint. No
                large-scale efficacy or long-term safety data exist; no
                FDA-approved indication.
              </p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass mb-3">
                Evidence Rating
              </p>
              <div className="flex items-center gap-4">
                <EvidenceRating rating={3} />
                <span className="font-display italic text-apo-mute">
                  · Promising mechanism, limited human outcomes data.
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── FOOTER SPEC MARK ───────────────────────────────────────── */}
        <Reveal>
          <div className="mt-24 pt-12 border-t border-apo-brass/30 text-center">
            <p className="font-mono text-[10px] uppercase tracking-specimen-caps text-apo-brass">
              Peptide Cortex · Specimen Sheet 01 of XX
            </p>
            <p className="mt-3 font-display italic text-apo-mute text-base max-w-md mx-auto">
              For research and reference purposes only. Not intended as
              dosing instructions for human or animal use. Consult a
              licensed physician before any medical decisions.
            </p>
          </div>
        </Reveal>
      </main>
    </>
  )
}
