import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

// Long-form compound reference guides — editorial documents rather than tools.
//
// They sit in the Sidebar's Reference section next to the Peptide Bible, so the
// legacy Sidebar / MobileNav chrome stays. TopBar and CortexStrip do NOT: each
// guide carries its own masthead (wordmark + section label), and stacking a
// second light-theme header on top of it just repeats the branding twice.
//
// Unlike its Reference siblings this surface is `cx-surface` and reads the
// Mirror ground tokens (--bg / --ink / --dim / --hue-*), so it follows whichever
// ground the user last chose on the Mirror rather than pinning its own palette.
// See src/lib/design/grounds.ts.
export default async function GuidesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Sidebar />
      <MobileNav />
      <div className="md:ml-[256px]">
        {/* pt-20 clears the 56px mobile header plus its safe-area inset, matching
            the other Reference routes' layouts. */}
        <main className="cx-surface min-h-screen bg-ground pt-20 font-sans text-ink md:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
