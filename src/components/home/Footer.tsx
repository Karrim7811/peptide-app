import Link from 'next/link'

/**
 * Legal footer. Copy is verbatim from the prototype. Link targets differ from
 * the prototype's placeholder `#access` anchors (a stand-in inside the design
 * sandbox, which had no other pages) — TERMS and PRIVACY point at this app's
 * real routes (src/app/terms, src/app/privacy), and CONTACT uses the support
 * address already used on the existing pricing page.
 */
export default function Footer() {
  return (
    <footer className="border-t border-hair px-5 pb-10 pt-[70px]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-accent"
              style={{ boxShadow: '0 0 10px var(--accent)' }}
            />
            <span className="font-mono text-xs tracking-[0.32em] text-ink">PEPTIDE CORTEX</span>
          </div>
          <span className="font-mono text-[10px] leading-[1.9] tracking-[0.1em] text-faint">
            © 2026 PEPTIDE CORTEX · RESEARCH USE ONLY
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Link
            href="/terms"
            className="flex min-h-11 items-center px-3 font-mono text-[10px] tracking-[0.14em] text-dim hover:text-ink"
          >
            TERMS
          </Link>
          <Link
            href="/privacy"
            className="flex min-h-11 items-center px-3 font-mono text-[10px] tracking-[0.14em] text-dim hover:text-ink"
          >
            PRIVACY
          </Link>
          <a
            href="mailto:support@tigristechlabs.com"
            className="flex min-h-11 items-center px-3 font-mono text-[10px] tracking-[0.14em] text-dim hover:text-ink"
          >
            CONTACT
          </a>
        </div>
      </div>
    </footer>
  )
}
