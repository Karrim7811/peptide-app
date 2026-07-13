import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedContext } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types'

export const FREE_LIMITS = {
  interactionChecksPerDay: 3,
} as const

type ProfileTierRow = {
  subscription_tier?: string | null
  subscription_expires_at?: string | null
} | null

// Collapse a profiles row to an effective tier, treating an expired pro as free.
export function resolveTier(profile: ProfileTierRow): SubscriptionTier {
  if (!profile) return 'free'
  if (profile.subscription_tier === 'pro' && profile.subscription_expires_at) {
    if (new Date(profile.subscription_expires_at) < new Date()) return 'free'
  }
  return (profile.subscription_tier as SubscriptionTier) ?? 'free'
}

export function isProTier(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'lifetime'
}

// Pro gate for API routes. Reads the caller's own tier via their auth-scoped
// client (works for web cookies and mobile Bearer alike). Returns null to
// allow the request through, or a NextResponse to return immediately.
export async function requirePro(request: Request): Promise<NextResponse | null> {
  const { user, supabase } = await getAuthenticatedContext(request)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.', code: 'AUTH_REQUIRED' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', user.id)
    .single()
  if (isProTier(resolveTier(profile))) return null
  return NextResponse.json(
    { error: 'This feature requires Peptide Cortex Pro.', code: 'PRO_REQUIRED' },
    { status: 403 }
  )
}

export async function getUserSubscription(): Promise<SubscriptionTier> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'free'

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', user.id)
    .single()

  if (!profile) return 'free'

  // Check if pro subscription has expired
  if (profile.subscription_tier === 'pro' && profile.subscription_expires_at) {
    const expiresAt = new Date(profile.subscription_expires_at)
    if (expiresAt < new Date()) return 'free'
  }

  return (profile.subscription_tier as SubscriptionTier) ?? 'free'
}

export async function isProUser(): Promise<boolean> {
  const tier = await getUserSubscription()
  return tier === 'pro' || tier === 'lifetime'
}

export async function getInteractionChecksToday(userId: string): Promise<number> {
  const supabase = createClient()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('interaction_checks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())

  return count ?? 0
}
