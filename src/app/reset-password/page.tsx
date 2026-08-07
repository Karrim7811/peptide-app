'use client'

// Where the password-recovery email lands.
//
// Supabase puts the user into a temporary recovery session when they follow the
// link, so updateUser() is all that is needed — there is no token to handle by
// hand. If that session is missing the link was already used or has expired,
// and this says so rather than failing silently on submit.

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MIN_PASSWORD = 6

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    // The repo's own strings, matched to signup so the two forms agree.
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < MIN_PASSWORD) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }
    setDone(true)
    // The recovery session is a real session, so the user is now signed in.
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  const fieldClass =
    'flex min-h-[52px] w-full items-center border border-hair px-[15px] text-base text-ink placeholder:text-faint outline-none transition-colors focus:border-accent'
  const fieldStyle = { backgroundColor: 'color-mix(in srgb, var(--ink) 2%, transparent)' }

  return (
    <div className="cx-surface flex min-h-screen items-center justify-center bg-ground px-6 py-16 font-sans text-ink">
      <div className="flex w-full max-w-[440px] flex-col gap-[22px]">
        <span className="font-mono text-xs tracking-[0.32em] text-ink">PEPTIDE CORTEX</span>

        {ready === false ? (
          <>
            <span className="font-display text-[38px] font-light leading-[1.1]">
              That link has expired.
            </span>
            <span className="text-[15px] leading-[1.8] text-dim" style={{ textWrap: 'pretty' }}>
              Reset links are good for one hour and can only be used once. Ask for a new one and it
              will arrive in a moment.
            </span>
            <Link
              href="/login"
              className="flex min-h-[52px] items-center justify-center border border-hair font-mono text-[10px] tracking-[0.16em] text-dim transition-colors hover:border-accent hover:text-ink"
            >
              BACK TO SIGN IN
            </Link>
          </>
        ) : done ? (
          <>
            <span className="font-display text-[38px] font-light leading-[1.1]">
              Password changed.
            </span>
            <span className="text-[15px] leading-[1.8] text-dim">Taking you to your field…</span>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
            <div className="flex flex-col gap-[10px]">
              <span className="font-display text-[38px] font-light leading-[1.1]">
                Set a new password.
              </span>
              <span className="text-[15px] leading-[1.75] text-dim" style={{ textWrap: 'pretty' }}>
                Choose something you have not used here before.
              </span>
            </div>

            {error && (
              <div className="flex flex-col gap-[6px] border-l-2 border-gold bg-panelHot px-[18px] py-[15px]">
                <span className="font-mono text-[9.5px] tracking-[0.18em] text-gold">CHECK THIS</span>
                <span className="text-sm leading-[1.6] text-ink">{error}</span>
              </div>
            )}

            <label className="flex flex-col gap-[7px]">
              <span className="font-mono text-[9.5px] tracking-[0.22em] text-faint">
                NEW PASSWORD
              </span>
              <div className="relative flex items-center">
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={`Min. ${MIN_PASSWORD} characters`}
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

            <label className="flex flex-col gap-[7px]">
              <span className="font-mono text-[9.5px] tracking-[0.22em] text-faint">
                CONFIRM PASSWORD
              </span>
              <input
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  setError('')
                }}
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                required
                className={fieldClass}
                style={fieldStyle}
              />
            </label>

            <button
              type="submit"
              disabled={loading || ready === null}
              className="flex min-h-[52px] items-center justify-center gap-3 bg-accent font-mono text-[10px] tracking-[0.18em] text-ground transition-opacity disabled:opacity-50"
            >
              {loading ? 'SAVING…' : 'SET NEW PASSWORD →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
