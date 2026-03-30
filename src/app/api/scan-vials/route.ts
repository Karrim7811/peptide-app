import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    }

    const { image, mimeType } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are an expert at identifying peptide vials from photographs. Look at the image carefully and identify every peptide vial visible. For each vial, extract:
- The peptide name from the label
- The vial size/amount in mg (or other unit if specified)
- The type (peptide, medication, supplement, etc.)
- Any other useful info visible on the label (manufacturer, concentration, lot number, expiry)

Return ONLY a JSON array. Each element should be:
{ "name": "BPC-157", "amount": "5mg", "type": "peptide", "notes": "any extra info" }

If you cannot identify any vials in the image, return an empty array [].
Do not include any text outside the JSON array.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType || 'image/jpeg',
                data: image,
              },
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

    // Try to parse JSON from the response, handling possible markdown code blocks
    let jsonStr = text
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (!arrayMatch) {
      return NextResponse.json({ vials: [] })
    }

    const vials = JSON.parse(arrayMatch[0])

    return NextResponse.json({ vials })
  } catch (error: any) {
    console.error('Vial scan error:', error?.message || error)
    const message = error?.message || 'Unknown error'
    return NextResponse.json(
      { error: `Failed to scan vials: ${message}` },
      { status: 500 }
    )
  }
}
