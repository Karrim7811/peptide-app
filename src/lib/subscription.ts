import { createClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types'

export const FREE_LIMITS = {
  stackItems: 5,
  interactionChecksPerDay: 3,
  reminderCount: 3,
  aiChatEnabled: true,
} as const

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
