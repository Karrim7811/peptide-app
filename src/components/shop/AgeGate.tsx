// The notice a signed-out visitor sees instead of the shop.
//
// Same chrome as the shop, so it reads as the shop's door and not as an error.
// Two actions and no checkbox: the acknowledgement is the click on "I am 18 or
// older", and what it leads to is the signup form, where a date of birth is
// collected and stored. A checkbox here would be the self-attestation §16.10
// rejected; this is a signpost to the real check, not a substitute for it.

import Link from 'next/link'
import { HAIR, KICKER, MONO, RULE, ShopChrome } from '@/components/shop/ShopChrome'
import { MIN_AGE_YEARS } from '@/lib/age'
import { loginUrl, signupUrl } from '@/lib/auth/next'

const INK = '#1A1D1F'
const INK2 = '#3B4045'
const INK3 = '#7E878E'
const JOST = 'Jost, sans-serif'

export function AgeGate({ next }: { next: string }) {
  return (
    <ShopChrome showCart={false}>
      <div
        style={{
          maxWidth: 'min(100%, 1120px)',
          margin: '0 auto',
          padding: 'clamp(40px,6vw,88px) clamp(16px,3vw,32px) 64px',
        }}
      >
        <div style={KICKER}>Adults {MIN_AGE_YEARS}+ · Account required</div>

        <h1
          style={{
            margin: '18px 0 0',
            fontWeight: 300,
            fontSize: 'clamp(36px,5vw,64px)',
            lineHeight: 0.98,
            letterSpacing: '-.028em',
            textWrap: 'pretty',
            maxWidth: '18ch',
          }}
        >
          The shop is for adults, and it needs an account.
        </h1>

        <p
          style={{
            margin: '18px 0 0',
            fontSize: 19,
            lineHeight: 1.45,
            color: INK2,
            maxWidth: '52ch',
            textWrap: 'pretty',
          }}
        >
          Research peptides are sold to adults {MIN_AGE_YEARS} and over, for research and
          reference purposes only. An account ties every order to the lot it came
          from, so a batch can be recalled to exactly the people who hold it, and it
          holds the date of birth we check before any sale.
        </p>

        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: RULE,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href={signupUrl(next)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: RULE,
              background: INK,
              color: '#F4F5F6',
              fontFamily: JOST,
              fontSize: 11,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              padding: '14px 22px',
              minHeight: 48,
              textDecoration: 'none',
            }}
          >
            I am {MIN_AGE_YEARS} or older — create an account
          </Link>
          <Link
            href={loginUrl(next)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: RULE,
              background: 'transparent',
              color: INK,
              fontFamily: JOST,
              fontSize: 11,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              padding: '14px 22px',
              minHeight: 48,
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
          <span style={{ fontSize: 15, fontStyle: 'italic', color: INK2 }}>
            Free. Reading the library never needs this.
          </span>
        </div>

        <dl
          style={{
            margin: '36px 0 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 0,
            borderTop: HAIR,
          }}
        >
          {[
            ['Under ' + MIN_AGE_YEARS, 'Refused at signup, refused again in the database, and refused a third time before any money moves.'],
            ['What is stored', 'Email, a password, and a date of birth. The date cannot be edited from the app once recorded.'],
            ['Still free', 'The library, the dosing reference and the guides stay open without an account. This is the door to the shop only.'],
          ].map(([term, body]) => (
            <div key={term} style={{ padding: '18px 18px 18px 0', borderBottom: HAIR }}>
              <dt style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.12em', color: INK3, textTransform: 'uppercase' }}>
                {term}
              </dt>
              <dd style={{ margin: '8px 0 0', fontSize: 16.5, lineHeight: 1.45, color: INK2, maxWidth: '34ch' }}>
                {body}
              </dd>
            </div>
          ))}
        </dl>

        <p style={{ margin: '28px 0 0', fontSize: 14.5, lineHeight: 1.45, color: INK3, maxWidth: '52ch' }}>
          By continuing you accept the{' '}
          <Link href="/terms" style={{ color: INK3, borderBottom: '1px solid rgba(26,29,31,.35)', textDecoration: 'none' }}>
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" style={{ color: INK3, borderBottom: '1px solid rgba(26,29,31,.35)', textDecoration: 'none' }}>
            privacy notice
          </Link>
          . US shipping only.
        </p>
      </div>
    </ShopChrome>
  )
}
