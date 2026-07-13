import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Auth required: this hits Claude Opus on every call. Left open, it is a
  // direct cost-abuse vector (anyone can curl it in a loop).
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.', code: 'AUTH_REQUIRED' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      // 5-7 headlines + 3-5 FDA items + trending list overruns 1024 tokens and
      // truncates the JSON mid-array, which then fails to parse. Give it room.
      max_tokens: 2048,
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

    let text = message.content[0].type === 'text' ? message.content[0].text : ''
    // Strip markdown fences and trailing commas before parsing.
    text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    let result: unknown = null
    if (jsonMatch) {
      const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, '$1')
      try {
        result = JSON.parse(cleaned)
      } catch (parseErr) {
        console.error('Market pulse JSON parse failed:', parseErr)
      }
    }

    // Degrade gracefully to an empty feed rather than 500 — this is a
    // non-critical news surface on the dashboard.
    if (!result || typeof result !== 'object') {
      return NextResponse.json({ lastUpdated: '', headlines: [], fdaWatch: [], trendingPeptides: [] })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('Market pulse error:', err)
    return NextResponse.json({ lastUpdated: '', headlines: [], fdaWatch: [], trendingPeptides: [] })
  }
}
