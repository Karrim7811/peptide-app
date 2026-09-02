import type { Metadata } from 'next'
import { hueVar, type HueFamily } from '@/lib/design/grounds'

// Retatrutide reconstitution reference.
//
// Ported from the authored document
// `peptide-cortex-retatrutide-reconstitution_1.html`. The prose is verbatim; the
// palette is not — the source pinned the V4 dark hexes (#050505 / #00E5FF /
// #F7B731) directly, and those are replaced here by the Mirror ground tokens so
// the page renders correctly on Midnight, Dusk and Daylight alike.
//
// ── Framing is load-bearing, not cosmetic ─────────────────────────────────────
// Apple rejected the iOS app under Guideline 1.4.2 for a dose calculator, and the
// same exposure applies on the web under US law. Per CLAUDE.md §16.9 this page
// describes the CHEMISTRY OF A SOLUTION — what a given draw volume contains —
// and never instructs a person to take an amount. The disclaimer banner above the
// arithmetic is mandatory, and trial quantities are reported as what was studied,
// not as what anyone should do. Do not reword any of this into second-person
// dosing language ("draw X for your dose"); that edit recreates the exposure.

export const metadata: Metadata = {
  title: 'Retatrutide Reconstitution — Peptide Cortex',
  description:
    'Reconstitution chemistry for 10 mg, 20 mg and 30 mg lyophilized retatrutide vials at a 10 mg/mL working concentration. Educational reference only — not dosing instructions.',
}

// ── primitives ────────────────────────────────────────────────────────────────

function Eyebrow({ hue = 'cy', children }: { hue?: HueFamily; children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-[10px] font-mono text-[10px] uppercase tracking-[0.34em] text-faintest">
      <span className="h-[5px] w-[5px] flex-none" style={{ background: hueVar(hue) }} aria-hidden />
      {children}
    </p>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 font-display text-[30px] font-light leading-[1.1] text-ink md:text-[44px]">
      {children}
    </h2>
  )
}

function Em({ children }: { children: React.ReactNode }) {
  return <em className="italic" style={{ color: hueVar('cy') }}>{children}</em>
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-[14px] mt-9 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-dim">
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-[18px] max-w-[72ch] leading-[1.9] text-dim">{children}</p>
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-ink">{children}</strong>
}

