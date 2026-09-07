'use client'

// The phone half of the hand-off.
//
// One button, one photo, one outcome. Written for someone standing at an open
// fridge holding a phone in one hand, so the target is large, the states are
// few, and nothing needs reading twice.
//
// It shows nothing about the account and asks for nothing. There is no sign-in
// and no consent dialog here — both were settled on the desktop when the link
// was created, because this page has no account context to ask about.
//
// A failure is terminal by design. The token is single-use, so "try again"
// would be a lie; the copy sends the reader back to the desktop for a new link.

import { useCallback, useRef, useState } from 'react'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const TEAL = '#1A8A9E'
const JOST = 'Jost, sans-serif'

/** ~6 MB, matching the endpoint, so the refusal happens before the upload. */
const MAX_BYTES = 6 * 1024 * 1024

type Stage = 'idle' | 'sending' | 'sent' | 'failed'

export function ScanCapture({ token }: { token: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('That is not an image.')
        setStage('failed')
        return
      }
      if (file.size > MAX_BYTES) {
        setError('That photo is over 6 MB. Take it again at a lower resolution.')
        setStage('failed')
        return
      }

      setStage('sending')
      setError(null)
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onerror = () => reject(new Error('unreadable'))
          reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
          reader.readAsDataURL(file)
        })

        const response = await fetch(`/api/scan-session/${token}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          setError(payload?.error ?? 'That did not send.')
          setStage('failed')
          return
        }
        setStage('sent')
      } catch {
        setError('That did not send.')
        setStage('failed')
      }
    },
    [token],
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#E6E9EB',
        color: INK,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        padding: 'clamp(24px,6vw,48px) clamp(18px,5vw,32px)',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL }} />
        <span style={{ fontWeight: 500, fontSize: 15, letterSpacing: '.22em' }}>
          PEPTIDE CORTEX
        </span>
      </div>

      {stage === 'sent' ? (
        <div style={{ marginTop: 'clamp(32px,12vw,72px)' }}>
          <h1
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: 'clamp(34px,9vw,52px)',
              lineHeight: 1,
              letterSpacing: '-.028em',
            }}
          >
            Sent.
          </h1>
          <p style={{ margin: '18px 0 0', fontSize: 21, lineHeight: 1.4, maxWidth: '30ch' }}>
            The readings are on the computer you scanned this from. You can put the phone
            down.
          </p>
          <p style={{ margin: '16px 0 0', fontSize: 16, color: INK2, maxWidth: '34ch' }}>
            Nothing is added to your bench until you check it there. This link is now used
            up.
          </p>
        </div>
      ) : stage === 'failed' ? (
        <div style={{ marginTop: 'clamp(32px,12vw,72px)' }}>
          <h1
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: 'clamp(30px,8vw,46px)',
              lineHeight: 1.05,
              letterSpacing: '-.028em',
              maxWidth: '18ch',
            }}
          >
            That did not go through.
          </h1>
          <p style={{ margin: '18px 0 0', fontSize: 19, lineHeight: 1.4, maxWidth: '34ch' }}>
            {error}
          </p>
          {/* No retry button. The link is single-use, so offering one would be
              a lie the second tap would expose. */}
          <p style={{ margin: '16px 0 0', fontSize: 16, color: INK2, maxWidth: '34ch' }}>
            Open the scanner on your computer again for a fresh link.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 'clamp(28px,10vw,60px)' }}>
          <h1
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: 'clamp(32px,9vw,52px)',
              lineHeight: 1,
              letterSpacing: '-.028em',
              maxWidth: '16ch',
            }}
          >
            Photograph the shelf.
          </h1>
          <p style={{ margin: '18px 0 0', fontSize: 19, lineHeight: 1.4, maxWidth: '32ch' }}>
            One photo, however many vials are in it. Get the labels square to the camera and
            close enough to read.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void send(file)
            }}
          />

          <button
            type="button"
            disabled={stage === 'sending'}
            onClick={() => fileRef.current?.click()}
            style={{
              marginTop: 28,
              width: '100%',
              maxWidth: 420,
              appearance: 'none',
              border: `1px solid ${INK}`,
              background: stage === 'sending' ? 'transparent' : INK,
              color: stage === 'sending' ? INK3 : '#F4F5F6',
              fontFamily: JOST,
              fontSize: 12,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              // Deliberately large: this is tapped one-handed at a fridge.
              padding: '22px 24px',
              minHeight: 64,
              borderRadius: 0,
              cursor: stage === 'sending' ? 'progress' : 'pointer',
            }}
          >
            {stage === 'sending' ? 'Sending…' : 'Take the photo'}
          </button>

          <p style={{ margin: '20px 0 0', fontSize: 15.5, color: INK2, maxWidth: '34ch' }}>
            The photo is read and discarded. It is not stored, and this link works once.
          </p>
        </div>
      )}

      <p
        style={{
          marginTop: 'auto',
          paddingTop: 40,
          fontSize: 13.5,
          lineHeight: 1.5,
          color: INK3,
          maxWidth: '40ch',
        }}
      >
        A label read from a photograph is a reading, not a record. For research and
        reference purposes only. Adults 18+.
      </p>
    </div>
  )
}
