import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LibraryChrome } from '@/components/library/LibraryChrome'

// Long-form compound reference guides — editorial documents rather than tools.
//
// They belong to the library, so since 2026-09-26 they sit inside
// LibraryChrome and carry the site's one menu (Bench · Library · Shop) in
// place of the legacy Sidebar / MobileNav. Each guide still draws its own
// masthead below that header; the header is the way out, the masthead is the
// document's title block.
//
// Unlike its library siblings this surface is `cx-surface` and reads the
// ground tokens (--bg / --ink / --dim / --hue-*) from the global
// GroundProvider rather than pinning its own palette. See
// src/lib/design/grounds.ts.
export default async function GuidesLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <LibraryChrome signedIn>
      <div className="cx-surface min-h-full bg-ground font-sans text-ink">{children}</div>
    </LibraryChrome>
  )
}
