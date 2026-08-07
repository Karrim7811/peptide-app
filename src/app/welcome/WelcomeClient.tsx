'use client'

// First-run onboarding. Four steps, one idea per screen, all skippable.
//
// Mirrors src/components/auth/AuthScreen.tsx: the same two-column shell (an
// animated left rail, a form on the right), the same fieldClass/fieldStyle
// input treatment, the same font-display headings over font-mono labels —
// so signup and onboarding read as one continuous product rather than two
// different apps stitched together.
//
// What this screen must never do: recommend, suggest, or rank a compound.
// Step 3 asks what the user already takes — a fact-gathering question, not a
// clinical one. Nothing here proposes a stack. That distinction is a legal
// line (CLAUDE.md §16.9), not a style preference.

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Loader2, Search, X } from 'lucide-react'
import { CATEGORY_BY_ID, COMPOUND_LIST, type Compound } from '@/lib/catalog'
import { completeOnboarding, type ExperienceLevel, type OnboardingCompoundInput } from './actions'

const DISCLAIMER =
  'EDUCATIONAL REFERENCE ONLY · CORTEX DESCRIBES HOW COMPOUNDS ARE STUDIED · IT DOES NOT DIAGNOSE, TREAT OR PRESCRIBE.'

const SORTED_COMPOUNDS: Compound[] = [...COMPOUND_LIST].sort((a, b) => a.name.localeCompare(b.name))

const TOTAL_STEPS = 4

interface ExperienceOption {
  value: ExperienceLevel
  label: string
  body: string
}

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  {
    value: 'new',
    label: 'NEW TO THIS',
    body: "Never run a compound, or just getting oriented. Explain things plainly and don't assume I know the shorthand.",
  },
  {
    value: 'some',
    label: 'SOME EXPERIENCE',
    body: "I've used one or two things before. I know the basics — dosing, timing — but not every detail.",
  },
  {
    value: 'experienced',
    label: 'EXPERIENCED',
    body: 'I run stacks regularly and know my way around dosing, cycling and interactions. Skip the primer.',
  },
]

interface StepCopy {
  title: string
  body: string
  meta: string
}

const STEP_COPY: Record<number, StepCopy> = {
  1: {
    title: 'Before the field fills in.',
    body: 'A few quick questions, all skippable. They just help me narrate your stack instead of a stranger’s.',
    meta: 'STEP 1 OF 4 · YOUR NAME',
  },
  2: {
    title: 'How much do you already know?',
    body: 'This only changes how much I explain — never what I show you. Nothing on the Mirror is gated behind it.',
    meta: 'STEP 2 OF 4 · EXPERIENCE',
  },
  3: {
    title: 'What are you already running?',
    body: 'Search all 58 compounds in the library. Pick what you have on hand right now — or nothing, if you’re here to browse first.',
    meta: 'STEP 3 OF 4 · CURRENT STACK',
  },
  4: {
    title: 'Make the numbers mean something.',
    body: 'Dose, vial size, what’s left — these are what let the field tell you when something is running low. Skip any field you don’t know yet.',
    meta: 'STEP 4 OF 4 · SUPPLY DETAILS',
  },
}

interface CompoundDraft {
  doseMcg: string
  vialSizeMg: string
  remainingMg: string
}

const EMPTY_DRAFT: CompoundDraft = { doseMcg: '', vialSizeMg: '', remainingMg: '' }

