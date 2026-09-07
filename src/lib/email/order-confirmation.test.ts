import { describe, expect, it } from 'vitest'
import {
  confirmationHtml,
  confirmationSubject,
  confirmationText,
  type ConfirmationInput,
} from '@/lib/email/order-confirmation'
import { SUPPORT_EMAIL } from '@/lib/legal'

// The receipt is the only copy of three facts the buyer needs and cannot
// reconstruct: where to send money, exactly how much, and the memo code that
// links their payment to this order. These tests are about that content
// surviving, and about the anti-phishing line staying in.

const base: ConfirmationInput = {
  paymentReference: 'PC-7K3M',
  subtotalCents: 12500,
  shippingCents: 1200,
  totalCents: 13700,
  shippingMethodId: 'priority',
  provider: 'zelle',
  lines: [
    { productName: 'GLP-3 (Retatrutide)', sizeDisplay: '30 mg', qty: 1, lineCents: 12500 },
  ],
  orderUrl: 'https://peptidecortex.com/shop/order/PC-7K3M',
  zelleHandle: 'pay@peptidecortex.com',
}

describe('the subject', () => {
  it('carries the reference, because that is what gets searched for later', () => {
    expect(confirmationSubject(base)).toContain('PC-7K3M')
  })
})

describe('the Zelle receipt', () => {
  const text = confirmationText(base)

  it('carries the three facts a payment cannot be made without', () => {
    expect(text).toContain('pay@peptidecortex.com')
    expect(text).toContain('$137.00')
    expect(text).toContain('PC-7K3M')
  })

  it('totals to the sum it was given, not to a recomputed one', () => {
    expect(text).toContain('$125.00')
    expect(text).toContain('$12.00')
    expect(text).toContain('$137.00')
  })

  it('names what was bought, with size and quantity', () => {
    expect(text).toContain('GLP-3 (Retatrutide)')
    expect(text).toContain('30 mg')
  })

  it('says the clock starts at payment clearing, not at checkout', () => {
    // The Zelle rail is confirmed by hand, so a window quoted from the order
    // date is a promise it cannot keep.
    expect(text).toMatch(/clears/)
  })

  it('keeps the anti-phishing line', () => {
    // The single most important sentence in the message: it is what lets a
    // customer safely ignore a spoofed follow-up saying the details changed.
    expect(text).toContain('trust the page')
    expect(text).toMatch(/never email you/)
  })

  it('links to the order page absolutely', () => {
    expect(text).toContain('https://peptidecortex.com/shop/order/PC-7K3M')
  })

  it('names the support address rather than saying "email us"', () => {
    expect(text).toContain(SUPPORT_EMAIL)
  })
})

describe('when the Zelle account is not set up', () => {
  const text = confirmationText({ ...base, zelleHandle: null })

  it('says so instead of naming an address that is not ours', () => {
    expect(text).toMatch(/not set up yet/)
    expect(text).toContain(SUPPORT_EMAIL)
  })

  it('reassures that nothing was charged', () => {
    expect(text).toMatch(/nothing has been charged/i)
  })
})

describe('the crypto receipt', () => {
  const text = confirmationText({ ...base, provider: 'btcpay' })

  it('does not tell a crypto buyer to send a Zelle payment', () => {
    expect(text).not.toContain('pay@peptidecortex.com')
    expect(text).not.toContain('MEMO')
  })

  it('says it confirms itself', () => {
    expect(text).toMatch(/confirms itself/)
  })
})

describe('the html body', () => {
  it('wraps the same text, so the two cannot drift', () => {
    const html = confirmationHtml(base)
    expect(html).toContain('PC-7K3M')
    expect(html).toContain('$137.00')
  })

  it('escapes order content rather than trusting it as markup', () => {
    const html = confirmationHtml({
      ...base,
      lines: [
        { productName: 'Nasty <script>x</script>', sizeDisplay: '5 mg', qty: 1, lineCents: 100 },
      ],
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('embeds no images, because half of them would not render', () => {
    // Gmail proxies remote images and Outlook often blocks them. Anything that
    // matters is text; the QR lives on the order page.
    expect(confirmationHtml(base)).not.toContain('<img')
  })
})
