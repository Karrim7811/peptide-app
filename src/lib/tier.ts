// Pure tier predicates.
//
// Split out of subscription.ts so client components and the entitlement module
// can read tier semantics without pulling `next/server` and the Supabase server
// client into the browser bundle. subscription.ts re-exports these, so there is
// still exactly one definition of what "pro" means.

import type { SubscriptionTier } from '@/types'

type ProfileTierRow = {
  subscription_tier?: string | null
  subscription_expires_at?: string | null
} | null

/** Collapse a profiles row to an effective tier, treating an expired pro as free. */
export function resolveTier(profile: ProfileTierRow): SubscriptionTier {
  if (!profile) return 'free'
  if (profile.subscription_tier === 'pro' && profile.subscription_expires_at) {
    if (new Date(profile.subscription_expires_at) < new Date()) return 'free'
  }
  return (profile.subscription_tier as SubscriptionTier) ?? 'free'
}

/**
 * `lifetime` is a payment path into Pro, not a third feature set — gating treats
 * it identically to `pro`. Lifetime stopped being sold on 2026-08-06 but
 * existing holders and the founder whitelist keep permanent access.
 */
export function isProTier(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'lifetime'
}
