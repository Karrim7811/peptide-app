'use client'

// The vial scanner.
//
// Photograph a shelf, get a proposal. The load-bearing word is proposal:
// nothing reaches the bench until the reading has been checked and confirmed,
// and every row is editable before it does. Claude is reading a curved label
// through a fridge door, and it will sometimes be wrong.
//
// What that means concretely, and should survive any tidy-up:
//
//   • The AI provenance line is at the point of output, not in a footer.
//   • A reading that did not resolve to a library entry is still shown, with
//     the name editable and suggestions offered. Dropping it would throw away
//     a photograph someone already took.
//   • An amount that could not be parsed is blank and says so. It is never
//     pre-filled with zero, and Add stays disabled until a real figure exists.
//   • The image is sent, read and discarded. It is not stored anywhere.
//
// ── Two ways in ──────────────────────────────────────────────────────────
//
// From this device: a file picker, or the camera on a phone browser.
//
// From your phone: a QR opening a capture page tied to a single-use token that
// expires in ten minutes. That exists because the shelf is in a fridge and the
// computer usually is not. The desktop polls for the result; the phone is told
// nothing about the account. See src/lib/scan-session.ts and the ordering
// comment in the upload route, which is where the security actually lives.

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAiConsent } from '@/components/AiConsentProvider'
import { setInventory } from '@/app/dashboard/actions'
import { amountNote, libraryNote, nearestNames, parseMg, readingsFrom } from '@/lib/scan'
import type { Reading } from '@/lib/scan'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const TEAL = '#1A8A9E'
const RULE = '1px solid #1A1D1F'
const HAIR = '1px solid rgba(26,29,31,.18)'
const JOST = 'Jost, sans-serif'
const MONO = "'JetBrains Mono', monospace"

/** ~6 MB, matching the API's own bound so the refusal happens before the upload. */
const MAX_BYTES = 6 * 1024 * 1024

interface Row extends Reading {
  key: string
  editedName: string
  editedAmount: string
  added: boolean
  failure: string | null
}

