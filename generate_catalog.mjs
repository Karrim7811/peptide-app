// Regenerates src/lib/catalog.ts from src/lib/peptide-knowledge.ts.
//
// Run:  node generate_catalog.mjs   (after python generate_knowledge.py)
//
// The original 58 compounds were generated once into the design handoff's
// catalog.js with an INCONSISTENT name rule — most strip the trailing
// parenthetical ("Semaglutide (Wegovy/Ozempic)" -> "Semaglutide") but a few do
// not ("GHK-Cu (Copper peptide)" keeps it). Those ids are referenced by live
// stack_items rows and by the tests, so they are carried over verbatim rather
// than re-derived. New compounds get the consistent rule.

import { readFileSync, writeFileSync } from 'node:fs'

const KNOWLEDGE = 'src/lib/peptide-knowledge.ts'
const FROZEN = 'design_handoff_peptide_cortex/catalog.js'
const OUT = 'src/lib/catalog.ts'

// ── Load the knowledge file ────────────────────────────────────────────────
const raw = readFileSync(KNOWLEDGE, 'utf8')
const start = raw.indexOf('export const PEPTIDE_KNOWLEDGE')
const end = raw.indexOf('\n]', start)
const arrayLiteral = raw.slice(raw.indexOf('[', start), end + 2)
const KNOW = new Function(`return ${arrayLiteral}`)()

// ── Canonical ids from the frozen bundle ───────────────────────────────────
const frozen = readFileSync(FROZEN, 'utf8')
const idByFullName = new Map()
for (const m of frozen.matchAll(
  /"id": "([^"]+)",\s*\n\s*"name": "([^"]+)",\s*\n\s*"fullName": "([^"]+)"/g,
)) {
  idByFullName.set(m[3], { id: m[1], name: m[2] })
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

function identify(fullName) {
  const known = idByFullName.get(fullName)
  if (known) return known
  const name = fullName.replace(/\s*\([^)]*\)\s*$/, '').trim() || fullName
  return { id: slug(name), name }
}

const EVIDENCE_TO_GRADE = {
  'FDA-approved Rx (labeled use)': ['A', 4],
  'Region-specific approval (not US FDA)': ['B', 3],
  'Mixed/unclear regulatory status': ['C', 2],
  'Research/compounded/adjunct (no established FDA indication)': ['D', 1],
  'Physiology/diagnostic target (not a therapy)': ['—', 0],
}

// ── Categories: preserved from the frozen bundle (ids, labels, hues, order) ─
const catsBlock = frozen.slice(
  frozen.indexOf('export const CATEGORIES'),
  frozen.indexOf('export const COMPOUNDS'),
)
const CATEGORIES = new Function(
  `return ${catsBlock.slice(catsBlock.indexOf('['), catsBlock.lastIndexOf(']') + 1)}`,
)()
const catIdByName = new Map(CATEGORIES.map((c) => [c.name, c.id]))

// ── Build compounds ────────────────────────────────────────────────────────
const identified = KNOW.map((k) => ({ k, ...identify(k.name) }))
const idByName = new Map(identified.map((e) => [e.k.name, e.id]))

const unknownCats = new Set()
const compounds = {}

for (const { k, id, name } of identified) {
  const [grade, bars] = EVIDENCE_TO_GRADE[k.evidenceLevel] ?? ['D', 1]
  const catId = catIdByName.get(k.goalCategory)
  if (!catId) unknownCats.add(k.goalCategory)

  compounds[id] = {
    id,
    name,
    fullName: k.name,
    category: k.goalCategory,
    catId: catId ?? slug(k.goalCategory),
    purpose: k.primaryPurpose,
    action: k.whatItDoes,
    effects: k.keyEffects,
    dosage: k.dosageRange,
    cautions: k.riskCautions,
    interactions: k.drugInteractions,
    bottomLine: k.bottomLine,
    evidence: k.evidenceLevel,
    grade,
    bars,
    cv: Number(k.cvRating) || 0,
    cvNotes: k.cvNotes,
    stacksWith: (k.stacksWellWith || []).map((n) => idByName.get(n)).filter(Boolean),
  }
}

if (unknownCats.size) {
  console.error('UNKNOWN goalCategory values (not in CATEGORIES):', [...unknownCats])
  process.exit(1)
}

// ── Sample data + helpers: carried over from the current catalog verbatim ───
const current = readFileSync(OUT, 'utf8')
const header = current.slice(0, current.indexOf('export const CATEGORIES'))
const tail = current.slice(current.indexOf('export const STACK'))

const out =
  header +
  `export const CATEGORIES: Category[] = ${JSON.stringify(CATEGORIES, null, 2)}\n\n` +
  `export const COMPOUNDS: Record<string, Compound> = ${JSON.stringify(compounds, null, 1)}\n\n` +
  tail.replace(/export const COUNTS: Counts = \{[^}]*\}/,
    `export const COUNTS: Counts = { compounds: ${Object.keys(compounds).length}, categories: ${CATEGORIES.length}, stack: 6 }`)

writeFileSync(OUT, out, 'utf8')

const byGrade = {}
for (const c of Object.values(compounds)) byGrade[c.grade] = (byGrade[c.grade] ?? 0) + 1
console.log(`wrote ${OUT}: ${Object.keys(compounds).length} compounds, ${CATEGORIES.length} categories`)
console.log('grades:', byGrade)
