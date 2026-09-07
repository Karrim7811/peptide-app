'use client'

// The buttons the order queue was missing.
//
// `markPaid`, `markPacked` and `markShipped` have existed, guarded and tested,
// since the shop was built — but nothing imported them. The queue rendered
// three read-only columns, so a Zelle payment could be seen and never
// confirmed, and the handoff's claim that SHOP_ADMIN_USER_ID was the only thing
// between here and a shipped order was wrong: with the variable set there was
// still no way to advance anything.
//
// Every guard stays where it was. This file decides nothing: `assertAdmin` runs
// server-side on each action, `canTransition` decides which moves are legal,
// and `validatePackAssignment` refuses a pack with a missing lot. What is here
// is the form, the pending state and the error line.
//
// ── Errors are inline, never a toast ──────────────────────────────────────
//
// An action can fail for a reason the operator must read and act on — a lost
// update ("reload and try again"), an unpacked lot, a product whose lot code
// does not exist yet. A toast that disappears in four seconds is the wrong
// surface for any of those, and the shop's conventions say feedback is inline
// text beside the control.

import { useState, useTransition } from 'react'
import { markPaid, markPacked, markShipped } from './actions'

interface OrderItem {
  id: string
  productName: string
  sizeDisplay: string
  qty: number
  /** Lots for this item's product that carry a code, so can be packed. */
  lots: Array<{ id: string; label: string }>
}

function Pending({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs text-cx-stone">{children}</span>
}

function Failure({ message }: { message: string }) {
  return (
    <p className="mt-2 border-l-2 border-cx-black pl-2 text-xs leading-relaxed text-cx-dark">
      {message}
    </p>
  )
}

const BUTTON =
  'mt-2 inline-flex min-h-[44px] items-center border border-cx-black bg-cx-black px-4 font-sans text-[11px] uppercase tracking-[0.18em] text-cx-parchment disabled:opacity-40'

/** Zelle only: the reference has been matched against the bank by hand. */
export function MarkPaid({ orderId, reference }: { orderId: string; reference: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Two clicks, because this one asserts money arrived. There is no undo:
  // `paid` cannot go back to `awaiting_payment` in the status machine.
  if (!confirming) {
    return (
      <button type="button" className={BUTTON} onClick={() => setConfirming(true)}>
        Mark paid
      </button>
    )
  }

  return (
    <div>
      <p className="mt-2 text-xs leading-relaxed text-cx-dark">
        Confirm <span className="font-mono">{reference}</span> is on the bank statement for the
        full amount. This cannot be undone.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={BUTTON}
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null)
              try {
                await markPaid(orderId)
              } catch (failure) {
                setError(failure instanceof Error ? failure.message : String(failure))
              }
            })
          }
        >
          {pending ? 'Working…' : 'Yes, it arrived'}
        </button>
        <button
          type="button"
          className="mt-2 min-h-[44px] font-sans text-[11px] uppercase tracking-[0.18em] text-cx-stone"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
      {error && <Failure message={error} />}
    </div>
  )
}

/**
 * Records which lot physically left the shelf, per item, then advances.
 *
 * A product whose lot has no code offers nothing to pick — four launch SKUs are
 * in that state. The select says so rather than rendering an empty dropdown,
 * because "no lot yet" is a fact about the batch, not a UI failure.
 */
export function MarkPacked({ orderId, items }: { orderId: string; items: OrderItem[] }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [lotByItem, setLotByItem] = useState<Record<string, string>>({})

  const unpackable = items.filter((item) => item.lots.length === 0)
  const allAssigned = items.every((item) => (lotByItem[item.id] ?? '').trim() !== '')

  return (
    <div className="mt-3 border-t border-cx-light pt-3">
      <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-cx-stone">
        Lot per item
      </p>

      {items.map((item) => (
        <label key={item.id} className="mt-2 block">
          <span className="text-xs text-cx-dark">
            {item.productName} · {item.sizeDisplay} × {item.qty}
          </span>
          {item.lots.length === 0 ? (
            <span className="mt-1 block font-mono text-xs text-cx-stone">
              no lot code on file — cannot be packed
            </span>
          ) : (
            <select
              className="mt-1 block w-full border border-cx-light bg-white px-2 py-2 font-mono text-xs"
              value={lotByItem[item.id] ?? ''}
              onChange={(event) =>
                setLotByItem((current) => ({ ...current, [item.id]: event.target.value }))
              }
            >
              <option value="">— pick the lot that shipped —</option>
              {item.lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.label}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}

      <button
        type="button"
        className={BUTTON}
        disabled={pending || !allAssigned || unpackable.length > 0}
        onClick={() =>
          start(async () => {
            setError(null)
            try {
              await markPacked(orderId, lotByItem)
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : String(failure))
            }
          })
        }
      >
        {pending ? 'Working…' : 'Mark packed'}
      </button>

      {/* Rendered, never removed, with the reason beside it — the shop's
          convention for a disabled control. */}
      {unpackable.length > 0 && (
        <Failure
          message={`${unpackable.length} item(s) have no lot code on file. Add the code before this order can be packed — it is the recall path, not a formality.`}
        />
      )}
      {unpackable.length === 0 && !allAssigned && !pending && (
        <Pending>Pick a lot for every item.</Pending>
      )}
      {error && <Failure message={error} />}
    </div>
  )
}

export function MarkShipped({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tracking, setTracking] = useState('')

  return (
    <div className="mt-3 border-t border-cx-light pt-3">
      <label className="block">
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-cx-stone">
          USPS tracking
        </span>
        <input
          value={tracking}
          onChange={(event) => setTracking(event.target.value)}
          placeholder="9400 1000 0000 0000 0000 00"
          className="mt-1 block w-full border border-cx-light bg-white px-2 py-2 font-mono text-xs"
        />
      </label>
      <button
        type="button"
        className={BUTTON}
        disabled={pending || tracking.trim() === ''}
        onClick={() =>
          start(async () => {
            setError(null)
            try {
              await markShipped(orderId, tracking)
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : String(failure))
            }
          })
        }
      >
        {pending ? 'Working…' : 'Mark shipped'}
      </button>
      {/* markShipped stores null for a blank string, which would leave a
          shipped order with no way to find the parcel. Require it here. */}
      {tracking.trim() === '' && !pending && (
        <Pending>A tracking number is required to mark this shipped.</Pending>
      )}
      {error && <Failure message={error} />}
    </div>
  )
}
