'use client'

// Layer-3 contextual tool: research notes against a compound.
//
// Ported forward from src/app/notes/page.tsx into an inline-expand control
// matching LogDoseButton.tsx's pattern. Deliberately no formatting toolbar —
// a bold/italic toolbar was tried in the iOS Notes view and reverted
// (ios-native commit 9ac175f); plain textarea only, here too.

import { useMemo, useState, useTransition } from 'react'
import { addNote, removeNote } from '@/app/dashboard/actions'
import type { CompoundRecords } from '@/lib/mirror/load'

interface NotesToolProps {
  compoundId: string
  notes: CompoundRecords['notes']
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

export default function NotesTool({ compoundId, notes }: NotesToolProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Newest first. load.ts already orders by created_at desc, but the tool
  // does not assume its caller preserved that order.
  const sorted = useMemo(
    () => [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notes],
  )

  function submit() {
    setError(null)
    startTransition(async () => {
      const outcome = await addNote({ compoundId, note, url: url || undefined })
      if (outcome.ok) {
        setNote('')
        setUrl('')
      } else {
        setError(outcome.error ?? 'Could not save that note.')
      }
    })
  }

  function remove(id: string) {
    setError(null)
    setRemovingId(id)
    startTransition(async () => {
      const outcome = await removeNote(id)
      if (!outcome.ok) setError(outcome.error ?? 'Could not remove that note.')
      setRemovingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-px bg-hair">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 bg-panel px-[14px] font-mono text-[9.5px] tracking-[0.1em] text-dim hover:text-ink"
      >
        <span>NOTES{notes.length ? ` · ${notes.length}` : ''}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-[14px] bg-panel p-[14px]">
          <div className="flex flex-col gap-[10px]">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a research note…"
              rows={3}
              className="w-full resize-none bg-panelHi p-3 text-[13.5px] leading-[1.6] text-ink placeholder:text-faintest"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="SOURCE URL (OPTIONAL)"
              className="min-h-[44px] bg-panelHi px-3 font-mono text-[9.5px] tracking-[0.08em] text-ink placeholder:text-faintest"
            />
            <button
              type="button"
              onClick={submit}
              disabled={pending || !note.trim()}
              className="min-h-[44px] bg-accent font-mono text-[9.5px] tracking-[0.14em] text-ground disabled:opacity-50"
            >
              {pending && !removingId ? 'SAVING…' : 'ADD NOTE'}
            </button>
          </div>

          {sorted.length > 0 && (
            <div className="flex flex-col gap-px bg-hair">
              {sorted.map((n) => (
                <div key={n.id} className="flex flex-col gap-[6px] bg-panelHi px-[12px] py-[10px]">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-[1.65] text-dim">{n.note}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {n.url && (
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 max-w-[220px] truncate font-mono text-[9px] tracking-[0.06em] text-accent hover:underline"
                      >
                        {n.url}
                      </a>
                    )}
                    <span className="font-mono text-[9px] tracking-[0.1em] text-faintest">
                      {formatDate(n.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      disabled={pending && removingId === n.id}
                      className="ml-auto flex min-h-[32px] items-center px-2 font-mono text-[9px] tracking-[0.1em] text-faintest hover:text-gold disabled:opacity-50"
                    >
                      {pending && removingId === n.id ? '…' : 'REMOVE'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <span role="alert" className="font-mono text-[9.5px] tracking-[0.1em] text-gold">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
