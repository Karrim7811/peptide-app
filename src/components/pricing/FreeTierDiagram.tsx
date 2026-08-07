// Ports "WHAT ONE COMPOUND ACTUALLY SHOWS YOU" — prototype lines 115-143.
// The SVG geometry (viewBox, coordinates, radii) is reproduced exactly per
// the handoff doc ("Reproduce it faithfully"); colours are swapped from the
// prototype's hardcoded hex to the equivalent ground tokens.
//
// This is the free-tier argument made visual: the resolved (YOURS) node
// keeps drawing dashed edges out to compounds the plan hasn't unlocked
// (LOCKED) and compounds the user doesn't own at all (LIBRARY, faint,
// no ring) — see the entitlement rule in the handoff README, "Never
// conflate locked with not owned."

export default function FreeTierDiagram() {
  return (
    <div className="flex justify-center px-5 py-14">
      <div className="flex w-full max-w-[1080px] flex-wrap items-center gap-9 border border-hair p-8">
        <div className="flex flex-1 flex-col gap-3.5" style={{ minWidth: 280, flexBasis: 300 }}>
          <span className="font-mono text-[10px] tracking-[0.26em] text-hue-cy">
            WHAT ONE COMPOUND ACTUALLY SHOWS YOU
          </span>
          <span className="font-display text-[30px] font-light leading-[1.25] text-ink" style={{ textWrap: 'pretty' }}>
            A single compound is not a single dot.
          </span>
          <span className="text-[15px] leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
            Free resolves one of your compounds — but the form still draws every relationship
            that compound has, out into the ones you have not unlocked. You can see what sits
            adjacent to what you take, and where the tension would form, before you pay
            anything.
          </span>
          <span className="font-mono text-[10px] leading-[1.9] tracking-[0.1em] text-faint">
            SOLID = RESOLVED · DASHED = YOURS, LOCKED · FAINT = NOT YOURS
          </span>
        </div>

        <div className="flex flex-1 justify-center" style={{ minWidth: 280, flexBasis: 300 }}>
          <svg viewBox="0 0 340 240" style={{ width: '100%', maxWidth: 360, height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
            <line x1={170} y1={120} x2={72} y2={62} stroke="var(--faint)" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="6 6" style={{ animation: 'cxmarch 1.5s linear infinite' }} />
            <line x1={170} y1={120} x2={278} y2={70} stroke="var(--faint)" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="6 6" style={{ animation: 'cxmarch 1.5s linear infinite' }} />
            <line x1={170} y1={120} x2={86} y2={188} stroke="var(--faint)" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="6 6" style={{ animation: 'cxmarch 1.5s linear infinite' }} />
            <line x1={170} y1={120} x2={266} y2={184} stroke="var(--faint)" strokeWidth={1} strokeOpacity={0.35} />

            <circle cx={170} cy={120} r={30} fill="var(--hue-cy)" fillOpacity={0.12} stroke="var(--hue-cy)" strokeWidth={1.6} />
            <text x={170} y={124} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize={10} letterSpacing={1.4} fill="var(--hue-cy)">
              YOURS
            </text>

            <circle cx={72} cy={62} r={17} fill="var(--accent)" fillOpacity={0.05} stroke="var(--accent)" strokeWidth={1} strokeOpacity={0.55} strokeDasharray="7 6" style={{ animation: 'cxmarch 1.5s linear infinite' }} />
            <circle cx={278} cy={70} r={17} fill="var(--accent)" fillOpacity={0.05} stroke="var(--accent)" strokeWidth={1} strokeOpacity={0.55} strokeDasharray="7 6" style={{ animation: 'cxmarch 1.5s linear infinite' }} />
            <circle cx={86} cy={188} r={17} fill="var(--gold)" fillOpacity={0.05} stroke="var(--gold)" strokeWidth={1} strokeOpacity={0.55} strokeDasharray="7 6" style={{ animation: 'cxmarch 1.5s linear infinite' }} />
            <circle cx={266} cy={184} r={13} fill="none" stroke="var(--faintest)" strokeWidth={1} />

            <text x={72} y={94} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize={8.5} letterSpacing={1} fill="var(--faint)">LOCKED</text>
            <text x={278} y={102} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize={8.5} letterSpacing={1} fill="var(--faint)">LOCKED</text>
            <text x={86} y={220} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize={8.5} letterSpacing={1} fill="var(--faint)">LOCKED</text>
            <text x={266} y={210} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize={8.5} letterSpacing={1} fill="var(--faintest)">LIBRARY</text>
          </svg>
        </div>
      </div>
    </div>
  )
}
