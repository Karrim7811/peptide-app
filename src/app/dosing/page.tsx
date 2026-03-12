'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Calculator,
  Search,
  ChevronDown,
  Clock,
  Target,
  Activity,
  Syringe,
  AlertTriangle,
  Info,
  Scale,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeptideData {
  name: string
  doseRange: string
  frequency: string
  bestTime: string
  cycleLength: string
  halfLife: string
  route: string
  goals: string[]
  notes: string
  weightBased: boolean
  weightDoseMcgPerKg?: number // if weight-based, mcg per kg
  fixedDoseMin?: number       // fixed range min in mcg
  fixedDoseMax?: number       // fixed range max in mcg
}

// ─── Peptide Data ─────────────────────────────────────────────────────────────

const PEPTIDES: Record<string, PeptideData> = {
  'BPC-157': {
    name: 'BPC-157',
    doseRange: '200–500 mcg',
    frequency: '1–2x per day',
    bestTime: 'Morning and/or evening, near site of injury if possible',
    cycleLength: '4–12 weeks, then 4 weeks off',
    halfLife: '~4 hours',
    route: 'Subcutaneous or intramuscular injection; oral (for gut)',
    goals: ['Injury recovery', 'Gut healing', 'Anti-inflammatory', 'Tendon repair'],
    notes:
      'Exceptionally well-tolerated. Can be taken orally for GI conditions. Avoid if active cancer history. Systemic effects seen even at injection sites remote from injury.',
    weightBased: false,
    fixedDoseMin: 200,
    fixedDoseMax: 500,
  },
  'TB-500': {
    name: 'TB-500',
    doseRange: '2–2.5 mg (loading), 1–1.5 mg (maintenance)',
    frequency: '2x per week (loading phase 4–6 weeks), then 1x per week',
    bestTime: 'Any time; consistent timing preferred',
    cycleLength: '4–6 weeks loading, then ongoing maintenance',
    halfLife: '~2–3 days',
    route: 'Subcutaneous injection',
    goals: ['Tissue repair', 'Muscle injury', 'Inflammation reduction', 'Flexibility'],
    notes:
      'Often stacked with BPC-157 for synergistic healing. Systemic in action—does not need to be injected near injury site. Avoid in active cancer cases.',
    weightBased: false,
    fixedDoseMin: 2000,
    fixedDoseMax: 2500,
  },
  'GHK-Cu': {
    name: 'GHK-Cu',
    doseRange: '1–2 mg',
    frequency: 'Once daily',
    bestTime: 'Morning or before bed',
    cycleLength: '4–8 weeks, then 4 weeks off',
    halfLife: '~15–30 minutes (injected)',
    route: 'Subcutaneous injection or topical',
    goals: ['Skin regeneration', 'Anti-aging', 'Wound healing', 'Hair growth'],
    notes:
      'Very safe profile. Often used topically for skin/hair benefits. Systemic injection provides broader regenerative effects. No major contraindications reported.',
    weightBased: false,
    fixedDoseMin: 1000,
    fixedDoseMax: 2000,
  },
  'Ipamorelin': {
    name: 'Ipamorelin',
    doseRange: '200–300 mcg',
    frequency: '1–3x per day',
    bestTime: 'Fasted, upon waking; pre-workout; before bed',
    cycleLength: '8–12 weeks, then 4 weeks off',
    halfLife: '~2 hours',
    route: 'Subcutaneous injection',
    goals: ['GH stimulation', 'Fat loss', 'Muscle gain', 'Sleep quality', 'Anti-aging'],
    notes:
      'Highly selective GHRP—minimal cortisol/prolactin spike. Best used fasted (no food 30 min before/after). Stack with CJC-1295 no DAC for amplified GH pulse.',
    weightBased: false,
    fixedDoseMin: 200,
    fixedDoseMax: 300,
  },
  'CJC-1295 (no DAC)': {
    name: 'CJC-1295 (no DAC)',
    doseRange: '100–200 mcg',
    frequency: '1–3x per day (timed with Ipamorelin)',
    bestTime: 'Fasted, upon waking; pre-workout; before bed',
    cycleLength: '8–12 weeks, then 4 weeks off',
    halfLife: '~30 minutes',
    route: 'Subcutaneous injection',
    goals: ['GH pulse amplification', 'Fat loss', 'Muscle growth', 'Recovery'],
    notes:
      'GHRH analog. Works best stacked with a GHRP like Ipamorelin. Short half-life produces a natural GH pulse. Must be injected fasted for maximum effect.',
    weightBased: false,
    fixedDoseMin: 100,
    fixedDoseMax: 200,
  },
  'CJC-1295 (with DAC)': {
    name: 'CJC-1295 (with DAC)',
    doseRange: '1–2 mg',
    frequency: '1–2x per week',
    bestTime: 'Any time; once or twice weekly dosing',
    cycleLength: '8–12 weeks, then 4 weeks off',
    halfLife: '~6–8 days',
    route: 'Subcutaneous injection',
    goals: ['Sustained GH elevation', 'Muscle growth', 'Fat loss', 'Anti-aging'],
    notes:
      'Drug Affinity Complex (DAC) extends half-life dramatically. Creates steady GH elevation rather than pulses—some prefer no-DAC for more natural pulsatile release. Do not use daily.',
    weightBased: false,
    fixedDoseMin: 1000,
    fixedDoseMax: 2000,
  },
  'Semaglutide': {
    name: 'Semaglutide',
    doseRange: '0.25–2.4 mg (titrate up slowly)',
    frequency: 'Once weekly',
    bestTime: 'Same day each week, with or without food',
    cycleLength: 'Ongoing; typically 12–52+ weeks for weight loss',
    halfLife: '~7 days',
    route: 'Subcutaneous injection',
    goals: ['Weight loss', 'Appetite suppression', 'Blood sugar control', 'GLP-1 agonism'],
    notes:
      'Start at 0.25 mg/week and titrate every 4 weeks. Nausea is the most common side effect—start low. Requires refrigeration. Not for use with personal/family history of thyroid cancer.',
    weightBased: false,
    fixedDoseMin: 250,
    fixedDoseMax: 2400,
  },
  'Tirzepatide': {
    name: 'Tirzepatide',
    doseRange: '2.5–15 mg (titrate every 4 weeks)',
    frequency: 'Once weekly',
    bestTime: 'Same day each week, with or without food',
    cycleLength: 'Ongoing; 20–52+ weeks for significant weight loss',
    halfLife: '~5 days',
    route: 'Subcutaneous injection',
    goals: ['Weight loss', 'Dual GIP/GLP-1 agonism', 'Blood sugar control', 'Appetite suppression'],
    notes:
      'Dual GIP and GLP-1 receptor agonist—often more potent than semaglutide for weight loss. Titrate slowly to minimize GI side effects. Not for thyroid cancer history.',
    weightBased: false,
    fixedDoseMin: 2500,
    fixedDoseMax: 15000,
  },
  'Sermorelin': {
    name: 'Sermorelin',
    doseRange: '200–500 mcg',
    frequency: 'Once daily',
    bestTime: 'Before bed (fasted; 2–3 hrs after last meal)',
    cycleLength: '3–6 months; can be used long-term',
    halfLife: '~10–20 minutes',
    route: 'Subcutaneous injection',
    goals: ['GH stimulation', 'Anti-aging', 'Sleep quality', 'Body composition'],
    notes:
      'GHRH analog that stimulates natural GH release. Very short half-life—timing before bed is key to catch natural GH pulse. Considered one of the safer GH secretagogues long-term.',
    weightBased: false,
    fixedDoseMin: 200,
    fixedDoseMax: 500,
  },
  'Hexarelin': {
    name: 'Hexarelin',
    doseRange: '100–200 mcg',
    frequency: '2–3x per day',
    bestTime: 'Fasted, morning; pre-workout; before bed',
    cycleLength: '4–8 weeks, then 4 weeks off (desensitizes quickly)',
    halfLife: '~70 minutes',
    route: 'Subcutaneous injection',
    goals: ['Potent GH release', 'Muscle growth', 'Cardiac protection', 'Fat loss'],
    notes:
      'One of the most potent GHRPs. Causes significant cortisol and prolactin increase at higher doses. Rapid desensitization—cycle off regularly. Cardiac protective properties noted in research.',
    weightBased: false,
    fixedDoseMin: 100,
    fixedDoseMax: 200,
  },
  'GHRP-2': {
    name: 'GHRP-2',
    doseRange: '100–300 mcg',
    frequency: '2–3x per day',
    bestTime: 'Fasted, morning; pre-workout; before bed',
    cycleLength: '8–12 weeks, then 4 weeks off',
    halfLife: '~30 minutes',
    route: 'Subcutaneous injection',
    goals: ['GH stimulation', 'Appetite increase', 'Muscle growth', 'Fat loss'],
    notes:
      'Strong GH releaser with notable hunger/appetite stimulation. Also raises cortisol and prolactin moderately. Good for bulking due to appetite effects. Do not use directly after meals.',
    weightBased: false,
    fixedDoseMin: 100,
    fixedDoseMax: 300,
  },
  'GHRP-6': {
    name: 'GHRP-6',
    doseRange: '100–300 mcg',
    frequency: '2–3x per day',
    bestTime: 'Fasted, 30–60 min before meals',
    cycleLength: '8–12 weeks, then 4 weeks off',
    halfLife: '~15–60 minutes',
    route: 'Subcutaneous injection',
    goals: ['GH stimulation', 'Strong appetite stimulation', 'Muscle growth', 'Recovery'],
    notes:
      'Causes intense hunger—often used in bulking protocols. Among the strongest appetite stimulants of all GHRPs. Cortisol/prolactin increase at higher doses. Inject fasted for GH effect.',
    weightBased: false,
    fixedDoseMin: 100,
    fixedDoseMax: 300,
  },
  'IGF-1 LR3': {
    name: 'IGF-1 LR3',
    doseRange: '20–60 mcg',
    frequency: 'Once daily or on training days only',
    bestTime: 'Post-workout, within 30–60 min of training',
    cycleLength: '4–6 weeks maximum, then 4+ weeks off',
    halfLife: '~20–30 hours',
    route: 'Subcutaneous or intramuscular injection',
    goals: ['Muscle hypertrophy', 'Nutrient partitioning', 'Satellite cell activation', 'Recovery'],
    notes:
      'Potent anabolic peptide. Extended half-life vs regular IGF-1. Risk of hypoglycemia—inject post-workout and eat carbs immediately after. Cycle strictly—prolonged use may cause organ growth. Do not exceed 6 weeks.',
    weightBased: false,
    fixedDoseMin: 20,
    fixedDoseMax: 60,
  },
  'Melanotan II': {
    name: 'Melanotan II',
    doseRange: '0.25–1 mg (start low)',
    frequency: 'Once daily during loading; 1–2x per week maintenance',
    bestTime: 'Evening (nausea is common—sleeping through it helps)',
    cycleLength: '2–4 weeks loading, then maintenance as needed',
    halfLife: '~1 hour',
    route: 'Subcutaneous injection',
    goals: ['Skin tanning', 'Libido enhancement', 'Erectile function', 'Appetite suppression'],
    notes:
      'Start at 0.25 mg and titrate up. Nausea, flushing, and facial flushing are common initially. Spontaneous erections possible. Darkens moles—monitor existing moles. Not for use with melanoma history.',
    weightBased: false,
    fixedDoseMin: 250,
    fixedDoseMax: 1000,
  },
  'PT-141': {
    name: 'PT-141 (Bremelanotide)',
    doseRange: '1–2 mg',
    frequency: 'As needed, 45–60 min before sexual activity',
    bestTime: '45–60 minutes before sexual activity',
    cycleLength: 'On-demand use; do not exceed 1 dose per 24 hrs',
    halfLife: '~2.7 hours',
    route: 'Subcutaneous injection or nasal spray',
    goals: ['Sexual arousal', 'Libido', 'Erectile function', 'Female sexual dysfunction'],
    notes:
      'Melanocortin receptor agonist. FDA approved (Vyleesi) for female sexual dysfunction. Blood pressure may temporarily rise—monitor if hypertensive. Start at 1 mg; titrate to 2 mg if needed.',
    weightBased: false,
    fixedDoseMin: 1000,
    fixedDoseMax: 2000,
  },
  'Epithalon': {
    name: 'Epithalon',
    doseRange: '5–10 mg',
    frequency: 'Once daily',
    bestTime: 'Morning or before bed',
    cycleLength: '10–20 day course, 1–2x per year',
    halfLife: '~1–2 hours',
    route: 'Subcutaneous injection or intranasal',
    goals: ['Anti-aging', 'Telomere elongation', 'Sleep improvement', 'Longevity'],
    notes:
      'Tetrapeptide studied for telomerase activation. Run as a course (10–20 consecutive days) rather than daily indefinitely. Very safe profile. Often combined with other anti-aging peptides.',
    weightBased: false,
    fixedDoseMin: 5000,
    fixedDoseMax: 10000,
  },
  'Thymosin Alpha-1': {
    name: 'Thymosin Alpha-1 (Tα1)',
    doseRange: '1–1.6 mg',
    frequency: '2x per week',
    bestTime: 'Any time; consistent schedule preferred',
    cycleLength: '4–12 weeks; longer in immune-compromised conditions',
    halfLife: '~2 hours',
    route: 'Subcutaneous injection',
    goals: ['Immune modulation', 'Antiviral', 'Antibacterial', 'Cancer adjunct', 'Chronic illness'],
    notes:
      'FDA-approved in some countries for hepatitis and cancer immunotherapy. Very well tolerated. Used in HIV, hepatitis B/C, and post-infection recovery. May upregulate T-cell activity—use caution with autoimmune disease.',
    weightBased: false,
    fixedDoseMin: 1000,
    fixedDoseMax: 1600,
  },
  'AOD-9604': {
    name: 'AOD-9604',
    doseRange: '300–500 mcg',
    frequency: 'Once daily',
    bestTime: 'Fasted, morning (30–60 min before eating)',
    cycleLength: '8–12 weeks, then 4 weeks off',
    halfLife: '~30 minutes',
    route: 'Subcutaneous injection',
    goals: ['Fat loss', 'Lipolysis', 'Body composition', 'No GH/IGF-1 side effects'],
    notes:
      'Modified fragment of HGH (176-191) targeting fat metabolism only. Does not stimulate GH receptors—no glucose dysregulation. Best used fasted. Often stacked with Ipamorelin/CJC for fat loss.',
    weightBased: false,
    fixedDoseMin: 300,
    fixedDoseMax: 500,
  },
  'NAD+': {
    name: 'NAD+',
    doseRange: '500–1000 mg (IV) or 25–50 mg (subcutaneous)',
    frequency: 'IV: 1–2x per week; SubQ: Daily',
    bestTime: 'Morning (energizing effect)',
    cycleLength: 'Ongoing; monthly IV courses or daily SubQ',
    halfLife: '~1–2 hours (IV); varies SubQ',
    route: 'Intravenous (IV) or subcutaneous injection',
    goals: ['Cellular energy', 'Anti-aging', 'Cognitive function', 'Addiction recovery', 'Mitochondrial health'],
    notes:
      'IV infusion must be given slowly to avoid chest tightness, nausea, and flushing—common side effects that resolve with slower drip rate. SubQ is more convenient but lower bioavailability. Pairs well with resveratrol and NMN orally.',
    weightBased: false,
    fixedDoseMin: 25000,
    fixedDoseMax: 1000000,
  },
  'Selank': {
    name: 'Selank',
    doseRange: '250–3000 mcg',
    frequency: '1–3x per day',
    bestTime: 'Morning and/or as needed for anxiety',
    cycleLength: '2–4 weeks, then break; or as needed',
    halfLife: '~1–2 minutes (rapidly cleaved)',
    route: 'Intranasal spray (most common) or subcutaneous injection',
    goals: ['Anxiety reduction', 'Cognitive enhancement', 'Memory', 'Mood stabilization'],
    notes:
      'Russian nootropic peptide. Extremely short half-life—intranasal is most practical. Non-sedating anxiolytic. No known dependence or withdrawal. Well tolerated even at higher doses.',
    weightBased: false,
    fixedDoseMin: 250,
    fixedDoseMax: 3000,
  },
  'Semax': {
    name: 'Semax',
    doseRange: '300–600 mcg',
    frequency: '1–3x per day',
    bestTime: 'Morning; before cognitive tasks',
    cycleLength: '2–4 weeks on, 2 weeks off',
    halfLife: '~Minutes (very short)',
    route: 'Intranasal spray (most common) or subcutaneous injection',
    goals: ['Cognitive enhancement', 'Focus', 'Neuroprotection', 'BDNF upregulation', 'Stroke recovery'],
    notes:
      'Russian neuropeptide. Increases BDNF significantly. Very short half-life—intranasal multiple daily dosing recommended. Excellent safety profile. May cause mild stimulant effect initially.',
    weightBased: false,
    fixedDoseMin: 300,
    fixedDoseMax: 600,
  },
  'MK-677': {
    name: 'MK-677 (Ibutamoren)',
    doseRange: '10–25 mg',
    frequency: 'Once daily',
    bestTime: 'Before bed (stimulates GH pulse during sleep)',
    cycleLength: '3–6 months; can be used long-term at lower doses',
    halfLife: '~24 hours',
    route: 'Oral (not a peptide injection—oral secretagogue)',
    goals: ['GH/IGF-1 elevation', 'Muscle growth', 'Fat loss', 'Sleep quality', 'Anti-aging'],
    notes:
      'Oral GH secretagogue—technically not a peptide but often grouped with them. Increases appetite (similar to ghrelin). May cause water retention and temporary insulin resistance. Monitor blood glucose with long-term use.',
    weightBased: false,
    fixedDoseMin: 10000,
    fixedDoseMax: 25000,
  },
  'BPC-157 + TB-500 (combined)': {
    name: 'BPC-157 + TB-500 (combined)',
    doseRange: 'BPC-157: 250 mcg + TB-500: 1–2 mg per dose',
    frequency: 'BPC-157: 1–2x daily; TB-500: 2x per week',
    bestTime: 'BPC-157 morning/evening; TB-500 any time twice weekly',
    cycleLength: '4–8 weeks, then 4 weeks off',
    halfLife: 'BPC-157: ~4 hrs; TB-500: ~2–3 days',
    route: 'Subcutaneous injection (both)',
    goals: ['Synergistic tissue repair', 'Tendon/ligament healing', 'Muscle injury', 'Anti-inflammatory'],
    notes:
      'The gold-standard healing combination. BPC-157 provides local/systemic healing; TB-500 promotes systemic tissue remodeling and flexibility. Often combined in a single vial. Very safe combination.',
    weightBased: false,
    fixedDoseMin: 250,
    fixedDoseMax: 500,
  },
  'Tesamorelin': {
    name: 'Tesamorelin',
    doseRange: '1–2 mg',
    frequency: 'Once daily',
    bestTime: 'Fasted, before bed or morning',
    cycleLength: '3–6 months; FDA-approved for long-term HIV-associated lipodystrophy',
    halfLife: '~26 minutes',
    route: 'Subcutaneous injection',
    goals: ['Visceral fat reduction', 'GH stimulation', 'Lipodystrophy treatment', 'Body composition'],
    notes:
      'FDA-approved GHRH analog (Egrifta). Most studied for visceral/abdominal fat reduction. Produces significant IGF-1 elevation. Monitor for glucose changes. More potent than Sermorelin for fat loss.',
    weightBased: false,
    fixedDoseMin: 1000,
    fixedDoseMax: 2000,
  },
  'PEG-MGF': {
    name: 'PEG-MGF',
    doseRange: '200–500 mcg',
    frequency: '2x per week',
    bestTime: 'Post-workout (within 1–2 hours of training)',
    cycleLength: '4–6 weeks, then 4 weeks off',
    halfLife: '~Several days (PEGylated for extended release)',
    route: 'Subcutaneous or intramuscular injection',
    goals: ['Muscle growth', 'Satellite cell activation', 'Recovery', 'Hypertrophy'],
    notes:
      'PEGylated form of Mechano Growth Factor—fragment of IGF-1. PEGylation extends half-life dramatically. Best used post-workout to activate muscle satellite cells. Stack with IGF-1 LR3 for synergistic muscle growth.',
    weightBased: false,
    fixedDoseMin: 200,
    fixedDoseMax: 500,
  },
}

