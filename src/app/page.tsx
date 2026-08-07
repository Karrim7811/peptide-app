import Nav from '@/components/home/Nav'
import Hero from '@/components/home/Hero'
import HowItWorks from '@/components/home/HowItWorks'
import Library from '@/components/home/Library'
import Trust from '@/components/home/Trust'
import Pricing from '@/components/home/Pricing'
import Footer from '@/components/home/Footer'

// Marketing Home — "the Mirror" redesign.
//
// Replaces the old `_landing/` implementation (16 components, kept in the
// tree for reference, no longer imported here). Source of truth:
// design_handoff_peptide_cortex/Peptide Cortex Home.dc.html — read for exact
// layout, colour, copy and motion, then rebuilt as idiomatic React/Tailwind
// against the ground-token design system (src/lib/design/grounds.ts).
export default function HomePage() {
  return (
    <div className="cx-surface min-h-screen overflow-x-hidden bg-ground font-sans text-ink">
      <Nav />
      <Hero />
      <HowItWorks />
      <Library />
      <Trust />
      <Pricing />
      <Footer />
    </div>
  )
}
