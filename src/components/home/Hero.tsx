import Link from 'next/link'

/**
 * Hero — the animated field.
 *
 * Ported from the prototype's breathing radial glow, three masked dot-grid
 * particle layers drifting in opposition, and a small SVG node network that
 * stands in for a resolved compound graph. Every colour is a ground token
 * (`--glowA/B/C`, `--dotA/B/C`, `--hue-*`) rather than a literal hex, so the
 * field re-themes live with the ground switcher in the nav.
 */
export default function Hero() {
  return (
    <div className="relative flex min-h-[86vh] items-center overflow-hidden px-5 pb-20 pt-[60px]">
      {/* breathing glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 54% 58% at 62% 46%, var(--glowA), transparent 70%), ' +
            'radial-gradient(ellipse 38% 42% at 48% 36%, var(--glowB), transparent 68%), ' +
            'radial-gradient(ellipse 22% 26% at 74% 62%, var(--glowC), transparent 66%)',
          animation: 'cxbreathe 11s ease-in-out infinite',
        }}
      />

      {/* particle layer — cyan, slow drift */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.42]"
        style={{
          backgroundImage: 'radial-gradient(var(--dotB) 0.9px, transparent 1.1px)',
          backgroundSize: '7px 7px',
          animation: 'cxdriftA 26s linear infinite alternate',
          maskImage:
            'radial-gradient(ellipse 38% 44% at 50% 38%, #000 12%, rgba(0,0,0,0.5) 45%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 38% 44% at 50% 38%, #000 12%, rgba(0,0,0,0.5) 45%, transparent 78%)',
        }}
      />

      {/* particle layer — purple, opposing drift */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(var(--dotA) 0.9px, transparent 1.1px)',
          backgroundSize: '9px 9px',
          animation: 'cxdriftB 34s linear infinite alternate',
          maskImage:
            'radial-gradient(ellipse 48% 52% at 64% 50%, #000 8%, rgba(0,0,0,0.45) 42%, transparent 76%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 48% 52% at 64% 50%, #000 8%, rgba(0,0,0,0.45) 42%, transparent 76%)',
        }}
      />

      {/* particle layer — gold, the "supply thinning" pulse */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(var(--dotC) 1.1px, transparent 1.3px)',
          backgroundSize: '6px 6px',
          animation: 'cxdriftB 30s linear infinite alternate, cxthin 3.4s ease-in-out infinite',
          maskImage:
            'radial-gradient(ellipse 13% 15% at 75% 62%, #000 4%, rgba(0,0,0,0.55) 40%, transparent 74%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 13% 15% at 75% 62%, #000 4%, rgba(0,0,0,0.55) 40%, transparent 74%)',
        }}
      />

      {/* node network */}
      <svg
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
        aria-hidden
      >
        <line x1={880} y1={300} x2={1040} y2={380} style={{ stroke: 'var(--hue-cy)' }} strokeWidth={2} strokeOpacity={0.5} />
        <line
          x1={1040}
          y1={380}
          x2={1120}
          y2={520}
          style={{ stroke: 'var(--hue-go)', animation: 'cxmarch 1.5s linear infinite' }}
          strokeWidth={1.8}
          strokeOpacity={0.55}
          strokeDasharray="8 7"
        />
        <line x1={880} y1={300} x2={960} y2={520} style={{ stroke: 'var(--dim)' }} strokeWidth={1.2} strokeOpacity={0.25} />
        <circle cx={880} cy={300} r={34} style={{ fill: 'var(--hue-cy)', stroke: 'var(--hue-cy)' }} fillOpacity={0.1} strokeWidth={1.5} />
        <circle cx={880} cy={300} r={46} fill="none" style={{ stroke: 'var(--hue-cy)' }} strokeOpacity={0.2} />
        <circle cx={1040} cy={380} r={26} style={{ fill: 'var(--hue-pu)', stroke: 'var(--hue-pu)' }} fillOpacity={0.12} strokeWidth={1.5} />
        <circle cx={1120} cy={520} r={22} style={{ fill: 'var(--hue-go)', stroke: 'var(--hue-go)' }} fillOpacity={0.1} strokeWidth={1.6} />
        <circle
          cx={1120}
          cy={520}
          r={34}
          fill="none"
          style={{ stroke: 'var(--hue-go)', animation: 'cxmarch 1.5s linear infinite' }}
          strokeOpacity={0.45}
          strokeDasharray="8 7"
        />
        <circle cx={960} cy={520} r={18} style={{ fill: 'var(--hue-gr)', stroke: 'var(--hue-gr)' }} fillOpacity={0.12} strokeWidth={1.3} strokeOpacity={0.7} />
      </svg>

      <div className="relative z-[2] mx-auto flex w-full max-w-[1280px] flex-col gap-[26px] px-1">
        <div className="flex items-center gap-2.5" style={{ animation: 'cxup 700ms cubic-bezier(.2,.7,.2,1) both' }}>
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-hue-cy"
            style={{ boxShadow: '0 0 10px var(--hue-cy)', animation: 'cxpulse 2.4s infinite' }}
          />
          <span className="font-mono text-[10px] tracking-[0.3em] text-hue-cy">
            A REASONING LAYER FOR PEPTIDE RESEARCH
          </span>
        </div>

        <h1
          className="m-0 max-w-[900px] font-sans text-[clamp(46px,8vw,104px)] font-extralight leading-[0.98] tracking-[-0.01em] text-ink"
          style={{ animation: 'cxup 700ms 80ms cubic-bezier(.2,.7,.2,1) both' }}
        >
          Stop reading
          <br />
          your protocol.
          <br />
          <span className="font-display font-light italic text-accent">Look at it.</span>
        </h1>

        <p
          className="m-0 max-w-[620px] text-[clamp(16px,1.6vw,20px)] leading-[1.75] text-dim"
          style={{ textWrap: 'pretty', animation: 'cxup 700ms 160ms cubic-bezier(.2,.7,.2,1) both' }}
        >
          Peptide Cortex renders everything you take as one living surface. Evidence is
          brightness. Adherence is density. A conflict or a supply gap shows up as tension you
          can see before you can name it.
        </p>

        <div
          id="access"
          className="flex flex-wrap items-center gap-3"
          style={{ animation: 'cxup 700ms 240ms cubic-bezier(.2,.7,.2,1) both' }}
        >
          <Link
            href="/signup"
            className="flex h-[52px] items-center whitespace-nowrap bg-accent px-7 font-mono text-[11px] tracking-[0.18em] text-ground transition-shadow hover:shadow-[0_0_24px_var(--accentDim)]"
          >
            CREATE YOUR FIELD →
          </Link>
          <Link
            href="/login"
            className="flex h-[52px] items-center whitespace-nowrap border border-hair px-7 font-mono text-[11px] tracking-[0.18em] text-dim hover:border-hue-cy hover:text-ink"
          >
            LOG IN
          </Link>
          <span className="font-mono text-[10px] tracking-[0.12em] text-faint">
            FREE TO START · NO CARD
          </span>
        </div>
        <span className="font-mono text-[10px] leading-[1.9] tracking-[0.1em] text-faint">
          ADULTS 18+ · EDUCATIONAL &amp; RESEARCH USE ONLY · NOT MEDICAL ADVICE
        </span>
      </div>
    </div>
  )
}