function parsePositive(raw: string): number | undefined {
  if (!raw.trim()) return undefined
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function parseNonNegative(raw: string): number | undefined {
  if (!raw.trim()) return undefined
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

const fieldClass =
  'flex min-h-[52px] w-full items-center border border-hair px-[15px] text-base text-ink placeholder:text-faint outline-none transition-colors focus:border-accent'
const fieldStyle = { backgroundColor: 'color-mix(in srgb, var(--ink) 2%, transparent)' }

export interface WelcomeClientProps {
  initialDisplayName: string
}

export default function WelcomeClient({ initialDisplayName }: WelcomeClientProps) {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [experience, setExperience] = useState<ExperienceLevel | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Record<string, CompoundDraft>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const filteredCompounds = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SORTED_COMPOUNDS
    return SORTED_COMPOUNDS.filter((c) => {
      const goal = CATEGORY_BY_ID[c.catId]?.label ?? ''
      return (
        c.name.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        goal.toLowerCase().includes(q)
      )
    })
  }, [query])

  const selectedCompounds = useMemo(
    () => selected.map((id) => COMPOUND_LIST.find((c) => c.id === id)).filter((c): c is Compound => !!c),
    [selected],
  )

  function toggleCompound(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function updateDraft(id: string, field: keyof CompoundDraft, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_DRAFT), [field]: value } }))
  }

  function buildCompoundInputs(): OnboardingCompoundInput[] {
    return selected.map((compoundId) => {
      const draft = drafts[compoundId] ?? EMPTY_DRAFT
      return {
        compoundId,
        doseMcg: parsePositive(draft.doseMcg),
        vialSizeMg: parsePositive(draft.vialSizeMg),
        remainingMg: parseNonNegative(draft.remainingMg),
      }
    })
  }

  async function submit(compounds: OnboardingCompoundInput[]) {
    setLoading(true)
    setError('')
    const result = await completeOnboarding({
      displayName: displayName.trim() || undefined,
      experienceLevel: experience,
      compounds,
    })
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong. Try again.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  function handleSkip() {
    void submit([])
  }

  function handleStep1Submit(e: FormEvent) {
    e.preventDefault()
    setStep(2)
  }

  function handleStep3Continue() {
    if (selected.length === 0) {
      void submit([])
      return
    }
    setStep(4)
  }

  function handleFinish() {
    void submit(buildCompoundInputs())
  }

  const copy = STEP_COPY[step]!

  return (
    <div className="cx-surface flex min-h-screen flex-wrap bg-ground text-ink font-sans">
      {/* LEFT — narration rail */}
      <div className="relative flex min-h-[260px] flex-1 basis-[420px] flex-col justify-between gap-10 overflow-hidden px-[30px] pb-[34px] pt-[26px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 56% 58% at 46% 44%, var(--glowA), transparent 70%), radial-gradient(ellipse 40% 44% at 34% 34%, var(--glowB), transparent 68%), radial-gradient(ellipse 22% 26% at 66% 64%, var(--glowC), transparent 66%)',
            animation: 'cxbreathe 11s ease-in-out infinite',
          }}
        />

        <Link href="/" className="relative z-[2] flex min-h-[44px] items-center gap-[11px] self-start">
          <span
            aria-hidden
            className="h-[7px] w-[7px] rounded-full bg-accent"
            style={{ boxShadow: '0 0 12px var(--accent)', animation: 'cxpulse 2.4s infinite' }}
          />
          <span className="font-mono text-xs tracking-[0.32em] text-ink">PEPTIDE CORTEX</span>
        </Link>

        <div className="relative z-[2] flex max-w-[420px] flex-col gap-[14px]" key={step} style={{ animation: 'cxup 420ms cubic-bezier(.2,.7,.2,1) both' }}>
          <span className="font-mono text-[9.5px] tracking-[0.28em] text-accent">{copy.meta}</span>
          <span className="font-display font-light leading-[1.2]" style={{ fontSize: 'clamp(26px,3.2vw,38px)' }}>
            {copy.title}
          </span>
          <span className="text-[15px] leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
            {copy.body}
          </span>
        </div>

        <div className="relative z-[2] flex flex-col gap-3">
          <div className="flex gap-[6px]">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
              <span key={n} className="h-[3px] flex-1" style={{ backgroundColor: n <= step ? 'var(--accent)' : 'var(--hair)' }} />
            ))}
          </div>
          <span className="font-mono text-[10px] leading-[1.9] tracking-[0.1em] text-faint">
            ADULTS 18+ · EDUCATIONAL RESEARCH REFERENCE
          </span>
        </div>
      </div>

      {/* RIGHT — step content */}
      <div className="flex flex-1 basis-[460px] min-w-[320px] items-center justify-center border-l border-hair px-[26px] py-10">
        <div className="flex w-full max-w-[440px] flex-col gap-[22px]" style={{ animation: 'cxup 460ms cubic-bezier(.2,.7,.2,1) both' }} key={step}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.2em] text-faint">STEP {step} OF {TOTAL_STEPS}</span>
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="flex min-h-[44px] items-center font-mono text-[10px] tracking-[0.14em] text-faint transition-colors hover:text-ink disabled:opacity-50"
            >
              SKIP FOR NOW →
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex flex-col gap-1 border-l-2 border-gold px-[15px] py-[13px]"
              style={{ backgroundColor: 'color-mix(in srgb, var(--gold) 7%, transparent)' }}
            >
              <span className="font-mono text-[9.5px] tracking-[0.18em] text-gold">CHECK THIS</span>
              <span className="text-sm leading-[1.6] text-ink">{error}</span>
            </div>
          )}

          {step === 1 && (
            <Step1
              displayName={displayName}
              setDisplayName={setDisplayName}
              onSubmit={handleStep1Submit}
            />
          )}

          {step === 2 && (
            <Step2
              experience={experience}
              setExperience={setExperience}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <Step3
              query={query}
              setQuery={setQuery}
              compounds={filteredCompounds}
              selectedSet={selectedSet}
              onToggle={toggleCompound}
              onBack={() => setStep(2)}
              onContinue={handleStep3Continue}
            />
          )}

          {step === 4 && (
            <Step4
              compounds={selectedCompounds}
              drafts={drafts}
              onChange={updateDraft}
              loading={loading}
              onBack={() => setStep(3)}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 1 — name ────────────────────────────────────────────────────────

function Step1({
  displayName,
  setDisplayName,
  onSubmit,
}: {
  displayName: string
  setDisplayName: (v: string) => void
  onSubmit: (e: FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-[9px]">
        <span className="font-display text-[32px] font-light leading-[1.1]">What should we call you?</span>
        <span className="text-[15px] leading-[1.75] text-dim" style={{ textWrap: 'pretty' }}>
          Optional. It shows up in Cortex&rsquo;s narration instead of nothing.
        </span>
      </div>

      <label className="flex flex-col gap-[7px]">
        <span className="font-mono text-[9.5px] tracking-[0.22em] text-faint">FIRST NAME OR HANDLE</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          type="text"
          autoComplete="given-name"
          maxLength={80}
          placeholder="e.g. Alex"
          autoFocus
          className={fieldClass}
          style={fieldStyle}
        />
      </label>

      <button
        type="submit"
        className="mt-1 flex min-h-[52px] items-center justify-center gap-2 bg-accent font-mono text-[11px] uppercase tracking-[0.18em] text-ground"
      >
        CONTINUE →
      </button>
    </form>
  )
}

// ── Step 2 — experience ─────────────────────────────────────────────────

function Step2({
  experience,
  setExperience,
  onBack,
  onNext,
}: {
  experience: ExperienceLevel | null
  setExperience: (v: ExperienceLevel) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[9px]">
        <span className="font-display text-[32px] font-light leading-[1.1]">
          How much experience do you have with peptides?
        </span>
        <span className="text-[15px] leading-[1.75] text-dim" style={{ textWrap: 'pretty' }}>
          Optional. Pick whichever is honest, not aspirational.
        </span>
      </div>

      <div className="flex flex-col gap-px bg-hair">
        {EXPERIENCE_OPTIONS.map((opt) => {
          const active = experience === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExperience(opt.value)}
              aria-pressed={active}
              className={`flex min-h-[44px] flex-col gap-[6px] px-[18px] py-[16px] text-left transition-colors ${
                active ? 'bg-panelHi' : 'bg-panel hover:bg-panelHi'
              }`}
            >
              <span className="flex items-center gap-[10px]">
                <span
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center border"
                  style={{ borderColor: active ? 'var(--accent)' : 'var(--hair)' }}
                >
                  {active && <span className="h-2 w-2 bg-accent" />}
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.16em] text-ink">{opt.label}</span>
              </span>
              <span className="pl-[26px] text-[13.5px] leading-[1.65] text-dim">{opt.body}</span>
            </button>
          )
        })}
      </div>

      <StepNav onBack={onBack} onNext={onNext} nextLabel="CONTINUE →" />
    </div>
  )
}

