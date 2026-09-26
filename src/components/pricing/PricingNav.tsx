import Link from 'next/link'
import { primaryNav } from '@/lib/nav'

// Ports the header band from
// design_handoff_peptide_cortex/Peptide Cortex Pricing.dc.html (lines 32-41).
//
// The prototype links to sibling .dc.html files: the logo to Home, "SEE THE
// FIELD" to the Mirror, "SIGN IN" to Auth. In this repo those map to `/`
// (marketing landing — still the pre-redesign page until the Home screen
// lands), `/dashboard` (the Mirror's route target per the migration doc), and
// `/login`.
//
// 2026-09-26: "SEE THE FIELD" is replaced by the site's one menu — Bench ·
// Library · Shop (src/lib/nav.ts) — in this surface's own mono idiom, since
// pricing is a ground-token page and cannot borrow the paper header.

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
      <nav aria-label="Site" className="flex flex-wrap items-center gap-2">
        {primaryNav().map((item) => (
          <Link
            key={item.section}
            href={item.href}
            className="flex min-h-[44px] items-center whitespace-nowrap px-3 font-mono text-[12px] uppercase tracking-[0.14em] text-dim md:text-[10px]"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/login"
          className="flex min-h-[44px] items-center whitespace-nowrap border border-hair px-4 font-mono text-[12px] tracking-[0.14em] text-ink md:text-[10px]"
        >
          SIGN IN
        </Link>
      </nav>
    </div>
  )
}
