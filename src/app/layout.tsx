import type { Metadata, Viewport } from 'next'
import './globals.css'
import AiConsentProvider from '@/components/AiConsentProvider'

export const metadata: Metadata = {
  title: 'Peptide Cortex',
  description: 'AI-Powered Peptide Intelligence Engine — track, optimize, and analyze your peptide protocol.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://peptidecortex.ai'),
  openGraph: {
    title: 'Peptide Cortex',
    description: 'AI-Powered Peptide Intelligence Engine — track, optimize, and analyze your peptide protocol.',
    url: 'https://peptidecortex.ai',
    siteName: 'Peptide Cortex',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peptide Cortex',
    description: 'AI-Powered Peptide Intelligence Engine — track, optimize, and analyze your peptide protocol.',
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
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap" rel="stylesheet" />
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
        <AiConsentProvider>
          {children}
        </AiConsentProvider>
      </body>
    </html>
  )
}
