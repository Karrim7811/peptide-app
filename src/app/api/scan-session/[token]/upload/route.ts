// The phone's upload.
//
// THE ONLY UNAUTHENTICATED WRITE IN THIS CODEBASE. There is no session on the
// phone; the token in the path is the entire credential. Everything below
// bounds what that token is worth.
//
// The order of operations IS the security property:
//
//   1. Shape-check the token before touching the database, so a path traversal
//      or a 10 KB string never becomes a query.
//   2. Look the row up under the SERVICE role. It has to be — the caller has no
//      session, so no RLS policy could match them. That is also why
//      scan_sessions has no insert or update policy at all: nothing carrying a
//      user session may write these rows either.
//   3. Refuse an expired or used token BEFORE reading the body, so a dead link
//      cannot make the server parse 6 MB.
//   4. Claim it BEFORE calling Claude, with an update conditional on
//      consumed_at still being null. A vision call takes seconds; recording
//      consumption afterwards would let two uploads race the same token and
//      both spend a call. The loser's update matches no row.
//   5. Only then read the image and call the model.
//
// The response tells the phone nothing about the account — not the email, not
// the bench, not even what was recognised. A stolen token buys one vision call
// and a "sent" screen, never a look at someone's data. The readings go back to
// the desktop, which is authenticated.
//
// The image is never stored. It is read, sent, and dropped; only the parsed
// readings are written to the row.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { REFUSAL_MESSAGE, looksLikeToken, refuseUpload } from '@/lib/scan-session'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
/** ~6 MB of image, matching /api/scan-vials. */
const MAX_BASE64 = 8_000_000

const SYSTEM = `You are an expert at identifying peptide vials from photographs. Look at the image carefully and identify every peptide vial visible. For each vial, extract the peptide name from the label, the vial size in mg, the type, and any other useful info visible on the label.

Return ONLY a JSON array. Each element:
{ "name": "BPC-157", "amount": "5mg", "type": "peptide", "notes": "any extra info" }

If you cannot identify any vials, return an empty array []. Do not include any text outside the JSON array.`

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  // 1. Shape first. An arbitrary string never reaches a query.
  if (!looksLikeToken(params.token)) {
    return NextResponse.json({ error: 'Unknown capture link.' }, { status: 404 })
  }

  const service = createServiceClient()

  // 2. Service role: the caller has no session to match a policy against.
  const { data: session } = await service
    .from('scan_sessions')
    .select('token, expires_at, consumed_at')
    .eq('token', params.token)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'Unknown capture link.' }, { status: 404 })
  }

  // 3. Refuse before reading a body.
  const refusal = refuseUpload(session)
  if (refusal) {
    return NextResponse.json({ error: REFUSAL_MESSAGE[refusal] }, { status: 410 })
  }

  // 4. Claim before spending. Conditional, so a race has exactly one winner.
  const { data: claimed } = await service
    .from('scan_sessions')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', params.token)
    .is('consumed_at', null)
    .select('token')

  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ error: REFUSAL_MESSAGE['already-used'] }, { status: 410 })
  }

  const fail = async (message: string, status: number) => {
    await service
      .from('scan_sessions')
      .update({ failed_at: new Date().toISOString() })
      .eq('token', params.token)
    return NextResponse.json({ error: message }, { status })
  }

  try {
    // 5. Now the expensive part.
    const body = await request.json()
    const { image, mimeType } = body

    if (typeof image !== 'string' || !image || image.length > MAX_BASE64) {
      return fail('That photo is missing or over 6 MB.', 400)
    }

    const mediaType = ALLOWED_MIME.includes(mimeType) ? mimeType : 'image/jpeg'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            {
              type: 'text',
              text: 'Identify all peptide vials in this image. Return the JSON array.',
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    const array = (fenced ? fenced[1] : text).match(/\[[\s\S]*\]/)
    // An empty array is a real answer — "no vials legible" — and is stored as
    // one, so the desktop stops waiting rather than hanging on a null.
    const vials = array ? JSON.parse(array[0]) : []

    await service.from('scan_sessions').update({ result: vials }).eq('token', params.token)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Scan session upload error:', error)
    return fail('That photo could not be read. Open the scanner again for a new link.', 500)
  }
}
