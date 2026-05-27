import type { Metadata } from 'next'
import SmoothScroll from '@/components/peptides/SmoothScroll'

// Standalone layout for the apothecary specimen-sheet routes.
// Deliberately bypasses Sidebar/TopBar/CortexStrip — these pages are a
// public visual surface with their own atmosphere. No auth gate yet.

export const metadata: Metadata = {
  title: 'Specimen — Peptide Cortex',
}

export default function PeptidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-apo-cream text-apo-ink antialiased">
      <SmoothScroll />
      {children}
    </div>
  )
}
