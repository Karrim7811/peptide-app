import { COMPOUND_LIST, COUNTS, GRADE_ORDER, type Grade } from '@/lib/catalog'

// Prototype colour scheme (A/A- cyan, B+/B/B- purple, C+ gold, C grey) collapsed
// onto this catalog's coarser 5-grade scale: strongest evidence stays coolest/
// brightest, weakest stays dimmest.
const GRADE_COLOR: Record<Grade, string> = {
  A: 'var(--hue-cy)',
  B: 'var(--accent)',
  C: 'var(--gold)',
  D: 'var(--faint)',
  '—': 'var(--faintest)',
}

function gradeTally() {
  const counts = new Map<Grade, number>()
  for (const entry of COMPOUND_LIST) {
    counts.set(entry.grade, (counts.get(entry.grade) ?? 0) + 1)
  }
  const max = Math.max(...Array.from(counts.values()))
  return GRADE_ORDER.filter((grade) => counts.has(grade)).map((grade) => {
    const count = counts.get(grade) ?? 0
    return {
      grade,
      count,
      pct: max > 0 ? Math.round((count / max) * 100) : 0,
      color: GRADE_COLOR[grade],
    }
  })
}

/**
 * "THE LIBRARY" — evidence grade breakdown, real counts from the catalog.
 *
 * One deliberate deviation from the prototype's literal copy: its footnote
 * read "GRADES DERIVE FROM THE LIBRARY'S OWN EVIDENCE LEVEL AND CV RATING ·
 * NOT FROM AN OPINION". Per the design handoff README's own explicit warning,
 * that is exactly the bug it documents — cvRating is a cardiovascular score
 * that must NEVER touch the evidence grade (grade is one-to-one from
 * `evidenceLevel` only, see src/lib/catalog.ts). Reproducing that sentence
 * verbatim would ship a factual error about how a medical-adjacent grading
 * system works, so "AND CV RATING" is dropped here.
 */
export default function Library() {
  const grades = gradeTally()

  return (
    <section
      id="library"
      className="border-t border-hair px-5 py-20"
      style={{ backgroundImage: 'linear-gradient(180deg, var(--accentWash), transparent 60%)' }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-12">
        <div className="flex min-w-[300px] flex-[1_1_380px] flex-col gap-4">
          <span className="font-mono text-[10px] tracking-[0.3em] text-faint">THE LIBRARY</span>
          <span className="font-display text-[clamp(28px,3.6vw,46px)] font-light leading-[1.18] text-ink">
            Graded, sourced, and quoted <span className="italic text-hue-cy">verbatim.</span>
          </span>
          <p className="text-base leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
            {COUNTS.compounds} compounds across {COUNTS.categories} goal categories, each
            carrying its own evidence level and cardiovascular rating. Cortex never paraphrases
            the record — where the library says a dosage field is unestablished, that is
            exactly what you see.
          </p>
          <p className="text-base leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
            When two fields of the record disagree with each other, the interface says so
            rather than picking a side.
          </p>
        </div>

        <div className="flex min-w-[300px] flex-[1_1_380px] flex-col gap-px bg-hair">
          {grades.map((g) => (
            <div key={g.grade} className="flex items-center gap-4 bg-panel px-[18px] py-4">
              <span
                className="w-11 font-sans text-2xl font-extralight leading-none"
                style={{ color: g.color }}
              >
                {g.grade}
              </span>
              <div className="h-1 min-w-0 flex-1 bg-hair">
                <div className="h-full" style={{ width: `${g.pct}%`, background: g.color }} />
              </div>
              <span className="w-[88px] text-right font-mono text-[11px] text-faint">
                {g.count} compounds
              </span>
            </div>
          ))}
          <div className="bg-panel px-[18px] py-4">
            <span
              className="font-mono text-[10px] leading-[1.9] tracking-[0.08em] text-faint"
              style={{ textWrap: 'pretty' }}
            >
              GRADES DERIVE FROM THE LIBRARY&apos;S OWN EVIDENCE LEVEL · NOT FROM AN OPINION
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
