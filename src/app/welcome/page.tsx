// First-run onboarding. Gated from the other side by dashboard/layout.tsx,
// which sends any user with onboarded_at IS NULL here. This page is the
// inverse guard: a user who has already onboarded gets sent straight to the
// Mirror instead of re-running a form that would otherwise happily add a
// second copy of everything they picked the first time.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WelcomeClient from './WelcomeClient'

export const dynamic = 'force-dynamic'

export default async function WelcomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, onboarded_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarded_at) redirect('/dashboard')

  return <WelcomeClient initialDisplayName={profile?.display_name ?? ''} />
}
