// The signup form's half of the age gate.
//
// Three gates guard 18+, and they are deliberately not the same code:
//
//   1. this module      — the form, so a person is told before they submit
//   2. handle_new_user  — SQL, so an account cannot be created around the form
//   3. shop/orders/age  — checkout, because that is where money moves
//
// This one turns three typed strings into a whole number of years. It is
// separate from the component so it can be tested without a DOM, and separate
// from isAdult() because that takes a stored 'YYYY-MM-DD' and this takes a
// half-finished form.

export const MIN_AGE_YEARS = 18

/**
 * The password minimum. The signup placeholder reads "at least 10 characters",
 * so the form has to mean it — a shorter value here makes that a lie the moment
 * someone tests it.
 */
export const MIN_PASSWORD = 10

/**
 * Whole years, or null while the date is incomplete or impossible.
 *
 * Null rather than a number, because "not finished typing" and "zero years old"
 * are different things and the form treats them differently: one leaves the
 * button disabled quietly, the other would be a refusal.
 */
export function ageFrom(m: string, d: string, y: string, now: Date = new Date()): number | null {
  if (!(m && d && y.length === 4)) return null

  const month = Number(m)
  const day = Number(d)
  const year = Number(y)
  if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const born = new Date(year, month - 1, day)
  // Rejects 31 February and friends. The Date constructor rolls them over, so
  // reading the parts back out is the only reliable check.
  if (born.getFullYear() !== year || born.getMonth() !== month - 1 || born.getDate() !== day) {
    return null
  }
  if (born.getTime() > now.getTime()) return null

  let age = now.getFullYear() - born.getFullYear()
  const months = now.getMonth() - born.getMonth()
  if (months < 0 || (months === 0 && now.getDate() < born.getDate())) age--
  return age
}

/** 'YYYY-MM-DD' from the three form fields, for user_metadata.dob. */
export function isoDob(m: string, d: string, y: string): string {
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}
