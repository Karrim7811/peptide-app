import AuthScreen from '@/components/auth/AuthScreen'
import { NEXT_PARAM, safeNext } from '@/lib/auth/next'

export default function SignupPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <AuthScreen mode="signup" next={safeNext(searchParams[NEXT_PARAM])} />
}
