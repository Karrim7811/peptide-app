import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR. Replaced by LogDoseButton on the compound view, and the Ledger for the full record.
// Redirect scheme is documented in src/app/stack/page.tsx.
export default function Redirect() {
  redirect('/dashboard?ledger=1')
}
