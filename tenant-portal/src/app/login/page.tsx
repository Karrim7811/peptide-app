'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2 text-xl font-semibold">
          <Home className="h-6 w-6 text-tp-accent" />
          {process.env.NEXT_PUBLIC_PORTAL_NAME || 'Tenant Portal'}
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-tp-border bg-tp-card p-6 shadow-sm"
        >
          <h1 className="text-lg font-semibold">Sign in</h1>
          <div>
            <label className="mb-1 block text-sm text-tp-muted" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-tp-border px-3 py-2 outline-none focus:border-tp-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-tp-muted" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-tp-border px-3 py-2 outline-none focus:border-tp-accent"
            />
          </div>
          {error && <p className="text-sm text-tp-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-tp-accent py-2 font-medium text-white hover:bg-tp-accentDark disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-tp-muted">
            First time here?{' '}
            <Link href="/signup" className="text-tp-accent hover:underline">
              Create your account
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
