// Ports the "NEVER BEHIND THE PAYWALL" block — prototype lines 145-151.
// Copy verbatim. This is the promise the pricing page prints and the
// entitlement module (see handoff README, "Never gate") has to keep.

export default function SafetyBlock() {
  return (
    <div className="flex justify-center px-5 pb-14">
      <div
        className="flex w-full max-w-[1080px] flex-col gap-3 bg-panelHot p-7"
        style={{ borderLeft: '2px solid var(--gold)' }}
      >
        <span className="font-mono text-[10px] tracking-[0.26em] text-gold">NEVER BEHIND THE PAYWALL</span>
        <span className="font-display text-[26px] font-light leading-[1.3] text-ink" style={{ textWrap: 'pretty' }}>
          Anything that could hurt you if you got it wrong is free.
        </span>
        <span className="max-w-[720px] text-[15px] leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
          Reconstitution arithmetic, cautions, contraindications and documented interactions stay
          readable at every tier, including for compounds your plan has not resolved. We will not
          put a dosing calculation behind a card form.
        </span>
      </div>
    </div>
  )
}
