import { describe, expect, it } from 'vitest'
import { MIN_AGE_YEARS, MIN_PASSWORD, ageFrom, isoDob, refuseDob } from '@/lib/age'
import { isAdult } from '@/lib/shop/orders/age'

// The signup form's half of the age gate. CLAUDE.md §16.10: a real date of
// birth, not a checkbox. The SQL trigger and the checkout gate are the other
// two; this is the one a person actually interacts with.

function yearsAgo(years: number, offsetDays = 0): [string, string, string] {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  date.setDate(date.getDate() + offsetDays)
  return [
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getFullYear()),
  ]
}

describe('ageFrom', () => {
  it('withholds an answer until the date is complete', () => {
    expect(ageFrom('', '', '')).toBeNull()
    expect(ageFrom('06', '', '')).toBeNull()
    expect(ageFrom('06', '14', '')).toBeNull()
    // A partial year must not resolve — '199' would otherwise read as year 199
    // and make a toddler 1827 years old.
    expect(ageFrom('06', '14', '199')).toBeNull()
  })

  it('rejects a date that does not exist', () => {
    expect(ageFrom('02', '31', '1990')).toBeNull()
    expect(ageFrom('04', '31', '1990')).toBeNull()
    expect(ageFrom('13', '01', '1990')).toBeNull()
    expect(ageFrom('00', '10', '1990')).toBeNull()
  })

  it('accepts a leap day in a leap year and refuses it otherwise', () => {
    expect(ageFrom('02', '29', '2000')).not.toBeNull()
    expect(ageFrom('02', '29', '1999')).toBeNull()
  })

  it('refuses a date in the future', () => {
    const [m, d, y] = yearsAgo(-1)
    expect(ageFrom(m, d, y)).toBeNull()
  })

  // The boundary is the entire point of the field.
  it('is exact on the eighteenth birthday', () => {
    const [m, d, y] = yearsAgo(MIN_AGE_YEARS)
    expect(ageFrom(m, d, y)).toBe(MIN_AGE_YEARS)
  })

  it('counts someone a day short of eighteen as seventeen', () => {
    const [m, d, y] = yearsAgo(MIN_AGE_YEARS, 1)
    expect(ageFrom(m, d, y)).toBe(MIN_AGE_YEARS - 1)
  })

  it('counts someone a day past eighteen as eighteen', () => {
    const [m, d, y] = yearsAgo(MIN_AGE_YEARS, -1)
    expect(ageFrom(m, d, y)).toBe(MIN_AGE_YEARS)
  })
})

describe('isoDob', () => {
  it('pads a single-digit month and day', () => {
    expect(isoDob('6', '4', '1990')).toBe('1990-06-04')
    expect(isoDob('12', '25', '1988')).toBe('1988-12-25')
  })

  // The form writes this string and the checkout gate reads it. If the two ever
  // disagree about the format, isAdult() fails closed and nobody can buy
  // anything — a silent, total outage of the shop.
  it('produces exactly what the checkout gate parses', () => {
    const [m, d, y] = yearsAgo(30)
    expect(isAdult(isoDob(m, d, y))).toBe(true)

    const [ym, yd, yy] = yearsAgo(10)
    expect(isAdult(isoDob(ym, yd, yy))).toBe(false)
  })

  it('agrees with the form gate on the eighteenth birthday', () => {
    const [m, d, y] = yearsAgo(MIN_AGE_YEARS)
    expect(ageFrom(m, d, y)).toBe(MIN_AGE_YEARS)
    expect(isAdult(isoDob(m, d, y))).toBe(true)
  })
})

describe('the promises the signup form makes', () => {
  // The placeholder reads "at least 10 characters". A shorter minimum makes
  // that sentence a lie the first time someone tests it.
  it('requires the password length its own placeholder advertises', () => {
    expect(MIN_PASSWORD).toBe(10)
  })

  it('gates at eighteen', () => {
    expect(MIN_AGE_YEARS).toBe(18)
  })
})

describe('refuseDob', () => {
  const adult = () => {
    const [m, d, y] = yearsAgo(30)
    return isoDob(m, d, y)
  }

  it('lets an account with no date on file record one', () => {
    expect(refuseDob(null, adult())).toBeNull()
    expect(refuseDob(undefined, adult())).toBeNull()
  })

  // A field the holder can rewrite the moment it refuses them is a checkbox
  // with extra steps.
  it('refuses to overwrite a date already on file', () => {
    expect(refuseDob('1990-06-14', adult())).toBe('already-recorded')
  })

  it('refuses an under-age date rather than recording it', () => {
    const [m, d, y] = yearsAgo(10)
    expect(refuseDob(null, isoDob(m, d, y))).toBe('under-age')
  })

  it('refuses anything it cannot parse, including an impossible date', () => {
    expect(refuseDob(null, '')).toBe('unparseable')
    expect(refuseDob(null, '14/06/1990')).toBe('unparseable')
    expect(refuseDob(null, '1990-02-31')).toBe('unparseable')
    expect(refuseDob(null, '1990-13-01')).toBe('unparseable')
  })

  it('agrees with the checkout gate about who is an adult', () => {
    const [m, d, y] = yearsAgo(MIN_AGE_YEARS)
    const iso = isoDob(m, d, y)
    expect(refuseDob(null, iso)).toBeNull()
    expect(isAdult(iso)).toBe(true)
  })
})
