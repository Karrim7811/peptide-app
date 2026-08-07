import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR. Replaced by RemindersTool on the compound view.
// Redirect scheme is documented in src/app/stack/page.tsx.
export default function Redirect() {
  redirect('/dashboard')
}
