import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR. Replaced by BloodworkOverlay.
// Redirect scheme is documented in src/app/stack/page.tsx.
export default function Redirect() {
  redirect('/dashboard?bloodwork=1')
}
