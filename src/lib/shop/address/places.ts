// US address autocomplete, via Google Places (New).
//
// ── Why this is server-side and gated ─────────────────────────────────────
//
// Every keystroke here costs money. An unauthenticated endpoint that proxies a
// metered third-party API is a hole someone drains for fun, so the routes that
// call this require a signed-in user — which the shop requires anyway — cap the
// query length, and refuse anything under MIN_QUERY characters. The API key is
// read here, on the server, and never reaches the browser: a Places key in
// client JavaScript is a key anyone can spend.
//
// ── Session tokens ────────────────────────────────────────────────────────
//
// Google bills a session, not a request: all the autocomplete calls a buyer
// makes while typing plus the one details call that resolves their choice are
// one charge, IF they carry the same session token and the session is closed by
// a details call. The client mints a token per address entry and discards it
// after resolve. Without that, every keystroke bills separately.
//
// ── Degradation ───────────────────────────────────────────────────────────
//
// With GOOGLE_PLACES_API_KEY unset, suggest() returns no suggestions and
// resolve() returns null. That is a supported state, not an outage: the field
// stays a plain input with the correct autoComplete attribute, which is what it
// was before this existed and is what the browser's own autofill uses. Nothing
// warns and no order is affected.

export const MIN_QUERY = 4
export const MAX_QUERY = 120
export const MAX_SUGGESTIONS = 5

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete'
const DETAILS_URL = 'https://places.googleapis.com/v1/places'

export interface AddressSuggestion {
  /** Google's opaque id, passed back to resolve(). Never displayed. */
  placeId: string
  /** What the buyer reads in the dropdown. */
  label: string
}

export interface ResolvedAddress {
  line1: string
  city: string
  state: string
  postal: string
}

function apiKey(): string | null {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim()
  return key && key.length > 0 ? key : null
}

export function isConfigured(): boolean {
  return apiKey() !== null
}

/** Google's own shape, narrowed to what is read below. */
interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string
      text?: { text?: string }
    }
  }>
}

interface DetailsResponse {
  addressComponents?: Array<{
    longText?: string
    shortText?: string
    types?: string[]
  }>
}

export async function suggest(
  query: string,
  sessionToken: string,
): Promise<AddressSuggestion[]> {
  const key = apiKey()
  const trimmed = query.trim()
  if (!key || trimmed.length < MIN_QUERY) return []

  const response = await fetch(AUTOCOMPLETE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      // Ask for the two fields actually rendered. The field mask is what keeps
      // this on the cheaper SKU; requesting everything is billed as everything.
      'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
    },
    body: JSON.stringify({
      input: trimmed.slice(0, MAX_QUERY),
      sessionToken,
      // Street addresses only, US only. The shop does not ship anywhere else
      // and a dropdown offering Toronto on a US-only checkout is a bug report.
      includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
      includedRegionCodes: ['us'],
    }),
    cache: 'no-store',
  })

  // A failure here is never fatal. The buyer types the address themselves, the
  // way they did before autocomplete existed.
  if (!response.ok) {
    console.warn(`[places] autocomplete ${response.status}`)
    return []
  }

  const data = (await response.json()) as AutocompleteResponse
  return (data.suggestions ?? [])
    .flatMap((s) => {
      const placeId = s.placePrediction?.placeId
      const label = s.placePrediction?.text?.text
      return placeId && label ? [{ placeId, label }] : []
    })
    .slice(0, MAX_SUGGESTIONS)
}

/**
 * Turn Google's component list into the four fields the form holds.
 *
 * Exported and pure so it can be tested without a network or a key — the
 * mapping is the part that breaks, not the fetch.
 */
export function toAddress(components: DetailsResponse['addressComponents']): ResolvedAddress | null {
  const pick = (type: string, short = false): string => {
    const found = (components ?? []).find((c) => (c.types ?? []).includes(type))
    return (short ? found?.shortText : found?.longText) ?? ''
  }

  const number = pick('street_number')
  const street = pick('route')
  // Google splits the street number from the street name; the form has one
  // line, so they are joined.
  //
  // The ROUTE is what is required, not the number. A line1 of "1600" with no
  // street is garbage and must fail; a route with no number ("Pennsylvania
  // Avenue Northwest") is an incomplete street line the buyer can see is
  // missing a number and fix, and the city, state and ZIP beside it are still
  // right. Some premises genuinely come back without a number, so requiring one
  // would reject addresses that are fine.
  const line1 = street ? [number, street].filter(Boolean).join(' ') : ''

  // Most addresses carry locality. Some carry only a sublocality (parts of NYC)
  // or only a postal town, and an empty City fails the form's own required
  // check, so fall through rather than returning a half address.
  const city = pick('locality') || pick('sublocality') || pick('postal_town')
  // Two-letter state: shortText, always. longText is "California".
  const state = pick('administrative_area_level_1', true)
  const postal = pick('postal_code')

  if (!line1 || !city || !state || !postal) return null
  return { line1, city, state, postal }
}

export async function resolve(
  placeId: string,
  sessionToken: string,
): Promise<ResolvedAddress | null> {
  const key = apiKey()
  if (!key || !placeId) return null

  const url = `${DETAILS_URL}/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`
  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'addressComponents',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    console.warn(`[places] details ${response.status}`)
    return null
  }

  const data = (await response.json()) as DetailsResponse
  return toAddress(data.addressComponents)
}
