import { createClient } from '@/lib/supabase/server'
import { currentPath } from '@/lib/auth/pathname'
import { AgeGate } from '@/components/shop/AgeGate'

// The shop's sign-in wall.
//
// Karim, 2026-09-07: nobody reaches the shop without an account, and nobody
// reaches it without being told it is for adults. One layout, so the rule
// covers the catalogue, every product page, the cart, checkout and the order
// pages at once, and a new route under /shop cannot forget it.
//
// A signed-out visitor is not redirected. They see the notice in place, at
// the URL they asked for, with two ways forward: create an account (which is
// where the real check happens — a stored date of birth, CLAUDE.md §16.10) or
// sign in. Both carry this path so they land back here, not on the bench.
//
// The notice is friction before the shop, not the age check. Signup refuses
// under-18 in the form and in SQL, and createOrder() refuses again from the
// stored date before taking money. An account that predates the field is
// asked for it at checkout (see dob-actions.ts), so a signed-in visitor passes
// here regardless: the sale is where it is enforced, and that is unchanged.
//
// Reading cookies makes everything under /shop render per request. The
// checkout already did; the catalogue is small.
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <AgeGate next={currentPath('/shop')} />

  return <>{children}</>
}
