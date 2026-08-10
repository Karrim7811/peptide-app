import type { Metadata } from 'next'
import './globals.css'

const portalName = process.env.NEXT_PUBLIC_PORTAL_NAME || 'Tenant Portal'

export const metadata: Metadata = {
  title: portalName,
  description: 'Pay your rent online, securely.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
