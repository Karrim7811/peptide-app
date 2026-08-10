export interface Tenant {
  id: string
  user_id: string | null
  email: string
  full_name: string
  unit: string
  monthly_rent_cents: number
  rent_due_day: number
  active: boolean
  stripe_customer_id: string | null
  created_at: string
}

export type PaymentStatus = 'processing' | 'succeeded' | 'failed'

export interface Payment {
  id: string
  tenant_id: string
  amount_cents: number
  period: string // 'YYYY-MM'
  status: PaymentStatus
  stripe_session_id: string
  stripe_payment_intent_id: string | null
  paid_at: string | null
  created_at: string
}

export type ServiceRequestStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled'
export type ServiceRequestCategory =
  | 'plumbing'
  | 'electrical'
  | 'appliance'
  | 'hvac'
  | 'pest'
  | 'general'

export interface ServiceRequest {
  id: string
  tenant_id: string
  category: ServiceRequestCategory
  title: string
  description: string
  status: ServiceRequestStatus
  created_at: string
  updated_at: string
}

export interface AdminServiceRequestRow extends ServiceRequest {
  tenants: Pick<Tenant, 'full_name' | 'unit' | 'email'> | null
}

export interface AdminTenantRow extends Tenant {
  current_period_status: PaymentStatus | 'unpaid'
}

export interface AdminPaymentRow extends Payment {
  tenants: Pick<Tenant, 'full_name' | 'unit' | 'email'> | null
}
