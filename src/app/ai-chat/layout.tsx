import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import TopBar from '@/components/TopBar'
import CortexStrip from '@/components/CortexStrip'

export default async function AiChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Sidebar />
      <MobileNav />
      <div className="md:ml-[256px]">
        <div className="hidden md:block">
          <TopBar />
          <CortexStrip />
        </div>
        <main className="max-w-4xl mx-auto px-4 md:px-6 pt-20 md:pt-6 pb-8">{children}</main>
      </div>
    </div>
  )
}
