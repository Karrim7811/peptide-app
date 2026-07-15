'use client'

import { useState } from 'react'
import { CX } from './_lib/tokens'

// Ports the `#product` section from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 72).
//
// "Product Proof" — the demo video slot the nav's "Product" link (`#product`)
// scrolls to. No `data-mode` scene canvas is driven by this section (the
// prototype marks `data-mode="5"` but z-index:2 content sits above the
// canvas regardless). The play button's glow is a real hover state (React
// state in place of the prototype's inline onmouseover/onmouseout).
export default function ProductProof() {
  const [playHover, setPlayHover] = useState(false)

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
          aspectRatio: '16 / 8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
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
          <div
            onMouseEnter={() => setPlayHover(true)}
            onMouseLeave={() => setPlayHover(false)}
            style={{
              width: 74,
              height: 74,
              border: `1px solid ${CX.cy}`,
              borderRadius: '50%',
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
              style={{
                width: 0,
                height: 0,
                borderLeft: `16px solid ${CX.cy}`,
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                marginLeft: 5,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: CX.dim,
            }}
          >
            Watch the 90-second walkthrough
          </div>
        </div>
      </div>
    </section>
  )
}
