'use client'

import { useState, useMemo } from 'react'
import { Layers, ChevronDown, ChevronUp, AlertTriangle, Filter } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StackComponent {
  peptide: string
  dose: string
  frequency: string
}

interface Stack {
  name: string
  goal: string
  components: StackComponent[]
  description: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  tags: string[]
}

// ─── Stack Data ───────────────────────────────────────────────────────────────

const STACKS: Stack[] = [
  {
    name: 'Healing & Recovery Stack',
    goal: 'Injury recovery, tissue repair',
    components: [
      { peptide: 'BPC-157', dose: '250 mcg', frequency: 'Twice daily (AM + PM)' },
      { peptide: 'TB-500', dose: '2 mg', frequency: 'Twice weekly (loading), then 1 mg 1x/week' },
    ],
    description:
      'BPC-157 and TB-500 are widely considered the gold-standard healing combination. BPC-157 drives local and systemic tissue repair via growth factor upregulation, while TB-500 promotes systemic actin remodeling and angiogenesis. Together they accelerate healing of tendons, ligaments, muscles, and gut lining significantly faster than either alone.',
    duration: '4–8 weeks on, 4 weeks off. Can repeat cycles as needed.',
    difficulty: 'Beginner',
    tags: ['Recovery', 'Anti-inflammatory', 'Tendon', 'Muscle', 'Gut Health'],
  },
  {
    name: 'GH Optimization Stack',
    goal: 'GH pulse amplification, fat loss, sleep quality',
    components: [
      { peptide: 'Ipamorelin', dose: '200–300 mcg', frequency: '3x daily — AM (fasted), pre-workout, before bed' },
      { peptide: 'CJC-1295 (no DAC)', dose: '100–200 mcg', frequency: '3x daily — dosed with each Ipamorelin injection' },
    ],
    description:
      'Ipamorelin (GHRP) and CJC-1295 no DAC (GHRH) work synergistically to produce powerful, natural-mimicking GH pulses. CJC-1295 amplifies the GHRH signal while Ipamorelin triggers GH release at the pituitary — together producing GH output several times greater than either alone. The before-bed dose takes advantage of natural nocturnal GH secretion for enhanced recovery and fat loss.',
    duration: '8–12 weeks on, 4 weeks off.',
    difficulty: 'Beginner',
    tags: ['GH', 'Fat Loss', 'Muscle', 'Sleep', 'Anti-Aging'],
  },
  {
    name: 'Fat Loss Stack',
    goal: 'Aggressive fat burning with GH support',
    components: [
      { peptide: 'AOD-9604', dose: '300–500 mcg', frequency: 'Once daily, fasted AM' },
      { peptide: 'Ipamorelin', dose: '200–300 mcg', frequency: 'Twice daily — fasted AM + before bed' },
      { peptide: 'CJC-1295 (no DAC)', dose: '100–200 mcg', frequency: 'Twice daily — dosed with Ipamorelin' },
    ],
    description:
      'AOD-9604 directly stimulates lipolysis and inhibits lipogenesis without affecting GH receptors or blood glucose. Stacking it with Ipamorelin + CJC-1295 adds the metabolic and body composition benefits of elevated GH pulses. This combination targets fat loss from multiple angles simultaneously, making it one of the most effective peptide-based fat-burning protocols.',
    duration: '8–12 weeks on, 4 weeks off.',
    difficulty: 'Intermediate',
    tags: ['Fat Loss', 'GH', 'Body Composition', 'Lipolysis'],
  },
  {
    name: 'Anti-Aging & Longevity Stack',
    goal: 'Cellular longevity, skin health, immune resilience',
    components: [
      { peptide: 'Epithalon', dose: '5–10 mg', frequency: 'Once daily for 10–20 consecutive days (course)' },
      { peptide: 'GHK-Cu', dose: '1–2 mg', frequency: 'Once daily (SubQ or topical)' },
      { peptide: 'Thymosin Alpha-1', dose: '1.6 mg', frequency: 'Twice weekly' },
    ],
    description:
      'Epithalon activates telomerase to support telomere lengthening and cellular longevity. GHK-Cu drives collagen synthesis, skin regeneration, and wound healing through copper-dependent pathways. Thymosin Alpha-1 modulates and strengthens immune function, shown to enhance T-cell activity and antiviral response. Together this stack addresses aging at the cellular, structural, and immune levels.',
    duration: 'Epithalon: 10–20 day courses 1–2x/year. GHK-Cu + TA1: 8–12 weeks, then 4 weeks off.',
    difficulty: 'Intermediate',
    tags: ['Anti-Aging', 'Longevity', 'Skin', 'Immune', 'Telomere'],
  },
  {
    name: 'Cognitive Enhancement Stack',
    goal: 'Focus, memory, anxiety reduction, neuroprotection',
    components: [
      { peptide: 'Selank', dose: '500–1000 mcg', frequency: 'Twice daily (AM + midday), intranasal' },
      { peptide: 'Semax', dose: '300–600 mcg', frequency: 'Twice daily (AM + midday), intranasal' },
    ],
    description:
      'Selank is an anxiolytic nootropic that reduces anxiety and improves mood without sedation, acting on GABA and serotonin systems. Semax powerfully upregulates BDNF (brain-derived neurotrophic factor), enhancing neuroplasticity, focus, and memory. Used together, they provide complementary nootropic effects — Semax drives cognitive performance while Selank manages stress and anxiety that might otherwise impair cognition.',
    duration: '2–4 weeks on, 2 weeks off. Can be used situationally.',
    difficulty: 'Beginner',
    tags: ['Cognitive', 'Focus', 'Memory', 'Anxiety', 'Neuroprotection', 'BDNF'],
  },
  {
    name: 'Body Recomposition Stack',
    goal: 'Simultaneous muscle gain, fat loss, and recovery',
    components: [
      { peptide: 'BPC-157', dose: '250 mcg', frequency: 'Twice daily (AM + PM)' },
      { peptide: 'TB-500', dose: '2 mg', frequency: 'Twice weekly' },
      { peptide: 'Ipamorelin', dose: '200–300 mcg', frequency: 'Twice daily — fasted AM + before bed' },
      { peptide: 'CJC-1295 (no DAC)', dose: '100–200 mcg', frequency: 'Twice daily — dosed with Ipamorelin' },
    ],
    description:
      'This comprehensive stack combines the anabolic and fat-burning benefits of elevated GH pulses (via Ipamorelin + CJC-1295) with the tissue repair and anti-inflammatory benefits of the BPC-157 + TB-500 healing stack. Elevated GH promotes muscle growth and lipolysis, while BPC-157 and TB-500 ensure the connective tissue and muscles can keep up with increased training load and recover faster between sessions.',
    duration: '8–12 weeks on, 4–6 weeks off.',
    difficulty: 'Intermediate',
    tags: ['Muscle', 'Fat Loss', 'Recovery', 'GH', 'Body Composition'],
  },
  {
    name: 'Libido & Sexual Performance Stack',
    goal: 'Enhanced sexual function, arousal, and performance',
    components: [
      { peptide: 'PT-141 (Bremelanotide)', dose: '1–2 mg', frequency: 'As needed, 45–60 min before activity' },
      { peptide: 'Melanotan II', dose: '0.25–1 mg (start low)', frequency: 'Daily during loading (2–4 weeks), then 2x/week' },
    ],
    description:
      'PT-141 acts directly on melanocortin receptors in the brain to enhance sexual desire and arousal in both men and women — it works centrally, not through the vascular system like PDE5 inhibitors. Melanotan II provides lasting tanning, libido enhancement, and can improve erectile quality with consistent use. Used together, Melanotan II provides the baseline libido enhancement while PT-141 is used acutely for sexual events.',
    duration: 'PT-141: On-demand. Melanotan II: 2–4 week loading, then maintenance as needed.',
    difficulty: 'Intermediate',
    tags: ['Libido', 'Sexual Function', 'Tanning', 'Arousal'],
  },
  {
    name: 'Immune Support Stack',
    goal: 'Immune modulation, antiviral support, systemic healing',
    components: [
      { peptide: 'Thymosin Alpha-1', dose: '1.6 mg', frequency: 'Twice weekly' },
      { peptide: 'BPC-157', dose: '250 mcg', frequency: 'Once to twice daily' },
    ],
    description:
      'Thymosin Alpha-1 is a clinically validated immune modulator used in approved medicines in multiple countries. It enhances T-cell maturation, NK cell activity, and antiviral immune response. BPC-157 contributes anti-inflammatory effects and supports gut health — where a large portion of immune function originates. This stack is widely used for post-illness recovery, chronic immune challenges, and as a general immune resilience protocol.',
    duration: '4–12 weeks depending on indication. Can be used long-term at maintenance doses.',
    difficulty: 'Beginner',
    tags: ['Immune', 'Antiviral', 'Anti-inflammatory', 'Gut Health', 'Recovery'],
  },
  {
    name: 'GLP-1 Weight Loss Protocol',
    goal: 'Significant weight reduction, metabolic health',
    components: [
      {
        peptide: 'Semaglutide (or Tirzepatide)',
        dose: 'Sema: 0.25 mg → titrate to 1–2.4 mg | Tirz: 2.5 mg → titrate to 10–15 mg',
        frequency: 'Once weekly (both)',
      },
      { peptide: 'AOD-9604 (optional add-on)', dose: '300–500 mcg', frequency: 'Once daily, fasted AM' },
    ],
    description:
      'Semaglutide and Tirzepatide are GLP-1 receptor agonists (Tirzepatide also targets GIP) that reduce appetite, slow gastric emptying, and improve insulin sensitivity — producing clinically significant weight loss of 15–25%+ over 6–12 months. AOD-9604 can be added to enhance direct lipolytic activity without interfering with GLP-1 pathways, potentially amplifying fat loss outcomes. Titrate GLP-1 agents slowly to minimize GI side effects.',
    duration: 'GLP-1 agent: Ongoing (typically 20–52+ weeks). AOD-9604: 8–12 weeks, repeated cycles.',
    difficulty: 'Intermediate',
    tags: ['Weight Loss', 'GLP-1', 'Appetite', 'Metabolic Health', 'Fat Loss'],
  },
  {
    name: 'IGF-1 Muscle Growth Stack',
    goal: 'Muscle hypertrophy, satellite cell activation, recovery',
    components: [
      { peptide: 'IGF-1 LR3', dose: '20–60 mcg', frequency: 'Once daily post-workout (training days only)' },
      { peptide: 'BPC-157', dose: '250 mcg', frequency: 'Twice daily (AM + PM)' },
      { peptide: 'PEG-MGF (optional)', dose: '200–400 mcg', frequency: 'Twice weekly, post-workout' },
    ],
    description:
      'IGF-1 LR3 is one of the most anabolic peptides available, directly stimulating muscle protein synthesis, nitrogen retention, and satellite cell activation. BPC-157 is added to protect connective tissue and joints from the increased mechanical stress that comes with accelerated muscle growth. PEG-MGF (Mechano Growth Factor) complements IGF-1 LR3 by further activating muscle satellite cells via a different receptor. Eat carbohydrates immediately after injection to prevent hypoglycemia.',
    duration: 'Maximum 4–6 weeks on IGF-1 LR3, then 4+ weeks off. Strict cycling is essential.',
    difficulty: 'Advanced',
    tags: ['Muscle Growth', 'Hypertrophy', 'IGF-1', 'Recovery', 'Anabolic'],
  },
]

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
          ? 'bg-indigo-600 text-white border-indigo-500'
          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
      }`}
    >
      {label}
    </button>
  )
}

function StackCard({ stack }: { stack: Stack }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden transition-all">
      {/* Card header — always visible */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white leading-snug">{stack.name}</h3>
            <p className="text-slate-400 text-sm mt-0.5">{stack.goal}</p>
          </div>
          <DifficultyBadge level={stack.difficulty} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {stack.tags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700 text-slate-400"
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
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700"
            >
              <span className="text-sm font-semibold text-indigo-300 shrink-0">{c.peptide}</span>
              <span className="hidden sm:block text-slate-600">·</span>
              <span className="text-xs text-slate-400">
                {c.dose} — {c.frequency}
              </span>
            </div>
          ))}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
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
        <div className="px-5 pb-5 border-t border-slate-700 pt-4 space-y-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">About This Stack</p>
            <p className="text-slate-300 text-sm leading-relaxed">{stack.description}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Cycle Duration</p>
            <p className="text-slate-300 text-sm">{stack.duration}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Full Protocol</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs text-slate-500 font-medium pb-2 pr-4">Peptide</th>
                    <th className="text-left text-xs text-slate-500 font-medium pb-2 pr-4">Dose</th>
                    <th className="text-left text-xs text-slate-500 font-medium pb-2">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {stack.components.map((c) => (
                    <tr key={c.peptide}>
                      <td className="py-2 pr-4 text-indigo-300 font-medium whitespace-nowrap">{c.peptide}</td>
                      <td className="py-2 pr-4 text-slate-300 whitespace-nowrap">{c.dose}</td>
                      <td className="py-2 text-slate-400 text-xs">{c.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StacksPage() {
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
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Popular Stacks</h1>
        </div>
        <p className="text-slate-400 text-sm">
          Well-researched peptide combinations with protocols, goals, and difficulty ratings.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Filters</span>
            {hasFilters && (
              <span className="text-xs text-indigo-400 font-medium">
                ({filtered.length} of {STACKS.length} stacks)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"
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
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficultyFilter(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      difficultyFilter === d
                        ? d === 'All'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : d === 'Beginner'
                          ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                          : d === 'Intermediate'
                          ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                          : 'bg-red-500/30 text-red-300 border-red-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filter */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Goals & Tags</p>
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
        <p className="text-slate-400 text-sm">
          Showing <span className="text-white font-medium">{filtered.length}</span> stacks
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
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
        <div className="bg-slate-800 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No stacks match your filters. Try clearing some filters.</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
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
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-slate-500 text-xs leading-relaxed">
          <span className="font-semibold text-slate-400">Disclaimer:</span> For informational purposes only. Always
          consult a qualified healthcare provider before using peptides. Peptides may be regulated or prohibited in your
          jurisdiction. This tool does not constitute medical advice.
        </p>
      </div>
    </div>
  )
}
