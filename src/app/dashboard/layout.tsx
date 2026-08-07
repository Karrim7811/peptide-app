import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// The Mirror is a full-bleed, self-chroming surface: it owns its own header,
// breadcrumb, ground toggle and footer, and sizes itself to exactly 100vh with
// overflow hidden. The legacy Sidebar / TopBar / CortexStrip chrome this layout
// used to wrap around /dashboard fought all of that — a light-theme sidebar,
// a max-width container and page padding around a surface designed to fill the
// viewport. That chrome still serves the legacy CRUD routes (/stack, /log,
// /cycle …), which keep their own layouts; it just has no place here.
//
// The auth gate stays, plus one more: a user who has never finished
// onboarding (profiles.onboarded_at IS NULL) is sent to /welcome first. That
// flow is what seeds a real stack, so the field means something the first
// time this layout's children ever render for them.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarded_at) redirect('/welcome')

  return <>{children}</>
}
