// Transactional email.
//
// One provider, one entry point, and a hard rule: NOTHING here may fail the
// thing that triggered it. An order is a row in the database; the receipt is a
// copy. If the copy cannot be made, the order still happened, and a customer
// whose payment succeeded must never see an error because a mail API was slow.
// `send()` returns an outcome, never throws.
//
// ── Unconfigured is a normal state, not an error ──────────────────────────
//
// With RESEND_API_KEY unset the app does not send and does not complain: the
// shop is meant to work before the email domain is warmed. Callers get
// `{ ok: false, reason: 'not-configured' }` and carry on. The same shape as
// SHOP_ZELLE_HANDLE — a missing capability is reported, never faked.
//
// ── Why the sender is not the address that takes money ────────────────────
//
// orders@ sends; pay@ receives Zelle. If they were one address, a spoofed From:
// would carry a much more convincing instruction to send money somewhere new,
// and our own genuine mail would have trained buyers to accept it. See
// src/lib/legal.ts.

import { Resend } from 'resend'

/** Who order mail comes from. The address exists; nothing else may send as it. */
export const ORDERS_FROM = 'Peptide Cortex <orders@peptidecortex.com>'

export type SendOutcome =
  | { ok: true; id: string | null }
  | { ok: false; reason: 'not-configured' | 'no-recipient' | 'failed'; detail?: string }

export interface Mail {
  to: string
  subject: string
  /** Always required. HTML is optional because text always renders. */
  text: string
  html?: string
}

/**
 * Sends, or explains why it did not.
 *
 * Deliberately not `throws`. Every caller is a side effect of something more
 * important than itself.
 */
export async function send(mail: Mail): Promise<SendOutcome> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return { ok: false, reason: 'not-configured' }
  if (!mail.to.trim()) return { ok: false, reason: 'no-recipient' }

  try {
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({
      from: ORDERS_FROM,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
    })

    if (error) return { ok: false, reason: 'failed', detail: error.message }
    return { ok: true, id: data?.id ?? null }
  } catch (failure) {
    // A network error, a bad key, a provider outage. All the same to the caller:
    // the mail did not go, and the caller's own work still stands.
    return {
      ok: false,
      reason: 'failed',
      detail: failure instanceof Error ? failure.message : String(failure),
    }
  }
}
