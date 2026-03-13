'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, ChevronDown, ChevronUp, ArrowLeft, Library,
  AlertTriangle, Pill, Zap, Heart, Brain, Shield, Dna,
  Star, Info, BookOpen,
} from 'lucide-react'
import { PEPTIDE_KNOWLEDGE, GOAL_CATEGORIES, searchPeptides, getPeptidesByCategory, type PeptideKnowledge } from '@/lib/peptide-knowledge'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Metabolic/Weight': <Zap className="w-3.5 h-3.5" />,
  'Healing/Recovery': <Heart className="w-3.5 h-3.5" />,
  'GH Axis': <Dna className="w-3.5 h-3.5" />,
  'Muscle/Performance': <Star className="w-3.5 h-3.5" />,
  'Longevity': <BookOpen className="w-3.5 h-3.5" />,
  'Cognition/Mood': <Brain className="w-3.5 h-3.5" />,
  'Sleep': <Info className="w-3.5 h-3.5" />,
  'Immune/Anti-inf': <Shield className="w-3.5 h-3.5" />,
  'Skin/Hair': <Star className="w-3.5 h-3.5" />,
  'Sexual Health': <Heart className="w-3.5 h-3.5" />,
  'Cardio/Vascular': <Heart className="w-3.5 h-3.5" />,
  'GI/Bone/Other': <Pill className="w-3.5 h-3.5" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Metabolic/Weight': 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Healing/Recovery': 'bg-green-500/15 text-green-300 border-green-500/30',
  'GH Axis': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Muscle/Performance': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Longevity': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  'Cognition/Mood': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Sleep': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  'Immune/Anti-inf': 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'Skin/Hair': 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  'Sexual Health': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'Cardio/Vascular': 'bg-red-500/15 text-red-300 border-red-500/30',
  'GI/Bone/Other': 'bg-slate-500/15 text-slate-300 border-slate-500/30',
}

const EVIDENCE_BADGE: Record<string, string> = {
  'FDA-approved Rx (labeled use)': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'FDA-approved Rx': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

function cvDots(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`inline-block w-2 h-2 rounded-full mx-0.5 ${i < rating ? 'bg-red-400' : 'bg-slate-600'}`}
    />
  ))
}

function PeptideCard({ peptide }: { peptide: PeptideKnowledge }) {
  const [expanded, setExpanded] = useState(false)
  const catColor = CATEGORY_COLORS[peptide.goalCategory] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  const evidenceBadgeClass = EVIDENCE_BADGE[peptide.evidenceLevel] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight mb-1.5">{peptide.name}</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${catColor}`}>
                {CATEGORY_ICONS[peptide.goalCategory]}
                {peptide.goalCategory}
              </span>
              {peptide.goalCategories.filter(c => c !== peptide.goalCategory).slice(0, 2).map(c => (
                <span key={c} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${CATEGORY_COLORS[c] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'}`}>
                  {CATEGORY_ICONS[c]}
                  {c}
                </span>
              ))}
            </div>
            <p className="text-slate-400 text-xs line-clamp-2">{peptide.whatItDoes}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${evidenceBadgeClass}`}>
              {peptide.evidenceLevel.length > 25 ? 'Research' : peptide.evidenceLevel}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4">
          {/* Bottom Line */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
            <p className="text-indigo-300 text-xs font-medium mb-0.5">Bottom Line</p>
            <p className="text-white text-sm">{peptide.bottomLine}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Key Effects */}
            <div>
              <h4 className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1.5">Key Effects</h4>
              <p className="text-slate-300 text-xs">{peptide.keyEffects}</p>
            </div>

            {/* Best For */}
            <div>
              <h4 className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1.5">Best For</h4>
              <p className="text-slate-300 text-xs">{peptide.bestFor}</p>
            </div>

            {/* Common Uses */}
            <div>
              <h4 className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1.5">Common Uses</h4>
              <p className="text-slate-300 text-xs">{peptide.commonUseExamples}</p>
            </div>

            {/* Dosage */}
            {peptide.dosageRange && (
              <div>
                <h4 className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1.5">Dosage Range</h4>
                <p className="text-slate-300 text-xs font-mono">{peptide.dosageRange}</p>
              </div>
            )}
          </div>

          {/* CV Rating */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide">CV Impact</span>
            <div className="flex items-center">{cvDots(peptide.cvRating)}</div>
            <span className="text-slate-400 text-xs">({peptide.cvRating}/5)</span>
          </div>
          {peptide.cvNotes && (
            <p className="text-slate-400 text-xs -mt-2">{peptide.cvNotes}</p>
          )}

          {/* Cautions */}
          {peptide.riskCautions && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400 text-[11px] font-semibold uppercase tracking-wide">Cautions</span>
              </div>
              <p className="text-yellow-200/80 text-xs">{peptide.riskCautions}</p>
            </div>
          )}

          {/* Avoid If */}
          {peptide.avoidIf && peptide.avoidIf !== peptide.riskCautions && (
            <div>
              <h4 className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1.5">Avoid If</h4>
              <p className="text-slate-300 text-xs">{peptide.avoidIf}</p>
            </div>
          )}

          {/* Drug Interactions */}
          {peptide.drugInteractions && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Pill className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 text-[11px] font-semibold uppercase tracking-wide">Drug Interactions</span>
              </div>
              <p className="text-red-200/80 text-xs">{peptide.drugInteractions}</p>
            </div>
          )}

          {/* Evidence */}
          <div className="pt-1 border-t border-slate-700">
            <span className="text-slate-500 text-[11px]">Evidence level: </span>
            <span className="text-slate-300 text-[11px]">{peptide.evidenceLevel}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReferencePage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let results = query ? searchPeptides(query) : PEPTIDE_KNOWLEDGE
    if (activeCategory) {
      results = results.filter(p => p.goalCategory === activeCategory || p.goalCategories.includes(activeCategory))
    }
    return results
  }, [query, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of GOAL_CATEGORIES) {
      counts[cat] = getPeptidesByCategory(cat).length
    }
    return counts
  }, [])

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-500/20 p-2 rounded-lg">
                <Library className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Peptide Bible</h1>
                <p className="text-slate-400 text-xs">{PEPTIDE_KNOWLEDGE.length} peptides · complete reference guide</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search peptides, effects, goals..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === null
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              All ({PEPTIDE_KNOWLEDGE.length})
            </button>
            {GOAL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === cat
                    ? `${CATEGORY_COLORS[cat]} border-current`
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {CATEGORY_ICONS[cat]}
                {cat}
                <span className="text-[10px] opacity-70">({categoryCounts[cat]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400 text-sm">
            {filtered.length === PEPTIDE_KNOWLEDGE.length
              ? `All ${filtered.length} peptides`
              : `${filtered.length} of ${PEPTIDE_KNOWLEDGE.length} peptides`}
            {activeCategory ? ` in ${activeCategory}` : ''}
          </p>
          {(query || activeCategory) && (
            <button
              onClick={() => { setQuery(''); setActiveCategory(null) }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Library className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No peptides match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(peptide => (
              <PeptideCard key={peptide.name} peptide={peptide} />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-xs font-semibold mb-1">Educational Use Only</p>
              <p className="text-slate-400 text-xs">
                This reference is for educational and research purposes only. Information comes from the Peptide Bible v2 and compiled research data.
                Always consult a qualified healthcare provider before using any peptide or research compound. Nothing here constitutes medical advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
