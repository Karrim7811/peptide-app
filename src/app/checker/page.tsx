// The interaction checker.
//
// Was a redirect into the Mirror. It is now its own screen, because the
// question it answers — "is this pair a problem" — is one people arrive with,
// not one that comes up while browsing a compound. InteractionCheck stays on
// the compound view inside the Mirror; both call the same API.
//
// Not Pro-gated. Free accounts get three checks a day, enforced in
// /api/check-interaction against the interaction_checks ledger. This page only
// relays what the API says about the cap — a client-side counter would be wrong
// across devices and trivially reset.

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { loginUrl } from '@/lib/auth/next'
import { LibraryChrome } from '@/components/library/LibraryChrome'
import { createClient } from '@/lib/supabase/server'
import { isProUser } from '@/lib/subscription'
import { CheckerClient } from './CheckerClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Interaction checker · Peptide Cortex',
  description:
    'Compare any two compounds — peptide, prescription, supplement or OTC — against what the literature reports.',
}

export default async function CheckerPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(loginUrl('/checker'))

  return (
    <LibraryChrome signedIn>
      <CheckerClient isPro={await isProUser()} />
    </LibraryChrome>
  )
}
