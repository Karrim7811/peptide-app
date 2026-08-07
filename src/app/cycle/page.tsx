import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR. Replaced by CycleControl and the CYCLE tab.
// Redirect scheme is documented in src/app/stack/page.tsx.
export default function Redirect() {
  redirect('/dashboard?tab=cycle')
}
