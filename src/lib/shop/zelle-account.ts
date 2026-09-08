// The Zelle account, as the buyer will actually see it.
//
// Three facts, read in one place because three surfaces show them and any
// disagreement between those surfaces reads as fraud: the Zelle sheet, the
// order page, and the confirmation email.
//
// ── Why the NAME is not optional ──────────────────────────────────────────
//
// A buyer paying by Zelle types an address into their banking app and the app
// shows them the registered name of whoever owns it. If that name is not the
// name of the shop they just bought from, the honest reaction is to stop — and
// they are right to. So the shop has to say the name FIRST, on its own pages,
// before the bank does.
//
// This matters concretely here: the storefront is Peptide Cortex and the Zelle
// account is Tigris Tech Labs LLC, the company behind it. Until 2026-09-07 the
// Zelle sheet printed the recipient as "Peptide Cortex LLC" — a hard-coded
// string, not read from anywhere, and not the name on the account. A buyer
// following it would have been told one name by us and shown another by their
// bank, on the screen where they decide whether this is a scam.
//
// ── Why it is all env, and none of it is a constant ───────────────────────
//
// Same reason SHOP_ZELLE_HANDLE is: this is deployment configuration, and the
// app must never imply a destination for money that the deployment has not
// been given. Unset, every surface says the account is not set up rather than
// naming one.

export interface ZelleAccount {
  /** The email or US mobile enrolled with Zelle. */
  handle: string
  /**
   * The registered name the buyer's banking app will show. Null when it has
   * not been configured — the surfaces then say they cannot confirm it rather
   * than printing a guess, because a wrong name here is worse than none.
   */
  name: string | null
  /**
   * The bank-issued QR, if one has been published. Zelle QR codes encode a
   * bank token and cannot be generated from a handle, so this is always an
   * image the account holder exported — never something this app renders.
   */
  qrUrl: string | null
}

/** Null when there is nowhere to send money. Every caller must handle that. */
export function zelleAccount(): ZelleAccount | null {
  const handle = process.env.SHOP_ZELLE_HANDLE?.trim()
  if (!handle) return null

  return {
    handle,
    name: process.env.SHOP_ZELLE_NAME?.trim() || null,
    qrUrl: process.env.SHOP_ZELLE_QR_URL?.trim() || null,
  }
}

/**
 * What to print under the handle so the bank's name is not a surprise.
 *
 * Reads as a warning, not a footnote: this is the line that stops a careful
 * buyer from abandoning a legitimate payment.
 */
export function recipientNote(account: ZelleAccount): string {
  if (!account.name) {
    return 'Your bank will show the registered name of this account before you send.'
  }
  return `Your banking app will show this as ${account.name} — the company behind Peptide Cortex. That is the right account.`
}
