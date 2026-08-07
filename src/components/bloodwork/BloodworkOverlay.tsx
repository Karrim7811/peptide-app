'use client'

// The Mirror's bloodwork ingest overlay.
//
// Same full-bleed document-surface pattern as the Ledger (src/components/ledger/Ledger.tsx):
// `absolute inset-0 z-20`, no atmosphere, an `onClose` prop, and NO own Esc listener — the
// shell's nav hook (useMirrorNav) owns Escape and will call onClose through whatever state
// tracks this overlay's open flag, exactly as it already does for the Ledger.
//
// Flow: upload a PDF/image -> POST /api/bloodwork-ocr -> review/correct parsed markers ->
// POST /api/bloodwork-analyze -> educational overview -> save to bloodwork_results. The two
// endpoints are untouched; this is a reskin of src/app/bloodwork/BloodworkClient.tsx's working
// flow, validation and error handling into the Mirror's visual language.
//
// GATING: bloodwork is Pro-only per CLAUDE.md's resolved product decision. The tier lock uses
// `ent.isFree` rather than `ent.labsOn`. `labsOn` is defined in src/lib/entitlement.ts as
// `hasLabs && !isFree` — "attached AND Pro" — which answers whether *already-saved* labs are
// readable elsewhere in the Mirror (MirrorPanel's region/whole narration). It is not "can this
// user open the uploader": a brand-new Pro subscriber has `hasLabs === false` on their very
// first visit, so gating the uploader on `labsOn` would lock every Pro user out of their first
// upload forever — the exact chicken-and-egg bug MirrorPanel.tsx already avoids by branching on
// `ent.isFree` first and reading `ent.labsOn` only as the secondary "already attached vs not
// attached yet" distinction (see MirrorPanel.tsx ~line 188). This overlay mirrors that same
// branch shape for the same feature, off the same `ent` object — no tier check invented here.

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAiConsent } from '@/components/AiConsentProvider'
import { MARKER_CATALOG, MARKER_BY_KEY } from '@/lib/bloodwork-markers'
import type { Entitlements } from '@/lib/entitlement'
import { money, MONTHLY_PRICE } from '@/lib/pricing'

export interface BloodworkOverlayProps {
  ent: Entitlements
  onClose: () => void
}

type MarkerRow = { key: string; label: string; value: string; unit: string }
type Recommendation = { peptide: string; reason: string; priority?: string; suggestedVialMg?: string }
type AnalyzeResult = { analysis: string; recommendations: Recommendation[]; warnings: string[] }

const DISCLAIMER =
  'EDUCATIONAL REFERENCE ONLY · CORTEX DESCRIBES HOW COMPOUNDS ARE STUDIED · IT DOES NOT DIAGNOSE, TREAT OR PRESCRIBE.'

const PRIORITY_HUE: Record<string, string> = {
  high: 'text-hue-go',
  medium: 'text-gold',
  low: 'text-faint',
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(((reader.result as string) || '').split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="flex min-h-[44px] items-center border border-hair px-4 font-mono text-[10px] tracking-[0.14em] text-dim hover:border-accent hover:text-ink"
    >
      CLOSE · ESC
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[9px] tracking-[0.26em] text-faint">{children}</span>
}

/** Pro-gated lock screen. Shown instead of the uploader — never both. */
function LockedPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ground">
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-hair px-[14px] py-3">
        <span className="font-mono text-[11px] tracking-[0.24em] text-ink">BLOODWORK</span>
        <CloseButton onClose={onClose} />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
        <div className="flex w-full max-w-[440px] flex-col gap-[14px] border border-hair p-8">
          <span className="font-mono text-[10px] tracking-[0.2em] text-gold">BLOODWORK · PRO</span>
          <span className="font-display text-[26px] font-light leading-[1.1] text-ink">
            Read your labs, not just log them
          </span>
          <p className="text-[14.5px] leading-[1.75] text-dim">
            Pro unlocks bloodwork ingest: upload a lab PDF or a photo, Cortex extracts the
            markers, and you get an educational overview of how each one is studied — plus
            peptide references commonly studied in relation to those biomarkers, checked
            against your stack. Free keeps the reference library, dose log and reconstitution
            math; bloodwork reading is Pro-only.
          </p>
          <Link
            href="/pricing"
            className="flex min-h-[44px] items-center justify-center bg-gold font-mono text-[10px] tracking-[0.16em] text-ground"
          >
            UNLOCK BLOODWORK · {money(MONTHLY_PRICE)}/MO →
          </Link>
          <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  )
}

