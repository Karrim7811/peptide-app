'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FlaskConical,
  Calculator,
  Info,
  Droplets,
} from 'lucide-react'

// ─── Quick Reference Data ──────────────────────────────────────────────────────

const VIAL_SIZES = [2, 5, 10] // mg
const WATER_AMOUNTS = [1, 2, 5] // mL

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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReconstitutionPage() {
  const router = useRouter()

  // Reconstitution inputs
  const [vialSize, setVialSize] = useState('')
  const [bacWater, setBacWater] = useState('')

  // Dose calculator inputs
  const [desiredDose, setDesiredDose] = useState('')
  const [doseUnit, setDoseUnit] = useState<'mcg' | 'mg'>('mcg')

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
            <p className="text-slate-400 text-sm">Calculate concentration and injection volume</p>
          </div>
        </div>
      </div>

      {/* ── Section 1: Reconstitution ─────────────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-500/10 to-transparent">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Reconstitution</h2>
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
