// The protocol planner.
//
// Pro-gated. The gate is here and in /api/protocol-plan; this one decides what
// to render, the API's decides whether to spend a model call.
//
// The bench is read as context and never written. Changing what is on the bench
// happens on the bench — a generated plan must not silently rewrite real data.

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { LibraryChrome } from '@/components/library/LibraryChrome'
import { createClient } from '@/lib/supabase/server'
import { isProUser } from '@/lib/subscription'
import { ProtocolClient } from './ProtocolClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Protocol planner · Peptide Cortex',
  description: 'A week drafted around what is already on the bench, with every amount sourced.',
}

export default async function ProtocolPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!(await isProUser())) redirect('/upgrade')

  const { data: rows } = await supabase
    .from('stack_items')
    .select('name')
    .eq('user_id', user.id)
    .eq('active', true)

  const bench = Array.from(
    new Set((rows ?? []).map((row) => String(row.name).trim()).filter(Boolean)),
  )

  return (
    <LibraryChrome signedIn>
      <ProtocolClient bench={bench} />
    </LibraryChrome>
  )
}
