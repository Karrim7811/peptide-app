'use client'

// The way in when the stack is empty.
//
// "Add your first peptide" on the bench used to land here on a blank field with
// no control in sight: the add button lives on a compound's own view, and the
// only way to a compound was a goal row in the side panel or the ask bar at the
// foot of the page. Nobody found either. This puts a search box where the eye
// goes — the middle of the empty field — and a result opens that compound with
// its add form already expanded.
//
// Search only, never a suggestion list: which compound to start with is not a
// question this product answers (CLAUDE.md §16.9).

import { useMemo, useState } from 'react'
import { COUNTS } from '@/lib/catalog'
import { matchCompounds } from '@/lib/mirror/search'

export default function AddFirstPeptide({ onSelectCompound }: { onSelectCompound: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => matchCompounds(query), [query])

  return (
    <div
      // The field pans and zooms on pointer and wheel — keep those gestures
      // off the form so typing and clicking a result do not drag the field.
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className="pointer-events-auto flex w-[min(420px,calc(100%-32px))] flex-col gap-3 border border-hair bg-panel p-5"
    >
      <span className="font-mono text-[9px] tracking-[0.26em] text-accent">ADD YOUR FIRST PEPTIDE</span>
      <p className="text-[14px] leading-[1.7] text-dim">
        Search the library by name. Open a result and record the vial — the field draws itself from
        what you hold.
      </p>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) onSelectCompound(results[0].id)
        }}
        placeholder={`Search ${COUNTS.compounds} compounds — e.g. BPC-157`}
        aria-label="Search the library for a peptide to add"
        className="min-h-[44px] border border-hair bg-panelHi px-3 text-[15px] text-ink placeholder:text-faint focus:border-accent focus:outline-none"
      />
      {query.trim() && (
        <div className="flex flex-col gap-px bg-hair">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCompound(c.id)}
              className="flex min-h-[44px] items-center justify-between gap-3 bg-panel px-3 text-left hover:bg-panelHi"
            >
              <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{c.name}</span>
              <span className="whitespace-nowrap font-mono text-[9.5px] tracking-[0.1em] text-faint">
                {c.category.toUpperCase()}
              </span>
              <span className="font-mono text-[9.5px] tracking-[0.1em] text-accent">ADD +</span>
            </button>
          ))}
          {results.length === 0 && (
            <span className="bg-panel px-3 py-3 text-[13px] text-faint">
              Nothing in the library by that name.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