export function ScannerClient({ origin }: { origin: string }) {
  const { requireConsent } = useAiConsent()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [handoff, setHandoff] = useState<{ token: string; url: string } | null>(null)
  const [waiting, setWaiting] = useState(false)
  const poll = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (poll.current) clearInterval(poll.current)
    poll.current = null
    setWaiting(false)
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  const showReadings = useCallback((raw: unknown) => {
    const readings = readingsFrom(raw)
    setRows(
      readings.map((reading, i) => ({
        ...reading,
        key: `${reading.readName}-${i}`,
        editedName: reading.compoundName ?? reading.readName,
        editedAmount: reading.mg !== null ? String(reading.mg) : '',
        added: false,
        failure: null,
      })),
    )
  }, [])

  const scan = useCallback(
    async (file: File) => {
      setError(null)

      if (!file.type.startsWith('image/')) {
        setError('That is not an image.')
        return
      }
      if (file.size > MAX_BYTES) {
        setError('That photo is over 6 MB. Take it again at a lower resolution.')
        return
      }

      const consented = await requireConsent()
      if (!consented) return

      setBusy(true)
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onerror = () => reject(new Error('could not read that file'))
          // Strip the data: prefix — the API wants raw base64.
          reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
          reader.readAsDataURL(file)
        })

        const response = await fetch('/api/scan-vials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        })

        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          setError(payload?.error ?? 'The scan failed. Try again.')
          return
        }

        // Blank rather than 0 where nothing was read. Zero is a claim.
        showReadings(payload?.vials)
      } catch {
        setError('The scan failed. Nothing was added.')
      } finally {
        setBusy(false)
      }
    },
    [requireConsent, showReadings],
  )

  const openHandoff = useCallback(async () => {
    setError(null)
    // Consent is taken here, on the device that has an account to ask about.
    // The phone page has none and must not be the place this is decided.
    const consented = await requireConsent()
    if (!consented) return

    stopPolling()
    try {
      const response = await fetch('/api/scan-session', { method: 'POST' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.token) {
        setError(payload?.error ?? 'Could not open a capture link.')
        return
      }

      const token: string = payload.token
      setHandoff({ token, url: `${origin}/scan/${token}` })
      setWaiting(true)

      poll.current = setInterval(async () => {
        try {
          const check = await fetch(`/api/scan-session/${token}`)
          if (!check.ok) return
          const state = await check.json()
          if (state.status === 'done') {
            stopPolling()
            setHandoff(null)
            showReadings(state.vials)
          } else if (state.status === 'failed' || state.status === 'expired') {
            stopPolling()
            setError(
              state.status === 'expired'
                ? 'That capture link expired before a photo arrived.'
                : 'The photo from your phone could not be read.',
            )
          }
        } catch {
          // A dropped poll is not a failure. The next tick tries again.
        }
      }, 2500)
    } catch {
      setError('Could not open a capture link.')
    }
  }, [origin, requireConsent, showReadings, stopPolling])

  async function add(row: Row) {
    const mg = Number(row.editedAmount)
    const compoundId = row.compoundId ?? resolveEdited(row.editedName)
    if (!compoundId || !(mg > 0)) return

    setRows((current) =>
      (current ?? []).map((r) => (r.key === row.key ? { ...r, failure: null } : r)),
    )

    const result = await setInventory({
      compoundId,
      vialSizeMg: mg,
      quantityRemaining: 1,
    })

    setRows((current) =>
      (current ?? []).map((r) =>
        r.key === row.key
          ? result.ok
            ? { ...r, added: true, failure: null }
            : { ...r, failure: result.error ?? 'could not add that' }
          : r,
      ),
    )
  }

  return (
    <div style={{ padding: 'clamp(22px,3vw,40px) clamp(16px,3vw,32px) clamp(24px,3vw,40px)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
          fontFamily: JOST,
          fontSize: 10.5,
          letterSpacing: '.26em',
          textTransform: 'uppercase',
          color: TEAL,
        }}
      >
        <span>Vial scanner</span>
        <span style={{ color: INK3 }}>Pro · nothing added until you confirm</span>
      </div>

      <h1
        style={{
          margin: '14px 0 0',
          fontWeight: 300,
          fontSize: 'clamp(30px,3.6vw,46px)',
          lineHeight: 1,
          letterSpacing: '-.028em',
        }}
      >
        Photograph the shelf.
      </h1>
      <p
        style={{
          margin: '14px 0 0',
          fontSize: 18,
          lineHeight: 1.45,
          color: INK2,
          maxWidth: '62ch',
          textWrap: 'pretty',
        }}
      >
        One photo, however many vials are in it. Every reading comes back editable and
        goes nowhere until you add it. The photo is read and discarded — it is not
        stored.
      </p>

      <div style={{ marginTop: 24, borderTop: RULE, paddingTop: 20 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            // Reset, so photographing the same file twice still fires.
            e.target.value = ''
            if (file) void scan(file)
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          style={{
            appearance: 'none',
            border: RULE,
            background: busy ? 'transparent' : INK,
            color: busy ? INK3 : '#F4F5F6',
            fontFamily: JOST,
            fontSize: 11,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            padding: '14px 22px',
            minHeight: 44,
            borderRadius: 0,
            cursor: busy ? 'progress' : 'pointer',
          }}
        >
          {busy ? 'Reading the label…' : 'Take or choose a photo'}
        </button>
        {/* The shelf is in a fridge; the computer usually is not. */}
        <div style={{ marginTop: 22, borderTop: HAIR, paddingTop: 18 }}>
          <div
            style={{
              fontFamily: JOST,
              fontSize: 10,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: INK3,
            }}
          >
            From your phone
          </div>

          {handoff ? (
            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,220px),1fr))',
                gap: '18px 28px',
                alignItems: 'start',
              }}
            >
              <div style={{ width: 160, height: 160, border: RULE, padding: 10 }}>
                {/* Server-rendered SVG. No QR encoder ships to the browser. */}
                <img
                  src={`/api/scan-session/qr?token=${handoff.token}&url=${encodeURIComponent(handoff.url)}`}
                  alt="Scan this with your phone camera"
                  width={140}
                  height={140}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.45, maxWidth: '44ch' }}>
                  Point your phone camera at this. It opens a capture page tied to this
                  session — no sign-in on the phone, nothing installed. It works once and
                  expires in ten minutes.
                </p>
                <p
                  style={{
                    margin: '10px 0 0',
                    fontFamily: JOST,
                    fontSize: 10,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    color: waiting ? TEAL : INK3,
                  }}
                >
                  {waiting ? 'Waiting for the phone' : 'Link open'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    stopPolling()
                    setHandoff(null)
                  }}
                  style={{
                    marginTop: 12,
                    appearance: 'none',
                    border: RULE,
                    background: 'transparent',
                    color: INK,
                    fontFamily: JOST,
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    padding: '10px 14px',
                    minHeight: 40,
                    borderRadius: 0,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={openHandoff}
                style={{
                  appearance: 'none',
                  border: RULE,
                  background: 'transparent',
                  color: INK,
                  fontFamily: JOST,
                  fontSize: 10.5,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  padding: '12px 16px',
                  minHeight: 44,
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
              >
                Show a QR for my phone
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 16, color: INK2, maxWidth: '52ch' }}>
                For when the vials are in the fridge and this screen is not.
              </p>
            </div>
          )}
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 16, color: INK2 }}>
          On a phone this opens the camera. On a desktop it opens a file picker. Or skip
          it and{' '}
          <Link href="/dashboard" style={{ color: INK, textDecoration: 'underline' }}>
            type the vial in on the bench
          </Link>
          .
        </p>

        {error && (
          <p
            style={{
              margin: '16px 0 0',
              fontSize: 17,
              lineHeight: 1.4,
              borderLeft: `2px solid ${INK}`,
              paddingLeft: 12,
            }}
          >
            {error} Nothing was added.
          </p>
        )}
      </div>

      {rows && (
        <div style={{ marginTop: 28 }}>
          {/* Provenance at the point of output, not in a footer. */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              fontFamily: JOST,
              fontSize: 9.5,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: INK3,
              borderBottom: RULE,
              paddingBottom: 8,
            }}
          >
            <span style={{ color: TEAL }}>
              AI read · Claude vision · nothing added until you confirm
            </span>
            <span>
              {rows.length} {rows.length === 1 ? 'reading' : 'readings'}
            </span>
          </div>

          {rows.length === 0 && (
            <p style={{ margin: '16px 0 0', fontSize: 17, fontStyle: 'italic', color: INK2 }}>
              No vials were legible in that photo. Try again closer, or with the label
              square to the camera.
            </p>
          )}

          {rows.map((row) => (
            <ReadingRow
              key={row.key}
              row={row}
              onChange={(patch) =>
                setRows((current) =>
                  (current ?? []).map((r) => (r.key === row.key ? { ...r, ...patch } : r)),
                )
              }
              onAdd={() => void add(row)}
            />
          ))}
        </div>
      )}

      <p
        style={{
          margin: '28px 0 0',
          fontSize: 15.5,
          lineHeight: 1.5,
          color: INK2,
          maxWidth: '68ch',
          textWrap: 'pretty',
        }}
      >
        A label read from a photograph is a reading, not a record. Check it against the
        vial in your hand before you rely on it. For research and reference purposes
        only; not dosing instructions, and not for human consumption. Adults 18+.
      </p>
    </div>
  )
}

