// Bloodwork, across panels.
//
// One panel is a snapshot. Four is a trend, and the trend is most of the value.
//
// ── The rule this module exists to enforce ────────────────────────────────
//
// From the V3 rules: "Bloodwork never marks, ranks, flags or colours a figure.
// Inks are ink and grey only; the printed range is shown as the lab printed it,
// never as a target. It never evaluates a value and never recommends a change."
//
// So there is no `isHigh`, no `status`, no `severity` and no colour anywhere in
// these types. There is deliberately nothing a component could bind a red
// highlight to. The one interpretive thing here is `direction`, which compares
// a marker against its own previous value and nothing else — not against a
// range, not against a target, not against a population. Up is up. Whether up
// is good is not a question this product answers.
//
// A range, where the lab printed one, is carried as the lab's own text and
// never parsed into a comparison. The moment it becomes two numbers, something
// downstream will compare a value to it and print a verdict.

export interface StoredMarker {
  name?: unknown
  value?: unknown
  unit?: unknown
  /** Whatever the lab printed, verbatim. Never parsed. */
  range?: unknown
}

export interface Panel {
  id: string
  /** YYYY-MM-DD. */
  date: string
  markers: Array<{ name: string; value: number; unit: string; range: string | null }>
}

/** Direction against this marker's own previous value. Never a judgement. */
export type Direction = 'up' | 'down' | 'level' | 'new'

export const DIRECTION_GLYPH: Record<Direction, string> = {
  up: '↗',
  down: '↘',
  level: '→',
  new: '·',
}

export interface TrendCell {
  panelId: string
  /** The figure as text, or null where this marker was not on that panel. */
  value: string | null
  isLatest: boolean
}

export interface TrendRow {
  key: string
  label: string
  unit: string
  /** The lab's printed range, verbatim. Null where none was recorded. */
  range: string | null
  cells: TrendCell[]
  direction: Direction
}

function str(value: unknown, max = 120): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function num(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Parse one stored `markers` JSON blob. Anything malformed yields no markers. */
export function readMarkers(raw: string | null | undefined): Panel['markers'] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  return parsed
    .map((entry: StoredMarker) => {
      const name = str(entry?.name, 80)
      const value = num(entry?.value)
      if (!name || value === null) return null
      return {
        name,
        value,
        unit: str(entry?.unit, 24) ?? '',
        range: str(entry?.range, 60),
      }
    })
    .filter((marker): marker is Panel['markers'][number] => marker !== null)
}

/** Trim a float for display without implying more precision than was recorded. */
function show(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

/**
 * Build the trend table.
 *
 * Panels arrive newest-first (the order the query returns) and are rendered
 * oldest-to-newest, because a trend read left to right is a trend read
 * forwards. The latest column is marked so a component can weight it, which is
 * emphasis, not evaluation.
 */
export function buildTrend(panels: Panel[]): { panels: Panel[]; rows: TrendRow[] } {
  const ordered = [...panels].sort((a, b) => a.date.localeCompare(b.date))
  const latestId = ordered.at(-1)?.id ?? null

  // Keyed on the lowercased name, so "Total Testosterone" and "total
  // testosterone" from two different labs land on one row.
  const keys = new Map<string, { label: string; unit: string; range: string | null }>()
  for (const panel of ordered) {
    for (const marker of panel.markers) {
      const key = marker.name.toLowerCase()
      const existing = keys.get(key)
      keys.set(key, {
        label: existing?.label ?? marker.name,
        unit: existing?.unit || marker.unit,
        // First non-empty range wins; ranges are lab text and rarely conflict.
        range: existing?.range ?? marker.range,
      })
    }
  }

  const rows: TrendRow[] = Array.from(keys.entries())
    .map(([key, meta]) => {
      const cells: TrendCell[] = ordered.map((panel) => {
        const marker = panel.markers.find((m) => m.name.toLowerCase() === key)
        return {
          panelId: panel.id,
          value: marker ? show(marker.value) : null,
          isLatest: panel.id === latestId,
        }
      })

      const present = ordered
        .map((panel) => panel.markers.find((m) => m.name.toLowerCase() === key)?.value)
        .filter((value): value is number => value !== undefined)

      let direction: Direction = 'new'
      if (present.length > 1) {
        const last = present.at(-1) as number
        const previous = present.at(-2) as number
        // A change under half a percent is noise between two draws, not a
        // trend, and calling it one would be the first step toward a verdict.
        const delta = previous === 0 ? last - previous : (last - previous) / Math.abs(previous)
        direction = Math.abs(delta) < 0.005 ? 'level' : delta > 0 ? 'up' : 'down'
      }

      return { key, label: meta.label, unit: meta.unit, range: meta.range, cells, direction }
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  return { panels: ordered, rows }
}