function Section({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return (
    <section className={first ? 'pb-12 md:pb-20' : 'border-t border-hair py-12 md:py-20'}>
      {children}
    </section>
  )
}

/** Hairline data grid. Cells are passed in reading order. */
function Grid({ columns, children }: { columns: string; children: React.ReactNode }) {
  return (
    <div className="my-7 overflow-x-auto">
      <div
        className="grid min-w-[560px] gap-px border border-hair bg-hair font-mono text-[12.5px]"
        style={{ gridTemplateColumns: columns }}
      >
        {children}
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-panel px-4 py-[14px] font-mono text-[9px] font-medium uppercase tracking-[0.24em] text-faint">
      {children}
    </div>
  )
}

function Td({
  children,
  tone = 'dim',
}: {
  children: React.ReactNode
  tone?: 'dim' | 'ink' | 'cy' | 'gold'
}) {
  const className =
    tone === 'ink'
      ? 'text-ink font-medium'
      : tone === 'gold'
        ? 'text-gold'
        : tone === 'cy'
          ? ''
          : 'text-dim'
  return (
    <div
      className={`bg-ground px-4 py-[14px] ${className}`}
      style={tone === 'cy' ? { color: hueVar('cy') } : undefined}
    >
      {children}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function RetatrutideReconstitutionPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-5 sm:px-10 lg:px-[60px]">
      {/* ── masthead ─────────────────────────────────────────────────────── */}
      <nav className="mb-12 flex h-[66px] items-center gap-3 border-b border-hair md:mb-20">
        <span
          className="h-[7px] w-[7px] flex-none"
          style={{ background: hueVar('cy'), boxShadow: `0 0 12px ${hueVar('cy')}` }}
          aria-hidden
        />
        <span className="font-mono text-[13px] tracking-[0.34em] text-ink">PEPTIDE CORTEX</span>
        <span className="ml-auto hidden font-mono text-[9.5px] uppercase tracking-[0.28em] text-faintest sm:inline">
          Reference · Reconstitution
        </span>
      </nav>

      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <Section first>
        <Eyebrow>Compound reference · Retatrutide</Eyebrow>
        <h1 className="mb-7 font-sans text-[40px] font-extralight leading-[0.98] tracking-[-0.01em] text-ink md:text-[80px]">
          SOLUTION
          <br />
          <span
            style={{
              backgroundImage: `linear-gradient(100deg, ${hueVar('cy')}, ${hueVar('pu')})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            PREPARATION
          </span>
        </h1>
        <p className="mb-3 max-w-[70ch] text-[14px] leading-[1.9] text-dim md:text-[18px]">
          Reconstitution chemistry for 10 mg, 20 mg and 30 mg lyophilized vials at a 10 mg/mL
          working concentration — what each preparation contains, how much a vial holds, and how
          long the prepared solution remains characterized.
        </p>

        {/* Mandatory per CLAUDE.md §16.9. Never remove, never move below the
            arithmetic, never soften the wording. */}
        <div className="my-10 border-l-2 border-gold bg-panelHot px-6 py-[22px] md:my-16">
          <span className="mb-3 block font-mono text-[9px] uppercase tracking-[0.34em] text-gold">
            Scope of this reference
          </span>
          <p className="font-mono text-[12.5px] font-light leading-[1.85] text-dim">
            For research and reference purposes only. Not intended as dosing instructions for human
            or animal use. Consult a licensed physician before any medical decisions.
          </p>
        </div>

        <P>
          Retatrutide is an investigational GLP-1 / GIP / glucagon triple receptor agonist in
          Lilly&rsquo;s phase 3 program. It holds no marketing authorization in any jurisdiction,
          which means there is no approved formulation, no approved concentration, and no
          established administration protocol outside a controlled trial. Material distributed for
          research use carries no verified assay of identity, potency, or sterility — every figure
          below is a calculation about the labeled mass, not a measurement of vial contents.
        </P>
      </Section>

      {/* ── 01 Notation ──────────────────────────────────────────────────── */}
      <Section>
        <Eyebrow hue="go">01 · Notation</Eyebrow>
        <H2>
          The unit that is <Em>not</Em> a unit.
        </H2>
        <P>
          Volume notation is the largest single source of preparation error in self-mixed peptide
          work, and it is an arithmetic failure rather than a pharmacological one. A cubic
          centimetre is a millilitre. It is not a syringe gradation.
        </P>

        <div className="my-8 border border-gold bg-panel p-6 md:p-9">
          <span className="mb-[18px] flex items-center gap-[9px] font-mono text-[9.5px] uppercase tracking-[0.34em] text-gold">
            <span
              className="h-[6px] w-[6px] flex-none"
              style={{ background: hueVar('go'), boxShadow: `0 0 12px ${hueVar('go')}` }}
              aria-hidden
            />
            Two-order-of-magnitude divergence
          </span>
          <P>
            On a U-100 insulin syringe, 100 gradations span 1 mL. A figure recorded as
            &ldquo;cc&rdquo; and then read as gradations — or the reverse — is wrong by a factor of
            one hundred:
          </P>

          <div className="my-6 grid grid-cols-1 gap-px bg-hair sm:grid-cols-2">
            <div className="bg-ground px-5 py-[22px] text-center">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-faint">
                20 units · U-100
              </div>
              <div
                className="font-mono text-[17px] font-medium leading-[1.3] md:text-[22px]"
                style={{ color: hueVar('cy') }}
              >
                0.20 mL
                <br />2 mg
              </div>
              <div className="mt-[10px] font-mono text-[10px] tracking-[0.06em] text-faintest">
                One fifth of a millilitre
              </div>
            </div>
            <div className="bg-ground px-5 py-[22px] text-center">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-faint">
                20 cc
              </div>
              <div className="font-mono text-[17px] font-medium leading-[1.3] text-gold md:text-[22px]">
                20 mL
                <br />
                ~200 mg
              </div>
              <div className="mt-[10px] font-mono text-[10px] tracking-[0.06em] text-faintest">
                Exceeds the whole vial
              </div>
            </div>
          </div>

          <p className="max-w-[72ch] leading-[1.9] text-dim">
            20 cc is a physically larger volume than any of these preparations contains. Any
            protocol note, spreadsheet column, or app field carrying this quantity should record{' '}
            <Strong>units</Strong> and reference the U-100 scale explicitly. Never let
            &ldquo;cc&rdquo; propagate from one record to the next.
          </p>
        </div>
      </Section>

      {/* ── 02 Preparation ───────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>02 · Preparation</Eyebrow>
        <H2>
          One concentration across <Em>three</Em> vial sizes.
        </H2>
        <P>
          Scaling diluent volume in proportion to labeled mass converges all three vials on an
          identical working concentration, so a single conversion table describes every preparation:
        </P>

        <Grid columns="repeat(4,1fr)">
          <Th>Vial</Th>
          <Th>Bacteriostatic water</Th>
          <Th>Final volume</Th>
          <Th>Concentration</Th>

          <Td tone="ink">10 mg</Td>
          <Td>1.0 mL</Td>
          <Td>1.0 mL</Td>
          <Td tone="cy">10 mg/mL</Td>

          <Td tone="ink">20 mg</Td>
          <Td>2.0 mL</Td>
          <Td>2.0 mL</Td>
          <Td tone="cy">10 mg/mL</Td>

          <Td tone="ink">30 mg</Td>
          <Td>3.0 mL</Td>
          <Td>3.0 mL</Td>
          <Td tone="cy">10 mg/mL</Td>
        </Grid>

        <div className="my-8 border border-hair bg-panel px-7 py-8 text-center md:px-11 md:py-11">
          <span
            className="block font-sans text-[34px] font-extralight leading-none md:text-[56px]"
            style={{ color: hueVar('cy') }}
          >
            1 unit = 0.1 mg
          </span>
          <div className="mt-[18px] font-mono text-[9.5px] uppercase tracking-[0.34em] text-faint">
            U-100 gradation at 10 mg/mL
          </div>
        </div>

        <H3>Aseptic procedure</H3>
        <ol className="mb-[18px] max-w-[72ch] list-decimal pl-5 leading-[1.9] text-dim marker:text-faintest">
          <li className="mb-[10px]">Allow the vial to reach room temperature before opening.</li>
          <li className="mb-[10px]">
            Swab both stoppers — lyophilate and diluent — with fresh alcohol; allow to dry fully.
          </li>
          <li className="mb-[10px]">
            Draw the measured diluent volume using a sterile needle. Use a new needle for every
            puncture.
          </li>
          <li className="mb-[10px]">
            Angle the needle so diluent runs <Strong>down the interior wall</Strong> of the vial
            rather than directly onto the cake.
          </li>
          <li className="mb-[10px]">
            Do not shake — agitation shears peptide bonds. Roll or swirl until dissolution
            completes, which may take several minutes.
          </li>
          <li className="mb-[10px]">
            A correctly reconstituted solution is clear and colorless. Cloudiness, discoloration,
            visible particulates, or incomplete dissolution indicate the preparation should be
            discarded.
          </li>
          <li className="mb-[10px]">
            Record the reconstitution date on the vial. Every figure in section 04 is measured from
            that date.
          </li>
        </ol>
      </Section>

      {/* ── 03 Solution content ──────────────────────────────────────────── */}
      <Section>
        <Eyebrow hue="pu">03 · Solution content</Eyebrow>
        <H2>
          What each draw volume <Em>contains.</Em>
        </H2>
        <P>
          At a 10 mg/mL reconstitution, a U-100 syringe drawn to the gradations below holds the
          following quantity of compound in solution:
        </P>

        <Grid columns="repeat(3,1fr)">
          <Th>Gradations (U-100)</Th>
          <Th>Volume</Th>
          <Th>Compound in solution</Th>

          <Td>5</Td>
          <Td>0.05 mL</Td>
          <Td tone="cy">0.5 mg</Td>

          <Td>10</Td>
          <Td>0.10 mL</Td>
          <Td tone="cy">1.0 mg</Td>

          <Td>15</Td>
          <Td>0.15 mL</Td>
          <Td tone="cy">1.5 mg</Td>

          <Td tone="ink">20</Td>
          <Td tone="ink">0.20 mL</Td>
          <Td tone="cy">2.0 mg</Td>

          <Td>30</Td>
          <Td>0.30 mL</Td>
          <Td tone="cy">3.0 mg</Td>

          <Td>40</Td>
          <Td>0.40 mL</Td>
          <Td tone="cy">4.0 mg</Td>
        </Grid>

        <div className="my-7 border-l-2 border-accent bg-panelHi px-6 py-5">
          <p className="text-[15px] leading-[1.85] text-faint">
            <Strong>Literature context.</Strong> Published phase 2 results (Jastreboff et al.,{' '}
            <em className="italic">NEJM</em>, 2023) describe trial arms initiating at 1 mg or 2 mg
            weekly, escalating in four-week increments to ceilings between 4 mg and 12 mg.
          </p>
          <p className="mt-[14px] text-[15px] leading-[1.85] text-faint">
            Gastrointestinal adverse events in those trials scaled with both absolute quantity and
            escalation rate, and were the principal cause of participant withdrawal. Trial
            quantities were administered under titration oversight with scheduled laboratory
            monitoring; they describe what was studied, not what is appropriate for any individual.
          </p>
        </div>
      </Section>

      {/* ── 04 Capacity & characterization window ────────────────────────── */}
      <Section>
        <Eyebrow>04 · Capacity &amp; characterization window</Eyebrow>
        <H2>
          Where the arithmetic and the <Em>chemistry</Em> disagree.
        </H2>
        <P>
          Vial capacity is straightforward division. The constraint that actually governs a
          preparation is narrower — and for the larger vials the two figures diverge sharply:
        </P>

        <Grid columns="1.1fr .9fr .8fr 1fr 1.5fr">
          <Th>Vial</Th>
          <Th>Total units</Th>
          <Th>20-unit draws</Th>
          <Th>At weekly interval</Th>
          <Th>vs. 28-day window</Th>

          <Td tone="ink">10 mg</Td>
          <Td>100</Td>
          <Td>5</Td>
          <Td>5 weeks · 35 d</Td>
          <Td tone="gold">7 days beyond</Td>

          <Td tone="ink">20 mg</Td>
          <Td>200</Td>
          <Td>10</Td>
          <Td>10 weeks · 70 d</Td>
          <Td tone="gold">42 days beyond</Td>

          <Td tone="ink">30 mg</Td>
          <Td>300</Td>
          <Td>15</Td>
          <Td>15 weeks · 105 d</Td>
          <Td tone="gold">77 days beyond</Td>
        </Grid>

        <P>
          Bacteriostatic water is preserved with 0.9% benzyl alcohol and is{' '}
          <Strong>labeled for 28 days following first puncture</Strong>. Reconstituted peptide
          degrades on a broadly comparable refrigerated timeline. Past that boundary a preparation
          carries two compounding unknowns: declining potency, so the quantity drawn no longer
          matches the quantity in the table above, and a preservative no longer reliably suppressing
          microbial growth in a repeatedly punctured vial.
        </P>

        <P>
          At a 20-unit weekly draw, a 30 mg vial holds close to four times what its characterization
          window covers. Dividing the lyophilate across smaller diluent volumes does not extend this
          — the interval runs from reconstitution regardless of how much water was added. The only
          variables that genuinely shorten time-in-use are a smaller vial or a larger draw, and draw
          quantity is not a parameter to select for the convenience of vial arithmetic.
        </P>

        <H3>Storage</H3>
        <ul className="mb-[18px] max-w-[72ch] list-disc pl-5 leading-[1.9] text-dim marker:text-faintest">
          <li className="mb-[10px]">
            <Strong>Pre-reconstitution:</Strong> lyophilized powder, refrigerated, protected from
            light.
          </li>
          <li className="mb-[10px]">
            <Strong>Post-reconstitution:</Strong> 2–8 °C. Do not freeze — ice crystal formation
            damages peptide structure.
          </li>
          <li className="mb-[10px]">
            Minimize time at room temperature and exposure to direct light.
          </li>
          <li className="mb-[10px]">Swab the stopper before every draw; new sterile needle every time.</li>
          <li className="mb-[10px]">
            Discard on any change in clarity, color, or the appearance of particulates.
          </li>
        </ul>
      </Section>

      {/* ── 05 Reported effects ──────────────────────────────────────────── */}
      <Section>
        <Eyebrow hue="pu">05 · Reported effects</Eyebrow>
        <H2>
          What the trial record <Em>describes.</Em>
        </H2>
        <P>
          Gastrointestinal effects dominate the published adverse-event profile: nausea, vomiting,
          diarrhea, constipation, and early satiety. Dose-dependent increases in resting heart rate
          were also recorded. Because this receptor class suppresses appetite substantially,
          dehydration and inadequate protein intake are documented secondary risks that compound the
          primary gastrointestinal burden.
        </P>

        <P>
          Presentations that warrant prompt clinical assessment in the literature include severe or
          persistent abdominal pain — particularly pain radiating to the back, a recognized
          presentation of pancreatitis — persistent vomiting or signs of dehydration, and symptoms
          consistent with significant hypoglycemia.
        </P>

        <p className="mt-[18px] font-mono text-[11px] leading-[1.8] tracking-[0.04em] text-faintest">
          A clinician assessing any of the above needs an accurate account of what was administered
          and in what quantity. Withholding that information impairs diagnosis; it is not a
          precondition of receiving care.
        </p>
      </Section>

      {/* ── 06 Limits ────────────────────────────────────────────────────── */}
      <Section>
        <Eyebrow hue="go">06 · Limits of this reference</Eyebrow>
        <H2>
          What this document <Em>cannot</Em> establish.
        </H2>

        <div className="my-8 grid grid-cols-1 gap-px border border-hair bg-hair md:grid-cols-3">
          <div className="bg-ground px-[22px] py-[26px]">
            <div
              className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.28em]"
              style={{ color: hueVar('cy') }}
            >
              Identity &amp; potency
            </div>
            <p className="text-[13.5px] leading-[1.75] text-faint">
              Whether the vial contains retatrutide, and at the labeled mass. Every calculation here
              is downstream of an assumption no reference sheet can verify.
            </p>
          </div>
          <div className="bg-ground px-[22px] py-[26px]">
            <div
              className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.28em]"
              style={{ color: hueVar('pu') }}
            >
              Sterility
            </div>
            <p className="text-[13.5px] leading-[1.75] text-faint">
              Non-pharmaceutical fill carries endotoxin and contamination risk that aseptic handling
              at the point of preparation cannot correct for.
            </p>
          </div>
          <div className="bg-ground px-[22px] py-[26px]">
            <div className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.28em] text-gold">
              Individual suitability
            </div>
            <p className="text-[13.5px] leading-[1.75] text-faint">
              Interaction with medical history, concurrent medications, and monitoring requirements
              — the oversight a trial protocol supplies and self-administration does not.
            </p>
          </div>
        </div>

        <P>
          Phase 3 evaluation is incomplete. Long-term safety, durability of effect, and the full
          interaction profile are not yet established in the published record.
        </P>

        <p className="mt-[18px] font-mono text-[11px] leading-[1.8] tracking-[0.04em] text-faintest">
          Educational reference only. Peptide Cortex describes how compounds are studied — it does
          not diagnose, treat, prescribe, or provide personal dosing instructions. Verify all figures
          against primary literature and a licensed physician.
        </p>
      </Section>

      {/* ── footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-12 flex flex-wrap items-center gap-3 border-t border-hair pb-16 pt-9 md:mt-20">
        <span className="h-[7px] w-[7px] flex-none" style={{ background: hueVar('cy') }} aria-hidden />
        <span className="font-mono text-[13px] tracking-[0.34em] text-ink">PEPTIDE CORTEX</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-faintest">
          © 2026 Tigris Tech Labs · Adults 18+ · Research use only
        </span>
      </footer>
    </div>
  )
}
