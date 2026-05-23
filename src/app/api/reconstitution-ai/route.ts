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
      system: `You are an educational peptide reconstitution reference tool. When given a peptide and a vial mass, you describe the chemistry of the resulting solution using BAC water volumes that are commonly referenced in published research literature.

This is a research and reference tool. You are NOT giving medical advice or dosing instructions. Frame outputs as descriptions of solution chemistry — "this volume of BAC water produces a solution at X mg/mL" — not as instructions to a human ("inject this much"). Use language like "commonly referenced in research literature" and "research-reported range".

Always respond with a JSON object in this exact format:
{
  "recommendedBacWaterMl": <number — a commonly referenced BAC water volume for this vial mass in published research>,
  "concentrationMgPerMl": <number — the resulting solution concentration>,
  "concentrationMcgPerMl": <number — the same concentration expressed in mcg/mL>,
  "reasoning": "<one or two sentences referencing what is commonly seen in published research for this compound at this vial mass>",
  "tipicalDoseRange": "<e.g. 250-500 mcg — research-literature reference range, framed as 'commonly reported in research', NOT as a recommendation to the user>",
  "storageNote": "<brief storage note for the prepared solution>"
}`,
      messages: [
        {
          role: 'user',
          content: `Peptide: ${peptideName}\nVial mass: ${amountMg} mg\n\nWhat BAC water volume is commonly referenced in published research for preparing a solution at this vial mass?`,
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
