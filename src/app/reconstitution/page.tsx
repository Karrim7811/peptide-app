'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FlaskConical,
  Calculator,
  Info,
  Droplets,
  Sparkles,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'

// ─── Quick Reference Data ──────────────────────────────────────────────────────

const VIAL_SIZES = [2, 5, 10] // mg
const WATER_AMOUNTS = [1, 2, 5] // mL

const PEPTIDE_NAMES = PEPTIDE_KNOWLEDGE.map((p) => p.name).sort((a, b) => a.localeCompare(b))

// ─── Sub-components ────────────────────────────────────────────────────────────

function InputCard({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
        />
        <span className="text-slate-400 text-sm font-medium w-10 text-right shrink-0">{unit}</span>
      </div>
    </div>
  )
}

function ResultBox({
  label,
  value,
  large,
}: {
  label: string
  value: string
  large?: boolean
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-5 py-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`font-bold text-indigo-400 ${large ? 'text-3xl' : 'text-xl'}`}>{value}</p>
    </div>
  )
}

interface AiResult {
  recommendedBacWaterMl: number
  concentrationMgPerMl: number
  concentrationMcgPerMl: number
  reasoning: string
  tipicalDoseRange: string
  storageNote: string
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-emerald-400',
  neutral: 'text-slate-300',
  negative: 'text-red-400',
  warning: 'text-amber-400',
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReconstitutionPage() {
  const router = useRouter()

  // AI peptide selector state
  const [selectedPeptide, setSelectedPeptide] = useState('')
  const [aiMg, setAiMg] = useState('')
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [peptideSearch, setPeptideSearch] = useState('')

  // Reconstitution inputs
  const [vialSize, setVialSize] = useState('')
  const [bacWater, setBacWater] = useState('')

  // Dose calculator inputs
  const [desiredDose, setDesiredDose] = useState('')
  const [doseUnit, setDoseUnit] = useState<'mcg' | 'mg'>('mcg')

  const filteredPeptides = useMemo(() => {
    if (!peptideSearch) return PEPTIDE_NAMES
    return PEPTIDE_NAMES.filter((p) => p.toLowerCase().includes(peptideSearch.toLowerCase()))
  }, [peptideSearch])

  async function handleAiCalculate() {
    if (!selectedPeptide || !aiMg) return
    setAiLoading(true)
    setAiError('')
    setAiResult(null)
    try {
      const res = await fetch('/api/reconstitution-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peptideName: selectedPeptide, amountMg: parseFloat(aiMg) }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setAiResult(data)
      // Auto-fill the manual calculator with AI recommendation
      setVialSize(aiMg)
      setBacWater(String(data.recommendedBacWaterMl))
    } catch {
      setAiError('Failed to get AI recommendation. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Concentration ──────────────────────────────────────────────────────────
  const concentration = useMemo(() => {
    const v = parseFloat(vialSize)
    const w = parseFloat(bacWater)
    if (!v || !w || v <= 0 || w <= 0) return null
    return v / w // mg/mL
  }, [vialSize, bacWater])

  // ── Dose calculation ───────────────────────────────────────────────────────
  const doseCalc = useMemo(() => {
    if (concentration === null) return null
    const raw = parseFloat(desiredDose)
    if (!raw || raw <= 0) return null

    // Normalise to mg
    const doseMg = doseUnit === 'mcg' ? raw / 1000 : raw
    const volumeMl = doseMg / concentration
    const u100 = volumeMl * 100
    const u40 = volumeMl * 40

    return { volumeMl, u100, u40 }
  }, [desiredDose, doseUnit, concentration])

  // ── Quick reference table ──────────────────────────────────────────────────
  const quickRef = useMemo(() => {
    return VIAL_SIZES.map((v) =>
      WATER_AMOUNTS.map((w) => ({
        vial: v,
        water: w,
        conc: (v / w) * 1000, // mcg/mL
      }))
    )
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Reconstitution Calculator</h1>
            <p className="text-slate-400 text-sm">AI-powered BAC water recommendations + manual calculator</p>
          </div>
        </div>
      </div>

      {/* ── Section 0: AI Peptide Assistant ───────────────────────────────────── */}
      <section className="bg-slate-800 border border-indigo-500/30 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-500/15 to-transparent">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">AI Reconstitution Advisor</h2>
          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full ml-auto">AI</span>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Select your peptide and enter the vial amount — AI will recommend how much BAC water to add and auto-fill the calculator below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Peptide Selector */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Peptide
              </label>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-left focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <span className={selectedPeptide ? 'text-white' : 'text-slate-600'}>
                  {selectedPeptide || 'Select peptide...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-1 w-full z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-700">
                    <input
                      type="text"
                      placeholder="Search peptides..."
                      value={peptideSearch}
                      onChange={(e) => setPeptideSearch(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredPeptides.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-4">No peptides found</p>
                    ) : (
                      filteredPeptides.map((name) => (
                        <button
                          key={name}
                          onClick={() => {
                            setSelectedPeptide(name)
                            setDropdownOpen(false)
                            setPeptideSearch('')
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${
                            selectedPeptide === name ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'
                          }`}
                        >
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Vial Amount
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={aiMg}
                  onChange={(e) => setAiMg(e.target.value)}
                  placeholder="e.g. 5"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
                <span className="text-slate-400 text-sm font-medium w-10 text-right shrink-0">mg</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAiCalculate}
            disabled={!selectedPeptide || !aiMg || aiLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3 transition-colors"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get AI Recommendation
              </>
            )}
          </button>

          {aiError && (
            <p className="text-red-400 text-sm text-center">{aiError}</p>
          )}

          {/* AI Result */}
          {aiResult && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <p className="text-sm font-semibold text-indigo-400">AI Recommendation for {selectedPeptide}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">BAC Water</p>
                  <p className="text-xl font-bold text-indigo-400">{aiResult.recommendedBacWaterMl} mL</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Concentration</p>
                  <p className="text-lg font-bold text-white">{aiResult.concentrationMgPerMl} mg/mL</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">= mcg/mL</p>
                  <p className="text-lg font-bold text-white">{aiResult.concentrationMcgPerMl?.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-slate-800/60 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Reasoning</p>
                  <p className="text-sm text-slate-300">{aiResult.reasoning}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500 mb-0.5">Typical Dose Range</p>
                    <p className="text-sm text-emerald-400 font-medium">{aiResult.tipicalDoseRange}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500 mb-0.5">Storage</p>
                    <p className="text-sm text-amber-400 font-medium">{aiResult.storageNote}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 text-center">
                ✓ Values auto-filled in the manual calculator below
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 1: Reconstitution ─────────────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-500/10 to-transparent">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Manual Reconstitution</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputCard
              label="Vial Size"
              unit="mg"
              value={vialSize}
              onChange={setVialSize}
              placeholder="e.g. 5"
            />
            <InputCard
              label="BAC Water Added"
              unit="mL"
              value={bacWater}
              onChange={setBacWater}
              placeholder="e.g. 2"
            />
          </div>

          {/* Concentration results */}
          {concentration !== null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <ResultBox
                label="Concentration"
                value={`${concentration.toFixed(2)} mg/mL`}
                large
              />
              <ResultBox
                label="Concentration"
                value={`${(concentration * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} mcg/mL`}
                large
              />
            </div>
          ) : (
            <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl px-5 py-6 text-center">
              <Droplets className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Enter vial size and BAC water to calculate concentration</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: Dose Calculator (only shown when concentration known) ──── */}
      {concentration !== null && (
        <section className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-500/10 to-transparent">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Dose Calculator</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Desired dose input + unit toggle */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Desired Dose
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={desiredDose}
                  onChange={(e) => setDesiredDose(e.target.value)}
                  placeholder="e.g. 250"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
                {/* Unit toggle */}
                <div className="flex rounded-lg overflow-hidden border border-slate-700 shrink-0">
                  <button
                    onClick={() => setDoseUnit('mcg')}
                    className={`px-3 py-2.5 text-sm font-semibold transition-colors ${
                      doseUnit === 'mcg'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    mcg
                  </button>
                  <button
                    onClick={() => setDoseUnit('mg')}
                    className={`px-3 py-2.5 text-sm font-semibold transition-colors ${
                      doseUnit === 'mg'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    mg
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {doseCalc !== null ? (
              <div className="space-y-3">
                <ResultBox
                  label="Volume to Inject"
                  value={`${doseCalc.volumeMl.toFixed(3)} mL`}
                  large
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ResultBox
                    label="U-100 Insulin Syringe"
                    value={`${doseCalc.u100.toFixed(1)} units`}
                  />
                  <ResultBox
                    label="U-40 Insulin Syringe"
                    value={`${doseCalc.u40.toFixed(1)} units`}
                  />
                </div>
                <p className="text-xs text-slate-600 px-1">
                  U-100 = 0.01 mL per unit &nbsp;·&nbsp; U-40 = 0.025 mL per unit
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl px-5 py-6 text-center">
                <Calculator className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Enter your desired dose above to calculate injection volume</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Section 3: Quick Reference Table ─────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700">
          <Droplets className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Quick Reference</h2>
          <span className="text-xs text-slate-500 ml-1">(mcg/mL)</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-600/20">
                <th className="text-left px-4 py-2.5 text-indigo-300 font-semibold rounded-tl-lg">
                  Vial \ Water
                </th>
                {WATER_AMOUNTS.map((w) => (
                  <th key={w} className="px-4 py-2.5 text-indigo-300 font-semibold text-center">
                    {w} mL
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quickRef.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-t border-slate-700/60 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-300 font-medium">{VIAL_SIZES[ri]} mg</td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-slate-200 text-center tabular-nums">
                      {cell.conc.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Info tip ─────────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-indigo-500/20 rounded-xl px-5 py-4 flex gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-slate-300 text-sm leading-relaxed">
          <span className="font-semibold text-white">Tip:</span> Always use bacteriostatic water (BAC water).
          Sterile water can be used but the peptide degrades faster and does not allow multi-dose use.
        </p>
      </div>
    </div>
  )
}
