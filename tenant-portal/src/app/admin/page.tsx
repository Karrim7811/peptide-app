import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import Header from '@/components/Header'
import AdminPanel from './AdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  return (
    <>
      <Header email={user.email} isAdmin />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <AdminPanel />
      </main>
    </>
  )
}
