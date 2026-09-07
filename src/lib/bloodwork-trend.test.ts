import { describe, expect, it } from 'vitest'
import { buildTrend, readMarkers } from '@/lib/bloodwork-trend'
import type { Panel } from '@/lib/bloodwork-trend'

const panel = (id: string, date: string, markers: unknown[]): Panel => ({
  id,
  date,
  markers: readMarkers(JSON.stringify(markers)),
})

describe('readMarkers', () => {
  it('survives anything that is not a marker array', () => {
    for (const junk of [null, undefined, '', 'not json', '{}', '[1,2]', '"a"']) {
      expect(readMarkers(junk as string)).toEqual([])
    }
  })

  it('drops a marker with no name or no numeric value', () => {
    const markers = readMarkers(
      JSON.stringify([
        { name: 'TSH', value: 1.4, unit: 'µIU/mL' },
        { name: '', value: 2 },
        { name: 'IGF-1' },
        { name: 'Estradiol', value: 'high' },
      ]),
    )
    expect(markers).toHaveLength(1)
    expect(markers[0].name).toBe('TSH')
  })

  it('accepts a numeric string, which is what a parsed lab report gives', () => {
    expect(readMarkers(JSON.stringify([{ name: 'TSH', value: '1.4' }]))[0].value).toBe(1.4)
  })

  // The moment a range becomes two numbers, something downstream compares a
  // value to it and prints a verdict.
  it('keeps the printed range as the lab wrote it and never parses it', () => {
    const [marker] = readMarkers(
      JSON.stringify([{ name: 'TSH', value: 1.4, range: '0.45 - 4.50' }]),
    )
    expect(marker.range).toBe('0.45 - 4.50')
  })
})

describe('buildTrend', () => {
  const panels = [
    panel('p2', '2026-06-01', [{ name: 'TSH', value: 2.0 }, { name: 'IGF-1', value: 180 }]),
    panel('p1', '2026-01-01', [{ name: 'TSH', value: 1.0 }]),
    panel('p3', '2026-09-01', [{ name: 'TSH', value: 3.0 }, { name: 'IGF-1', value: 150 }]),
  ]

  it('orders panels oldest to newest, so a trend reads forwards', () => {
    expect(buildTrend(panels).panels.map((p) => p.id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('marks only the latest panel', () => {
    const { rows } = buildTrend(panels)
    const latest = rows[0].cells.filter((cell) => cell.isLatest)
    expect(latest).toHaveLength(1)
    expect(latest[0].panelId).toBe('p3')
  })

  it('leaves a gap where a marker was not on a panel, rather than carrying it forward', () => {
    const igf = buildTrend(panels).rows.find((row) => row.label === 'IGF-1')
    expect(igf?.cells.map((cell) => cell.value)).toEqual([null, '180', '150'])
  })

  it('reads direction against the marker own previous value', () => {
    const { rows } = buildTrend(panels)
    expect(rows.find((row) => row.label === 'TSH')?.direction).toBe('up')
    expect(rows.find((row) => row.label === 'IGF-1')?.direction).toBe('down')
  })

  it('calls a single reading new rather than level', () => {
    const single = buildTrend([panel('p1', '2026-01-01', [{ name: 'TSH', value: 1 }])])
    expect(single.rows[0].direction).toBe('new')
  })

  // Noise between two draws is not a trend, and calling it one is the first
  // step toward a verdict.
  it('calls a sub-half-percent change level, not a direction', () => {
    const flat = buildTrend([
      panel('a', '2026-01-01', [{ name: 'TSH', value: 2.0 }]),
      panel('b', '2026-06-01', [{ name: 'TSH', value: 2.004 }]),
    ])
    expect(flat.rows[0].direction).toBe('level')
  })

  it('joins the same marker across labs that capitalise it differently', () => {
    const merged = buildTrend([
      panel('a', '2026-01-01', [{ name: 'Total Testosterone', value: 500 }]),
      panel('b', '2026-06-01', [{ name: 'total testosterone', value: 600 }]),
    ])
    expect(merged.rows).toHaveLength(1)
    expect(merged.rows[0].cells.map((c) => c.value)).toEqual(['500', '600'])
  })

  // The whole point. If any of these ever appear, something is evaluating.
  it('exposes nothing a component could bind a verdict to', () => {
    const row = buildTrend(panels).rows[0] as unknown as Record<string, unknown>
    for (const forbidden of ['status', 'isHigh', 'isLow', 'flag', 'severity', 'colour', 'color']) {
      expect(row[forbidden], forbidden).toBeUndefined()
    }
  })

  it('handles no panels at all', () => {
    expect(buildTrend([])).toEqual({ panels: [], rows: [] })
  })
})
