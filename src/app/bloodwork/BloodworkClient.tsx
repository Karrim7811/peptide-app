'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Upload, FlaskConical, Loader2, Plus, X, Sparkles,
  AlertTriangle, ChevronDown, ChevronRight, CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAiConsent } from '@/components/AiConsentProvider'
import { MARKER_CATALOG, MARKER_BY_KEY } from '@/lib/bloodwork-markers'

type MarkerRow = { key: string; label: string; value: string; unit: string }
type Recommendation = { peptide: string; reason: string; priority?: string; suggestedVialMg?: string }
type AnalyzeResult = { analysis: string; recommendations: Recommendation[]; warnings: string[] }
type HistoryRow = { id: string; created_at: string; analysis: string; recommendations: string; warnings: string }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(((reader.result as string) || '').split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  low: 'bg-[#F2F0ED] text-[#B0AAA0] border-[#E8E5E0]',
}

export default function BloodworkClient() {
  const { requireConsent } = useAiConsent()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [markers, setMarkers] = useState<MarkerRow[]>([])
  const [goals, setGoals] = useState('')
  const [includeStack, setIncludeStack] = useState(true)
  const [addKey, setAddKey] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [openHistory, setOpenHistory] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('bloodwork_results')
      .select('id, created_at, analysis, recommendations, warnings')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setHistory(data ?? [])
  }, [supabase])

  useEffect(() => { loadHistory() }, [loadHistory])

  function upsertMarker(key: string, value: string) {
    const def = MARKER_BY_KEY[key]
    if (!def) return
    setMarkers((prev) => {
      const idx = prev.findIndex((m) => m.key === key)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], value }
        return copy
      }
      return [...prev, { key, label: def.label, value, unit: def.unit }]
    })
  }

  async function handleFile(file: File) {
    setError('')
    const consented = await requireConsent()
    if (!consented) return
    setOcrLoading(true)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/bloodwork-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'application/pdf' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Could not read that file. Try a clearer scan or enter values manually.')
        return
      }
      const found = data.markers || {}
      let count = 0
      for (const def of MARKER_CATALOG) {
        const v = found[def.key]
        if (typeof v === 'number' && !Number.isNaN(v)) {
          upsertMarker(def.key, String(v))
          count++
        }
      }
      if (count === 0) setError('No recognizable markers were found. You can enter values manually below.')
    } catch {
      setError('Failed to read the file. Please try again.')
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeMarker(key: string) {
    setMarkers((p) => p.filter((m) => m.key !== key))
  }
  function setValue(key: string, value: string) {
    setMarkers((p) => p.map((m) => (m.key === key ? { ...m, value } : m)))
  }
  function addMarker() {
    if (!addKey) return
    const def = MARKER_BY_KEY[addKey]
    if (def && !markers.some((m) => m.key === addKey)) {
      setMarkers((p) => [...p, { key: def.key, label: def.label, value: '', unit: def.unit }])
    }
    setAddKey('')
  }

  async function handleAnalyze() {
    setError('')
    const filled = markers.filter((m) => m.value.trim() !== '' && !Number.isNaN(Number(m.value)))
    if (filled.length === 0) {
      setError('Add at least one marker value to analyze.')
      return
    }
    const consented = await requireConsent()
    if (!consented) return
    setAnalyzing(true)
    setResult(null)
    setSaved(false)
    try {
      let currentStack: { name: string }[] | undefined
      if (includeStack) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('stack_items')
            .select('name')
            .eq('user_id', user.id)
            .eq('active', true)
          currentStack = (data ?? []).map((s) => ({ name: s.name as string }))
        }
      }
      const payloadMarkers = filled.map((m) => ({ name: m.label, value: Number(m.value), unit: m.unit }))
      const res = await fetch('/api/bloodwork-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markers: payloadMarkers, goals, currentStack }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Analysis failed. Please try again.')
        return
      }
      const r: AnalyzeResult = {
        analysis: data.analysis || '',
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
      }
      setResult(r)
      await saveResult(payloadMarkers, r)
    } catch {
      setError('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function saveResult(
    payloadMarkers: { name: string; value: number; unit: string }[],
    r: AnalyzeResult
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('bloodwork_results').insert({
        user_id: user.id,
        markers: JSON.stringify(payloadMarkers),
        analysis: r.analysis,
        recommendations: JSON.stringify(r.recommendations),
        warnings: JSON.stringify(r.warnings),
      })
      setSaved(true)
      loadHistory()
    } catch {
      /* save is non-fatal — the result is still shown */
    }
  }

  const availableToAdd = MARKER_CATALOG.filter((d) => !markers.some((m) => m.key === d.key))

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#B0AAA0] hover:text-[#1A1915] mb-3">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1A1915] flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-[#1A8A9E]" />
          Bloodwork Analyzer
        </h1>
        <p className="text-[#B0AAA0] mt-1">
          Upload a lab report (PDF or photo), review the extracted markers, and get an
          educational overview with peptides studied in relation to those biomarkers.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <p className="text-xs text-[#3A3730] leading-relaxed">
          For research and educational reference only — not medical advice, diagnosis, or
          interpretation of your lab results. Consult a licensed physician about your bloodwork.
        </p>
      </div>

      {/* Upload */}
      <div className="bg-white border border-[#E8E5E0] rounded-xl p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={ocrLoading}
          className="w-full border-2 border-dashed border-[#1A8A9E]/40 hover:border-[#1A8A9E] hover:bg-[#1A8A9E]/5 disabled:opacity-60 rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-colors"
        >
          {ocrLoading ? (
            <>
              <Loader2 className="w-7 h-7 text-[#1A8A9E] animate-spin" />
              <span className="text-sm text-[#3A3730] font-medium">Reading your report…</span>
            </>
          ) : (
            <>
              <Upload className="w-7 h-7 text-[#1A8A9E]" />
              <span className="text-sm text-[#3A3730] font-medium">Upload lab report (PDF or image)</span>
              <span className="text-xs text-[#B0AAA0]">Labcorp, Quest, or any lab PDF — or a clear photo</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Markers editor */}
      <div className="bg-white border border-[#E8E5E0] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1A1915]">Your markers</h2>

        {markers.length === 0 ? (
          <p className="text-sm text-[#B0AAA0]">
            Upload a report above to auto-fill, or add markers manually below.
          </p>
        ) : (
          <div className="space-y-2">
            {markers.map((m) => (
              <div key={m.key} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-[#3A3730] min-w-0 truncate">{m.label}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={m.value}
                  onChange={(e) => setValue(m.key, e.target.value)}
                  placeholder="value"
                  className="w-24 font-mono tabular-nums text-right"
                />
                <span className="w-16 text-xs text-[#B0AAA0]">{m.unit}</span>
                <button
                  onClick={() => removeMarker(m.key)}
                  className="p-1.5 text-[#B0AAA0] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add marker */}
        {availableToAdd.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <select
                value={addKey}
                onChange={(e) => setAddKey(e.target.value)}
                className="appearance-none pr-8 w-full"
              >
                <option value="">Add a marker…</option>
                {availableToAdd.map((d) => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0AAA0] pointer-events-none" />
            </div>
            <button
              onClick={addMarker}
              disabled={!addKey}
              className="flex items-center gap-1.5 bg-[#F2F0ED] hover:bg-[#E8E5E0] disabled:opacity-50 text-[#1A1915] px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        )}

        {/* Goals + options */}
        <div className="pt-2 space-y-3 border-t border-[#E8E5E0]">
          <div>
            <label className="block text-sm font-medium text-[#3A3730] mb-1.5 mt-3">
              Goals <span className="text-[#B0AAA0] font-normal">(optional)</span>
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. improve recovery, optimize testosterone, longevity"
              rows={2}
              className="w-full resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#3A3730] cursor-pointer">
            <input
              type="checkbox"
              checked={includeStack}
              onChange={(e) => setIncludeStack(e.target.checked)}
              className="w-4 h-4 accent-[#1A8A9E]"
            />
            Consider my current stack for context
          </label>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing || ocrLoading}
          className="w-full flex items-center justify-center gap-2 bg-[#1A8A9E] hover:bg-[#15707f] disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
        >
          {analyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Analyze Bloodwork</>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white border border-[#1A8A9E]/30 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1A1915]">Educational overview</h2>
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved to history
              </span>
            )}
          </div>

          {result.analysis && (
            <div className="text-sm text-[#3A3730] leading-relaxed whitespace-pre-wrap">
              {result.analysis}
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wider text-[#B0AAA0] uppercase">
                Peptides studied for these markers
              </h3>
              {result.recommendations.map((rec, i) => (
                <div key={i} className="border border-[#E8E5E0] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#1A1915] text-sm">{rec.peptide}</span>
                    {rec.priority && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[rec.priority.toLowerCase()] ?? PRIORITY_STYLE.low}`}>
                        {rec.priority}
                      </span>
                    )}
                    {rec.suggestedVialMg && (
                      <span className="text-[10px] text-[#B0AAA0] font-mono ml-auto">
                        {rec.suggestedVialMg} mg vial
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#3A3730] leading-relaxed">{rec.reason}</p>
                </div>
              ))}
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-3 space-y-1.5">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-[#3A3730] flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  {w}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-6">
          <h2 className="text-base font-semibold text-[#1A1915] mb-3">Previous analyses</h2>
          <div className="divide-y divide-[#E8E5E0]">
            {history.map((h) => {
              const isOpen = openHistory === h.id
              const date = new Date(h.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
              })
              let recs: Recommendation[] = []
              let warns: string[] = []
              try { recs = JSON.parse(h.recommendations || '[]') } catch { /* ignore */ }
              try { warns = JSON.parse(h.warnings || '[]') } catch { /* ignore */ }
              return (
                <div key={h.id} className="py-2">
                  <button
                    onClick={() => setOpenHistory(isOpen ? null : h.id)}
                    className="w-full flex items-center gap-2 text-left"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4 text-[#B0AAA0]" /> : <ChevronRight className="w-4 h-4 text-[#B0AAA0]" />}
                    <span className="text-sm font-medium text-[#1A1915] font-mono">{date}</span>
                    <span className="text-xs text-[#B0AAA0] truncate flex-1">
                      {h.analysis.slice(0, 60)}…
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pl-6 pt-2 space-y-3">
                      <p className="text-sm text-[#3A3730] leading-relaxed whitespace-pre-wrap">{h.analysis}</p>
                      {recs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {recs.map((r, i) => (
                            <span key={i} className="text-xs bg-[#1A8A9E]/10 text-[#1A8A9E] px-2 py-0.5 rounded-full">
                              {r.peptide}
                            </span>
                          ))}
                        </div>
                      )}
                      {warns.map((w, i) => (
                        <p key={i} className="text-xs text-[#B0AAA0]">{w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
