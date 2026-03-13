import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default async function AiChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar />
      <div className="md:ml-64">
        <main className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
