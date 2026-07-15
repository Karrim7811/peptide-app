'use client'
import { useSceneMode } from './_landing/_lib/useSceneMode'
import { useReveal } from './_landing/_lib/useReveal'
import ParticleNetwork from './_landing/_lib/ParticleNetwork'
import Nav from './_landing/Nav'
import Hero from './_landing/Hero'
import Corpus from './_landing/Corpus'
import Mechanisms from './_landing/Mechanisms'
import PeptideNodes from './_landing/PeptideNodes'
import Synthesis from './_landing/Synthesis'
import Terminal from './_landing/Terminal'
import Checker from './_landing/Checker'
import Footer from './_landing/Footer'
// (Task 7–8 imports added as those sections land)

export default function LandingPage() {
  const mode = useSceneMode()
  useReveal()
  return (
    <div style={{ position: 'relative', background: '#050505', minHeight: '100vh' }}>
      <ParticleNetwork mode={mode} />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 30%, transparent 55%, rgba(5,5,5,0.6) 100%)',
        }}
      />
      <Nav mode={mode} />
      <Hero />
      <Corpus />
      <Mechanisms />
      <PeptideNodes />
      <Synthesis />
      <Terminal />
      <Checker />
      {/* Task 7: <Stacks/> <Bloodwork/> <Chat/> */}
      {/* Task 8: <Trust/> <Pricing/> <FinalCta/> */}
      <Footer />
    </div>
  )
}
