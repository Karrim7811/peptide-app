import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginUrl } from '@/lib/auth/next'
import { currentPath } from '@/lib/auth/pathname'

// The Mirror is a full-bleed, self-chroming surface: it owns its own header,
// breadcrumb, ground toggle and footer, and sizes itself to exactly 100vh with
// overflow hidden. The legacy Sidebar / TopBar / CortexStrip chrome this layout
// used to wrap around /dashboard fought all of that — a light-theme sidebar,
// a max-width container and page padding around a surface designed to fill the
// viewport. That chrome still serves the legacy CRUD routes (/stack, /log,
// /cycle …), which keep their own layouts; it just has no place here.
//
// Only the auth gate stays. This layout used to send anyone with
// profiles.onboarded_at IS NULL to /welcome first, which meant a new account
// that clicked "Log dose" or "Edit" on the bench was detoured through a
// four-step form instead of landing where it clicked. The bench now has its
// own add form, so the Mirror opens directly; /welcome is still there for
// anyone who wants it, it is just not forced.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(loginUrl(currentPath('/mirror')))

  return <>{children}</>
}
