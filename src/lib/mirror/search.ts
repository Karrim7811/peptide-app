import { COMPOUND_LIST, type Compound } from '@/lib/catalog'

const MAX_RESULTS = 8

/** Name search over the library: prefix matches first, then substring (name or full name). */
export function matchCompounds(query: string): Compound[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const starts = COMPOUND_LIST.filter((c) => c.name.toLowerCase().startsWith(q))
  const contains = COMPOUND_LIST.filter(
    (c) =>
      !c.name.toLowerCase().startsWith(q) &&
      (c.name.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q)),
  )
  return [...starts, ...contains].slice(0, MAX_RESULTS)
}
