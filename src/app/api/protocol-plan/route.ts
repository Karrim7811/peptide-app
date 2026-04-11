import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { requireAiConsent } from '@/lib/ai-consent'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildKnowledgeContext(): string {
  return PEPTIDE_KNOWLEDGE.map(p =>
    `${p.name} [${p.goalCategory}]: ${p.whatItDoes}. Dosage: ${p.dosageRange || 'varies'}. ` +
    `Key effects: ${p.keyEffects}. Cautions: ${p.riskCautions}. ` +
    `Drug interactions: ${p.drugInteractions || 'none noted'}. Evidence: ${p.evidenceLevel}. ` +
    `Stacks well with: ${p.stacksWellWith?.join(', ') || 'N/A'}. Avoid if: ${p.avoidIf || 'N/A'}.`
  ).join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to use Protocol Planner.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const consentError = requireAiConsent(user)
    if (consentError) return consentError

    const body = await request.json()
    const { peptides, profile, customInstructions } = body

    if (!peptides || !Array.isArray(peptides) || peptides.length === 0) {
      return NextResponse.json({ error: 'At least one peptide is required.' }, { status: 400 })
    }

    const knowledgeBase = buildKnowledgeContext()

    const profileSummary = profile
      ? `User Profile:
- Age: ${profile.age || 'not specified'}
- Weight: ${profile.weight || 'not specified'}
- Sex: ${profile.sex || 'not specified'}
- Experience level: ${profile.experience || 'Beginner'}
- Goals: ${profile.goals?.join(', ') || 'general wellness'}
- Medical conditions: ${profile.conditions?.join(', ') || 'none reported'}`
      : 'No profile provided — use conservative defaults for a beginner.'

    const systemPrompt = `You are Cortex AI, an educational peptide research reference tool. You generate example weekly schedules based on published research literature for the user's selected peptides and profile. ALL information you provide is for educational and research reference only — NOT medical advice, diagnosis, or treatment recommendations.

Peptide Knowledge Base:
${knowledgeBase}

${profileSummary}

${customInstructions ? `CRITICAL USER CONTEXT (these instructions override your defaults for this request — follow them exactly while preserving the educational-reference framing):
${customInstructions}
` : ''}

TASK: Generate an example research-based weekly reference schedule for these peptides: ${peptides.join(', ')}

IMPORTANT: Frame everything as educational reference from published literature, not as personalized medical instructions. Use language like "commonly reported", "research literature suggests", "typically referenced at" instead of prescriptive language.

You MUST:
1. Reference published research on all peptides for interaction information and safety notes
2. Create an example weekly reference schedule (Monday through Sunday) based on research literature
3. Include commonly reported timing (Morning/Evening/Night), research-reported amounts, administration route, and site rotation references
4. Flag any potentially concerning combinations with clear notes from research
5. Note any research-reported contraindications relevant to the user's profile
6. Adjust complexity based on experience level (Beginner = simpler schedules; Advanced = can handle complex timing)
7. Include reconstitution reference information for each peptide (vial size, BAC water volume, resulting concentration, commonly reported volume)
8. Suggest schedule reminders for reference

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{
  "weeklySchedule": [
    {
      "day": "Monday",
      "doses": [
        {
          "peptide": "BPC-157",
          "dose": "250 mcg",
          "time": "Morning",
          "route": "Subcutaneous",
          "site": "Abdomen",
          "notes": "Take on empty stomach"
        }
      ]
    }
  ],
  "interactions": [
    {
      "peptideA": "X",
      "peptideB": "Y",
      "level": "safe",
      "note": "These peptides complement each other well"
    }
  ],
  "warnings": ["Any important warnings as strings"],
  "reconstitution": [
    {
      "peptide": "BPC-157",
      "vialSize": "5mg",
      "bacWater": "2mL",
      "concentration": "2500 mcg/mL",
      "typicalDose": "250 mcg = 0.1 mL"
    }
  ],
  "summary": "A 2-3 sentence overall summary of the protocol",
  "suggestedReminders": [
    {
      "peptide": "BPC-157",
      "time": "08:00",
      "days": [1, 2, 3, 4, 5, 6, 0],
      "dose": "250 mcg"
    }
  ]
}

The "level" for interactions must be one of: "safe", "caution", "danger".
Days in suggestedReminders use: 0=Sunday, 1=Monday, ..., 6=Saturday.
Include ALL 7 days in weeklySchedule even if some have no doses (empty doses array).
CRITICAL: This is for educational reference only. Always include a reminder to consult a qualified healthcare professional. Never present information as personalized medical advice.`

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Create a complete weekly protocol for: ${peptides.join(', ')}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response — handle markdown, extra text, etc.
    let jsonText = content.text.trim()

    // Remove markdown code blocks
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

    // Find the JSON object in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', jsonText.substring(0, 500))
      throw new SyntaxError('No JSON object found in AI response')
    }

    const plan = JSON.parse(jsonMatch[0])

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Protocol plan error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to generate protocol. The AI returned an unexpected format. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate protocol plan. Please try again.' },
      { status: 500 }
    )
  }
}
