// Landing page sample/demo data — ported verbatim from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, class Component
// methods buildPaperFeed / buildPipe / buildTerminal / buildChecker /
// buildStackScan / buildBlood / buildChat).
//
// This is illustrative sample content for landing-page animations/demos only —
// not live data, not user data, not medical advice. Strings are preserved
// verbatim from the prototype since they are shown to users.

// ─── Paper feed (buildPaperFeed) ───────────────────────────────────────────────

export const PAPER_FEED: string[] = [
  'Angiogenic modulation via BPC-157 in tendon repair',
  'GLP-1 receptor agonism and central satiety pathways',
  'TB-500 / thymosin-β4 actin sequestration kinetics',
  'GHK-Cu copper-peptide effects on collagen synthesis',
  'CJC-1295 pulsatile GH secretion and IGF-1 dynamics',
  'mTOR signaling crosstalk with growth-factor cascades',
  'VEGF expression and capillary density in ischemic tissue',
  'Ipamorelin selectivity at the ghrelin receptor',
  'TGF-β regulation of fibroblast differentiation',
  'AOD-9604 lipolytic activity in adipocyte models',
  'FGF-2 mitogenic pathways in wound healing',
  'Semaglutide cardiometabolic outcome meta-analysis',
]

// ─── Pipeline stages (buildPipe) ───────────────────────────────────────────────

export type PipelineStage = [label: string, sub: string, color: string]

export const PIPELINE_STAGES: PipelineStage[] = [
  ['LITERATURE', 'peer-reviewed', '#00E5FF'],
  ['MECHANISMS', 'pathways mapped', '#3BA7F0'],
  ['PATHWAYS', 'cross-referenced', '#7C3AED'],
  ['SYNERGIES', 'flagged', '#B06BE0'],
  ['REFERENCE', 'assembled', '#F7B731'],
]

// ─── Terminal / evidence panel (buildTerminal) ─────────────────────────────────

export interface EvidenceRow {
  name: string
  label: string
  level: number
  color: string
}

export interface MechanismChip {
  label: string
  color: string
}

export interface TerminalSample {
  evidence: EvidenceRow[]
  mechanismChips: MechanismChip[]
  mechanismNotes: string[]
  referenceTheme: string
  referenceLines: string[]
  referenceScore: string
  referenceScoreLabel: string[]
}

const MECH_CHIP_COLORS = ['#00E5FF', '#7C3AED', '#F7B731']
const MECH_CHIP_LABELS = ['VEGF', 'mTOR', 'IGF-1', 'FGF-2', 'TGF-β', 'GH', 'Angiogenesis']

export const TERMINAL_SAMPLE: TerminalSample = {
  evidence: [
    { name: 'BPC-157', label: 'Extensive', level: 0.9, color: '#00E5FF' },
    { name: 'TB-500', label: 'Solid', level: 0.72, color: '#00E5FF' },
    { name: 'GHK-Cu', label: 'Moderate', level: 0.58, color: '#7C3AED' },
    { name: 'CJC-1295', label: 'Moderate', level: 0.5, color: '#7C3AED' },
    { name: 'AOD-9604', label: 'Emerging', level: 0.32, color: '#F7B731' },
  ],
  mechanismChips: MECH_CHIP_LABELS.map((label, i) => ({
    label,
    color: MECH_CHIP_COLORS[i % MECH_CHIP_COLORS.length],
  })),
  mechanismNotes: ['pathways referenced', 'relationships mapped', 'synergistic pairs flagged'],
  referenceTheme: 'RECOVERY THEME · sample',
  referenceLines: ['BPC-157  · repair', 'TB-500  · actin/repair', 'GHK-Cu  · collagen'],
  referenceScore: 'HIGH',
  referenceScoreLabel: ['LITERATURE', 'SUPPORT'],
}

// ─── Interaction checker (buildChecker) ────────────────────────────────────────

export interface Verdict {
  sev: string
  c: string
  t: string
}

export const INTERACTION_SAMPLES: Record<string, Verdict> = {
  'BPC-157|TB-500': {
    sev: 'STUDIED TOGETHER',
    c: '#00E5FF',
    t: 'Frequently referenced as a combined tissue-repair pair. Complementary mechanisms — BPC-157 (angiogenesis/GI) and TB-500 (actin/cell migration) — with no established pharmacokinetic conflict reported in the literature.',
  },
  'Tesamorelin|Ipamorelin': {
    sev: 'STUDIED TOGETHER',
    c: '#00E5FF',
    t: 'GHRH analog plus GH secretagogue act on distinct receptors; commonly referenced as a combined GH-axis approach in the literature. IGF-1 monitoring is discussed in the sources.',
  },
  'CJC-1295|Ipamorelin': {
    sev: 'STUDIED TOGETHER',
    c: '#00E5FF',
    t: 'The classic GHRH + GHRP pairing — referenced to produce synergistic, natural-mimicking GH pulses at distinct receptor sites.',
  },
  'Semaglutide|Retatrutide': {
    sev: 'CAUTION',
    c: '#F7B731',
    t: 'Two incretin agonists with overlapping GI and glycemic effects. Combined use is not standard and raises additive nausea/hypoglycemia considerations in the literature. Physician oversight referenced.',
  },
  'Semaglutide|Tirzepatide': {
    sev: 'CAUTION',
    c: '#F7B731',
    t: 'Overlapping GLP-1 activity — stacking incretin agonists compounds GI and hypoglycemia risk. Not a standard combination; physician oversight referenced.',
  },
  'BPC-157|Semaglutide': {
    sev: 'MONITOR',
    c: '#B06BE0',
    t: 'No direct interaction widely reported. GLP-1 agonists slow gastric emptying; sources discuss watching for compounded GI effects.',
  },
}

