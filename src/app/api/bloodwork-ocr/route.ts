import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { requireAiConsent } from '@/lib/ai-consent'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    }

    const consentError = requireAiConsent(user)
    if (consentError) return consentError

    const { image, mimeType } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const isPDF = mimeType === 'application/pdf'

    // Build the message content based on file type
    const userContent: any[] = []

    if (isPDF) {
      userContent.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: image,
        },
      })
    } else {
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType || 'image/jpeg',
          data: image,
        },
      })
    }

    userContent.push({
      type: 'text',
      text: `Extract all bloodwork/lab values from this ${isPDF ? 'document' : 'image'}. Return ONLY a JSON object with the following structure. For any marker not found, omit it from the response. Use the exact keys shown:

{
  "testosterone": number or null,
  "freeTestosterone": number or null,
  "igf1": number or null,
  "estradiol": number or null,
  "tsh": number or null,
  "t3Free": number or null,
  "t4Free": number or null,
  "fastingGlucose": number or null,
  "hba1c": number or null,
  "totalCholesterol": number or null,
  "ldl": number or null,
  "hdl": number or null,
  "triglycerides": number or null,
  "alt": number or null,
  "ast": number or null,
  "gfr": number or null,
  "creatinine": number or null,
  "crp": number or null,
  "vitaminD": number or null,
  "b12": number or null,
  "ironFerritin": number or null,
  "wbc": number or null,
  "rbc": number or null,
  "hemoglobin": number or null,
  "hematocrit": number or null
}

Only return the JSON object, nothing else. If this is not a bloodwork report, return {"error": "Not a bloodwork report"}.`,
    })

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // Try to parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not extract values from image' }, { status: 422 })
    }

    const markers = JSON.parse(jsonMatch[0])

    if (markers.error) {
      return NextResponse.json({ error: markers.error }, { status: 422 })
    }

    return NextResponse.json({ markers })
  } catch (error: any) {
    console.error('Bloodwork OCR error:', error?.message || error)
    const message = error?.message || 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process bloodwork image: ${message}` },
      { status: 500 }
    )
  }
}
