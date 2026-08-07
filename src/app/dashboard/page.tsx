// The Mirror. Server shell: loads the user's live rows, hands them to the
// client surface. See MirrorClient.tsx for the surface itself and
// src/lib/mirror/load.ts for how the live schema maps onto the view model.

import MirrorClient from './MirrorClient'
import { loadMirrorData } from '@/lib/mirror/load'

// The stack changes as the user logs doses, so this must not be cached across
// requests. The Server Actions in actions.ts revalidate this path on write.
export const dynamic = 'force-dynamic'

export default async function MirrorPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const data = await loadMirrorData()
  return <MirrorClient data={data} params={flattenParams(searchParams)} />
}

function flattenParams(
  params?: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === 'string') out[key] = value
    else if (Array.isArray(value) && value[0]) out[key] = value[0]
  }
  return out
}
