import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { requireAiConsent } from '@/lib/ai-consent'
import { requirePro } from '@/lib/subscription'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    }

    const consentError = requireAiConsent(user)
    if (consentError) return consentError

    const proError = await requirePro(request)
    if (proError) return proError

    const { peptideName, goal } = await request.json()
    if (!peptideName) {
      return NextResponse.json({ error: 'Peptide name is required.' }, { status: 400 })
    }

    // Bound untrusted input length.
    const safeName = String(peptideName).slice(0, 80)
    const safeGoal = typeof goal === 'string' ? goal.slice(0, 200) : ''

    // Find the peptide in knowledge base
    const peptide = PEPTIDE_KNOWLEDGE.find(
      p => p.name.toLowerCase() === safeName.toLowerCase()
    )

    // Build the knowledge context for the AI
    const allPeptides = PEPTIDE_KNOWLEDGE.map(p =>
      `${p.name} [${p.goalCategory}]: ${p.whatItDoes}. Key effects: ${p.keyEffects}. Evidence: ${p.evidenceLevel}.`
    ).join('\n')

    const peptideInfo = peptide
      ? `Name: ${peptide.name}
Primary Purpose: ${peptide.primaryPurpose}
What it does: ${peptide.whatItDoes}
Goal Categories: ${peptide.goalCategories.join(', ')}
Key Effects: ${peptide.keyEffects}
Evidence: ${peptide.evidenceLevel}
CV Rating: ${peptide.cvRating}/5
Drug Interactions: ${peptide.drugInteractions}`
      : `The user asked about: ${safeName}`

    const goalContext = safeGoal ? `\nUser's primary goal: ${safeGoal}` : ''

    const systemPrompt = `You are Cortex AI, an educational peptide research reference tool. You summarize what published research literature reports about how peptides are commonly combined. Everything you provide is for educational and research reference only — NOT medical advice, diagnosis, or treatment recommendations.

## All 58 peptides in the knowledge base:
${allPeptides}

Your task: Given a specific peptide, summarize complementary peptides that research literature commonly references alongside it.

Always structure your response EXACTLY as follows (use these exact headers):

## Why Peptides Are Referenced Together
[1-2 sentences on what complementary combinations are reported to achieve for this specific peptide]

## Commonly Referenced Combinations
[List 4-6 peptides with this format for each:]
**[Peptide Name]** — [Goal category]
Reported synergy: [1-2 sentences on the mechanism reported in the literature]
Reported benefit: [What research literature associates with this combination]
Caution: [Any interaction or timing note from the literature]

## Timing & Reference Notes
[2-3 bullet points on how these are commonly referenced together in research literature]

## Commonly Cautioned Combinations
[2-3 peptides or classes the literature reports should not be combined, and why]

Frame everything as research reference — use "commonly reported", "research literature suggests", "studies note" rather than prescriptive instructions. Note when something lacks human evidence. Always end by reminding the user this is educational reference only and to consult a qualified healthcare professional before any decision.`

    const userMessage = `I want to know what peptides research literature commonly references alongside ${safeName}.${goalContext}

Here is the known information about this peptide:
${peptideInfo}

Give me the best stacking recommendations with clear reasoning.`

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    return NextResponse.json({
      reply: content.text,
      peptideData: peptide ?? null,
    })
  } catch (error) {
    console.error('Stack finder error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations. Please try again.' }, { status: 500 })
  }
}
