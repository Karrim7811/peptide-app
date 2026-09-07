import AuthScreen from '@/components/auth/AuthScreen'
import { NEXT_PARAM, safeNext } from '@/lib/auth/next'

// `?next=` is where the gate that sent someone here wants them back. Read on
// the server and validated before the client sees it.
export default function LoginPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <AuthScreen mode="login" next={safeNext(searchParams[NEXT_PARAM])} />
}
