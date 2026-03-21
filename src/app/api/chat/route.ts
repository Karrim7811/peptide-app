import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'
import { getAuthenticatedUser } from '@/lib/supabase/server'
// Pro gating temporarily removed — all authenticated users have full access

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
    // Auth check (supports both cookie-based web and Bearer token mobile)
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to use Cortex AI.', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, stackContext } = body
    // messages: array of { role: 'user'|'assistant', content: string }
    // stackContext: string describing user's current stack (optional)

    const knowledgeBase = buildKnowledgeContext()

    const systemPrompt = `You are Cortex AI, the peptide intelligence assistant inside the Peptide Cortex app. You are knowledgeable, conversational, and helpful — like talking to a well-informed friend who happens to be an expert in peptides, research chemicals, and biohacking protocols.

You know about:
- Peptide mechanisms, half-lives, and optimal dosing
- Injection protocols, reconstitution, and storage
- Stack combinations and synergies
- Side effect profiles and mitigation
- Cycling protocols
- Interactions with supplements AND prescription medications

Peptide Knowledge Base (58 peptides):
${knowledgeBase}

${stackContext ? `The user's current stack: ${stackContext}\n` : ''}

IMPORTANT FORMATTING RULES:
- Write in a natural, conversational tone — like you're chatting, not writing an essay
- DO NOT use markdown headers (#, ##, ###)
- DO NOT use bold (**text**) or italic markers
- Use plain text only
- Use simple dashes (-) for lists when needed
- Keep responses concise and practical
- Break up long responses with blank lines for readability

Always recommend consulting a healthcare provider for medical decisions. Frame information as educational/research context.`

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
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
