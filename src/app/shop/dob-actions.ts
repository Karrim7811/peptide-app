'use server'

// Completing an account that predates the date-of-birth field.
//
// ── Why this exists ───────────────────────────────────────────────────────
//
// Signup has collected a date of birth since §16.10 was settled, but ten of the
// twelve accounts in production predate it and hold null. `isAdult()` fails
// closed on a null — correctly — so those accounts are refused at checkout with
// no way to fix it themselves, because nothing in the app ever asked them
// again. Both paid accounts are among them.
//
// This is the second and only other place a date of birth can be written.
//
// ── The rules, and why they are in src/lib/age.ts ─────────────────────────
//
// `refuseDob()` decides; this function only performs. It refuses to overwrite a
// date already on file, because a field its holder can rewrite the moment it
// refuses them is a checkbox with extra steps — and the whole argument for
// storing a real date is that it is not a checkbox. Correcting a genuine typo
// is a support request.
//
// Written through the anon client, not the service role. The column-level grant
// in supabase/profile_update_policy_migration.sql already allows a user to
// update their own `dob` and nothing else, so RLS is doing real work here and
// this cannot become a way to write another account's row.

import { createClient } from '@/lib/supabase/server'
import { refuseDob } from '@/lib/age'

export interface DobResult {
  ok: boolean
  error?: string
}

const REFUSALS: Record<string, string> = {
  'already-recorded':
    'A date of birth is already on file for this account. Email us if it needs correcting.',
  unparseable: 'That is not a complete date. Month, day and year.',
  'under-age': 'Peptide Cortex is for adults. Orders cannot be placed under 18.',
}

export async function recordDateOfBirth(iso: string): Promise<DobResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('dob')
    .eq('id', user.id)
    .single()

  const refusal = refuseDob(profile?.dob, iso)
  if (refusal) return { ok: false, error: REFUSALS[refusal] }

  const { error } = await supabase
    .from('profiles')
    .update({ dob: iso })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Whether checkout needs to ask. Null for a signed-out visitor, who is stopped
 * earlier and for a different reason.
 */
export async function needsDateOfBirth(): Promise<boolean | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('dob')
    .eq('id', user.id)
    .single()

  return !profile?.dob
}
