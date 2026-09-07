import { redirect } from 'next/navigation'

// SUPERSEDED BY THE MIRROR. Replaced by RemindersTool on the compound view.
// Redirect scheme is documented in src/app/stack/page.tsx. These land on
// /mirror, which is the surface that reads their query params — /dashboard is
// now the V3 bench and understands none of them.
export default function Redirect() {
  redirect('/mirror')
}
