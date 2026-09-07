// Requesting a reset link.
//
// Separate from /reset-password, which is where the emailed link LANDS and
// where a new password is actually set. One URL showing two different forms
// depending on whether a recovery session happens to exist is a route that is
// hard to reason about and harder to link to.

import AuthScreen from '@/components/auth/AuthScreen'
import { NEXT_PARAM, safeNext } from '@/lib/auth/next'

export const metadata = { title: 'Reset your password · Peptide Cortex' }

export default function ForgotPasswordPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <AuthScreen mode="reset" next={safeNext(searchParams[NEXT_PARAM])} />
}
