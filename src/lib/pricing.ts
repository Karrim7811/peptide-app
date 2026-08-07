// Pro pricing. Two numbers; every string on the pricing page derives from them.
//
// Hardcoding the display copy is how the "SAVE $60" badge and the footnote fell
// out of sync during design, so nothing below is a literal.
//
// Supersedes CLAUDE.md §16.4/§16.5 (which specified $9.99/mo + $99.99 lifetime
// with annual deprecated). Decided 2026-08-06: annual is back, lifetime stops
// being sold. `subscription_tier = 'lifetime'` still grants permanent Pro for
// existing holders and the founder whitelist — nothing revokes access.

/** Billed monthly. */
export const MONTHLY_PRICE = 14.99

/**
 * Billed once yearly. 119.88 divides to exactly $9.99/mo — an annual price
 * should land on a clean monthly figure, since the monthly figure is what the
 * card actually shows.
 */
export const ANNUAL_PRICE = 119.88

/** Free trial on Pro, in months. */
export const TRIAL_MONTHS = 1

/**
 * The same trial expressed for Stripe, which takes days. Derived so the page's
 * promise and the subscription's actual trial cannot drift apart.
 */
export const TRIAL_DAYS = TRIAL_MONTHS * 30

export type BillingCycle = 'monthly' | 'annual'

/** `$9.99`, `$60` — trailing `.00` dropped, matching the prototype. */
export function money(value: number): string {
  return '$' + (Math.round(value * 100) / 100).toFixed(2).replace(/\.00$/, '')
}

export const fullYearPrice = MONTHLY_PRICE * 12

export const annualSaving = Math.max(0, fullYearPrice - ANNUAL_PRICE)

export const annualSavingPct = fullYearPrice
  ? Math.round((1 - ANNUAL_PRICE / fullYearPrice) * 100)
  : 0

export const annualPerMonth = ANNUAL_PRICE / 12

export function priceLabel(cycle: BillingCycle): string {
  return money(cycle === 'annual' ? annualPerMonth : MONTHLY_PRICE)
}

export const trialPhrase = TRIAL_MONTHS === 1 ? 'a month' : `${TRIAL_MONTHS} months`

/**
 * The trial leads, because it is the only number that changes what the user
 * risks by clicking. Price follows it in the same sentence, never hidden —
 * which is also California's auto-renewal disclosure requirement (CLAUDE.md
 * §16.12): amount, frequency and cancellation method shown before Pay.
 */
export function priceFootnote(cycle: BillingCycle): string {
  const lead = TRIAL_MONTHS
    ? `FREE FOR ${TRIAL_MONTHS === 1 ? 'ONE MONTH' : `${TRIAL_MONTHS} MONTHS`}, THEN `
    : 'BILLED '
  const terms =
    cycle === 'annual'
      ? `${money(ANNUAL_PRICE)} YEARLY · CANCEL ANY TIME`
      : `${money(MONTHLY_PRICE)} MONTHLY · CANCEL ANY TIME`
  return lead + terms
}

export function proCta(cycle: BillingCycle): string {
  if (TRIAL_MONTHS) return 'START YOUR FREE MONTH →'
  return cycle === 'annual'
    ? `GO PRO · ${money(ANNUAL_PRICE)}/YR →`
    : `GO PRO · ${money(MONTHLY_PRICE)}/MO →`
}

/**
 * The discount is stated in MONEY, never in months. "Months free" belongs to
 * the trial alone — expressing both in the same unit made the card unreadable.
 */
export const saveLabel = `SAVE ${money(annualSaving)}`

export const trialNote =
  `No card charged for ${trialPhrase}. Cancel before it ends and you pay nothing — ` +
  `your stack stays, it just goes back to one resolved compound.`
