import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: `You are a peptide industry analyst with knowledge up to early 2026.
Provide a concise market pulse update covering recent developments in the peptide research space.
Respond ONLY with a JSON object in this exact format:
{
  "lastUpdated": "<Month Year>",
  "headlines": [
    {
      "title": "<headline>",
      "summary": "<1-2 sentence summary>",
      "category": "<FDA|Research|Market|Regulatory|Clinical>",
      "sentiment": "<positive|neutral|negative|warning>"
    }
  ],
  "fdaWatch": [
    {
      "peptide": "<name>",
      "status": "<current FDA status>",
      "update": "<recent development>"
    }
  ],
  "trendingPeptides": ["<peptide1>", "<peptide2>", "<peptide3>", "<peptide4>", "<peptide5>"]
}

Include 5-7 headlines and 3-5 FDA watch items. Focus on BPC-157, TB-500, CJC-1295, Ipamorelin, Semaglutide, Tirzepatide, Selank, Semax, AOD-9604, and other popular peptides. Include FDA enforcement actions, research breakthroughs, scheduling changes, and market developments.`,
      messages: [
        {
          role: 'user',
          content: 'Give me the latest peptide market pulse update with FDA news, research updates, and trending peptides as of early 2026.',
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
    }
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (err) {
    console.error('Market pulse error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
