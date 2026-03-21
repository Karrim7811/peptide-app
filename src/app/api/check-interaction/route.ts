import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { findPeptide } from '@/lib/peptide-knowledge'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemA, itemB } = body

    if (!itemA || !itemB) {
      return NextResponse.json(
        { error: 'Both itemA and itemB are required.' },
        { status: 400 }
      )
    }

    // Look up knowledge for both items to enrich the prompt
    const kA = findPeptide(itemA)
    const kB = findPeptide(itemB)
    const contextA = kA
      ? `${kA.name}: ${kA.whatItDoes}. Drug interactions: ${kA.drugInteractions}. Cautions: ${kA.riskCautions}.`
      : ''
    const contextB = kB
      ? `${kB.name}: ${kB.whatItDoes}. Drug interactions: ${kB.drugInteractions}. Cautions: ${kB.riskCautions}.`
      : ''
    const knowledgeContext = [contextA, contextB].filter(Boolean).join('\n')

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: `You are a medical interaction checker specializing in peptides, prescription medications, supplements, and over-the-counter drugs.

You check interactions between ANY combination of:
- Peptides (BPC-157, TB-500, Semaglutide, etc.)
- Prescription medications (Metformin, Vyvanse, Lisinopril, Adderall, etc.)
- Supplements (Vitamin D, Magnesium, Ashwagandha, etc.)
- Over-the-counter drugs (Ibuprofen, Tylenol, Aspirin, etc.)

Provide clear, factual information about interactions between the two compounds.
Always recommend consulting a healthcare provider for medical decisions.
${knowledgeContext ? `\nKnown data about these compounds:\n${knowledgeContext}\n` : ''}
Format your response as JSON: { "level": "safe|caution|danger|unknown", "summary": "brief one-line summary", "details": "detailed explanation in plain text - no markdown, no bold, no headers", "recommendations": ["rec1", "rec2", "rec3"] }
Respond ONLY with the JSON object, no additional text.`,
      messages: [
        {
          role: 'user',
          content: `Check the interaction between "${itemA}" and "${itemB}". These could be peptides, medications, supplements, or any combination.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const result = JSON.parse(jsonText)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Interaction check error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          level: 'unknown',
          summary: 'Could not parse interaction data.',
          details: 'The AI returned an unexpected response format. Please try again.',
          recommendations: ['Consult a healthcare provider for accurate interaction information.'],
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check interaction. Please try again.' },
      { status: 500 }
    )
  }
}
