// The phone capture page.
//
// Opened by scanning a QR on the desktop. No sign-in, nothing installed, and
// deliberately nothing about the account on it: not the email, not the bench,
// not what was recognised. Whoever holds this link can send one photograph and
// see that it sent. That is the whole surface.
//
// Server-rendered with no data fetch at all — even checking whether the token
// is live would leak whether it exists. The upload endpoint is the only thing
// that knows, and it answers in one shot.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { looksLikeToken } from '@/lib/scan-session'
import { ScanCapture } from './ScanCapture'

export const dynamic = 'force-dynamic'

// A capture link is one-use and private. It must never be indexed, and it has
// nothing worth previewing.
export const metadata: Metadata = {
  title: 'Send a photo · Peptide Cortex',
  robots: { index: false, follow: false },
}

export default function ScanPage({ params }: { params: { token: string } }) {
  if (!looksLikeToken(params.token)) notFound()
  return <ScanCapture token={params.token} />
}
