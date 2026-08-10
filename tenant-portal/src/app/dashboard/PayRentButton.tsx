'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'

export default function PayRentButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start checkout. Try again.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Could not start checkout. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-tp-accent px-5 py-2.5 font-medium text-white hover:bg-tp-accentDark disabled:opacity-50"
      >
        <CreditCard className="h-5 w-5" />
        {loading ? 'Redirecting…' : 'Pay rent'}
      </button>
      {error && <p className="text-sm text-tp-danger">{error}</p>}
    </div>
  )
}
