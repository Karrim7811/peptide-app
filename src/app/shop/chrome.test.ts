import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Every shop page must take its header from ShopChrome.
//
// This is a source-level test, which is unusual here, and it earns it: the bug
// it locks down is invisible to every other kind. /shop and /shop/[slug] drew
// their own header — identical to ShopChrome's except that it had no cart link
// — and those two pages are the only ones carrying an Add to cart button. The
// cart worked perfectly. It was simply unreachable, and no unit test of the
// cart could have noticed, because the cart was never the broken part.
//
// A page that hand-rolls chrome again would reintroduce exactly that, so the
// invariant is checked where it can be checked: at the import.

const SHOP = join(process.cwd(), 'src/app/shop')

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return pageFiles(path)
    return entry === 'page.tsx' ? [path] : []
  })
}

describe('shop chrome', () => {
  const pages = pageFiles(SHOP)

  it('finds every shop page', () => {
    // A guard on the guard: a broken walk would pass everything below silently.
    expect(pages.length).toBeGreaterThanOrEqual(6)
  })

  it.each(pages.map((p) => [p.slice(process.cwd().length + 1), p]))(
    '%s renders inside ShopChrome',
    (_label, path) => {
      expect(readFileSync(path, 'utf8')).toContain('ShopChrome')
    },
  )

  // ShopChrome is the only thing that renders CartCount, and CartCount is the
  // only link to /shop/cart anywhere in the app. If that stops being true, the
  // test above stops meaning anything.
  it('ShopChrome is what carries the cart link', () => {
    const chrome = readFileSync(
      join(process.cwd(), 'src/components/shop/ShopChrome.tsx'),
      'utf8',
    )
    expect(chrome).toContain('CartCount')

    const count = readFileSync(
      join(process.cwd(), 'src/components/shop/CartCount.tsx'),
      'utf8',
    )
    expect(count).toContain('/shop/cart')
  })
})
