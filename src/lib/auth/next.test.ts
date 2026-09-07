import { describe, expect, it } from 'vitest'
import { DEFAULT_NEXT, loginUrl, safeNext, signupUrl, withNext } from '@/lib/auth/next'

// The return-to parameter every gate writes. It comes from the URL, so the
// only property that matters is that it can never leave the site.

describe('safeNext', () => {
  it('keeps a same-origin path, query and hash included', () => {
    expect(safeNext('/shop')).toBe('/shop')
    expect(safeNext('/shop/bpc-157')).toBe('/shop/bpc-157')
    expect(safeNext('/mirror?tab=cycle')).toBe('/mirror?tab=cycle')
    expect(safeNext('/reference#top')).toBe('/reference#top')
  })

  it('falls back when nothing was asked for', () => {
    expect(safeNext(undefined)).toBe(DEFAULT_NEXT)
    expect(safeNext(null)).toBe(DEFAULT_NEXT)
    expect(safeNext('')).toBe(DEFAULT_NEXT)
  })

  it('refuses anything that could leave the origin', () => {
    expect(safeNext('https://evil.example/')).toBe(DEFAULT_NEXT)
    expect(safeNext('//evil.example')).toBe(DEFAULT_NEXT)
    expect(safeNext('/\\evil.example')).toBe(DEFAULT_NEXT)
    expect(safeNext('javascript:alert(1)')).toBe(DEFAULT_NEXT)
    expect(safeNext('shop')).toBe(DEFAULT_NEXT)
  })

  it('refuses the auth screens themselves, which would loop', () => {
    expect(safeNext('/login')).toBe(DEFAULT_NEXT)
    expect(safeNext('/signup?next=/shop')).toBe(DEFAULT_NEXT)
    expect(safeNext('/forgot-password')).toBe(DEFAULT_NEXT)
    expect(safeNext('/reset-password')).toBe(DEFAULT_NEXT)
    // But a route that merely starts with the same letters is fine.
    expect(safeNext('/loginfo')).toBe('/loginfo')
  })

  it('takes the first value of a repeated key', () => {
    expect(safeNext(['/shop', '/cart'])).toBe('/shop')
    expect(safeNext([])).toBe(DEFAULT_NEXT)
  })
})

describe('withNext', () => {
  it('encodes the path and leaves the default off the URL', () => {
    expect(loginUrl('/shop/cart')).toBe('/login?next=%2Fshop%2Fcart')
    expect(signupUrl('/shop')).toBe('/signup?next=%2Fshop')
    expect(loginUrl('/dashboard')).toBe('/login')
    expect(loginUrl('https://evil.example/')).toBe('/login')
    expect(withNext('/forgot-password', '/shop')).toBe('/forgot-password?next=%2Fshop')
  })
})
