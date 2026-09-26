import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// This route's page is a redirect stub into the Mirror (see page.tsx), so it
// never renders content and needs no chrome. The legacy Sidebar / MobileNav /
// TopBar frame it used to wrap was never visible and has been dropped; the
// sign-in gate stays so a signed-out visitor goes to /login, not the Mirror.
export default async function NotesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
