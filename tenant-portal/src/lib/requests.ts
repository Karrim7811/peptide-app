import type { ServiceRequestCategory, ServiceRequestStatus } from '@/types'

export const CATEGORY_LABELS: Record<ServiceRequestCategory, string> = {
  general: 'General',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  appliance: 'Appliance',
  hvac: 'Heating / Cooling',
  pest: 'Pest control',
}

export const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
}
