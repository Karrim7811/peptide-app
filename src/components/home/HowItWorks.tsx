// "The problem" (the old app's fragmentation, stated plainly) and "the four
// zoom layers explained" are one visual section in the prototype (`id="how"`
// in Peptide Cortex Home.dc.html) — an intro block followed by a 4-card grid.
// Kept as one component for that reason; the two ideas are visually distinct
// blocks within it.

const LAYERS = [
  {
    n: '01',
    tag: 'WHOLE',
    hueClass: 'text-accent',
    title: 'The form',
    body: 'Your whole protocol as one surface. Cortex says one thing, then goes quiet.',
  },
  {
    n: '02',
    tag: 'GOAL',
    hueClass: 'text-hue-cy',
    title: 'A system',
    body: 'Repair, GH axis, metabolic. Interactions live here as geometry, not as a form you fill in.',
  },
  {
    n: '03',
    tag: 'COMPOUND',
    hueClass: 'text-hue-cy',
    title: 'One molecule',
    body: 'The reference entry and your own history with it are the same object, seen at the same depth.',
  },
  {
    n: '04',
    tag: 'VERIFY',
    hueClass: 'text-gold',
    title: 'The claim, the math',
    body: 'Deliberately plain. The arithmetic with its working shown, and the record behind every grade.',
  },
] as const

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-hair px-5 py-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-11">
        {/* the problem, stated plainly */}
        <div className="flex max-w-[760px] flex-col gap-3.5">
          <span className="font-mono text-[10px] tracking-[0.3em] text-faint">
            HOW IT WORKS · ONE AXIS, NO MENU
          </span>
          <span className="font-display text-[clamp(30px,4vw,52px)] font-light leading-[1.15] text-ink">
            You don&apos;t navigate pages. You <span className="italic text-accent">zoom</span>.
          </span>
          <span className="text-base leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
            Every screen the old app had is absorbed into four depths. Zoom out is back. There
            is no sidebar to hunt through, because the thing you are looking at is the
            navigation.
          </span>
        </div>

        {/* the four zoom layers */}
        <div
          className="grid gap-px bg-hair"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
        >
          {LAYERS.map((layer) => (
            <div key={layer.n} className="flex flex-col gap-3.5 bg-panel px-6 py-7">
              <div className="flex items-baseline gap-2.5">
                <span className={`font-sans text-[44px] font-extralight leading-none ${layer.hueClass}`}>
                  {layer.n}
                </span>
                <span className={`font-mono text-[10px] tracking-[0.2em] ${layer.hueClass}`}>
                  {layer.tag}
                </span>
              </div>
              <span className="font-display text-[25px] leading-[1.25] text-ink">{layer.title}</span>
              <span className="text-sm leading-[1.8] text-faint" style={{ textWrap: 'pretty' }}>
                {layer.body}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
