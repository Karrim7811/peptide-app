import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'
import { getAuthenticatedUser } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
    }

    const { peptideName, goal } = await request.json()
    if (!peptideName) {
      return NextResponse.json({ error: 'Peptide name is required.' }, { status: 400 })
    }

    // Find the peptide in knowledge base
    const peptide = PEPTIDE_KNOWLEDGE.find(
      p => p.name.toLowerCase() === peptideName.toLowerCase()
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
      : `The user asked about: ${peptideName}`

    const goalContext = goal ? `\nUser's primary goal: ${goal}` : ''

    const systemPrompt = `You are PeptideAI, an expert in peptide protocols and stacking. You have deep knowledge of synergistic combinations, mechanisms of action, and safety.

## All 58 peptides in the knowledge base:
${allPeptides}

Your task: Given a specific peptide, recommend the best complementary peptides to stack with it.

Always structure your response EXACTLY as follows (use these exact headers):

## Why Stack With Other Peptides?
[1-2 sentences on what complementary stacking achieves for this specific peptide]

## Top Stacking Recommendations
[List 4-6 peptides with this format for each:]
**[Peptide Name]** — [Goal category]
Why it works: [1-2 sentences on the synergy mechanism]
Combined benefit: [What the user gets from this combination]
Caution: [Any interaction or timing note]

## Timing & Protocol Tips
[2-3 practical bullet points on how to time/administer this stack]

## What to Avoid Stacking
[2-3 peptides or classes that should NOT be combined and why]

Keep answers practical, specific, and safe. Always note if something lacks human evidence.`

    const userMessage = `I want to know what peptides I can stack with ${peptideName}.${goalContext}

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
