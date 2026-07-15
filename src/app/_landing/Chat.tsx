'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CX, prefersReducedMotion } from './_lib/tokens'
import { CHAT_QA, CHAT_FALLBACK } from './_lib/samples'

// Ports `#ai` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 218,
// logic in `buildChat()` ~line 526).
//
// LABELED SAMPLE SURFACE — this is a public, logged-out demo. Answers are
// looked up client-side from the fixture map in `_lib/samples.ts`
// (`CHAT_QA` / `CHAT_FALLBACK`). There is no `fetch` here and there must
// never be one; the real, authenticated Cortex AI chat lives at `/ai-chat`
// and calls `/api/chat`.

const MONO = "'JetBrains Mono', monospace"

const OPENING =
  "I'm Cortex — your peptide research intelligence. Ask me about any compound's mechanism, half-life, or how it's studied alongside others."

const linkStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: CX.cy,
}

interface ChatMsg {
  id: number
  who: 'user' | 'cx'
  text: string
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.who === 'user'
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        maxWidth: '86%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 26,
          height: 26,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 9,
          background: isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,229,255,0.16)',
          color: isUser ? '#cdd6e2' : CX.cy,
          border: isUser ? 'none' : '1px solid rgba(0,229,255,0.4)',
        }}
      >
        {isUser ? 'YOU' : 'CX'}
      </div>
      <div
        style={{
          fontSize: 13.5,
          lineHeight: 1.75,
          padding: '12px 16px',
          background: isUser ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
          color: isUser ? '#eaf6f8' : '#c9d3e0',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {msg.text}
      </div>
    </div>
  )
}

export default function Chat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ id: 0, who: 'cx', text: OPENING }])
  const [input, setInput] = useState('')
  const idRef = useRef(1)
  const threadRef = useRef<HTMLDivElement>(null)
  const askTimeout = useRef<ReturnType<typeof setTimeout>>()
  const typeInterval = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  useEffect(() => {
    return () => {
      if (askTimeout.current) clearTimeout(askTimeout.current)
      if (typeInterval.current) clearInterval(typeInterval.current)
    }
  }, [])

  const ask = useCallback((q: string) => {
    if (!q.trim()) return
    const answer = CHAT_QA[q] || CHAT_FALLBACK
    const userId = idRef.current++
    const cxId = idRef.current++
    setMsgs((m) => [...m, { id: userId, who: 'user', text: q }, { id: cxId, who: 'cx', text: '…' }])

    if (askTimeout.current) clearTimeout(askTimeout.current)
    if (typeInterval.current) clearInterval(typeInterval.current)

    askTimeout.current = setTimeout(() => {
      if (prefersReducedMotion()) {
        setMsgs((m) => m.map((mm) => (mm.id === cxId ? { ...mm, text: answer } : mm)))
        return
      }
      let i = 0
      typeInterval.current = setInterval(() => {
        i += 2
        const partial = answer.slice(0, i)
        setMsgs((m) => m.map((mm) => (mm.id === cxId ? { ...mm, text: partial } : mm)))
        if (i >= answer.length && typeInterval.current) {
          clearInterval(typeInterval.current)
        }
      }, 14)
    }, 420)
  }, [])

  const fire = () => {
    ask(input)
    setInput('')
  }

  return (
    <section id="ai" data-mode="5" style={{ position: 'relative', zIndex: 2, padding: '12vh clamp(20px,5vw,60px)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div data-reveal style={{ textAlign: 'center', marginBottom: 44 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              color: CX.pu,
              marginBottom: 18,
            }}
          >
            07 · Cortex AI
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 'clamp(34px,5.4vw,72px)',
              lineHeight: 1.04,
            }}
          >
            Your peptide intelligence, <span style={{ fontStyle: 'italic', color: CX.cy }}>on call.</span>
          </h2>
          <p style={{ maxWidth: '56ch', margin: '22px auto 0', fontSize: 15, color: CX.dim, lineHeight: 1.9 }}>
            Ask anything — mechanisms, half-lives, how compounds are studied together. Cortex answers from the
            literature, with your stack loaded as context. Sourced, never prescriptive.
          </p>
        </div>

        <div
          data-reveal
          style={{
            maxWidth: 820,
            margin: '0 auto',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(180deg, rgba(9,17,31,0.7), rgba(5,5,5,0.9))',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: CX.cy, boxShadow: `0 0 12px ${CX.cy}` }} />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: '#fff' }}>CORTEX AI</span>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: CX.faintest, marginLeft: 'auto' }}>
              context: your stack · 6 compounds
            </span>
          </div>

          <div
            ref={threadRef}
            style={{ height: 340, overflowY: 'auto', padding: '26px clamp(16px,3vw,30px)', display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            {msgs.map((m) => (
              <Bubble key={m.id} msg={m} />
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 clamp(16px,3vw,30px) 16px' }}>
            {Object.keys(CHAT_QA).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                style={{
                  fontFamily: MONO,
                  fontSize: 9.5,
                  letterSpacing: '0.02em',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  border: '1px solid rgba(0,229,255,0.25)',
                  background: 'rgba(0,229,255,0.05)',
                  color: CX.dim,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '14px clamp(16px,3vw,30px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <input
              type="text"
              value={input}
              placeholder="Ask Cortex about a peptide…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fire()
              }}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                outline: 'none',
                color: '#fff',
                fontSize: 13,
                padding: '13px 16px',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={fire}
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#050505',
                background: CX.cy,
                border: 'none',
                padding: '13px 26px',
                cursor: 'pointer',
              }}
            >
              Ask →
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/ai-chat" style={linkStyle}>
            Chat in the app →
          </a>
        </div>

        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            color: CX.faintest,
            marginTop: 14,
            textAlign: 'center',
            lineHeight: 1.7,
          }}
        >
          Educational reference only. Cortex cites how compounds are studied — it does not provide medical advice or
          personal dosing instructions.
        </div>
      </div>
    </section>
  )
}
