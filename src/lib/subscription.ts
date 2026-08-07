import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedContext } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types'

// Pure predicates and limits live in tier.ts so client code can import them
// without dragging next/headers along. Re-exported here for existing callers.
import { resolveTier, isProTier, FREE_LIMITS } from '@/lib/tier'
export { resolveTier, isProTier, FREE_LIMITS }

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
