'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Ports `design_handoff_peptide_cortex/Peptide Cortex Auth.dc.html`.
// Field list, validation rules and copy are reconciled field-for-field against
// the routes this replaces (see that bundle's README, "2. Auth"):
//   src/app/login/page.tsx  — email + password, signInWithPassword → /dashboard
//   src/app/signup/page.tsx — email + dob + password + confirm, 18+ gate,
//                             password >= 6, signUp({options:{data:{dob}}}),
//                             then a "check your email" state (does not log in).
// No OAuth, no AI-consent checkbox — both deliberate (see handoff README).

const MIN_AGE_YEARS = 18
const MIN_PASSWORD = 6

function computeAgeYears(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob + 'T00:00:00')
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let years = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years -= 1
  return years
}

function getMaxDob(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS)
  return d.toISOString().slice(0, 10)
}

interface AuthScreenProps {
  mode: 'login' | 'signup'
}

export default function AuthScreen({ mode: initialMode }: AuthScreenProps) {
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [dob, setDob] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const isLogin = mode === 'login'
  const isSignup = !isLogin

  function showLogin() {
    setMode('login')
    setError('')
    setSent(false)
  }

  function showSignup() {
    setMode('signup')
    setError('')
    setSent(false)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (isSignup) {
      if (password !== confirm) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < MIN_PASSWORD) {
        setError(`Password must be at least ${MIN_PASSWORD} characters.`)
        return
      }
      const age = computeAgeYears(dob)
      if (age === null) {
        setError('Please enter your date of birth.')
        return
      }
      if (age < MIN_AGE_YEARS) {
        setError(`You must be ${MIN_AGE_YEARS} or older to create an account.`)
        return
      }
    }

    setLoading(true)
    const supabase = createClient()

    if (isSignup) {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { dob },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      setSent(true)
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const heading = isLogin ? 'Welcome back.' : 'Create your field.'
  const subheading = isLogin
    ? 'Your form is where you left it — same regions, same tension, updated against anything logged since.'
    : 'Email, date of birth, password. Your stack becomes a surface you can read at a glance.'
  const submitLabel = isLogin ? 'SIGN IN TO CORTEX →' : 'CREATE ACCOUNT →'
  const submitLoadingLabel = isLogin ? 'SIGNING IN…' : 'CREATING ACCOUNT…'
  const asideTitle = isLogin
    ? 'Your field has been holding without you.'
    : 'Nothing to configure. It assembles itself.'
  const asideBody = isLogin
    ? 'Cortex keeps reading while you are away — new evidence strengthens an edge, a vial runs down, a marker drifts. It will tell you what changed in one sentence.'
    : 'Add what you take. The regions form, the edges draw themselves from the reference library, and anything running low starts pulling against the rest.'
  const asideMeta = isLogin ? 'RESEARCH USE ONLY · NOT MEDICAL ADVICE' : '58 COMPOUNDS · 12 REGIONS · ADULTS 18+'
  const footNote = isLogin
    ? 'ROW-LEVEL ISOLATION PER ACCOUNT · YOUR DATA IS NEVER SOLD OR TRAINED ON'
    : 'ADULTS 18+ · EDUCATIONAL RESEARCH REFERENCE · CORTEX DOES NOT DIAGNOSE, TREAT OR PRESCRIBE'

  const fieldClass =
    'flex min-h-[52px] w-full items-center border border-hair px-[15px] text-base text-ink placeholder:text-faint outline-none transition-colors focus:border-accent'
  const fieldStyle = { backgroundColor: 'color-mix(in srgb, var(--ink) 2%, transparent)' }

  return (
    <div className="cx-surface flex min-h-screen flex-wrap bg-ground text-ink font-sans">
      {/* LEFT — animated field panel */}
      <div className="relative flex min-h-[320px] flex-1 basis-[460px] flex-col justify-between gap-10 overflow-hidden px-[30px] pb-[34px] pt-[26px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 56% 58% at 46% 44%, var(--glowA), transparent 70%), radial-gradient(ellipse 40% 44% at 34% 34%, var(--glowB), transparent 68%), radial-gradient(ellipse 22% 26% at 66% 64%, var(--glowC), transparent 66%)',
            animation: 'cxbreathe 11s ease-in-out infinite',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(var(--dotB) 0.9px, transparent 1.1px)',
            backgroundSize: '7px 7px',
            opacity: 0.44,
            animation: 'cxdriftA 26s linear infinite alternate',
            WebkitMaskImage:
              'radial-gradient(ellipse 40% 44% at 36% 36%, #000 12%, rgba(0,0,0,0.5) 45%, transparent 78%)',
            maskImage:
              'radial-gradient(ellipse 40% 44% at 36% 36%, #000 12%, rgba(0,0,0,0.5) 45%, transparent 78%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(var(--dotA) 0.9px, transparent 1.1px)',
            backgroundSize: '9px 9px',
            opacity: 0.4,
            animation: 'cxdriftB 34s linear infinite alternate',
            WebkitMaskImage:
              'radial-gradient(ellipse 48% 52% at 54% 50%, #000 8%, rgba(0,0,0,0.45) 42%, transparent 76%)',
            maskImage:
              'radial-gradient(ellipse 48% 52% at 54% 50%, #000 8%, rgba(0,0,0,0.45) 42%, transparent 76%)',
          }}
        />

        <svg
          viewBox="0 0 600 520"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <line x1={210} y1={210} x2={330} y2={265} className="stroke-hue-cy" strokeWidth={2} strokeOpacity={0.5} />
          <line
            x1={330}
            y1={265}
            x2={390}
            y2={370}
            className="stroke-hue-go"
            strokeWidth={1.8}
            strokeOpacity={0.5}
            strokeDasharray="8 7"
            style={{ animation: 'cxmarch 1.5s linear infinite' }}
          />
          <line x1={210} y1={210} x2={270} y2={370} className="stroke-dim" strokeWidth={1.2} strokeOpacity={0.22} />
          <circle cx={210} cy={210} r={30} className="fill-hue-cy stroke-hue-cy" fillOpacity={0.1} strokeWidth={1.5} />
          <circle cx={210} cy={210} r={41} fill="none" className="stroke-hue-cy" strokeOpacity={0.18} />
          <circle cx={330} cy={265} r={23} className="fill-accent stroke-accent" fillOpacity={0.12} strokeWidth={1.5} />
          <circle cx={390} cy={370} r={19} className="fill-hue-go stroke-hue-go" fillOpacity={0.1} strokeWidth={1.5} />
          <circle
            cx={390}
            cy={370}
            r={29}
            fill="none"
            className="stroke-hue-go"
            strokeOpacity={0.42}
            strokeDasharray="8 7"
            style={{ animation: 'cxmarch 1.5s linear infinite' }}
          />
          <circle
            cx={270}
            cy={370}
            r={16}
            className="fill-hue-gr stroke-hue-gr"
            fillOpacity={0.12}
            strokeOpacity={0.7}
            strokeWidth={1.3}
          />
        </svg>

        <Link href="/" className="relative z-[2] flex min-h-[44px] items-center gap-[11px] self-start">
          <span
            aria-hidden
            className="h-[7px] w-[7px] rounded-full bg-accent"
            style={{ boxShadow: '0 0 12px var(--accent)', animation: 'cxpulse 2.4s infinite' }}
          />
          <span className="font-mono text-xs tracking-[0.32em] text-ink">PEPTIDE CORTEX</span>
        </Link>

        <div className="relative z-[2] flex max-w-[420px] flex-col gap-[14px]">
          <span
            className="font-display font-light leading-[1.2]"
            style={{ fontSize: 'clamp(28px,3.4vw,40px)' }}
          >
            {asideTitle}
          </span>
          <span className="text-[15px] leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
            {asideBody}
          </span>
          <span className="font-mono text-[10px] leading-[1.9] tracking-[0.1em] text-faint">{asideMeta}</span>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex flex-1 basis-[460px] min-w-[320px] items-center justify-center border-l border-hair px-[26px] py-10">
        {sent ? (
          <div
            className="flex w-full max-w-[420px] flex-col gap-5"
            style={{ animation: 'cxup 460ms cubic-bezier(.2,.7,.2,1) both' }}
          >
            <span className="flex h-[52px] w-[52px] items-center justify-center border border-hue-cy">
              <Mail size={22} strokeWidth={1.8} className="text-hue-cy" />
            </span>
            <span className="font-display text-[38px] font-light leading-[1.1]">Check your email.</span>
            <span className="text-[15px] leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
              We sent a confirmation link to <span className="text-hue-cy">{email}</span>. Click it to activate
              your account — your field is waiting on the other side.
            </span>
            <button
              type="button"
              onClick={showLogin}
              className="flex min-h-[52px] items-center justify-center border border-hair font-mono text-[10px] tracking-[0.16em] text-dim transition-colors hover:border-accent hover:text-ink"
            >
              BACK TO SIGN IN
            </button>
          </div>
        ) : (
          <div
            className="flex w-full max-w-[420px] flex-col gap-[22px]"
            style={{ animation: 'cxup 460ms cubic-bezier(.2,.7,.2,1) both' }}
          >
            <div className="flex gap-px bg-hair">
              <button
                type="button"
                onClick={showLogin}
                className={`flex min-h-[44px] flex-1 items-center justify-center font-mono text-[10px] tracking-[0.16em] ${
                  isLogin ? 'bg-ink text-ground' : 'bg-panel text-dim'
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={showSignup}
                className={`flex min-h-[44px] flex-1 items-center justify-center font-mono text-[10px] tracking-[0.16em] ${
                  isSignup ? 'bg-ink text-ground' : 'bg-panel text-dim'
                }`}
              >
                CREATE ACCOUNT
              </button>
            </div>

            <div className="flex flex-col gap-[9px]">
              <span className="font-display text-[38px] font-light leading-[1.1]">{heading}</span>
              <span className="text-[15px] leading-[1.75] text-dim" style={{ textWrap: 'pretty' }}>
                {subheading}
              </span>
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-[7px]">
                <span className="font-mono text-[9.5px] tracking-[0.22em] text-faint">EMAIL ADDRESS</span>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className={fieldClass}
                  style={fieldStyle}
                />
              </label>

              {isSignup && (
                <label className="flex flex-col gap-[7px]">
                  <span className="font-mono text-[9.5px] tracking-[0.22em] text-faint">DATE OF BIRTH</span>
                  <input
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value)
                      setError('')
                    }}
                    type="date"
                    max={getMaxDob()}
                    autoComplete="bday"
                    required
                    className={fieldClass}
                    style={fieldStyle}
                  />
                  <span className="text-[13px] leading-[1.7] text-faint">You must be 18 or older.</span>
                </label>
              )}

              <label className="flex flex-col gap-[7px]">
                <span className="font-mono text-[9.5px] tracking-[0.22em] text-faint">PASSWORD</span>
                <div className="relative flex items-center">
                  <input
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    type={showPw ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder={isLogin ? '••••••••' : `Min. ${MIN_PASSWORD} characters`}
                    required
                    className={`${fieldClass} pr-[52px]`}
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute bottom-0 right-0 top-0 flex w-12 items-center justify-center text-faint transition-colors hover:text-ink"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {isSignup && (
                <label className="flex flex-col gap-[7px]">
                  <span className="font-mono text-[9.5px] tracking-[0.22em] text-faint">CONFIRM PASSWORD</span>
                  <div className="relative flex items-center">
                    <input
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value)
                        setError('')
                      }}
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      required
                      className={`${fieldClass} pr-[52px]`}
                      style={fieldStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute bottom-0 right-0 top-0 flex w-12 items-center justify-center text-faint transition-colors hover:text-ink"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex min-h-[52px] items-center justify-center gap-2 bg-accent font-mono text-[11px] uppercase tracking-[0.18em] text-ground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {submitLoadingLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </button>
            </form>

            {isSignup && (
              <span className="text-[13px] leading-[1.75] text-faint" style={{ textWrap: 'pretty' }}>
                By creating an account you agree to our{' '}
                <Link href="/terms" className="text-accent hover:text-hue-cy">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-accent hover:text-hue-cy">
                  Privacy Policy
                </Link>
                .
              </span>
            )}

            {isLogin ? (
              <button
                type="button"
                onClick={showSignup}
                className="flex min-h-[44px] items-center font-mono text-[10px] tracking-[0.14em] text-faint transition-colors hover:text-ink"
              >
                NO ACCOUNT? CREATE ONE →
              </button>
            ) : (
              <button
                type="button"
                onClick={showLogin}
                className="flex min-h-[44px] items-center font-mono text-[10px] tracking-[0.14em] text-faint transition-colors hover:text-ink"
              >
                ALREADY HAVE AN ACCOUNT? SIGN IN →
              </button>
            )}

            <span className="font-mono text-[10px] leading-[1.9] tracking-[0.08em] text-faint" style={{ textWrap: 'pretty' }}>
              {footNote}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