function resolveEdited(name: string): string | null {
  const [suggestion] = nearestNames(name, 1)
  if (!suggestion) return null
  const readings = readingsFrom([{ name: suggestion }])
  return readings[0]?.compoundId ?? null
}

function ReadingRow({
  row,
  onChange,
  onAdd,
}: {
  row: Row
  onChange: (patch: Partial<Row>) => void
  onAdd: () => void
}) {
  const mg = parseMg(`${row.editedAmount} mg`)
  const resolved = row.compoundId ?? resolveEdited(row.editedName)
  const ready = Boolean(resolved) && mg !== null && !row.added

  return (
    <div style={{ padding: '16px 0', borderBottom: HAIR }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,180px),1fr))',
          gap: '12px 20px',
          alignItems: 'end',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Legend>Peptide</Legend>
          <input
            value={row.editedName}
            onChange={(e) => onChange({ editedName: e.target.value })}
            style={FIELD}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Legend>Amount · mg</Legend>
          <input
            value={row.editedAmount}
            onChange={(e) => onChange({ editedAmount: e.target.value })}
            inputMode="decimal"
            placeholder="—"
            style={{ ...FIELD, fontFamily: MONO }}
          />
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={onAdd}
            disabled={!ready}
            style={{
              appearance: 'none',
              border: RULE,
              background: ready ? INK : 'transparent',
              color: ready ? '#F4F5F6' : INK3,
              fontFamily: JOST,
              fontSize: 10.5,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              padding: '12px 16px',
              minHeight: 44,
              borderRadius: 0,
              cursor: ready ? 'pointer' : 'not-allowed',
              opacity: ready ? 1 : 0.4,
            }}
          >
            {row.added ? 'On the bench' : 'Add to the bench'}
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          display: 'grid',
          gridTemplateColumns: 'minmax(0,110px) minmax(0,1fr)',
          gap: '6px 14px',
          fontSize: 15,
          lineHeight: 1.4,
        }}
      >
        <Legend>As read</Legend>
        <span style={{ fontFamily: MONO, fontSize: 13, color: INK2 }}>
          {row.readName}
          {row.readAmount ? ` · ${row.readAmount}` : ''}
        </span>
        <Legend>Amount</Legend>
        <span style={{ color: mg === null ? INK3 : INK2 }}>{amountNote(row)}</span>
        <Legend>In the library</Legend>
        <span style={{ color: resolved ? INK2 : INK3 }}>
          {resolved ? libraryNote(row) : 'Not matched — correct the name to add it'}
        </span>
        {row.notes && (
          <>
            <Legend>Also read</Legend>
            <span style={{ color: INK2 }}>{row.notes}</span>
          </>
        )}
      </div>

      {row.failure && (
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 15.5,
            borderLeft: `2px solid ${INK}`,
            paddingLeft: 10,
          }}
        >
          {row.failure}
        </p>
      )}
    </div>
  )
}

const FIELD: React.CSSProperties = {
  height: 44,
  padding: '0 12px',
  border: '1px solid rgba(26,29,31,.45)',
  background: '#F4F5F6',
  fontSize: 17,
  borderRadius: 0,
  color: INK,
  minWidth: 0,
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: JOST,
        fontSize: 10,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        color: INK3,
      }}
    >
      {children}
    </span>
  )
}
