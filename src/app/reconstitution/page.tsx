import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR. Replaced by THE MATH, reframed as solution chemistry per CLAUDE.md 16.9.
// Redirect scheme is documented in src/app/stack/page.tsx.
export default function Redirect() {
  redirect('/dashboard')
}
