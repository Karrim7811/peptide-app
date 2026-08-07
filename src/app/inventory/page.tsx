import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR. Replaced by StackControl on the compound view — vial size and quantity remaining.
// Redirect scheme is documented in src/app/stack/page.tsx.
export default function Redirect() {
  redirect('/dashboard')
}