export const FALLBACK_VERDICT: Verdict = {
  sev: 'NO DIRECT SIGNAL',
  c: '#8A97AC',
  t: 'No well-characterized interaction reported between these two in the available literature. Absence of a documented signal is not proof of safety — verify with primary sources and a clinician.',
}

const SAME_COMPOUND_VERDICT: Verdict = {
  sev: 'SAME COMPOUND',
  c: '#8A97AC',
  t: 'Select two different compounds to check their interaction.',
}

export function lookupVerdict(a: string, b: string): Verdict {
  if (a === b) return SAME_COMPOUND_VERDICT
  return INTERACTION_SAMPLES[`${a}|${b}`] || INTERACTION_SAMPLES[`${b}|${a}`] || FALLBACK_VERDICT
}

// ─── Stack scan (buildStackScan) ───────────────────────────────────────────────

export type StackScanFlag = [severity: string, color: string, note: string]

export interface StackScanSample {
  meds: string[]
  peps: string[]
  flags: Record<string, StackScanFlag>
}

export const STACK_SCAN: StackScanSample = {
  meds: ['Metformin', 'Lisinopril', 'Atorvastatin'],
  peps: ['BPC-157', 'CJC-1295', 'Tesamorelin'],
  flags: {
    'CJC-1295|Metformin': [
      'MONITOR',
      '#F7B731',
      'GH-axis peptides can raise fasting glucose while metformin lowers it — track HbA1c across the cycle.',
    ],
    'Tesamorelin|Metformin': [
      'MONITOR',
      '#F7B731',
      'Overlapping glucose and IGF-1 effects — monitor glycemic markers; discussed with physician oversight in the literature.',
    ],
  },
}

// ─── Bloodwork (buildBlood) ─────────────────────────────────────────────────────

export type BloodMarker = [name: string, value: string, status: string, level: number, color: string]
export type BloodRec = [group: string, peptides: string, note: string]

export const BLOOD_MARKERS: BloodMarker[] = [
  ['Total Testosterone', '312 ng/dL', 'LOW', 0.32, '#F7B731'],
  ['IGF-1', '145 ng/mL', 'LOW-NORMAL', 0.44, '#7C3AED'],
  ['hs-CRP', '3.8 mg/L', 'ELEVATED', 0.72, '#F7B731'],
  ['HbA1c', '5.9 %', 'BORDERLINE', 0.6, '#F7B731'],
  ['Vitamin D', '22 ng/mL', 'LOW', 0.3, '#F7B731'],
  ['ApoB', '105 mg/dL', 'BORDERLINE', 0.58, '#00E5FF'],
  ['Ferritin', '96 ng/mL', 'IN RANGE', 0.55, '#3BA7F0'],
  ['TSH', '2.1 mIU/L', 'IN RANGE', 0.5, '#3BA7F0'],
]

export const BLOOD_RECS: BloodRec[] = [
  [
    'GH / IGF-1 axis · low-normal',
    'CJC-1295 + Ipamorelin',
    'Act on distinct GH-axis receptors; commonly referenced where IGF-1 sits low-normal.',
  ],
  [
    'Inflammation · hs-CRP elevated',
    'BPC-157',
    'Studied for tissue and GI repair; paired with lifestyle inputs that drive CRP.',
  ],
  [
    'Metabolic · HbA1c / ApoB',
    'Tesamorelin · Semaglutide',
    'Referenced in visceral-fat and metabolic literature; physician oversight noted.',
  ],
  [
    'Recovery support',
    'TB-500',
    'Frequently referenced alongside BPC-157 in repair contexts.',
  ],
]

// ─── Chat (buildChat) ───────────────────────────────────────────────────────────

export const CHAT_QA: Record<string, string> = {
  "What's the half-life of BPC-157?":
    "Reported circulating half-life is short — on the order of a few hours — though tissue-level effects are studied to persist longer. Sources differ; this is reference information, not a dosing instruction.",
  'Can I stack TB-500 with BPC-157?':
    "They're among the most commonly co-referenced peptides for tissue repair — complementary mechanisms (angiogenesis/GI vs. actin/cell migration) with no established pharmacokinetic conflict in the literature. Verify with primary sources and a clinician.",
  'What is CJC-1295 studied for?':
    "It's a GHRH analog studied for sustained GH and IGF-1 elevation, frequently referenced alongside a secretagogue like Ipamorelin to target distinct receptors on the GH axis.",
  'How is GHK-Cu researched?':
    "GHK-Cu is a copper-binding peptide studied for collagen synthesis, wound healing and skin remodeling. I can pull the specific references if you'd like.",
}

export const CHAT_FALLBACK: string =
  "I can reference mechanisms, half-lives, study findings and how compounds are discussed together — always sourced, never as medical advice. Try one of the suggested questions above."
