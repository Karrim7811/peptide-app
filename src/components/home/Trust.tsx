const CARDS = [
  {
    tag: 'SOURCED',
    varName: '--hue-cy',
    body: 'Every claim traces to the reference library, and every number on your field traces to something you logged.',
  },
  {
    tag: 'REFERENCE, NOT RX',
    varName: '--accent',
    body: 'An educational reference for adults 18+. Cortex describes how compounds are studied. It does not diagnose, treat or prescribe.',
  },
  {
    tag: 'YOUR DATA',
    varName: '--gold',
    body: 'Row-level isolation per account. Never sold, never trained on. Delete it and it is gone.',
  },
] as const

/** The evidence-honesty / trust block — three plain promises, no headline. */
export default function Trust() {
  return (
    <section className="border-t border-hair px-5 py-20">
      <div
        className="mx-auto grid max-w-[1280px] gap-px bg-hair"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
      >
        {CARDS.map((card) => (
          <div
            key={card.tag}
            className="flex flex-col gap-3 border-t-2 bg-panel px-[26px] py-[30px]"
            style={{ borderTopColor: `var(${card.varName})` }}
          >
            <span
              className="font-mono text-[10px] tracking-[0.22em]"
              style={{ color: `var(${card.varName})` }}
            >
              {card.tag}
            </span>
            <span className="text-[15px] leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
              {card.body}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
