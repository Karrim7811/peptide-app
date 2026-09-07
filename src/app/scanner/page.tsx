// The vial scanner.
//
// Pro-gated per CLAUDE.md §16.8, the same as on iOS. The gate is here AND in
// /api/scan-vials, because this one only decides what to render — the API's is
// the one that decides whether to spend a vision call.

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { LibraryChrome } from '@/components/library/LibraryChrome'
import { createClient } from '@/lib/supabase/server'
import { isProUser } from '@/lib/subscription'
import { ScannerClient } from './ScannerClient'

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

  if (!user) redirect('/login')
  if (!(await isProUser())) redirect('/upgrade')

  return (
    <LibraryChrome signedIn>
      <ScannerClient />
    </LibraryChrome>
  )
}
