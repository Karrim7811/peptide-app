import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { requireAiConsent } from '@/lib/ai-consent'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildPeptideList(): string {
  return PEPTIDE_KNOWLEDGE.map(p =>
    `${p.name} [${p.goalCategory}]: ${p.whatItDoes}. Dosage: ${p.dosageRange || 'varies'}. ` +
    `Key effects: ${p.keyEffects}. Stacks well with: ${p.stacksWellWith?.join(', ') || 'N/A'}.`
  ).join('\n')
}

const SYSTEM_PROMPT = `You are Cortex AI, a peptide protocol consultant. The user wants help choosing peptides and building a personalized protocol. Your job is to have a brief conversation to understand their needs, then recommend specific peptides and fill in their profile.

Available peptides in our database:
${buildPeptideList()}

CONVERSATION RULES:
1. Ask targeted questions about: their specific goals, current health conditions, experience with peptides, age/weight/sex if not provided, any medications they're on.
2. Keep questions focused and concise (3-4 questions per round).
3. After gathering enough info (typically 2-3 rounds of questions), provide your final recommendation.
4. Be warm, professional, and knowledgeable.

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, just raw JSON) in one of these two formats:

If you need more information:
{
  "type": "questions",
  "questions": ["Question 1?", "Question 2?", "Question 3?"]
}

If you have enough information to make a recommendation:
{
  "type": "recommendation",
  "peptides": ["BPC-157", "TB-500"],
  "profile": {
    "age": "35",
    "weight": "180",
    "sex": "Male",
    "experience": "Beginner",
    "goals": ["Recovery", "Healing"],
    "conditions": ["None"]
  },
  "summary": "Based on your goals of recovery and healing, I recommend BPC-157 and TB-500. This combination is excellent for tissue repair and reducing inflammation."
}

IMPORTANT:
- Only recommend peptides that exist in the database above.
- For the profile, only fill in fields the user has mentioned or that you can reasonably infer. Use empty string for unknown fields.
- Goals must be from: Fat Loss, Muscle Growth, Recovery, Anti-Aging, Cognitive Enhancement, Sleep, Immune Support, Healing.
- Conditions must be from: Diabetes, Heart Disease, Thyroid, High Blood Pressure, Liver Issues, Kidney Issues, None.
- Experience must be: Beginner, Intermediate, or Advanced.
- Sex must be: Male, Female, or Other.`

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to use Protocol Consult.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const consentError = requireAiConsent(user)
    if (consentError) return consentError

    const body = await request.json()
    const { message, history } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'A message is required.' }, { status: 400 })
    }

    // Build messages array from history
    const messages: { role: 'user' | 'assistant'; content: string }[] = []

    if (history && Array.isArray(history)) {
      for (const entry of history) {
        if (entry.role === 'user' || entry.role === 'assistant') {
          messages.push({ role: entry.role, content: entry.content })
        }
      }
    }

    // If the last message in history isn't the current message, add it
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.content !== message || lastMsg.role !== 'user') {
      messages.push({ role: 'user', content: message })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response
    let jsonText = content.text.trim()
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in consult response:', jsonText.substring(0, 500))
      throw new SyntaxError('No JSON object found in AI response')
    }

    const result = JSON.parse(jsonMatch[0])

    // Validate response type
    if (result.type !== 'questions' && result.type !== 'recommendation') {
      throw new Error('Invalid response type from AI')
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Protocol consult error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to process consultation. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to consult Cortex AI. Please try again.' },
      { status: 500 }
    )
  }
}
