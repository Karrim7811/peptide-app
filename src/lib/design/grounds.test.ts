import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GROUND,
  GROUNDS,
  GROUND_DEFINITIONS,
  MIRROR_DEFAULT_GROUND,
  MIRROR_GROUNDS,
  groundVars,
  isGround,
} from '@/lib/design/grounds'

// grounds.ts promises that every text tier clears WCAG AA (4.5:1) against its
// ground. Nothing enforced it, and the paper ground was tuned against this
// test rather than by eye — V3's Ink-3 and Ink-4 both fail it and are the
// reason paper's faint tiers are darker than the site's.

function luminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const TEXT_TIERS = ['--ink', '--dim', '--faint', '--faintest', '--accent'] as const

describe('grounds', () => {
  it('lists every defined ground, and the Mirror offers only defined ones', () => {
    expect([...GROUNDS].sort()).toEqual(Object.keys(GROUND_DEFINITIONS).sort())
    for (const ground of MIRROR_GROUNDS) expect(isGround(ground)).toBe(true)
    expect(isGround(DEFAULT_GROUND)).toBe(true)
    expect(isGround(MIRROR_DEFAULT_GROUND)).toBe(true)
    expect(isGround('sepia')).toBe(false)
  })

  it('keeps the global default dark and the Mirror default on paper', () => {
    // The dark surfaces outside the Mirror render on the global default; the
    // Mirror is the one that moved to V3. Changing either is a decision.
    expect(DEFAULT_GROUND).toBe('midnight')
    expect(MIRROR_DEFAULT_GROUND).toBe('paper')
    expect(MIRROR_GROUNDS[0]).toBe(MIRROR_DEFAULT_GROUND)
  })

  it('exposes the hue families as custom properties', () => {
    const vars = groundVars('paper')
    expect(vars['--hue-cy']).toBe(GROUND_DEFINITIONS.paper.hues.cy)
    expect(vars['--hue-go']).toBe(GROUND_DEFINITIONS.paper.hues.go)
  })

  describe.each(GROUNDS)('%s clears 4.5:1', (ground) => {
    const { vars, hues } = GROUND_DEFINITIONS[ground]

    it.each(TEXT_TIERS)('%s against the ground and the panel', (tier) => {
      expect(contrast(vars[tier]!, vars['--bg']!)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(vars[tier]!, vars['--panel']!)).toBeGreaterThanOrEqual(4.5)
    })

    it('paper carries the V3 palette and its hues read as text', () => {
      if (ground !== 'paper') return
      expect(vars['--bg']).toBe('#E6E9EB')
      expect(vars['--panel']).toBe('#F4F5F6')
      expect(vars['--ink']).toBe('#1A1D1F')
      expect(vars['--dim']).toBe('#3B4045')
      for (const hue of Object.values(hues)) {
        expect(contrast(hue, vars['--bg']!)).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrast(vars['--gold']!, vars['--bg']!)).toBeGreaterThanOrEqual(4.5)
    })
  })
})
