'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FlaskConical, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 18+ gate: signup is refused below this age.
const MIN_AGE_YEARS = 18

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

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dob, setDob] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Max date attribute for the DOB input — exactly 18 years ago.
  const maxDob = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - MIN_AGE_YEARS)
    return d.toISOString().slice(0, 10)
  })()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const age = computeAgeYears(dob)
    if (age === null) {
      setError('Please enter your date of birth.')
      setLoading(false)
      return
    }
    if (age < MIN_AGE_YEARS) {
      setError(`You must be ${MIN_AGE_YEARS} or older to create an account.`)
      setLoading(false)
      return
    }

    const supabase = createClient()
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

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-[#E8E5E0] rounded-2xl p-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1915] mb-3">Check your email</h2>
            <p className="text-[#B0AAA0] mb-6">
              We sent a confirmation link to <span className="text-[#1A8A9E]">{email}</span>.
              Click the link to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915] font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-[#1A8A9E]/12 p-3 rounded-2xl mb-4">
            <FlaskConical className="w-8 h-8 text-[#1A8A9E]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1915]">
            Peptide<span className="text-[#1A8A9E]">Cortex</span>
          </h1>
          <p className="text-[#B0AAA0] mt-2">Create your account</p>
        </div>

        <div className="bg-white border border-[#E8E5E0] rounded-2xl p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Date of birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={maxDob}
                required
                autoComplete="bday"
                className="font-mono tabular-nums"
              />
              <p className="text-xs text-[#B0AAA0] mt-1">
                You must be {MIN_AGE_YEARS} or older.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0AAA0] hover:text-[#3A3730]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0AAA0] hover:text-[#3A3730]"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A8A9E] hover:bg-[#1A8A9E] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1915] font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-[#B0AAA0] text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-[#1A8A9E] hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[#1A8A9E] hover:underline">Privacy Policy</Link>.
          </p>

          <div className="mt-5 text-center text-sm text-[#B0AAA0]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1A8A9E] hover:text-[#1A8A9E] font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
