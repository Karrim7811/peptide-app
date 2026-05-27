import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export default function PeptidesV2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={jetbrainsMono.variable}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#EDE3D0',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  )
}
