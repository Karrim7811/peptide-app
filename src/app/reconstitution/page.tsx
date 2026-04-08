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
import { useAiConsent } from '@/components/AiConsentProvider'

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
    <div className="bg-white border border-[#E8E5E0] rounded-xl p-4">
      <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-3">
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
          className="flex-1 bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-[#1A1915] placeholder-[#B0AAA0] focus:outline-none focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E] transition-colors text-sm"
        />
        <span className="text-[#B0AAA0] text-sm font-medium w-10 text-right shrink-0">{unit}</span>
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
    <div className="bg-[#FAFAF8] border border-[#E8E5E0] rounded-xl px-5 py-4">
      <p className="text-xs text-[#B0AAA0] uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={`font-bold text-[#1A8A9E] ${large ? 'text-3xl' : 'text-xl'}`}>{value}</p>
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
  neutral: 'text-[#3A3730]',
  negative: 'text-red-400',
  warning: 'text-amber-400',
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReconstitutionPage() {
  const router = useRouter()
  const { requireConsent } = useAiConsent()

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

    const consented = await requireConsent()
    if (!consented) return

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
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-[#E8E5E0] text-[#B0AAA0] hover:text-[#1A1915] hover:border-[#D0CCC6] transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A8A9E]/12 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-[#1A8A9E]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1915] leading-tight">Reconstitution Calculator</h1>
            <p className="text-[#B0AAA0] text-sm">AI-powered BAC water recommendations + manual calculator</p>
          </div>
        </div>
      </div>

      {/* ── Section 0: AI Peptide Assistant ───────────────────────────────────── */}
      <section className="bg-white border border-[#1A8A9E]/30 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#E8E5E0] bg-gradient-to-r from-[#1A8A9E]/10 to-transparent">
          <Sparkles className="w-4 h-4 text-[#1A8A9E]" />
          <h2 className="text-base font-semibold text-[#1A1915]">AI Reconstitution Advisor</h2>
          <span className="text-xs text-[#1A8A9E] bg-[#1A8A9E]/8 px-2 py-0.5 rounded-full ml-auto">AI</span>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#B0AAA0]">
            Select your peptide and enter the vial amount — AI will recommend how much BAC water to add and auto-fill the calculator below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Peptide Selector */}
            <div className="relative">
              <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
                Peptide
              </label>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#1A8A9E] transition-colors"
              >
                <span className={selectedPeptide ? 'text-[#1A1915]' : 'text-[#B0AAA0]'}>
                  {selectedPeptide || 'Select peptide...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#B0AAA0] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-1 w-full z-50 bg-[#FAFAF8] border border-[#E8E5E0] rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-[#E8E5E0]">
                    <input
                      type="text"
                      placeholder="Search peptides..."
                      value={peptideSearch}
                      onChange={(e) => setPeptideSearch(e.target.value)}
                      className="w-full bg-white border border-[#E8E5E0] rounded-lg px-3 py-2 text-sm text-[#1A1915] placeholder-[#B0AAA0] focus:outline-none focus:border-[#1A8A9E]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredPeptides.length === 0 ? (
                      <p className="text-center text-[#B0AAA0] text-sm py-4">No peptides found</p>
                    ) : (
                      filteredPeptides.map((name) => (
                        <button
                          key={name}
                          onClick={() => {
                            setSelectedPeptide(name)
                            setDropdownOpen(false)
                            setPeptideSearch('')
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white transition-colors ${
                            selectedPeptide === name ? 'text-[#1A8A9E] bg-[#1A8A9E]/8' : 'text-[#3A3730]'
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
              <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-2">
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
                  className="flex-1 bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-[#1A1915] placeholder-[#B0AAA0] focus:outline-none focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E] transition-colors text-sm"
                />
                <span className="text-[#B0AAA0] text-sm font-medium w-10 text-right shrink-0">mg</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAiCalculate}
            disabled={!selectedPeptide || !aiMg || aiLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#1A8A9E] hover:bg-[#1A8A9E] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1915] font-semibold rounded-xl px-6 py-3 transition-colors"
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
            <div className="bg-[#FAFAF8] border border-[#1A8A9E]/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#1A8A9E]" />
                <p className="text-sm font-semibold text-[#1A8A9E]">AI Recommendation for {selectedPeptide}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-[#B0AAA0] mb-1">BAC Water</p>
                  <p className="text-xl font-bold text-[#1A8A9E]">{aiResult.recommendedBacWaterMl} mL</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-[#B0AAA0] mb-1">Concentration</p>
                  <p className="text-lg font-bold text-[#1A1915]">{aiResult.concentrationMgPerMl} mg/mL</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-[#B0AAA0] mb-1">= mcg/mL</p>
                  <p className="text-lg font-bold text-[#1A1915]">{aiResult.concentrationMcgPerMl?.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-[#F2F0ED] rounded-lg px-4 py-3">
                  <p className="text-xs text-[#B0AAA0] uppercase tracking-wide mb-1">Reasoning</p>
                  <p className="text-sm text-[#3A3730]">{aiResult.reasoning}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F2F0ED] rounded-lg px-3 py-2">
                    <p className="text-xs text-[#B0AAA0] mb-0.5">Typical Dose Range</p>
                    <p className="text-sm text-emerald-400 font-medium">{aiResult.tipicalDoseRange}</p>
                  </div>
                  <div className="bg-[#F2F0ED] rounded-lg px-3 py-2">
                    <p className="text-xs text-[#B0AAA0] mb-0.5">Storage</p>
                    <p className="text-sm text-amber-400 font-medium">{aiResult.storageNote}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#B0AAA0] text-center">
                ✓ Values auto-filled in the manual calculator below
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 1: Reconstitution ─────────────────────────────────────────── */}
      <section className="bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#E8E5E0] bg-gradient-to-r from-[#1A8A9E]/8 to-transparent">
          <FlaskConical className="w-4 h-4 text-[#1A8A9E]" />
          <h2 className="text-base font-semibold text-[#1A1915]">Manual Reconstitution</h2>
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
            <div className="bg-[#FAFAF8] border border-dashed border-[#E8E5E0] rounded-xl px-5 py-6 text-center">
              <Droplets className="w-8 h-8 text-[#3A3730] mx-auto mb-2" />
              <p className="text-[#B0AAA0] text-sm">Enter vial size and BAC water to calculate concentration</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: Dose Calculator (only shown when concentration known) ──── */}
      {concentration !== null && (
        <section className="bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[#E8E5E0] bg-gradient-to-r from-[#1A8A9E]/8 to-transparent">
            <Calculator className="w-4 h-4 text-[#1A8A9E]" />
            <h2 className="text-base font-semibold text-[#1A1915]">Dose Calculator</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Desired dose input + unit toggle */}
            <div className="bg-white border border-[#E8E5E0] rounded-xl p-4">
              <label className="block text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider mb-3">
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
                  className="flex-1 bg-[#FAFAF8] border border-[#E8E5E0] rounded-lg px-4 py-2.5 text-[#1A1915] placeholder-[#B0AAA0] focus:outline-none focus:border-[#1A8A9E] focus:ring-1 focus:ring-[#1A8A9E] transition-colors text-sm"
                />
                {/* Unit toggle */}
                <div className="flex rounded-lg overflow-hidden border border-[#E8E5E0] shrink-0">
                  <button
                    onClick={() => setDoseUnit('mcg')}
                    className={`px-3 py-2.5 text-sm font-semibold transition-colors ${
                      doseUnit === 'mcg'
                        ? 'bg-[#1A8A9E] text-[#1A1915]'
                        : 'bg-[#FAFAF8] text-[#B0AAA0] hover:text-[#1A1915]'
                    }`}
                  >
                    mcg
                  </button>
                  <button
                    onClick={() => setDoseUnit('mg')}
                    className={`px-3 py-2.5 text-sm font-semibold transition-colors ${
                      doseUnit === 'mg'
                        ? 'bg-[#1A8A9E] text-[#1A1915]'
                        : 'bg-[#FAFAF8] text-[#B0AAA0] hover:text-[#1A1915]'
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
                <p className="text-xs text-[#B0AAA0] px-1">
                  U-100 = 0.01 mL per unit &nbsp;·&nbsp; U-40 = 0.025 mL per unit
                </p>
              </div>
            ) : (
              <div className="bg-[#FAFAF8] border border-dashed border-[#E8E5E0] rounded-xl px-5 py-6 text-center">
                <Calculator className="w-8 h-8 text-[#3A3730] mx-auto mb-2" />
                <p className="text-[#B0AAA0] text-sm">Enter your desired dose above to calculate injection volume</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Section 3: Quick Reference Table ─────────────────────────────────── */}
      <section className="bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#E8E5E0]">
          <Droplets className="w-4 h-4 text-[#1A8A9E]" />
          <h2 className="text-base font-semibold text-[#1A1915]">Quick Reference</h2>
          <span className="text-xs text-[#B0AAA0] ml-1">(mcg/mL)</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1A8A9E]/12">
                <th className="text-left px-4 py-2.5 text-[#1A8A9E] font-semibold rounded-tl-lg">
                  Vial \ Water
                </th>
                {WATER_AMOUNTS.map((w) => (
                  <th key={w} className="px-4 py-2.5 text-[#1A8A9E] font-semibold text-center">
                    {w} mL
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quickRef.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-t border-[#E8E5E0] hover:bg-[#F2F0ED] transition-colors"
                >
                  <td className="px-4 py-3 text-[#3A3730] font-medium">{VIAL_SIZES[ri]} mg</td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-[#3A3730] text-center tabular-nums">
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
      <div className="bg-white border border-[#1A8A9E]/20 rounded-xl px-5 py-4 flex gap-3">
        <Info className="w-5 h-5 text-[#1A8A9E] shrink-0 mt-0.5" />
        <p className="text-[#3A3730] text-sm leading-relaxed">
          <span className="font-semibold text-[#1A1915]">Tip:</span> Always use bacteriostatic water (BAC water).
          Sterile water can be used but the peptide degrades faster and does not allow multi-dose use.
        </p>
      </div>
    </div>
  )
}
