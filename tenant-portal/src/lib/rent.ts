const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Rent month key, e.g. '2026-08'
export function currentPeriod(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// '2026-08' -> 'August 2026'
export function periodLabel(period: string): string {
  const [y, m] = period.split('-')
  const idx = Number(m) - 1
  if (!y || idx < 0 || idx > 11) return period
  return `${MONTHS[idx]} ${y}`
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
