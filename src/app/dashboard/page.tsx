// The Mirror. Server shell: loads the user's live rows, hands them to the
// client surface. See MirrorClient.tsx for the surface itself and
// src/lib/mirror/load.ts for how the live schema maps onto the view model.

import MirrorClient from './MirrorClient'
import { loadMirrorData } from '@/lib/mirror/load'

// The stack changes as the user logs doses, so this must not be cached across
// requests. The Server Actions in actions.ts revalidate this path on write.
export const dynamic = 'force-dynamic'

export default async function MirrorPage() {
  const data = await loadMirrorData()
  return <MirrorClient data={data} />
}
