'use client'

import { useState } from 'react'
import { CX } from './_lib/tokens'

// Ports the `#product` section from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 72),
// with the 90s product walkthrough wired into the demo-video slot per
// `design_handoff_peptide_cortex_v4/walkthrough/.../README.md` (MP4 path).
//
// "Product Proof" — the slot the nav's "Product" link (`#product`) scrolls to.
// The play button lazily swaps the placeholder for an inline <video>. Until
// `public/walkthrough.mp4` (exported from the walkthrough .dc.html) exists, the
// video errors gracefully to a "coming soon" state rather than showing a broken
// black box. Drop in `public/walkthrough.mp4` (+ `public/walkthrough-poster.jpg`)
// and it goes live with no further code change.
export default function ProductProof() {
  const [playHover, setPlayHover] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)

  return (
    <section
      id="product"
      data-mode="5"
      style={{
        position: 'relative',
        zIndex: 2,
        padding: '8vh clamp(20px,5vw,60px) 10vh',
      }}
    >
      <div
        data-reveal
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          textAlign: 'center',
          marginBottom: 34,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: CX.cy,
          }}
        >
          This is the product
        </div>
        <h2
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 200,
            fontSize: 'clamp(28px,4vw,52px)',
            lineHeight: 1.1,
            marginTop: 14,
          }}
        >
          A research terminal — not a chatbot.
        </h2>
      </div>

      {/* demo video slot */}
      <div
        data-reveal
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(180deg,rgba(9,17,31,0.6),rgba(5,5,5,0.8))',
          // 16:8 cinematic placeholder; the real walkthrough is 16:9, so switch
          // to its native ratio on play to avoid letterboxing/cropping.
          aspectRatio: playing ? '16 / 9' : '16 / 8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {playing && !videoError ? (
          <video
            src="/walkthrough.mp4"
            poster="/walkthrough-poster.jpg"
            controls
            autoPlay
            playsInline
            preload="none"
            onError={() => setVideoError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: CX.ink }}
          />
        ) : (
          <>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(rgba(0,229,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.05) 1px,transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <button
                type="button"
                aria-label="Play the product walkthrough"
                onClick={() => {
                  setVideoError(false)
                  setPlaying(true)
                }}
                onMouseEnter={() => setPlayHover(true)}
                onMouseLeave={() => setPlayHover(false)}
                style={{
                  width: 74,
                  height: 74,
                  border: `1px solid ${CX.cy}`,
                  borderRadius: '50%',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  cursor: 'pointer',
                  transition: 'box-shadow .3s',
                  boxShadow: playHover ? '0 0 40px rgba(0,229,255,0.4)' : '0 0 0 rgba(0,229,255,0)',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `16px solid ${CX.cy}`,
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    marginLeft: 5,
                  }}
                />
              </button>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: CX.dim,
                }}
              >
                {videoError ? 'Walkthrough coming soon' : 'Watch the 90-second walkthrough'}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
