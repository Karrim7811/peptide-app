import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'
import CortexStrip from '@/components/CortexStrip'

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Sidebar />
      <div className="md:ml-[256px]">
        <TopBar />
        <CortexStrip />
        <main className="max-w-7xl mx-auto px-6 py-6 pb-24 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
