import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR. Replaced by the ROTATION tab, and the site picker when logging a dose.
// Redirect scheme is documented in src/app/stack/page.tsx.
export default function Redirect() {
  redirect('/dashboard?tab=rotation')
}
