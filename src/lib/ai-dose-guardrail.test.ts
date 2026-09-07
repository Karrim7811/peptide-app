import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COMPOUND_LIST } from '@/lib/catalog'
import { NO_DOSE_LINE, doseState } from '@/lib/dosing'
import { doseGuardrail, noDoseNames } from '@/lib/ai-dose-guardrail'

describe('noDoseNames', () => {
  it('names every entry without a published figure, and none that has one', () => {
    const names = new Set(noDoseNames())
    for (const entry of COMPOUND_LIST) {
      if (doseState(entry) === 'published') {
        expect(names.has(entry.name), `${entry.id} has a figure and must not be listed`).toBe(
          false,
        )
      } else {
        expect(names.has(entry.name), `${entry.id} has no figure and must be listed`).toBe(true)
      }
    }
  })

  it('lists the research-tier peptides the calculator would have had to invent for', () => {
    const names = noDoseNames()
    expect(names).toContain('BPC-157')
    expect(names).toContain('SLU-PP-332')
  })

  it('does not list a labelled drug with a real published range', () => {
    expect(noDoseNames()).not.toContain('Semaglutide')
  })
})

describe('doseGuardrail', () => {
  const text = doseGuardrail()

  it('states the exact sentence that is the only permitted output', () => {
    expect(text).toContain(NO_DOSE_LINE)
  })

  // A model will reason its way around a category. A name on a list is harder.
  it('includes the names in full rather than describing the category', () => {
    for (const name of noDoseNames()) expect(text).toContain(name)
  })

  it('closes the routes a number could arrive through', () => {
    for (const route of [
      'animal studies',
      'body weight',
      'allometric scaling',
      'community',
      'similar peptide',
      'general knowledge',
    ]) {
      expect(text.toLowerCase()).toContain(route)
    }
  })

  it('still allows the literature to be described, labelled as not a dose', () => {
    expect(text).toContain('not a dose')
  })

  it('requires a source beside every figure that is permitted', () => {
    // Collapsed, because the prompt is hard-wrapped and the sentence spans a
    // line break. Asserting the wrapped form would break on a reflow.
    const flat = text.replace(/\s+/g, ' ')
    expect(flat).toContain('Never present a figure without its source')
    expect(flat).toContain('indistinguishable from a recommendation')
  })
})

// CLAUDE.md §16.9a names these two routes as the remaining exposure. Reading
// the source is deliberate: an import that is deleted while tidying would
// otherwise leave both prompts silently permissive again, and there is no unit
// test of a system prompt that would notice.
describe('the routes that can emit an amount', () => {
  const routes = [
    'src/app/api/protocol-plan/route.ts',
    'src/app/api/protocol-refine/route.ts',
    'src/app/api/chat/route.ts',
  ]

  it('every one of them interpolates the guardrail into its system prompt', () => {
    for (const path of routes) {
      const source = readFileSync(path, 'utf8')
      expect(source, path).toContain("from '@/lib/ai-dose-guardrail'")
      expect(source, path).toContain('${doseGuardrail()}')
    }
  })

  it('no longer asks the model for amounts without an exclusion', () => {
    const plan = readFileSync('src/app/api/protocol-plan/route.ts', 'utf8')
    expect(plan).not.toContain('research-reported amounts, administration route')
  })

  it('no longer advertises a peptide count that has been wrong since the port', () => {
    const chat = readFileSync('src/app/api/chat/route.ts', 'utf8')
    expect(chat).not.toContain('58 peptides')
  })
})
