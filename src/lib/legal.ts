// Legal copy that more than one surface has to agree on.
//
// The refund text appears at checkout and on the refund page, and the two saying
// slightly different things is the kind of discrepancy that gets read against
// you. It lives here so there is one wording.
//
// REFUND_STATUS is rendered on the page as a visible tag. §16.12 of CLAUDE.md
// calls for an attorney review before any paid marketing push, and until that
// happens the page says so rather than presenting a draft as settled policy.

export const REFUND_STATUS = 'Draft · under legal review'

/**
 * The addresses the shop publishes.
 *
 * Three roles, deliberately not one address:
 *
 *   pay@      receives money over Zelle. NOT in this file — it is
 *             SHOP_ZELLE_HANDLE, an env var, because it is deployment config
 *             and because the app must never imply a destination for money
 *             that the deployment has not actually been given.
 *   orders@   the From: on order mail, once transactional email exists.
 *             Nothing sends yet, so it is not defined here either — a constant
 *             naming a sender that cannot send is a lie waiting to be read.
 *             The address exists on the domain; the code for it does not.
 *   support@  the one address a human writes to. That is this.
 *
 * Keeping the payment destination separate from the sending identity is a
 * security property, not tidiness: if the address that receives money were also
 * the address that sends email, a spoofed From: would carry a far more
 * convincing instruction to send money somewhere new.
 *
 * Before 2026-09-07 the live site published NO address at all. The two in the
 * tree — support@tigristechlabs.com and hello@peptidecortex.com — were both in
 * unimported footers (src/components/home/, src/app/_landing/), so the refund
 * policy's "email us" and the Zelle fallback's "email us" named nobody.
 */
export const SUPPORT_EMAIL = 'support@peptidecortex.com'

export const REFUND_POLICY =
  `Refunds are handled by hand, not by a card network. Unopened vials with the cold-chain seal intact can be returned within 14 days of delivery for a full refund including original shipping. Opened vials can’t be returned — we can’t verify how they were stored after they left us. Email ${SUPPORT_EMAIL} with your order reference and we’ll confirm within one business day.`

/** Where the effective-date line on every legal page comes from. */
export const LEGAL_EFFECTIVE = '2026-09-04'

/**
 * Kept as an alias so /eu keeps working. One address, one value — the point of
 * L-5, which the roadmap marked resolved while four addresses across two
 * domains were still in the tree.
 */
export const CONTACT_EMAIL = SUPPORT_EMAIL
