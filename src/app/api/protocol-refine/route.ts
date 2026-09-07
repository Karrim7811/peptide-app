// Refining a plan by arguing with it.
//
// The design's planner "changes its mind when you tell it to". /api/
// protocol-consult does not do this — it is a pre-plan intake that gathers
// goals and suggests peptides, and its response shape is questions or a
// recommendation, not a week. This route is the post-plan half.
//
// ── Why it returns a whole plan ───────────────────────────────────────────
//
// The model is asked to return the FULL revised plan in the same JSON shape as
// /api/protocol-plan, not a diff. Two reasons, and the second is the one that
// matters:
//
//   1. A diff against a nested weekly schedule is more error-prone to apply
//      than a whole document is to re-read.
//   2. The whole plan goes back through readPlan() on the client, which is what
//      strips any amount attached to a peptide with no published human dose. A
//      patch format would let a refinement smuggle in a figure by editing one
//      field of an already-rendered plan, bypassing the one place that check
//      happens.
//
// So the enforcement is the same on turn nine as on turn one.
//
// Pro-gated and consent-gated exactly like the planner it refines.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { requireAiConsent } from '@/lib/ai-consent'
import { doseGuardrail } from '@/lib/ai-dose-guardrail'
import { requirePro } from '@/lib/subscription'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** Only the peptides in play, not all 124 — the plan already names its cast. */
function contextFor(names: string[]): string {
  const wanted = new Set(names.map((name) => name.toLowerCase()))
  return PEPTIDE_KNOWLEDGE.filter((entry) => wanted.has(entry.name.toLowerCase()))
    .map(
      (entry) =>
        `${entry.name}: ${entry.whatItDoes}. Dosage: ${entry.dosageRange || 'varies'}. ` +
        `Cautions: ${entry.riskCautions}. Interactions: ${entry.drugInteractions || 'none noted'}.`,
    )
    .join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to refine a protocol.', code: 'AUTH_REQUIRED' },
        { status: 401 },
      )
    }

    const consentError = requireAiConsent(user)
    if (consentError) return consentError

    const proError = await requirePro(request)
    if (proError) return proError

    const body = await request.json()
    const { plan, message, peptides } = body

    const ask = typeof message === 'string' ? message.trim().slice(0, 1000) : ''
    if (!ask) {
      return NextResponse.json({ error: 'Say what you want changed.' }, { status: 400 })
    }
    if (!plan || typeof plan !== 'object') {
      return NextResponse.json({ error: 'There is no plan to refine.' }, { status: 400 })
    }

    const names = Array.isArray(peptides)
      ? peptides.slice(0, 20).map((entry: unknown) => String(entry).slice(0, 80))
      : []

    // The plan is echoed back to the model as data, not as instructions. It was
    // produced by a model and may contain anything; the guardrail below is what
    // constrains the output regardless of what the input says.
    const systemPrompt = `You are Cortex AI, an educational peptide research reference tool. You are revising an existing example weekly reference schedule because the reader has asked for a change. All output is educational and research reference only — NOT medical advice, diagnosis or treatment.

Peptides in play:
${contextFor(names)}

TASK: Apply the reader's requested change and return the COMPLETE revised schedule, not a description of what you changed. Explain your reasoning in "summary": say what moved and why, and say plainly if you think the request is a bad idea and why — you are allowed to disagree.

Respond ONLY with a valid JSON object in exactly the same format as the plan you were given: weeklySchedule (all 7 days, each with a doses array of {peptide, dose, time, route, site, notes}), interactions ({peptideA, peptideB, level, note} where level is safe|caution|danger), warnings (array of strings), and summary (a short paragraph).

${doseGuardrail()}

CRITICAL: Educational reference only. Never present anything as personalized medical advice.`

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `The current plan, as JSON:\n${JSON.stringify(plan).slice(0, 20000)}\n\nThe change I want: ${ask}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const text = content.text.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new SyntaxError('No JSON object in the response')

    return NextResponse.json(JSON.parse(match[0]))
  } catch (error) {
    console.error('Protocol refine error:', error)
    return NextResponse.json(
      { error: 'The plan could not be revised. Your current plan is unchanged.' },
      { status: 500 },
    )
  }
}
