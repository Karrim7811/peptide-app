export type SubscriptionTier = 'free' | 'pro' | 'lifetime'

export interface Profile {
  id: string
  email: string
  created_at: string
  subscription_tier: SubscriptionTier
  subscription_expires_at: string | null
  stripe_customer_id: string | null
}

export interface StackItem {
  id: string
  user_id: string
  name: string
  type: 'peptide' | 'medication' | 'supplement'
  dose: string
  unit: string
  notes: string
  active: boolean
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  stack_item_id: string
  stack_item?: StackItem
  time: string // HH:MM
  days_of_week: number[] // 0=Sun..6=Sat
  dose: string
  active: boolean
  created_at: string
}

export interface DoseLog {
  id: string
  user_id: string
  stack_item_id: string
  stack_item?: StackItem
  taken_at: string
  dose: string
  notes: string
  created_at: string
}
