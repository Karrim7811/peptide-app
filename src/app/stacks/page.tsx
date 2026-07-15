'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Layers, ChevronDown, ChevronUp, AlertTriangle, Filter, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STACKS, type Stack, type StackComponent } from '@/lib/stacks'

const ALL_TAGS = Array.from(new Set(STACKS.flatMap((s) => s.tags))).sort()

// ─── Sub-components ───────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
}

function DifficultyBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${DIFFICULTY_STYLES[level] ?? ''}`}
    >
      {level}
    </span>
  )
}

function TagBadge({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-[#1A8A9E] text-[#1A1915] border-[#1A8A9E]'
          : 'bg-white text-[#B0AAA0] border-[#E8E5E0] hover:text-[#1A1915] hover:border-[#B0AAA0]'
      }`}
    >
      {label}
    </button>
  )
}

function StackCard({ stack }: { stack: Stack }) {
  const [expanded, setExpanded] = useState(false)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)

  async function handleAddToMyStack() {
    setImporting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setImporting(false)
      return
    }

    const inserts = stack.components.map((c) => {
      const parts = c.dose.trim().split(' ')
      const dose = parts[0] ?? ''
      const unit = parts[1] ?? 'mcg'
      return {
        user_id: user.id,
        name: c.peptide,
        type: 'peptide' as const,
        dose,
        unit,
        active: true,
        notes: '',
      }
    })

    await supabase.from('stack_items').insert(inserts)

    setImporting(false)
    setImported(true)
    setTimeout(() => setImported(false), 2000)
  }

  return (
    <div className="bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden transition-all">
      {/* Card header — always visible */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#1A1915] leading-snug">{stack.name}</h3>
            <p className="text-[#B0AAA0] text-sm mt-0.5">{stack.goal}</p>
          </div>
          <DifficultyBadge level={stack.difficulty} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {stack.tags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F2F0ED] text-[#B0AAA0]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Components summary */}
        <div className="space-y-2">
          {stack.components.map((c) => (
            <div
              key={c.peptide}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#E8E5E0]"
            >
              <span className="text-sm font-semibold text-[#1A8A9E] shrink-0">{c.peptide}</span>
              <span className="hidden sm:block text-[#B0AAA0]">·</span>
              <span className="text-xs text-[#B0AAA0]">
                {c.dose} — {c.frequency}
              </span>
            </div>
          ))}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 text-sm text-[#1A8A9E] hover:text-[#1A8A9E] transition-colors font-medium"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" /> Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" /> View full protocol
            </>
          )}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[#E8E5E0] pt-4 space-y-4">
          <div>
            <p className="text-xs text-[#B0AAA0] uppercase tracking-wider font-medium mb-2">About This Stack</p>
            <p className="text-[#3A3730] text-sm leading-relaxed">{stack.description}</p>
          </div>
          <div>
            <p className="text-xs text-[#B0AAA0] uppercase tracking-wider font-medium mb-2">Cycle Duration</p>
            <p className="text-[#3A3730] text-sm">{stack.duration}</p>
          </div>
          <div>
            <p className="text-xs text-[#B0AAA0] uppercase tracking-wider font-medium mb-2">Full Protocol</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E5E0]">
                    <th className="text-left text-xs text-[#B0AAA0] font-medium pb-2 pr-4">Peptide</th>
                    <th className="text-left text-xs text-[#B0AAA0] font-medium pb-2 pr-4">Dose</th>
                    <th className="text-left text-xs text-[#B0AAA0] font-medium pb-2">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {stack.components.map((c) => (
                    <tr key={c.peptide}>
                      <td className="py-2 pr-4 text-[#1A8A9E] font-medium whitespace-nowrap">{c.peptide}</td>
                      <td className="py-2 pr-4 text-[#3A3730] whitespace-nowrap">{c.dose}</td>
                      <td className="py-2 text-[#B0AAA0] text-xs">{c.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add to My Stack button */}
          <div>
            <button
              onClick={handleAddToMyStack}
              disabled={importing || imported}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                imported
                  ? 'bg-emerald-600 text-[#1A1915] cursor-default'
                  : 'bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915]'
              } ${importing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : imported ? (
                <>
                  <Check className="w-4 h-4" />
                  Added to My Stack!
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  Add to My Stack
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StacksPage() {
  const router = useRouter()
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All')

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const filtered = useMemo(() => {
    return STACKS.filter((s) => {
      const tagMatch = activeTags.length === 0 || activeTags.some((t) => s.tags.includes(t))
      const diffMatch = difficultyFilter === 'All' || s.difficulty === difficultyFilter
      return tagMatch && diffMatch
    })
  }, [activeTags, difficultyFilter])

  const clearFilters = () => {
    setActiveTags([])
    setDifficultyFilter('All')
  }

  const hasFilters = activeTags.length > 0 || difficultyFilter !== 'All'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-[#B0AAA0] hover:text-[#1A1915] hover:bg-[#F2F0ED] rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#1A8A9E]/12 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#1A8A9E]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1915]">Popular Stacks</h1>
        </div>
        <p className="text-[#B0AAA0] text-sm">
          Well-researched peptide combinations with protocols, goals, and difficulty ratings.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[#E8E5E0] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#B0AAA0]" />
            <span className="text-sm font-medium text-[#3A3730]">Filters</span>
            {hasFilters && (
              <span className="text-xs text-[#1A8A9E] font-medium">
                ({filtered.length} of {STACKS.length} stacks)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#B0AAA0] hover:text-[#3A3730] transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-[#1A8A9E] hover:text-[#1A8A9E] transition-colors font-medium flex items-center gap-1"
            >
              {showFilters ? (
                <>Hide <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <>
            {/* Difficulty filter */}
            <div>
              <p className="text-xs text-[#B0AAA0] uppercase tracking-wider font-medium mb-2">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficultyFilter(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      difficultyFilter === d
                        ? d === 'All'
                          ? 'bg-[#1A8A9E] text-[#1A1915] border-[#1A8A9E]'
                          : d === 'Beginner'
                          ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                          : d === 'Intermediate'
                          ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                          : 'bg-red-500/30 text-red-300 border-red-500/50'
                        : 'bg-[#FAFAF8] text-[#B0AAA0] border-[#E8E5E0] hover:text-[#1A1915]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filter */}
            <div>
              <p className="text-xs text-[#B0AAA0] uppercase tracking-wider font-medium mb-2">Goals & Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.map((tag) => (
                  <TagBadge
                    key={tag}
                    label={tag}
                    active={activeTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stack count */}
      <div className="flex items-center justify-between">
        <p className="text-[#B0AAA0] text-sm">
          Showing <span className="text-[#1A1915] font-medium">{filtered.length}</span> stacks
        </p>
        <div className="flex items-center gap-3 text-xs text-[#B0AAA0]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Beginner
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>Intermediate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>Advanced
          </span>
        </div>
      </div>

      {/* Stack cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E8E5E0] rounded-2xl p-12 text-center">
          <Layers className="w-12 h-12 text-[#B0AAA0] mx-auto mb-3" />
          <p className="text-[#B0AAA0] text-sm">No stacks match your filters. Try clearing some filters.</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-[#1A8A9E] text-sm hover:text-[#1A8A9E] transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((stack) => (
            <StackCard key={stack.name} stack={stack} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-white/50 border border-[#E8E5E0] rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-[#B0AAA0] flex-shrink-0 mt-0.5" />
        <p className="text-[#B0AAA0] text-xs leading-relaxed">
          <span className="font-semibold text-[#B0AAA0]">Disclaimer:</span> For informational purposes only. Always
          consult a qualified healthcare provider before using peptides. Peptides may be regulated or prohibited in your
          jurisdiction. This tool does not constitute medical advice.
        </p>
      </div>
    </div>
  )
}
