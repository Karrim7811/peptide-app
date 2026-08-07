'use server'

// The onboarding flow's single write path.
//
// Runs under the caller's own auth-scoped client (createClient from
// @/lib/supabase/server) — same convention as src/app/dashboard/actions.ts —
// so RLS enforces the write, not a client-side check. The profiles UPDATE
// (display_name / experience_level / onboarded_at) needs a policy that did
// not exist before this feature; see supabase/profile_update_policy_migration.sql.
//
// Stack items and inventory rows are seeded by CALLING the Mirror's own
// Server Actions (addStackItem, setInventory) rather than re-implementing
// their validation here — they already own the "what does a valid stack row
// look like" question.
//
// One compound's failure never blocks the rest, and never blocks the profile
// write that already landed: this is a first-run form, not a transaction. A
// user who filled in 4 of 5 compounds and hit a duplicate on the 5th should
// still land on a Mirror that shows onboarded_at set and 4 compounds mapped,
// not an error page.

import { createClient } from '@/lib/supabase/server'
import { addStackItem, setInventory } from '@/app/dashboard/actions'
import { COMPOUNDS } from '@/lib/catalog'

export type ExperienceLevel = 'new' | 'some' | 'experienced'

const EXPERIENCE_LEVELS: ReadonlySet<string> = new Set(['new', 'some', 'experienced'])

export interface OnboardingCompoundInput {
  compoundId: string
  /** Dose in micrograms. Omit or leave undefined to skip. */
  doseMcg?: number
  /** Vial size in milligrams. Omit to skip — paired with remainingMg. */
  vialSizeMg?: number
  /** Quantity remaining in milligrams. Omit to skip — paired with vialSizeMg. */
  remainingMg?: number
}

export interface OnboardingInput {
  displayName?: string
  experienceLevel?: ExperienceLevel | null
  compounds: OnboardingCompoundInput[]
}

export interface OnboardingResult {
  ok: boolean
  error?: string
  /** Compound ids that were selected but could not be added (already in stack, unknown id, etc). Non-fatal. */
  skipped?: string[]
}

const MAX_DISPLAY_NAME = 80

function cleanDisplayName(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().slice(0, MAX_DISPLAY_NAME)
  return trimmed.length ? trimmed : null
}

function cleanExperience(value: ExperienceLevel | null | undefined): ExperienceLevel | null {
  return value && EXPERIENCE_LEVELS.has(value) ? value : null
}

/** Positive finite number, or undefined for "skip this field". */
function positiveOrUndefined(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

/**
 * Save the onboarding answers, seed the stack, and mark the profile
 * onboarded. Also the target of "Skip for now" — called with
 * `compounds: []` (and whatever of displayName/experienceLevel was already
 * filled in) sets onboarded_at without adding anything.
 */
export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: cleanDisplayName(input.displayName),
      experience_level: cleanExperience(input.experienceLevel),
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) return { ok: false, error: profileError.message }

  const skipped: string[] = []

  for (const item of input.compounds) {
    if (!COMPOUNDS[item.compoundId]) {
      skipped.push(item.compoundId)
      continue
    }

    const doseMcg = positiveOrUndefined(item.doseMcg)
    const stackResult = await addStackItem({
      compoundId: item.compoundId,
      dose: doseMcg !== undefined ? String(doseMcg) : undefined,
      unit: 'mcg',
    })
    if (!stackResult.ok) {
      skipped.push(item.compoundId)
      continue
    }

    const vialSizeMg = positiveOrUndefined(item.vialSizeMg)
    // 0 is a legitimate "nothing left" answer, so this checks presence, not truthiness.
    const remainingMg =
      typeof item.remainingMg === 'number' && Number.isFinite(item.remainingMg) && item.remainingMg >= 0
        ? item.remainingMg
        : undefined

    if (vialSizeMg !== undefined && remainingMg !== undefined) {
      await setInventory({
        compoundId: item.compoundId,
        vialSizeMg,
        quantityRemaining: remainingMg,
      })
    }
  }

  return { ok: true, skipped: skipped.length ? skipped : undefined }
}