export default function BloodworkOverlay({ ent, onClose }: BloodworkOverlayProps) {
  if (ent.isFree) {
    return <LockedPanel onClose={onClose} />
  }
  return <IngestPanel onClose={onClose} hasExistingLabs={ent.labsOn} />
}

function IngestPanel({ onClose, hasExistingLabs }: { onClose: () => void; hasExistingLabs: boolean }) {
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

  const upsertMarker = useCallback((key: string, value: string) => {
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
  }, [])

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

  async function saveResult(
    payloadMarkers: { name: string; value: number; unit: string }[],
    r: AnalyzeResult,
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
    } catch {
      /* save is non-fatal — the result is still shown */
    }
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

  const availableToAdd = MARKER_CATALOG.filter((d) => !markers.some((m) => m.key === d.key))

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ground">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-hair px-[14px] py-3">
        <span className="font-mono text-[11px] tracking-[0.24em] text-ink">BLOODWORK</span>
        <CloseButton onClose={onClose} />
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex max-w-[720px] flex-col gap-6 p-6 pb-16">
          <div className="flex flex-col gap-[7px]">
            <span className="font-display text-[28px] font-light leading-none text-ink">
              {hasExistingLabs ? 'Update your bloodwork' : 'Attach your bloodwork'}
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-faint">
              UPLOAD A LAB PDF OR PHOTO · REVIEW THE PARSED MARKERS · GET AN EDUCATIONAL OVERVIEW
            </span>
          </div>

          {/* Mandatory disclaimer — present on every state of this overlay */}
          <div className="flex flex-col gap-[6px] border-l-2 border-gold bg-panelHot px-4 py-3">
            <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-dim">{DISCLAIMER}</p>
          </div>

          {/* Upload */}
          <div className="flex flex-col gap-3 border border-hair p-6">
            <SectionLabel>UPLOAD · PDF OR IMAGE</SectionLabel>
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
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 border border-dashed border-hair px-4 py-6 text-center hover:border-accent disabled:opacity-60"
            >
              {ocrLoading ? (
                <span className="font-mono text-[11px] tracking-[0.12em] text-accent">READING YOUR REPORT…</span>
              ) : (
                <>
                  <span className="font-mono text-[11px] tracking-[0.14em] text-ink">UPLOAD LAB REPORT</span>
                  <span className="text-[12.5px] text-faint">Labcorp, Quest, any lab PDF — or a clear photo</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="border-l-2 border-hue-go bg-panelHot px-4 py-3">
              <p className="text-[13.5px] leading-[1.6] text-ink">{error}</p>
            </div>
          )}

          {/* Markers editor */}
          <div className="flex flex-col gap-4 border border-hair p-6">
            <SectionLabel>YOUR MARKERS</SectionLabel>

            {markers.length === 0 ? (
              <p className="text-[13.5px] leading-[1.7] text-faint">
                Upload a report above to auto-fill, or add markers manually below.
              </p>
            ) : (
              <div className="flex flex-col gap-px bg-hair">
                {markers.map((m) => (
                  <div key={m.key} className="flex min-h-[44px] items-center gap-3 bg-panel px-[15px] py-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{m.label}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={m.value}
                      onChange={(e) => setValue(m.key, e.target.value)}
                      placeholder="value"
                      className="w-24 border border-hair bg-panelHi px-2 py-1.5 text-right font-mono text-[13px] text-ink placeholder:text-faintest focus:border-accent focus:outline-none"
                    />
                    <span className="w-20 flex-shrink-0 font-mono text-[10.5px] text-faint">{m.unit}</span>
                    <button
                      type="button"
                      onClick={() => removeMarker(m.key)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center font-mono text-[10px] tracking-[0.1em] text-faint hover:text-hue-go"
                      title="Remove"
                      aria-label={`Remove ${m.label}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add marker */}
            {availableToAdd.length > 0 && (
              <div className="flex items-stretch gap-px bg-hair">
                <select
                  value={addKey}
                  onChange={(e) => setAddKey(e.target.value)}
                  className="min-h-[44px] flex-1 bg-panelHi px-3 font-mono text-[11px] text-ink focus:outline-none"
                >
                  <option value="">ADD A MARKER…</option>
                  {availableToAdd.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addMarker}
                  disabled={!addKey}
                  className="min-h-[44px] basis-[88px] bg-panelHi font-mono text-[10px] tracking-[0.12em] text-dim hover:text-ink disabled:opacity-50"
                >
                  ADD
                </button>
              </div>
            )}

            {/* Goals + options */}
            <div className="flex flex-col gap-3 border-t border-hair pt-4">
              <div className="flex flex-col gap-[6px]">
                <label className="font-mono text-[9.5px] tracking-[0.16em] text-faint">
                  GOALS · OPTIONAL
                </label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. improve recovery, optimize testosterone, longevity"
                  rows={2}
                  className="w-full resize-none border border-hair bg-panelHi px-3 py-2 text-[13.5px] text-ink placeholder:text-faintest focus:border-accent focus:outline-none"
                />
              </div>
              <label className="flex min-h-[44px] items-center gap-2 text-[13.5px] text-dim">
                <input
                  type="checkbox"
                  checked={includeStack}
                  onChange={(e) => setIncludeStack(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Consider my current stack for context
              </label>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || ocrLoading}
              className="flex min-h-[44px] items-center justify-center bg-accent font-mono text-[11px] tracking-[0.16em] text-ground disabled:opacity-50"
            >
              {analyzing ? 'ANALYZING…' : 'ANALYZE BLOODWORK'}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="flex flex-col gap-5 border border-hair p-6">
              <div className="flex items-center justify-between gap-3">
                <SectionLabel>EDUCATIONAL OVERVIEW</SectionLabel>
                {saved && (
                  <span className="font-mono text-[9.5px] tracking-[0.1em] text-hue-gr">SAVED TO HISTORY</span>
                )}
              </div>

              <div className="border-l-2 border-gold bg-panelHot px-4 py-3">
                <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-dim">{DISCLAIMER}</p>
              </div>

              {result.analysis && (
                <p className="whitespace-pre-wrap text-[14.5px] leading-[1.8] text-dim">{result.analysis}</p>
              )}

              {result.recommendations.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionLabel>PEPTIDES STUDIED FOR THESE MARKERS</SectionLabel>
                  <div className="flex flex-col gap-px bg-hair">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="flex flex-col gap-1.5 bg-panel px-[15px] py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-ink">{rec.peptide}</span>
                          {rec.priority && (
                            <span
                              className={`font-mono text-[9px] tracking-[0.12em] ${
                                PRIORITY_HUE[rec.priority.toLowerCase()] ?? PRIORITY_HUE.low
                              }`}
                            >
                              {rec.priority.toUpperCase()}
                            </span>
                          )}
                          {rec.suggestedVialMg && (
                            <span className="ml-auto font-mono text-[10.5px] text-faint">
                              {rec.suggestedVialMg} mg vial
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] leading-[1.7] text-dim">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="flex flex-col gap-1.5 border-l-2 border-gold bg-panelHot px-4 py-3">
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-[12.5px] leading-[1.65] text-dim">{w}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
