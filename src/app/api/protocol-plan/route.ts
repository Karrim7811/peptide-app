import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'
import { getAuthenticatedUser } from '@/lib/supabase/server'

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

    const systemPrompt = `You are Cortex AI, an expert peptide protocol planner. You create personalized weekly dosing schedules based on the user's peptides, profile, and goals.

Peptide Knowledge Base:
${knowledgeBase}

${profileSummary}

${customInstructions ? `Additional user instructions: ${customInstructions}` : ''}

TASK: Create a complete weekly dosing protocol for these peptides: ${peptides.join(', ')}

You MUST:
1. Analyze all peptides for interactions and safety concerns
2. Create a weekly dosing schedule (Monday through Sunday)
3. Include timing (Morning/Evening/Night), dose amounts, injection route, and injection site rotation
4. Flag any dangerous combinations with clear warnings
5. Consider the user's medical conditions — contraindicate where necessary
6. Adjust protocol complexity based on experience level (Beginner = simpler schedules, fewer injections per day; Advanced = can handle complex timing)
7. Include reconstitution instructions for each peptide (vial size, BAC water volume, resulting concentration, typical dose volume)
8. Suggest reminders for each peptide with specific times and days

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
Always recommend consulting a healthcare provider.`

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
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

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const plan = JSON.parse(jsonText)

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
