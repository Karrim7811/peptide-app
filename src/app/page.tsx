'use client'
import { useSceneMode } from './_landing/_lib/useSceneMode'
import { useReveal } from './_landing/_lib/useReveal'
import ParticleNetwork from './_landing/_lib/ParticleNetwork'
import Nav from './_landing/Nav'
import Hero from './_landing/Hero'
import ProductProof from './_landing/ProductProof'
import Corpus from './_landing/Corpus'
import Mechanisms from './_landing/Mechanisms'
import PeptideNodes from './_landing/PeptideNodes'
import Synthesis from './_landing/Synthesis'
import Terminal from './_landing/Terminal'
import Checker from './_landing/Checker'
import Stacks from './_landing/Stacks'
import Bloodwork from './_landing/Bloodwork'
import Chat from './_landing/Chat'
import Trust from './_landing/Trust'
import Pricing from './_landing/Pricing'
import FinalCta from './_landing/FinalCta'
import Footer from './_landing/Footer'

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
      <ProductProof />
      <Corpus />
      <Mechanisms />
      <PeptideNodes />
      <Synthesis />
      <Terminal />
      <Checker />
      <Stacks />
      <Bloodwork />
      <Chat />
      <Trust />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  )
}
