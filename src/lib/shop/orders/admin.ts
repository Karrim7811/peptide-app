// Guards for the admin queue.
//
// Packing is the only moment the physical vial and the database touch. Every
// other status change is bookkeeping; this one records which batch actually left
// the shelf, and it is the whole basis of the recall path. If an item can be
// packed without a lot, order_items.lot_id is decorative — and you would only
// discover that on the day you needed to know who received a bad batch.
//
// Note that four launch SKUs currently carry no lot code at all. Orders for
// those cannot be packed through this guard until Karim supplies one, which is
// the correct behaviour rather than an obstacle.

export interface PackableItem {
  id: string
  productId: string
  qty: number
}

export function validatePackAssignment(
  items: PackableItem[],
  lotByItem: Record<string, string>,
): void {
  if (items.length === 0) throw new Error('order has no items to pack')

  const assigned = Object.keys(lotByItem)
  if (assigned.length === 0) throw new Error('no lots assigned')

  // A blank lot id is a missing lot wearing a disguise — treat it as missing.
  const missing = items
    .filter((item) => !lotByItem[item.id] || lotByItem[item.id].trim() === '')
    .map((item) => item.id)
  if (missing.length > 0) {
    throw new Error(`no lot assigned for item(s): ${missing.join(', ')}`)
  }

  const known = new Set(items.map((item) => item.id))
  const unknown = assigned.filter((id) => !known.has(id))
  if (unknown.length > 0) {
    throw new Error(`item(s) not on this order: ${unknown.join(', ')}`)
  }
}
