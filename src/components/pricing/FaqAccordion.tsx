'use client'

import { useState } from 'react'
import { FAQS } from './content'

// Ports the FAQ accordion — prototype lines 153-167 + `state.open` /
// `faqs.onClick` in `renderVals()`. Single-open, first item open by default
// (`state = { open: 0 }`), re-clicking the open item collapses it
// (`open: s.open === i ? -1 : i`).

export default function FaqAccordion() {
  const [open, setOpen] = useState(0)

  return (
    <div className="flex justify-center px-5 pb-16">
      <div className="flex w-full max-w-[1080px] flex-col gap-px border border-hair bg-hair">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div
              key={f.q}
              onClick={() => setOpen(isOpen ? -1 : i)}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setOpen(isOpen ? -1 : i)
                }
              }}
              className="flex min-h-[44px] cursor-pointer flex-col gap-2.5 bg-ground px-6 py-5"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-base leading-[1.5] text-ink">{f.q}</span>
                <span
                  aria-hidden
                  className="shrink-0 font-mono text-base leading-none"
                  style={{
                    color: isOpen ? 'var(--accent)' : 'var(--faint)',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                    transition: 'transform 200ms ease',
                  }}
                >
                  +
                </span>
              </div>
              {isOpen && (
                <span className="max-w-[760px] text-[14.5px] leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
                  {f.a}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
