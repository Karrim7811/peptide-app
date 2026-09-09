'use client'

// The address line, with suggestions.
//
// A combobox, built by hand rather than pulled in, because the whole widget is
// an input plus a listbox and the accessibility contract is short enough to
// meet properly: aria-expanded on the input, aria-activedescendant pointing at
// the highlighted option, arrows and Enter and Escape bound, and every option a
// real element the screen reader can announce.
//
// ── It must degrade to a plain input ──────────────────────────────────────
//
// With no Places key the endpoint returns an empty list forever, and this
// renders exactly the input it wrapped: same name, same autoComplete, same
// styling, so the browser's own saved-address autofill still works. The buyer
// can always ignore the dropdown and type the whole address; nothing here is
// required to place an order, and a failed lookup is silent rather than an
// error the buyer cannot act on.
//
// ── Cost ──────────────────────────────────────────────────────────────────
//
// Two things keep the bill down and both matter. One session token per address
// entry, closed by the resolve call, so a whole entry is billed once instead of
// once per keystroke. And a debounce, so typing "1600 Pennsylvania" is a
// handful of requests rather than eighteen.

import { useCallback, useEffect, useRef, useState } from 'react'

interface Suggestion {
  placeId: string
  label: string
}

export interface ResolvedAddress {
  line1: string
  city: string
  state: string
  postal: string
}

const DEBOUNCE_MS = 220
const MIN_QUERY = 4

function newSessionToken(): string {
  // crypto.randomUUID is unavailable on http origins in older Safari, and this
  // component must not throw there — the token only has to be a unique UUID.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`
}

export function AddressAutocomplete({
  value,
  onChange,
  onResolved,
  inputStyle,
  name,
  autoComplete,
  id,
}: {
  value: string
  onChange: (next: string) => void
  /** Fired when the buyer picks a suggestion that resolved to a full address. */
  onResolved: (address: ResolvedAddress) => void
  inputStyle: React.CSSProperties
  name: string
  autoComplete: string
  id: string
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const session = useRef<string>(newSessionToken())
  const box = useRef<HTMLDivElement>(null)
  // Set while a suggestion is being applied, so the resulting value change does
  // not immediately re-open the dropdown with a search for the address we just
  // filled in.
  const applying = useRef(false)

  const close = useCallback(() => {
    setOpen(false)
    setActive(-1)
  }, [])

  useEffect(() => {
    if (applying.current) {
      applying.current = false
      return
    }
    const query = value.trim()
    if (query.length < MIN_QUERY) {
      setSuggestions([])
      close()
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/shop/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'suggest',
            query,
            sessionToken: session.current,
          }),
        })
        if (!response.ok) return
        const data = (await response.json()) as { suggestions?: Suggestion[] }
        if (cancelled) return
        const next = data.suggestions ?? []
        setSuggestions(next)
        setOpen(next.length > 0)
        setActive(-1)
      } catch {
        // Offline, blocked, or the key is unset. The input still works.
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value, close])

  // A click outside is a dismissal. Without this the list survives until the
  // input is focused again, floating over the rest of the form.
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, close])

  async function choose(suggestion: Suggestion) {
    applying.current = true
    onChange(suggestion.label)
    setSuggestions([])
    close()

    try {
      const response = await fetch('/api/shop/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          placeId: suggestion.placeId,
          sessionToken: session.current,
        }),
      })
      const data = (await response.json()) as { address?: ResolvedAddress | null }
      if (data.address) onResolved(data.address)
    } catch {
      // The label is already in the field, so the buyer completes the rest by
      // hand. Worse than resolving, better than an error they cannot fix.
    } finally {
      // The details call closed the billing session; the next entry needs a new
      // token or it is billed per keystroke.
      session.current = newSessionToken()
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (event.key === 'Enter' && active >= 0) {
      // Only swallow Enter when something is highlighted. Otherwise Enter still
      // belongs to the form.
      event.preventDefault()
      void choose(suggestions[active])
    } else if (event.key === 'Escape') {
      close()
    }
  }

  const listId = `${id}-suggestions`

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <input
        id={id}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        style={inputStyle}
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: '#F4F5F6',
            border: '1px solid #1A1D1F',
            borderTop: 'none',
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.placeId}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown, not click: the input's blur would close the list
              // before a click ever landed.
              onMouseDown={(e) => {
                e.preventDefault()
                void choose(suggestion)
              }}
              onMouseEnter={() => setActive(index)}
              style={{
                padding: '11px 14px',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                lineHeight: 1.4,
                color: '#1A1D1F',
                background: index === active ? 'rgba(26,138,158,.14)' : 'transparent',
                borderBottom:
                  index === suggestions.length - 1
                    ? 'none'
                    : '1px solid rgba(26,29,31,.18)',
              }}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
