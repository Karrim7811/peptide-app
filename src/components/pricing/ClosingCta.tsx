import Link from 'next/link'

// Ports the closing CTA — prototype lines 169-172.

export default function ClosingCta() {
  return (
    <div className="flex flex-col items-center gap-[18px] px-5 pb-[72px] text-center">
      <span
        className="max-w-[620px] font-display text-[clamp(26px,3.4vw,38px)] font-light leading-[1.2] text-ink"
        style={{ textWrap: 'pretty' }}
      >
        Start with one compound. The form will show you the rest of the shape.
      </span>
      <Link
        href="/signup"
        className="flex min-h-[52px] items-center justify-center bg-accent px-8 font-mono text-[10.5px] tracking-[0.16em] text-ground"
      >
        CREATE YOUR FIELD →
      </Link>
    </div>
  )
}
