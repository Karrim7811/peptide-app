'use client'

// Copy to clipboard, with the confirmation in the button itself.
//
// The label flips to "Copied" for 1.6 s and flips back. No toast and no modal:
// the design has neither anywhere, and a toast confirming a copy is a thing to
// dismiss in exchange for information the button already carries.
//
// A failed write is silent on purpose. Clipboard access is denied in enough
// ordinary situations — an insecure origin, a browser permission, an iframe —
// that an error message here would mostly be noise, and every value this button
// copies is also on screen to be selected by hand.

import { useCallback, useEffect, useRef, useState } from 'react'

export function CopyButton({
  value,
  label = 'Copy',
  filled = false,
}: {
  value: string
  label?: string
  filled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(value).catch(() => {})
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }, [value])

  return (
    <button
      type="button"
      onClick={copy}
      style={{
        appearance: 'none',
        border: '1px solid #1A1D1F',
        background: filled ? '#1A1D1F' : 'transparent',
        color: filled ? '#F4F5F6' : '#1A1D1F',
        fontFamily: 'Jost, sans-serif',
        fontSize: filled ? 11 : 10.5,
        letterSpacing: filled ? '.24em' : '.22em',
        textTransform: 'uppercase',
        padding: filled ? '14px 22px' : '12px 16px',
        minHeight: 44,
        minWidth: filled ? 170 : 110,
        cursor: 'pointer',
        borderRadius: 0,
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
