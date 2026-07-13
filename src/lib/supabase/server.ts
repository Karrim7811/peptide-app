import { createServerClient } from '@supabase/ssr'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Service-role client — bypasses RLS. SERVER-ONLY, never expose to the browser
// or a client component. Used by flows that must write on behalf of a user who
// has no active session in the request context (e.g. the Stripe webhook, which
// carries a Stripe signature, not a Supabase cookie). Without this, profile
// UPDATEs run as the anon role and are silently denied by RLS.
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — service-role operations (e.g. Stripe webhook profile updates) cannot run'
    )
  }
  return createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// Resolve both the authenticated user AND an auth-scoped Supabase client from
// either a Bearer token (mobile app) or session cookies (web). The returned
// client is bound to the caller's identity, so RLS-scoped self-reads (e.g.
// reading one's own profile tier) and inserts work regardless of auth method.
export async function getAuthenticatedContext(request: Request) {
  // Try Bearer token first (mobile app)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    return { user, supabase }
  }

  // Fall back to cookie-based auth (web)
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return { user, supabase }
  } catch {
    return { user: null, supabase }
  }
}

// Helper to get just the authenticated user from either cookies or Bearer token
export async function getAuthenticatedUser(request: Request) {
  const { user } = await getAuthenticatedContext(request)
  return user
}
