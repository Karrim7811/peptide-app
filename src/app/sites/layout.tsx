import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default async function SitesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Sidebar />
      <div className="md:ml-[240px]">
        <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
