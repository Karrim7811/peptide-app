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

    const systemPrompt = `You are PeptideAI, a bloodwork analysis expert with deep knowledge of peptides, hormones, and biomarkers.

## Peptide Knowledge Base (58 peptides):
${peptideKnowledge}

Your task: Analyze the user's bloodwork markers, identify concerning values, and recommend peptides that could help optimize their biomarkers based on evidence.

Respond ONLY with a JSON object in this exact format (no markdown, no code blocks):
{
  "analysis": "<A comprehensive 2-4 paragraph analysis of the bloodwork results, noting what's optimal, suboptimal, or concerning. Reference normal ranges.>",
  "recommendations": [
    {
      "peptide": "<peptide name>",
      "reason": "<why this peptide is recommended based on the bloodwork>",
      "priority": "<high|medium|low>"
    }
  ],
  "warnings": ["<any health warnings or concerns that need immediate medical attention>"]
}

Provide 3-6 peptide recommendations sorted by priority. Be specific about which markers each peptide targets.
Always include a warning to consult a healthcare provider.
If any markers are critically out of range, flag them in warnings.`

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
