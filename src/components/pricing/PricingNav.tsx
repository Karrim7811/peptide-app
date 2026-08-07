import Link from 'next/link'

// Ports the header band from
// design_handoff_peptide_cortex/Peptide Cortex Pricing.dc.html (lines 32-41).
//
// The prototype links to sibling .dc.html files: the logo to Home, "SEE THE
// FIELD" to the Mirror, "SIGN IN" to Auth. In this repo those map to `/`
// (marketing landing — still the pre-redesign page until the Home screen
// lands), `/dashboard` (the Mirror's route target per the migration doc), and
// `/login`.

export default function PricingNav() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b border-hair px-5 py-2.5">
      <Link href="/" className="flex min-h-[44px] items-center gap-2.5 text-ink">
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-accent"
          style={{ boxShadow: '0 0 10px var(--accent)', animation: 'cxpulse 2.4s infinite' }}
        />
        <span className="font-mono text-[11px] tracking-[0.3em]">PEPTIDE CORTEX</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex min-h-[44px] items-center whitespace-nowrap px-3.5 font-mono text-[10px] tracking-[0.14em] text-dim"
        >
          SEE THE FIELD
        </Link>
        <Link
          href="/login"
          className="flex min-h-[44px] items-center whitespace-nowrap border border-hair px-4 font-mono text-[10px] tracking-[0.14em] text-ink"
        >
          SIGN IN
        </Link>
      </div>
    </div>
  )
}
