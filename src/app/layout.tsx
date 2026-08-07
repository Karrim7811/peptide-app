import type { Metadata, Viewport } from 'next'
import type { CSSProperties } from 'react'
import './globals.css'
import AiConsentProvider from '@/components/AiConsentProvider'
import GroundProvider from '@/components/GroundProvider'
import { DEFAULT_GROUND, groundVars } from '@/lib/design/grounds'

export const metadata: Metadata = {
  title: 'Peptide Cortex',
  description: 'AI-Powered Peptide Research Companion — organize, reference, and explore your peptide protocol. For educational purposes only — not medical advice.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://peptidecortex.com'),
  openGraph: {
    title: 'Peptide Cortex',
    description: 'AI-Powered Peptide Research Companion — organize, reference, and explore your peptide protocol. For educational purposes only — not medical advice.',
    url: 'https://peptidecortex.com',
    siteName: 'Peptide Cortex',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peptide Cortex',
    description: 'AI-Powered Peptide Research Companion — organize, reference, and explore your peptide protocol. For educational purposes only — not medical advice.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Peptide Cortex',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FAFAF8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Midnight is server-rendered inline so the first paint is already correct;
    // GroundProvider only takes over on hydration. Legacy light-theme routes are
    // unaffected — they read the separate --cx-* variables in globals.css.
    <html lang="en" style={groundVars(DEFAULT_GROUND) as CSSProperties}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && !window.Capacitor) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(){});
                });
              }
            `,
          }}
        />
      </head>
      <body style={{ background: '#FAFAF8', color: '#1A1915' }}>
        <GroundProvider>
          <AiConsentProvider>
            {children}
          </AiConsentProvider>
        </GroundProvider>
      </body>
    </html>
  )
}
