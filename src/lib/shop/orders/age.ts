// The 18+ check at the point of sale.
//
// Signup already refuses under-18s in a database trigger, so this is the second
// gate. It exists because the trigger guards account CREATION only: an account
// made before the trigger landed, or one whose dob was never backfilled, would
// otherwise walk straight through checkout. The stated legal posture is adults
// only, and the sale is the moment that matters.
//
// Everything unknown fails closed. A missing or unparseable date of birth is not
// permission.

const YMD = /^\d{4}-\d{2}-\d{2}$/

export function isAdult(dob: string | null | undefined, now: Date = new Date()): boolean {
  if (!dob || !YMD.test(dob)) return false

  const [year, month, day] = dob.split('-').map(Number)
  // Reject an impossible date rather than letting Date roll it over — '2008-02-30'
  // would otherwise silently become 1 March.
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return false
  }

  if (parsed.getTime() > now.getTime()) return false

  // The 18th birthday, computed by calendar arithmetic rather than by dividing
  // elapsed milliseconds — leap years make the latter wrong at the boundary.
  // Date.UTC rolls 29 Feb into 1 March in a non-leap year, which is the correct
  // outcome: someone born on 29 Feb 2008 is an adult from 1 March 2026.
  const eighteenth = new Date(Date.UTC(year + 18, month - 1, day))
  return now.getTime() >= eighteenth.getTime()
}