// ── Step 3 — searchable multi-select ────────────────────────────────────

function Step3({
  query,
  setQuery,
  compounds,
  selectedSet,
  onToggle,
  onBack,
  onContinue,
}: {
  query: string
  setQuery: (v: string) => void
  compounds: Compound[]
  selectedSet: Set<string>
  onToggle: (id: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[9px]">
        <span className="font-display text-[32px] font-light leading-[1.1]">
          Are you taking anything right now?
        </span>
        <span className="text-[15px] leading-[1.75] text-dim" style={{ textWrap: 'pretty' }}>
          Search the library and select what applies. Selecting nothing is fine — you can add compounds
          from the Mirror any time.
        </span>
      </div>

      <div className="relative flex items-center">
        <Search size={16} className="pointer-events-none absolute left-[15px] text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Search 58 compounds…"
          className={`${fieldClass} pl-[42px]`}
          style={fieldStyle}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute bottom-0 right-0 top-0 flex w-12 items-center justify-center text-faint transition-colors hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <span className="font-mono text-[9.5px] tracking-[0.16em] text-faint">
        {selectedSet.size} SELECTED · {compounds.length} SHOWN
      </span>

      <div className="flex max-h-[300px] flex-col gap-px overflow-y-auto bg-hair" style={{ scrollbarWidth: 'thin' }}>
        {compounds.map((c) => {
          const active = selectedSet.has(c.id)
          const goal = CATEGORY_BY_ID[c.catId]?.label ?? ''
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              aria-pressed={active}
              className={`flex min-h-[44px] items-center gap-3 px-4 py-[12px] text-left transition-colors ${
                active ? 'bg-panelHi' : 'bg-panel hover:bg-panelHi'
              }`}
            >
              <span
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center border"
                style={{ borderColor: active ? 'var(--accent)' : 'var(--hair)' }}
              >
                {active && <Check size={11} className="text-accent" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{c.name}</span>
              <span className="whitespace-nowrap font-mono text-[9px] tracking-[0.1em] text-faint">{goal}</span>
            </button>
          )
        })}
        {compounds.length === 0 && (
          <div className="bg-panel px-4 py-[15px] text-[13px] text-faint">Nothing matches &ldquo;{query}&rdquo;.</div>
        )}
      </div>

      <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">{DISCLAIMER}</p>

      <StepNav onBack={onBack} onNext={onContinue} nextLabel={selectedSet.size ? 'CONTINUE →' : 'CONTINUE WITHOUT ADDING ANYTHING →'} />
    </div>
  )
}

// ── Step 4 — dose / vial / remaining ────────────────────────────────────

function Step4({
  compounds,
  drafts,
  onChange,
  loading,
  onBack,
  onFinish,
}: {
  compounds: Compound[]
  drafts: Record<string, CompoundDraft>
  onChange: (id: string, field: keyof CompoundDraft, value: string) => void
  loading: boolean
  onBack: () => void
  onFinish: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[9px]">
        <span className="font-display text-[32px] font-light leading-[1.1]">A few numbers, if you have them.</span>
        <span className="text-[15px] leading-[1.75] text-dim" style={{ textWrap: 'pretty' }}>
          Dose, vial size and what&rsquo;s left are what let the Mirror tell you when supply is running out.
          Every field is optional — leave any of them blank and that math just stays off until you fill it in later.
        </span>
      </div>

      <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
        {compounds.map((c) => {
          const d = drafts[c.id] ?? EMPTY_DRAFT
          return (
            <div key={c.id} className="flex flex-col gap-3 border border-hair p-[16px]">
              <span className="text-[15px] text-ink">{c.name}</span>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-[6px]">
                  <span className="font-mono text-[8.5px] tracking-[0.14em] text-faint">DOSE (MCG)</span>
                  <input
                    value={d.doseMcg}
                    onChange={(e) => onChange(c.id, 'doseMcg', e.target.value)}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    placeholder="—"
                    className="flex min-h-[44px] w-full items-center border border-hair px-[10px] font-mono text-[13px] text-ink placeholder:text-faint outline-none focus:border-accent"
                    style={fieldStyle}
                  />
                </label>
                <label className="flex flex-col gap-[6px]">
                  <span className="font-mono text-[8.5px] tracking-[0.14em] text-faint">VIAL SIZE (MG)</span>
                  <input
                    value={d.vialSizeMg}
                    onChange={(e) => onChange(c.id, 'vialSizeMg', e.target.value)}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    placeholder="—"
                    className="flex min-h-[44px] w-full items-center border border-hair px-[10px] font-mono text-[13px] text-ink placeholder:text-faint outline-none focus:border-accent"
                    style={fieldStyle}
                  />
                </label>
                <label className="flex flex-col gap-[6px]">
                  <span className="font-mono text-[8.5px] tracking-[0.14em] text-faint">LEFT (MG)</span>
                  <input
                    value={d.remainingMg}
                    onChange={(e) => onChange(c.id, 'remainingMg', e.target.value)}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    placeholder="—"
                    className="flex min-h-[44px] w-full items-center border border-hair px-[10px] font-mono text-[13px] text-ink placeholder:text-faint outline-none focus:border-accent"
                    style={fieldStyle}
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>

      <p className="font-mono text-[10px] leading-[1.9] tracking-[0.06em] text-faint">{DISCLAIMER}</p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex min-h-[52px] flex-1 items-center justify-center border border-hair font-mono text-[10px] tracking-[0.16em] text-dim transition-colors hover:border-accent hover:text-ink disabled:opacity-50"
        >
          ← BACK
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={loading}
          className="flex min-h-[52px] flex-[2] items-center justify-center gap-2 bg-accent font-mono text-[11px] uppercase tracking-[0.18em] text-ground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> SETTING UP…
            </>
          ) : (
            'ENTER THE MIRROR →'
          )}
        </button>
      </div>
    </div>
  )
}

// ── shared nav row ───────────────────────────────────────────────────────

function StepNav({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-[52px] flex-1 items-center justify-center border border-hair font-mono text-[10px] tracking-[0.16em] text-dim transition-colors hover:border-accent hover:text-ink"
      >
        ← BACK
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex min-h-[52px] flex-[2] items-center justify-center gap-2 bg-accent font-mono text-[11px] uppercase tracking-[0.18em] text-ground"
      >
        {nextLabel}
      </button>
    </div>
  )
}
