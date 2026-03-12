'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  X,
  BookOpen,
  Link,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PEPTIDE_NAMES = [
  'BPC-157',
  'TB-500',
  'GHK-Cu',
  'Ipamorelin',
  'CJC-1295 (no DAC)',
  'CJC-1295 (with DAC)',
  'Semaglutide',
  'Tirzepatide',
  'Retatrutide',
  'Sermorelin',
  'Hexarelin',
  'GHRP-2',
  'GHRP-6',
  'IGF-1 LR3',
  'IGF-1 DES',
  'Melanotan II',
  'Melanotan I (MT-1)',
  'PT-141 (Bremelanotide)',
  'Epithalon',
  'Thymosin Alpha-1 (Tα1)',
  'AOD-9604',
  'NAD+',
  'Selank',
  'Semax',
  'MK-677 (Ibutamoren)',
  'BPC-157 + TB-500 (combined)',
  'Tesamorelin',
  'PEG-MGF',
  'Kisspeptin-10',
  'Gonadorelin',
  'Oxytocin',
  'HGH (Human Growth Hormone)',
  'Follistatin 344',
  'DSIP (Delta Sleep-Inducing Peptide)',
  'LL-37',
  'KPV',
  'VIP (Vasoactive Intestinal Peptide)',
  'MOTS-c',
  'SS-31 (Elamipretide)',
  '5-Amino-1MQ',
  'Triptorelin',
  'Glutathione',
  'NMN (Nicotinamide Mononucleotide)',
  'Humanin',
  'Dihexa',
  'Thymalin',
  'Pinealon',
  'Larazotide',
  'Cagrilintide',
  'Pramlintide (Amylin)',
  'SNAP-8',
  'Cortagen',
]

interface ResearchNote {
  id: string
  user_id: string
  peptide_name: string
  note: string
  url: string | null
  created_at: string
}

const EMPTY_FORM = {
  peptide_name: '',
  note: '',
  url: '',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PeptideAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(
    () =>
      value.trim()
        ? PEPTIDE_NAMES.filter((p) => p.toLowerCase().includes(value.toLowerCase()))
        : PEPTIDE_NAMES,
    [value]
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? 'Search peptide...'}
          className="pr-8"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 top-full mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {suggestions.map((p) => (
            <button
              key={p}
              type="button"
              onMouseDown={() => {
                onChange(p)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NotesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [notes, setNotes] = useState<ResearchNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('research_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setNotes(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return notes
    return notes.filter(
      (n) =>
        n.peptide_name.toLowerCase().includes(q) || n.note.toLowerCase().includes(q)
    )
  }, [notes, searchQuery])

  const grouped = useMemo(() => {
    const map: Record<string, ResearchNote[]> = {}
    filteredNotes.forEach((n) => {
      if (!map[n.peptide_name]) map[n.peptide_name] = []
      map[n.peptide_name].push(n)
    })
    return map
  }, [filteredNotes])

  const sortedPeptides = useMemo(
    () => Object.keys(grouped).sort((a, b) => a.localeCompare(b)),
    [grouped]
  )

  function toggleGroup(name: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!form.peptide_name.trim()) {
      setFormError('Please enter a peptide name.')
      return
    }
    if (!form.note.trim()) {
      setFormError('Note text is required.')
      return
    }

    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setFormError('Not authenticated.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('research_notes').insert({
      user_id: user.id,
      peptide_name: form.peptide_name.trim(),
      note: form.note.trim(),
      url: form.url.trim() || null,
    })

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    setForm({ ...EMPTY_FORM })
    setShowForm(false)
    setSaving(false)
    fetchNotes()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return
    setDeletingId(id)
    await supabase.from('research_notes').delete().eq('id', id)
    setDeletingId(null)
    fetchNotes()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              Research Notes
            </h1>
            <p className="text-slate-400 mt-0.5 text-sm">
              Save and organise notes about your peptides.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm((prev) => !prev)
            setFormError('')
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm shrink-0"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Note
            </>
          )}
        </button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <div className="bg-slate-800 border border-indigo-500/30 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <Link className="w-4 h-4 text-indigo-400" />
            New Research Note
          </h2>
          <form onSubmit={handleAddNote} className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Peptide <span className="text-red-400">*</span>
              </label>
              <PeptideAutocomplete
                value={form.peptide_name}
                onChange={(v) => setForm({ ...form, peptide_name: v })}
                placeholder="e.g. BPC-157"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Note <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Write your research note here..."
                rows={4}
                className="resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                URL <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Note
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormError('')
                }}
                className="text-slate-400 hover:text-white px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      {!loading && notes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by peptide or content..."
            className="pl-10 pr-4"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-14 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">No research notes yet</p>
          <p className="text-slate-500 text-sm">
            Start adding notes about your peptides.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add your first note
          </button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No notes match &ldquo;{searchQuery}&rdquo;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPeptides.map((peptide) => {
            const isCollapsed = collapsedGroups.has(peptide)
            const groupNotes = grouped[peptide]

            return (
              <div
                key={peptide}
                className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(peptide)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400 font-semibold text-base">
                      {peptide}
                    </span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      {groupNotes.length} {groupNotes.length === 1 ? 'note' : 'notes'}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Note Cards */}
                {!isCollapsed && (
                  <div className="border-t border-slate-700 divide-y divide-slate-700/60">
                    {groupNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onDelete={handleDelete}
                        deleting={deletingId === note.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NoteCard({
  note,
  onDelete,
  deleting,
}: {
  note: ResearchNote
  onDelete: (id: string) => void
  deleting: boolean
}) {
  return (
    <div className="px-5 py-4 flex gap-4 group hover:bg-slate-700/20 transition-colors">
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
          {note.note}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {note.url && (
            <a
              href={note.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors truncate max-w-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{note.url}</span>
            </a>
          )}
          <span className="text-xs text-slate-500 flex items-center gap-1">
            {formatDate(note.created_at)}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(note.id)}
        disabled={deleting}
        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        title="Delete note"
      >
        {deleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
