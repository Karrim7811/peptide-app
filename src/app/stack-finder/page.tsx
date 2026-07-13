import { redirect } from 'next/navigation'
import { isProUser } from '@/lib/subscription'
import StackFinderClient from './StackFinderClient'

// Stack Finder is Pro-only. Server-side gate redirects free users to /upgrade.
// The /api/stack-finder route also enforces Pro server-side as defence in depth.
export default async function Page() {
  if (!(await isProUser())) {
    redirect('/upgrade')
  }
  return <StackFinderClient />
}
