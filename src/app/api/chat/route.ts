import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Build a compact knowledge summary for the system prompt
function buildKnowledgeContext(): string {
  return PEPTIDE_KNOWLEDGE.map(p =>
    `${p.name} [${p.goalCategory}]: ${p.whatItDoes}. Dosage: ${p.dosageRange || 'varies'}. ` +
    `Key effects: ${p.keyEffects}. Cautions: ${p.riskCautions}. ` +
    `Drug interactions: ${p.drugInteractions || 'none noted'}. Evidence: ${p.evidenceLevel}.`
  ).join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, stackContext } = body
    // messages: array of { role: 'user'|'assistant', content: string }
    // stackContext: string describing user's current stack (optional)

    const knowledgeBase = buildKnowledgeContext()

    const systemPrompt = `You are PeptideAI, an expert assistant specializing in peptides, research chemicals, and biohacking protocols. You have deep knowledge of:
- Peptide mechanisms of action, half-lives, and optimal dosing
- Injection protocols, reconstitution, and storage
- Stack combinations and synergies
- Side effect profiles and mitigation
- Cycling protocols (on/off periods)
- Interaction with supplements and medications

## Peptide Knowledge Base (58 peptides):
${knowledgeBase}

${stackContext ? `The user's current stack:\n${stackContext}\n` : ''}

Always:
- Be specific and practical with protocols and dosing
- Mention if something requires refrigeration, specific injection timing, or fasted state
- Flag any known interactions or concerns
- Recommend consulting a healthcare provider for medical decisions
- Keep responses concise and well-structured with bullet points or sections when helpful

Never recommend anything clearly illegal. Always frame information as educational/research context.`

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    return NextResponse.json({ reply: content.text })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to get response. Please try again.' }, { status: 500 })
  }
}
