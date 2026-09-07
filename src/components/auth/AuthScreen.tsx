'use client'

// Auth: one screen, three modes.
//
// Rebuilt from design_handoff_peptide_cortex_site/Auth.dc.html (V3). Replaces
// the dark v4 screen, which no longer matched anything around it and still
// advertised "58 COMPOUNDS" — a number that has been 124 for some time.
//
// ── Date of birth is three fields, not a picker ───────────────────────────
//
// CLAUDE.md §16.10 settled this: collect a real date, not a self-attested
// checkbox. Three numeric inputs beat <input type="date"> here because a native
// picker opening on the current month makes a 1994 birthday a long scroll, and
// because the mobile keyboards differ wildly. Digits only, stripped as they are
// typed rather than rejected afterwards.
//
// The gate refuses at signup, the handle_new_user trigger refuses in SQL, and
// src/lib/shop/orders/age.ts refuses again at checkout. Three, because the first
// is client-side and the last one decides whether to take money.
//
// ── Routes ────────────────────────────────────────────────────────────────
//
// The design's route map sends "reset" to /reset-password, but that route is
// already where the recovery email lands and where a new password is set. The
// request form lives at /forgot-password instead, so one URL is not two forms
// depending on session state.
//
// ── Return-to ─────────────────────────────────────────────────────────────
//
// Every gate in the app passes the page it refused as `?next=`, and this
// screen sends the new session back there. The value is validated by
// src/lib/auth/next.ts before it gets here — the page reads it from the URL,
// so an absolute URL would otherwise make the login form an open redirect.
// The tabs carry it too, so switching from "Sign in" to "Create account" does
// not lose the product someone was looking at.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LEGAL_FOOTER } from '@/components/legal/LegalPage'
import { MIN_AGE_YEARS, MIN_PASSWORD, ageFrom, isoDob } from '@/lib/age'
import { DEFAULT_NEXT, withNext } from '@/lib/auth/next'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const TEAL = '#1A8A9E'
const RULE = '1px solid #1A1D1F'
const FIELD = '1px solid rgba(26,29,31,.45)'
const JOST = 'Jost, sans-serif'
const MONO = "'JetBrains Mono', monospace"

export type AuthMode = 'signup' | 'login' | 'reset'

const TABS: Array<[AuthMode, string, string]> = [
  ['signup', 'Create account', '/signup'],
  ['login', 'Sign in', '/login'],
  ['reset', 'Reset password', '/forgot-password'],
]

const REASONS: Array<[string, string]> = [
  [
    'Recall',
    'Orders are tied to a lot code. If a batch is ever recalled, we can reach exactly the people who hold it.',
  ],
  [
    'Age',
    'Date of birth is a real field, not a checkbox. Under-18 is refused at signup and again at the sale.',
  ],
  [
    'The bench',
    'Vials, log and notes persist across your phone and desktop. Reading never needs this.',
  ],
]

const COPY: Record<AuthMode, { title: string; lede: string; cta: string }> = {
  signup: {
    title: 'An account, so a bench and an order have somewhere to live.',
    lede: 'Email, a password, and your date of birth. The date is stored: we sell to adults only and check it twice — here and again at checkout.',
    cta: 'Create account',
  },
  login: {
    title: 'Back to the bench.',
    lede: 'Your library notes, your bench and your orders are where you left them.',
    cta: 'Sign in',
  },
  reset: {
    title: 'Reset your password.',
    lede: 'Enter the email on the account and we will send a one-hour link.',
    cta: 'Send reset link',
  },
}

