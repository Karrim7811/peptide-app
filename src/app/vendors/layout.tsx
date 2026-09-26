import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginUrl } from '@/lib/auth/next'
import { currentPath } from '@/lib/auth/pathname'
import { LibraryChrome } from '@/components/library/LibraryChrome'

// Vendor directory: part of the library.
//
// Moved off the legacy Sidebar / MobileNav / TopBar frame onto LibraryChrome
// (2026-09-26) so this page carries the same Bench · Library · Shop menu as
// the rest of the site. The page body is unchanged; the container below keeps
// the width and padding the old frame gave it.
export default async function VendorsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(loginUrl(currentPath('/vendors')))
  return (
    <LibraryChrome signedIn>
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 font-sans md:px-6">{children}</div>
    </LibraryChrome>
  )
}
