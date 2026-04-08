import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { requireAiConsent } from '@/lib/ai-consent'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in.', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const consentError = requireAiConsent(user)
    if (consentError) return consentError

    const { peptideName, amountMg } = await req.json()
    if (!peptideName || !amountMg) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      system: `You are an educational peptide reconstitution reference tool. When given a peptide name and the amount in mg,
you provide commonly referenced BAC water volumes from published research literature. This is for educational reference only, not medical advice.
Always respond with a JSON object in this exact format:
{
  "recommendedBacWaterMl": <number>,
  "concentrationMgPerMl": <number>,
  "concentrationMcgPerMl": <number>,
  "reasoning": "<brief explanation referencing common research practices>",
  "tipicalDoseRange": "<e.g. 250-500 mcg — commonly reported in research>",
  "storageNote": "<brief storage note>"
}`,
      messages: [
        {
          role: 'user',
          content: `Peptide: ${peptideName}\nAmount in vial: ${amountMg} mg\n\nHow much BAC water should I add?`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (err) {
    console.error('Reconstitution AI error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
