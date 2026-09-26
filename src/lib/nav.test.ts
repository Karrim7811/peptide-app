import { describe, expect, it } from 'vitest'
import { primaryNav, sectionFor } from './nav'

describe('sectionFor', () => {
  it.each([
    ['/dashboard', 'bench'],
    ['/mirror', 'bench'],
    ['/checker', 'bench'],
    ['/bloodwork', 'bench'],
    ['/protocol', 'bench'],
    ['/scanner', 'bench'],
    ['/reference', 'library'],
    ['/reference/bpc-157', 'library'],
    ['/dosing', 'library'],
    ['/guides/retatrutide-reconstitution', 'library'],
    ['/stacks', 'library'],
    ['/vendors', 'library'],
    ['/regulatory', 'library'],
    ['/shop', 'shop'],
    ['/shop/orders', 'shop'],
    ['/shop/cart?x=1', 'shop'],
  ])('%s → %s', (path, section) => {
    expect(sectionFor(path)).toBe(section)
  })

  it.each(['/', '/terms', '/login', '/pricing', '/shopping', '/referenced', null, undefined])(
    '%s is no section',
    (path) => {
      expect(sectionFor(path)).toBeNull()
    },
  )
})

describe('primaryNav', () => {
  it('is Bench · Library · Shop, in that order', () => {
    expect(primaryNav().map((i) => i.label)).toEqual(['Bench', 'Library', 'Shop'])
  })

  it('gives each item the section it marks active', () => {
    for (const item of primaryNav()) expect(sectionFor(item.href)).toBe(item.section)
  })
})
