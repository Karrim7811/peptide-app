import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { requireAiConsent } from '@/lib/ai-consent'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildPeptideContext(): string {
  return PEPTIDE_KNOWLEDGE.map(p =>
    `${p.name} [${p.goalCategory}]: ${p.whatItDoes}. Key effects: ${p.keyEffects}. Evidence: ${p.evidenceLevel}. Cautions: ${p.riskCautions}.`
  ).join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to use Bloodwork Analyzer.', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const consentError = requireAiConsent(user)
    if (consentError) return consentError

    const body = await request.json()
    const { markers, currentStack, goals } = body as {
      markers: { name: string; value: number; unit: string }[]
      currentStack: string[]
      goals: string
    }

    if (!markers || markers.length === 0) {
      return NextResponse.json({ error: 'At least one bloodwork marker is required.' }, { status: 400 })
    }

    const peptideKnowledge = buildPeptideContext()

    const markersText = markers
      .map(m => `${m.name}: ${m.value} ${m.unit}`)
      .join('\n')

    const stackText = currentStack && currentStack.length > 0
      ? `Current peptide stack: ${currentStack.join(', ')}`
      : 'No current peptide stack.'

    const goalsText = goals ? `User goals: ${goals}` : 'No specific goals stated.'

    const systemPrompt = `You are PeptideAI, an educational research reference tool with knowledge of peptides, hormones, and biomarkers from published literature. ALL information you provide is for educational reference only — NOT medical advice, diagnosis, or treatment recommendations.

## Peptide Knowledge Base (58 peptides):
${peptideKnowledge}

Your task: Provide an educational overview of the user's bloodwork markers in the context of published reference ranges, and note peptides that have been studied in relation to those biomarkers in research literature.

IMPORTANT: Frame everything as educational reference from published research, not as medical advice. Use language like "research literature suggests", "studies have investigated", "commonly referenced in research" rather than prescriptive language.

Respond ONLY with a JSON object in this exact format (no markdown, no code blocks):
{
  "analysis": "<A 2-4 paragraph educational overview of the markers in context of standard reference ranges. Note which are within, above, or below commonly published ranges. This is not a diagnosis.>",
  "recommendations": [
    {
      "peptide": "<peptide name>",
      "reason": "<what research literature says about this peptide in relation to relevant biomarkers>",
      "priority": "<high|medium|low>"
    }
  ],
  "warnings": ["<important notes — always include a reminder that this is educational only and to consult a healthcare professional>"]
}

Provide 3-6 peptide references sorted by relevance to the markers. Be specific about which markers each peptide has been studied for.
ALWAYS include a warning that this is for educational reference only and the user should consult a qualified healthcare professional for medical advice.
If any markers appear significantly outside standard reference ranges, note this and emphasize consulting a doctor.`

    const userMessage = `Please analyze my bloodwork and recommend peptides.

## Bloodwork Results:
${markersText}

## Context:
${stackText}
${goalsText}

Analyze these results, identify any concerning values, and recommend peptides that could help optimize my biomarkers.`

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    // Extract JSON from response
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const result = JSON.parse(jsonText)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bloodwork analyze error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json({
        analysis: 'Unable to parse the AI analysis. Please try again.',
        recommendations: [],
        warnings: ['The analysis could not be completed. Please try again or consult a healthcare provider.'],
      }, { status: 200 })
    }

    return NextResponse.json({ error: 'Failed to analyze bloodwork. Please try again.' }, { status: 500 })
  }
}
