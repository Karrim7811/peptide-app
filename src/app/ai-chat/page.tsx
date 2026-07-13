import { redirect } from 'next/navigation'
import { isProUser } from '@/lib/subscription'
import AiChatClient from './AiChatClient'

// Cortex AI chat is Pro-only. Server-side gate redirects free users to /upgrade.
// The /api/chat route also enforces Pro server-side as defence in depth.
export default async function Page() {
  if (!(await isProUser())) {
    redirect('/upgrade')
  }
  return <AiChatClient />
}
