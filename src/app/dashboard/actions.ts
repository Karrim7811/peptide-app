'use server'

// The Mirror's write paths.
//
// Server Actions rather than client-side Supabase calls, for two reasons:
//   1. Every write runs under the caller's own auth-scoped client, so RLS is
//      the enforcement, not a client-side check that a devtools console can
//      skip.
//   2. Tier gating on writes belongs on the server. A locked compound can still
//      be LOGGED against — the tier withholds resolution, never ownership — but
//      the free allowance on stack size is enforced here, not in the UI.
//
// Note on what is deliberately NOT gated: logging a dose, editing inventory,
// and reading reconstitution arithmetic all work at every tier, for locked
// compounds too. The pricing page prints that as a promise.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveCompoundId } from '@/lib/mirror/mapping'
import { COMPOUNDS } from '@/lib/catalog'

export interface ActionResult {
  ok: boolean
  error?: string
}

const OK: ActionResult = { ok: true }

function fail(error: string): ActionResult {
  return { ok: false, error }
}

async function authed() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/**
 * Log a dose against a compound.
 *
 * Works for locked compounds. The tier decides what the Mirror will RESOLVE,
 * not what the user is allowed to record about their own protocol.
 */
export async function logDose(input: {
  compoundId: string
  dose?: string
  site?: string
  notes?: string
}): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const compound = COMPOUNDS[input.compoundId]
  if (!compound) return fail('Unknown compound.')

  // Find the user's stack row for this compound. Names are free text, so match
  // through the same resolver the read path uses rather than a naive equality.
  const { data: rows, error: readError } = await supabase
    .from('stack_items')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('active', true)

  if (readError) return fail(readError.message)

  const match = (rows ?? []).find((row) => resolveCompoundId(row.name) === input.compoundId)
  if (!match) return fail(`${compound.name} is not in your stack.`)

  const { error } = await supabase.from('dose_logs').insert({
    user_id: user.id,
    stack_item_id: match.id,
    dose: input.dose ?? '',
    notes: input.notes ?? '',
  })
  if (error) return fail(error.message)

  // The site is a separate record — injection_sites is its own log, not a
  // column on the dose. Written alongside so rotation stays derivable.
  if (input.site) {
    const { error: siteError } = await supabase.from('injection_sites').insert({
      user_id: user.id,
      site: input.site,
      peptide_name: match.name,
    })
    if (siteError) return fail(siteError.message)
  }

  revalidatePath('/dashboard')
  return OK
}

/**
 * Add a compound to the stack.
 *
 * The free allowance limits how many compounds the Mirror will RESOLVE, not how
 * many the user may own — so this does not cap stack size. A free user with six
 * compounds sees all six on the field; five of them are dashed.
 */
export async function addStackItem(input: {
  compoundId: string
  dose?: string
  unit?: string
  notes?: string
}): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const compound = COMPOUNDS[input.compoundId]
  if (!compound) return fail('Unknown compound.')

  const { data: existing } = await supabase
    .from('stack_items')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('active', true)

  if ((existing ?? []).some((row) => resolveCompoundId(row.name) === input.compoundId)) {
    return fail(`${compound.name} is already in your stack.`)
  }

  const { error } = await supabase.from('stack_items').insert({
    user_id: user.id,
    // Store the catalog name so the read path resolves it back deterministically.
    name: compound.name,
    type: 'peptide',
    dose: input.dose ?? '',
    unit: input.unit ?? 'mcg',
    notes: input.notes ?? '',
    active: true,
  })
  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

/** Deactivate rather than delete, so the dose history keeps its referent. */
export async function removeStackItem(compoundId: string): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const { data: rows } = await supabase
    .from('stack_items')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('active', true)

  const match = (rows ?? []).find((row) => resolveCompoundId(row.name) === compoundId)
  if (!match) return fail('Not in your stack.')

  // A hard delete would cascade the dose_logs rows that reference it and quietly
  // rewrite the user's history. The Ledger is for proving; it does not lose rows.
  const { error } = await supabase
    .from('stack_items')
    .update({ active: false })
    .eq('id', match.id)
    .eq('user_id', user.id)

  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

/**
 * Set the remaining quantity for a compound's vial.
 *
 * Supply percent and days-of-supply are DERIVED from this at read time; nothing
 * stores an aggregate. See mapping.ts.
 */
