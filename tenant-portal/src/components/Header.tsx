import { Home } from 'lucide-react'
import Link from 'next/link'

export default function Header({
  email,
  isAdmin,
}: {
  email?: string | null
  isAdmin?: boolean
}) {
  const portalName = process.env.NEXT_PUBLIC_PORTAL_NAME || 'Tenant Portal'
  return (
    <header className="border-b border-tp-border bg-tp-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Home className="h-5 w-5 text-tp-accent" />
          {portalName}
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {email && (
            <Link href="/requests" className="text-tp-muted hover:text-tp-ink">
              Requests
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="text-tp-accent hover:underline">
              Admin
            </Link>
          )}
          {email && (
            <>
              <span className="hidden text-tp-muted sm:inline">{email}</span>
              <form action="/api/auth/signout" method="post">
                <button className="rounded-md border border-tp-border px-3 py-1.5 hover:bg-tp-bg">
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
