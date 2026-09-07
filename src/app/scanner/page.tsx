// The vial scanner.
//
// Pro-gated per CLAUDE.md §16.8, the same as on iOS. The gate is here AND in
// /api/scan-vials, because this one only decides what to render — the API's is
// the one that decides whether to spend a vision call.

import { redirect } from 'next/navigation'
import { loginUrl } from '@/lib/auth/next'
import type { Metadata } from 'next'
import { LibraryChrome } from '@/components/library/LibraryChrome'
import { createClient } from '@/lib/supabase/server'
import { isProUser } from '@/lib/subscription'
import { ScannerClient } from './ScannerClient'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Vial scanner · Peptide Cortex',
  description: 'Photograph a shelf and check the reading before anything reaches your bench.',
}

export default async function ScannerPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(loginUrl('/scanner'))
  if (!(await isProUser())) redirect('/upgrade')

  // The phone needs an absolute URL to open, and it is not on this machine —
  // localhost would be its own localhost. Read the host the browser actually
  // used rather than an env var that would be wrong in preview deployments.
  const head = headers()
  const host = head.get('x-forwarded-host') ?? head.get('host') ?? 'peptidecortex.com'
  const proto = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

  return (
    <LibraryChrome signedIn>
      <ScannerClient origin={`${proto}://${host}`} />
    </LibraryChrome>
  )
}