export async function setInventory(input: {
  compoundId: string
  vialSizeMg: number
  quantityRemaining: number
  expiryDate?: string | null
}): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const compound = COMPOUNDS[input.compoundId]
  if (!compound) return fail('Unknown compound.')
  if (!(input.vialSizeMg > 0)) return fail('Vial size must be greater than zero.')
  if (input.quantityRemaining < 0) return fail('Quantity remaining cannot be negative.')

  const { data: existing } = await supabase
    .from('inventory')
    .select('id, name')
    .eq('user_id', user.id)

  const match = (existing ?? []).find((row) => resolveCompoundId(row.name) === input.compoundId)

  const payload = {
    user_id: user.id,
    name: compound.name,
    vial_size_mg: input.vialSizeMg,
    quantity_remaining: input.quantityRemaining,
    unit: 'mg',
    expiry_date: input.expiryDate ?? null,
  }

  const { error } = match
    ? await supabase.from('inventory').update(payload).eq('id', match.id).eq('user_id', user.id)
    : await supabase.from('inventory').insert(payload)

  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

/**
 * Schedule a compound.
 *
 * Cadence is what supply-days arithmetic reads, so a reminder is not merely a
 * notification — it is the input that makes "4 days left" mean anything.
 */
export async function setReminder(input: {
  compoundId: string
  time: string
  daysOfWeek: number[]
  dose?: string
}): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')
  if (!/^\d{2}:\d{2}/.test(input.time)) return fail('Give the reminder a time.')
  if (!input.daysOfWeek.length) return fail('Pick at least one day.')
  if (input.daysOfWeek.some((day) => day < 0 || day > 6)) return fail('Invalid day.')

  const { data: rows } = await supabase
    .from('stack_items')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('active', true)

  const match = (rows ?? []).find((row) => resolveCompoundId(row.name) === input.compoundId)
  if (!match) return fail('Add it to your stack first.')

  const { error } = await supabase.from('reminders').insert({
    user_id: user.id,
    stack_item_id: match.id,
    time: input.time,
    days_of_week: input.daysOfWeek,
    dose: input.dose ?? '',
    active: true,
  })
  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

export async function removeReminder(reminderId: string): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId)
    .eq('user_id', user.id)
  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

/** A research note against a compound. Never gated — it is the user's own writing. */
export async function addNote(input: {
  compoundId: string
  note: string
  url?: string
}): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const compound = COMPOUNDS[input.compoundId]
  if (!compound) return fail('Unknown compound.')
  if (!input.note.trim()) return fail('Write something first.')

  const { error } = await supabase.from('research_notes').insert({
    user_id: user.id,
    peptide_name: compound.name,
    note: input.note.trim(),
    url: input.url?.trim() ?? '',
  })
  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

export async function removeNote(noteId: string): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const { error } = await supabase
    .from('research_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id)
  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

/**
 * Record a side effect.
 *
 * Explicitly NOT tier-gated, and never will be. Withholding a safety signal
 * behind a paywall is the one thing this product must not do — the pricing page
 * commits to cautions and contraindications staying open at every tier, and a
 * user's own adverse-event record is squarely inside that promise.
 */
export async function logSideEffect(input: {
  compoundId: string
  effect: string
  severity: number
  notes?: string
}): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const compound = COMPOUNDS[input.compoundId]
  if (!compound) return fail('Unknown compound.')
  if (!input.effect.trim()) return fail('Describe what happened.')

  const severity = Math.max(1, Math.min(5, Math.round(input.severity)))

  const { error } = await supabase.from('side_effects').insert({
    user_id: user.id,
    peptide_name: compound.name,
    effect: input.effect.trim(),
    severity,
    notes: input.notes?.trim() ?? '',
  })
  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

export async function removeSideEffect(id: string): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')

  const { error } = await supabase
    .from('side_effects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}

/** Start a cycle. Day, length and washout are all derived from these fields. */
export async function startCycle(input: {
  name: string
  startDate: string
  onWeeks: number
  offWeeks: number
}): Promise<ActionResult> {
  const { supabase, user } = await authed()
  if (!user) return fail('Please sign in.')
  if (!input.name.trim()) return fail('Give the cycle a name.')
  if (!(input.onWeeks > 0)) return fail('On-weeks must be greater than zero.')

  const { error } = await supabase.from('cycles').insert({
    user_id: user.id,
    name: input.name.trim(),
    start_date: input.startDate,
    on_weeks: input.onWeeks,
    off_weeks: input.offWeeks,
    status: 'on',
    peptide_names: [],
  })
  if (error) return fail(error.message)

  revalidatePath('/dashboard')
  return OK
}