const PEPTIDE_NAMES = Object.keys(PEPTIDES)

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-indigo-400" />
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-0.5">{label}</p>
        <p className="text-slate-200 text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  )
}

function GoalBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
      {label}
    </span>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DosingPage() {
  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return PEPTIDE_NAMES.filter((n) => n.toLowerCase().includes(q))
  }, [query])

  const peptide = selected ? PEPTIDES[selected] : null

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function selectPeptide(name: string) {
    setSelected(name)
    setQuery(name)
    setDropdownOpen(false)
  }

  // Dosage calculator logic
  const calculatedDose = useMemo(() => {
    if (!peptide || !weightInput) return null
    const w = parseFloat(weightInput)
    if (isNaN(w) || w <= 0) return null
    const weightKg = weightUnit === 'lbs' ? w * 0.453592 : w

    if (peptide.weightBased && peptide.weightDoseMcgPerKg) {
      const dose = weightKg * peptide.weightDoseMcgPerKg
      return `${dose.toFixed(1)} mcg`
    }
    // Fixed dose — just show range with note
    return null
  }, [peptide, weightInput, weightUnit, weightUnit])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Dosage Calculator</h1>
        </div>
        <p className="text-slate-400 text-sm ml-13">
          Select a peptide to view recommended dosing protocols and reference information.
        </p>
      </div>

      {/* Search Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-slate-300 mb-2">Search Peptide</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setDropdownOpen(true)
              if (e.target.value === '') setSelected(null)
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Type to search peptides..."
            className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
          />
          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {dropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-slate-500 text-sm">No peptides found</div>
            ) : (
              filtered.map((name) => (
                <button
                  key={name}
                  onMouseDown={() => selectPeptide(name)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-700 ${
                    selected === name ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'
                  }`}
                >
                  {name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Peptide Info Card */}
      {peptide && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-500/10 to-transparent">
            <h2 className="text-xl font-bold text-white">{peptide.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {peptide.goals.map((g) => (
                <GoalBadge key={g} label={g} />
              ))}
            </div>
          </div>

          {/* Card body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FieldRow icon={Activity} label="Dose Range" value={peptide.doseRange} />
            <FieldRow icon={Clock} label="Frequency" value={peptide.frequency} />
            <FieldRow icon={Target} label="Best Time to Take" value={peptide.bestTime} />
            <FieldRow icon={Clock} label="Half-Life" value={peptide.halfLife} />
            <FieldRow icon={Activity} label="Cycle Length" value={peptide.cycleLength} />
            <FieldRow icon={Syringe} label="Route of Administration" value={peptide.route} />
          </div>

          {/* Notes */}
          <div className="px-6 pb-6">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">Important Notes</p>
                <p className="text-slate-300 text-sm leading-relaxed">{peptide.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dosage Calculator Tab */}
      {peptide && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Dosage Calculator</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">
                Body Weight
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="Enter weight..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">
                Unit
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-700">
                <button
                  onClick={() => setWeightUnit('kg')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    weightUnit === 'kg'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  kg
                </button>
                <button
                  onClick={() => setWeightUnit('lbs')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    weightUnit === 'lbs'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  lbs
                </button>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            {calculatedDose ? (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                  Calculated Dose for {weightInput} {weightUnit}
                </p>
                <p className="text-2xl font-bold text-indigo-400">{calculatedDose}</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                    Standard Dose Range
                  </p>
                  <p className="text-lg font-bold text-indigo-400">{peptide.doseRange}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {peptide.name} uses a fixed dosing protocol not based on body weight.
                    {weightInput
                      ? ' The standard range above applies regardless of body weight.'
                      : ' Enter your weight to confirm the standard protocol applies to you.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!peptide && (
        <div className="bg-slate-800 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
          <Calculator className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Select a peptide above to view dosing information</p>
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
