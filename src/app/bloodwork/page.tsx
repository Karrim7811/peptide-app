import { redirect } from 'next/navigation'
import { isProUser } from '@/lib/subscription'
import BloodworkClient from './BloodworkClient'

// Bloodwork Analyzer is Pro-only. Server-side gate redirects free users to
// /upgrade. The /api/bloodwork-* routes also enforce Pro server-side.
export default async function Page() {
  if (!(await isProUser())) {
    redirect('/upgrade')
  }
  return <BloodworkClient />
}
