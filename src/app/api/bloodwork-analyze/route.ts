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
    // currentStack accepts either the new structured shape (preferred) or a
    // legacy string[]. Legacy requests are coerced into structured entries
    // so the rest of the code has a single shape to work with.
    type StackEntry = {
      name: string
      vialMg?: string | number
      doseAmount?: string | number
      doseUnit?: string
      schedule?: string
    }
    const { markers, currentStack, currentStackSchedule, goals } = body as {
      markers: { name: string; value: number; unit: string }[]
      currentStack?: (StackEntry | string)[]
      currentStackSchedule?: string  // legacy free-text
      goals: string
    }

    if (!markers || markers.length === 0) {
      return NextResponse.json({ error: 'At least one bloodwork marker is required.' }, { status: 400 })
    }

    const peptideKnowledge = buildPeptideContext()

    const markersText = markers
      .map(m => `${m.name}: ${m.value} ${m.unit}`)
      .join('\n')

    const stackEntries: StackEntry[] = (currentStack || [])
      .map((e) => (typeof e === 'string' ? { name: e } : e))
      .filter((e) => e && typeof e.name === 'string' && e.name.trim().length > 0)

    const hasStack = stackEntries.length > 0

    // Build a rich per-entry description for the prompt. Each entry is
    // rendered as one bullet point with vial mg, per-dose amount+unit and
    // schedule — whatever the user filled in.
    const stackLines = stackEntries.map((e) => {
      const parts: string[] = [String(e.name).trim()]
      if (e.vialMg !== undefined && String(e.vialMg).trim().length > 0) {
        parts.push(`(${String(e.vialMg).trim()} mg vial)`)
      }
      if (e.doseAmount !== undefined && String(e.doseAmount).trim().length > 0) {
        const unit = e.doseUnit && String(e.doseUnit).trim().length > 0 ? String(e.doseUnit) : 'mcg'
        parts.push(`— ${String(e.doseAmount).trim()} ${unit} per dose`)
      }
      if (e.schedule && String(e.schedule).trim().length > 0) {
        parts.push(`, ${String(e.schedule).trim()}`)
      }
      return `- ${parts.join(' ')}`
    })

    const stackText = hasStack
      ? `Current peptide stack (the user is already using these — the vial mg, per-dose amount and timing are the user's actual current protocol):\n${stackLines.join('\n')}`
      : 'No current peptide stack.'

    // Legacy free-text schedule (only if the new structured entries did not
    // already include per-entry schedules) — kept for backwards compat.
    const scheduleText = hasStack && !stackEntries.some((e) => e.schedule && String(e.schedule).trim().length > 0)
      && currentStackSchedule && currentStackSchedule.trim().length > 0
      ? `Additional schedule notes: ${currentStackSchedule.trim()}`
      : ''

    const goalsText = goals ? `User goals: ${goals}` : 'No specific goals stated.'

    const systemPrompt = `You are PeptideAI, an educational research reference tool with knowledge of peptides, hormones, and biomarkers from published literature. ALL information you provide is for educational reference only — NOT medical advice, diagnosis, or treatment recommendations.

## Peptide Knowledge Base (58 peptides):
${peptideKnowledge}

Your task: Provide an educational overview of the user's bloodwork markers in the context of published reference ranges, and note peptides that have been studied in relation to those biomarkers in research literature.

IMPORTANT: Frame everything as educational reference from published research, not as medical advice. Use language like "research literature suggests", "studies have investigated", "commonly referenced in research" rather than prescriptive language.

RESPECT THE USER'S EXISTING REFERENCE SCHEDULE:
If the user indicates they are already using a peptide stack with a specific schedule, treat that schedule as fixed context. Your peptide references must:
- NOT duplicate peptides already in the user's current stack (unless the research literature suggests a meaningfully different amount would be relevant — and call that out explicitly).
- Favor peptides that complement the existing schedule — e.g. if the user already references a morning injection, prefer peptides that research literature commonly references for evening/night use, unless co-administration is supported by the literature.
- In each recommendation's reason, note how the referenced peptide would fit around the user's existing schedule (e.g. "research literature often references this for evening use, which would complement the user's morning BPC-157 reference").
- Note any interactions research literature has identified between the referenced peptides and the user's existing stack.

VIAL MG REFERENCE:
For every recommended peptide, include a \`suggestedVialMg\` hint — the vial size that is most commonly referenced in research literature for that peptide (e.g. 5, 10). This is so the user can reference what vial size to look for. Use a numeric value (mg) or, if the peptide is typically sold in a non-mg unit, a short string like "2 mg" / "5000 IU".

Respond ONLY with a JSON object in this exact format (no markdown, no code blocks):
{
  "analysis": "<A 2-4 paragraph educational overview of the markers in context of standard reference ranges. Note which are within, above, or below commonly published ranges. This is not a diagnosis.>",
  "recommendations": [
    {
      "peptide": "<peptide name>",
      "reason": "<what research literature says about this peptide in relation to relevant biomarkers, and how it fits around the user's existing schedule if one was provided>",
      "priority": "<high|medium|low>",
      "suggestedVialMg": "<commonly referenced vial size, e.g. '5' or '10 mg'>"
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
${stackText}${scheduleText ? `\n${scheduleText}` : ''}
${goalsText}

Analyze these results, identify any concerning values, and recommend peptides that could help optimize my biomarkers. For each recommendation include the commonly-referenced vial mg size.${hasStack ? ' Keep my existing stack and its schedule intact as context — suggest additional peptides that would complement what I am already referencing, rather than replacing it.' : ''}`

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

    // Normalise suggestedVialMg to a string so the iOS decoder has a
    // single shape to parse (Claude sometimes returns a bare number).
    if (Array.isArray(result?.recommendations)) {
      for (const rec of result.recommendations) {
        if (rec && rec.suggestedVialMg !== undefined && rec.suggestedVialMg !== null) {
          rec.suggestedVialMg = String(rec.suggestedVialMg)
        }
      }
    }

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