export default function AuthScreen({ mode, next = DEFAULT_NEXT }: { mode: AuthMode; next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState({ m: '', d: '', y: '' })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSignup = mode === 'signup'
  const isLogin = mode === 'login'
  const isReset = mode === 'reset'

  const age = useMemo(() => ageFrom(dob.m, dob.d, dob.y), [dob])
  const under = age !== null && age < MIN_AGE_YEARS
  const emailOk = /.+@.+\..+/.test(email)
  const passwordOk = isSignup ? password.length >= MIN_PASSWORD : password.length > 0

  const notReady =
    busy ||
    !emailOk ||
    (isSignup && (!passwordOk || age === null || under)) ||
    (isLogin && !passwordOk)

  const digits = (key: 'm' | 'd' | 'y', max: number) => (value: string) =>
    setDob((current) => ({ ...current, [key]: value.replace(/\D/g, '').slice(0, max) }))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (notReady) return
    setBusy(true)
    setError(null)
    const supabase = createClient()

    if (isReset) {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      // Deliberately not branching on the result. Telling an anonymous visitor
      // which addresses have accounts turns this form into an account oracle.
      setSent(true)
      setBusy(false)
      return
    }

    if (isSignup) {
      const { data, error: failed } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Read by handle_new_user, which refuses under-18 in SQL as well.
          // See supabase/profile_dob_migration.sql.
          data: { dob: isoDob(dob.m, dob.d, dob.y) },
          emailRedirectTo: `${window.location.origin}${next}`,
        },
      })
      if (failed) {
        setError(failed.message)
        setBusy(false)
        return
      }
      // A session comes back only while email confirmation is off, which is the
      // project's current setting. Branch on what the server actually returned,
      // so this stays correct if that is switched on later.
      if (data.session) {
        router.push(next)
        router.refresh()
        return
      }
      setSent(true)
      setBusy(false)
      return
    }

    const { error: failed } = await supabase.auth.signInWithPassword({ email, password })
    if (failed) {
      setError(failed.message)
      setBusy(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  const dobNote = under
    ? 'Peptide Cortex is for adults. Accounts cannot be created under 18.'
    : age !== null
      ? 'Stored with the account. Checked again at checkout.'
      : 'Required. Month, day, year.'

  const ctaNote = isSignup
    ? under
      ? 'Nothing was created.'
      : 'Free. Reading stays free after.'
    : isLogin
      ? 'No account yet? Create one above.'
      : ''

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#E6E9EB',
        color: INK,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      <header style={{ borderBottom: RULE }}>
        <div
          style={{
            padding: '14px clamp(16px,3vw,32px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px,2vw,28px)',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              whiteSpace: 'nowrap',
              color: INK,
              textDecoration: 'none',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL }} />
            <span style={{ fontWeight: 500, fontSize: 15, letterSpacing: '.22em' }}>
              PEPTIDE CORTEX
            </span>
          </Link>
          <nav
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(12px,2vw,24px)',
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
            }}
          >
            <Link href="/reference" style={{ color: INK, textDecoration: 'none' }}>
              Library
            </Link>
            <Link href="/shop" style={{ color: INK, textDecoration: 'none' }}>
              Shop
            </Link>
          </nav>
        </div>
      </header>

      <div className="auth-grid" style={{ flex: 1, display: 'grid' }}>
        <div
          className="auth-main"
          style={{ padding: 'clamp(28px,4vw,56px) clamp(16px,3vw,32px) 48px' }}
        >
          <div
            style={{
              display: 'flex',
              gap: 18,
              flexWrap: 'wrap',
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: INK3,
            }}
          >
            {TABS.map(([key, label, href]) => (
              <Link
                key={key}
                href={withNext(href, next)}
                style={{
                  color: key === mode ? INK : INK3,
                  borderBottom: `1px solid ${key === mode ? INK : 'transparent'}`,
                  paddingBottom: 3,
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          <h1
            style={{
              margin: '22px 0 0',
              fontWeight: 300,
              fontSize: 'clamp(34px,4.4vw,56px)',
              lineHeight: 1,
              letterSpacing: '-.028em',
              textWrap: 'pretty',
              maxWidth: '18ch',
            }}
          >
            {COPY[mode].title}
          </h1>
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 18,
              lineHeight: 1.45,
              color: INK2,
              maxWidth: '50ch',
              textWrap: 'pretty',
            }}
          >
            {COPY[mode].lede}
          </p>

          {sent ? (
            <div style={{ marginTop: 32, maxWidth: 460, borderTop: RULE, paddingTop: 16 }}>
              {isReset ? (
                <>
                  <p style={{ margin: 0, fontSize: 22, lineHeight: 1.3, textWrap: 'pretty' }}>
                    If an account exists for{' '}
                    <span style={{ fontFamily: MONO, fontSize: 17 }}>{email}</span>, a reset
                    link is on its way.
                  </p>
                  <p
                    style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.45, color: INK2 }}
                  >
                    Links expire after one hour. Nothing changes until you open one.
                  </p>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 22, lineHeight: 1.3, textWrap: 'pretty' }}>
                  Check <span style={{ fontFamily: MONO, fontSize: 17 }}>{email}</span> for a
                  confirmation link.
                </p>
              )}
              <Link
                href={withNext('/login', next)}
                style={{
                  display: 'inline-block',
                  marginTop: 14,
                  fontFamily: JOST,
                  fontSize: 10.5,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  borderBottom: RULE,
                  paddingBottom: 2,
                  color: INK,
                  textDecoration: 'none',
                }}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              onSubmit={submit}
              style={{
                marginTop: 32,
                maxWidth: 460,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Legend>Email</Legend>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@lab.example"
                  autoComplete="email"
                  style={{
                    height: 48,
                    padding: '0 12px',
                    border: FIELD,
                    background: '#F4F5F6',
                    fontSize: 18,
                    borderRadius: 0,
                    color: INK,
                  }}
                />
              </label>

              {!isReset && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Legend>Password</Legend>
                    {isLogin && (
                      <Link
                        href={withNext('/forgot-password', next)}
                        style={{
                          fontFamily: JOST,
                          fontSize: 10,
                          letterSpacing: '.22em',
                          textTransform: 'uppercase',
                          color: INK3,
                          textDecoration: 'none',
                        }}
                      >
                        Forgot it
                      </Link>
                    )}
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isSignup ? `at least ${MIN_PASSWORD} characters` : '••••••••••'
                    }
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    style={{
                      height: 48,
                      padding: '0 12px',
                      border: FIELD,
                      background: '#F4F5F6',
                      fontSize: 18,
                      fontFamily: MONO,
                      letterSpacing: '.1em',
                      borderRadius: 0,
                      color: INK,
                    }}
                  />
                </label>
              )}

              {isSignup && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Legend>Date of birth</Legend>
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 10 }}
                  >
                    <DateBox value={dob.m} onChange={digits('m', 2)} hint="MM" label="Month" />
                    <DateBox value={dob.d} onChange={digits('d', 2)} hint="DD" label="Day" />
                    <DateBox value={dob.y} onChange={digits('y', 4)} hint="YYYY" label="Year" />
                  </div>
                  <span
                    style={{
                      fontSize: 15,
                      lineHeight: 1.4,
                      // Refusal in full ink, the routine note in grey. No red
                      // anywhere: being under 18 is not an error state.
                      color: under ? INK : INK3,
                    }}
                  >
                    {dobNote}
                  </span>
                </div>
              )}

              {error && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: 1.4,
                    borderLeft: `2px solid ${INK}`,
                    paddingLeft: 12,
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginTop: 6,
                }}
              >
                <button
                  type="submit"
                  disabled={notReady}
                  style={{
                    appearance: 'none',
                    border: RULE,
                    background: INK,
                    color: '#F4F5F6',
                    fontFamily: JOST,
                    fontSize: 11,
                    letterSpacing: '.24em',
                    textTransform: 'uppercase',
                    padding: '14px 22px',
                    minHeight: 48,
                    borderRadius: 0,
                    cursor: notReady ? 'not-allowed' : 'pointer',
                    // Rendered, never removed. The reason sits beside it.
                    opacity: notReady ? 0.4 : 1,
                  }}
                >
                  {busy ? 'Working…' : COPY[mode].cta}
                </button>
                {ctaNote && (
                  <span style={{ fontSize: 15, fontStyle: 'italic', color: INK2 }}>
                    {ctaNote}
                  </span>
                )}
              </div>

              {isSignup && (
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 14.5,
                    lineHeight: 1.45,
                    color: INK3,
                    maxWidth: '46ch',
                  }}
                >
                  By continuing you accept the{' '}
                  <Link
                    href="/terms"
                    style={{
                      color: INK3,
                      borderBottom: '1px solid rgba(26,29,31,.35)',
                      textDecoration: 'none',
                    }}
                  >
                    terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    style={{
                      color: INK3,
                      borderBottom: '1px solid rgba(26,29,31,.35)',
                      textDecoration: 'none',
                    }}
                  >
                    privacy notice
                  </Link>
                  . Adults 18+. US only.
                </p>
              )}
            </form>
          )}
        </div>

        <aside
          style={{
            background: '#F4F5F6',
            padding: 'clamp(28px,4vw,56px) clamp(16px,3vw,32px)',
          }}
        >
          <div
            style={{
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: TEAL,
            }}
          >
            What an account is for
          </div>
          <div style={{ marginTop: 14, borderTop: RULE }}>
            {REASONS.map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,110px) minmax(0,1fr)',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(26,29,31,.16)',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: JOST,
                    fontSize: 10,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    color: INK3,
                  }}
                >
                  {key}
                </span>
                <span style={{ fontSize: 16, lineHeight: 1.45, minWidth: 0 }}>{value}</span>
              </div>
            ))}
          </div>
          <p
            style={{
              margin: '18px 0 0',
              fontSize: 16,
              lineHeight: 1.45,
              color: INK2,
              textWrap: 'pretty',
            }}
          >
            Reading the library needs no account. Keeping a bench, or buying, does.
          </p>
        </aside>
      </div>

      <footer
        style={{
          background: INK,
          color: '#C9CED2',
          padding: '14px clamp(16px,3vw,32px)',
          fontFamily: JOST,
          fontSize: 10,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          lineHeight: 1.8,
        }}
      >
        {LEGAL_FOOTER}
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `.auth-grid { grid-template-columns: minmax(0,1fr); }
          @media (min-width: 861px) {
            .auth-grid { grid-template-columns: minmax(0,1.4fr) minmax(300px,1fr); }
            .auth-main { border-right: ${RULE}; }
          }`,
        }}
      />
    </div>
  )
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: JOST,
        fontSize: 10,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        color: INK3,
      }}
    >
      {children}
    </span>
  )
}

function DateBox({
  value,
  onChange,
  hint,
  label,
}: {
  value: string
  onChange: (value: string) => void
  hint: string
  label: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={hint}
      aria-label={label}
      inputMode="numeric"
      autoComplete={
        label === 'Month' ? 'bday-month' : label === 'Day' ? 'bday-day' : 'bday-year'
      }
      style={{
        height: 48,
        padding: '0 12px',
        border: FIELD,
        background: '#F4F5F6',
        fontSize: 18,
        fontFamily: MONO,
        textAlign: 'center',
        borderRadius: 0,
        color: INK,
      }}
    />
  )
}
