import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/checker', '/stack', '/reminders', '/log']

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname
    const isProtected = PROTECTED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    )

    if (isProtected) {
      const cookies = request.cookies.getAll()
      const hasSession = cookies.some(
        (c) => c.name.startsWith('sb-') && c.name.includes('auth-token')
      )
      if (!hasSession) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    return NextResponse.next()
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
