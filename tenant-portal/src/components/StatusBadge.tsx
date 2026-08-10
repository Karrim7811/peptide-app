import { STATUS_LABELS } from '@/lib/requests'
import type { ServiceRequestStatus } from '@/types'

const STYLES: Record<ServiceRequestStatus, string> = {
  open: 'bg-sky-50 text-sky-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-tp-accent/10 text-tp-accent',
  cancelled: 'bg-tp-bg text-tp-muted',
}

export default function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
