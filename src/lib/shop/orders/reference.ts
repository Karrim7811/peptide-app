// The code a customer types into a Zelle memo.
//
// Zelle has no merchant API, so this string is the only link between money
// landing in the bank and an order in the database. A mistyped one is a support
// ticket, not an automatic anything — which is why the alphabet matters more
// than the entropy does.
//
// Crockford-style: no O or 0, no I, 1 or L. Uppercase only, because banks
// normalise memo fields inconsistently and a lowercase code would sometimes
// arrive upcased and sometimes not.

import { randomInt } from 'node:crypto'

export const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

const PATTERN = /^PC-[0-9A-Z]{4}$/

export function generateReference(): string {
  let code = ''
  for (let i = 0; i < 4; i++) code += ALPHABET[randomInt(ALPHABET.length)]
  return `PC-${code}`
}

/**
 * Strict: no trimming, no case folding. Both would let two different strings
 * validate while only one matches the stored row, which is exactly the class of
 * near-miss this code exists to avoid. Normalise deliberately at the call site
 * if a form needs it.
 */
export function isValidReference(value: string): boolean {
  if (!PATTERN.test(value)) return false
  const body = value.slice(3)
  for (const c of body) if (!ALPHABET.includes(c)) return false
  return true
}
