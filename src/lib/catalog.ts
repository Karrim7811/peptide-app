// Peptide Cortex — Mirror data layer.
//
// PORTED, NOT AUTHORED. The data below is a mechanical port of
// design_handoff_peptide_cortex/catalog.js, which was itself generated from
// src/lib/peptide-knowledge.ts (58 entries) and src/lib/bloodwork-markers.ts.
// Every prose field is the repo's own copy, unedited — nothing prescriptive is
// invented here. Regenerate rather than hand-edit.
//
// ── The evidence-grade rule ────────────────────────────────────────────────
// `grade` maps ONE-TO-ONE from `evidence` with no tiebreaker. `cv` is a
// CARDIOVASCULAR score paired with `cvNotes` and must NEVER influence the
// evidence grade — an earlier revision used it as a tiebreaker and fabricated
// a distinction between Semaglutide (cv 5) and Somatropin (cv 1) despite
// identical evidence. `gradeFor()` is the only sanctioned derivation, and
// `assertGradeIntegrity()` proves the invariant over the whole catalog.
//
// ── Supabase mapping ───────────────────────────────────────────────────────
//   STACK   -> stack_items        DOSE_LOG -> dose_logs
//   MARKERS -> bloodwork_results  CYCLE    -> cycles
//   SITES   -> injection_sites    COMPOUNDS/CATEGORIES -> this bundle, not tables
//
// SITES carries geometry only. Injection counts are DERIVED from the filtered
// dose log at read time (see siteUsage() in entitlement.ts) — a stored count
// cannot respond to a filter, and that is how the free tier leaked a locked
// compound's history during design.

import type { HueFamily } from '@/lib/design/grounds'

/** The five `evidenceLevel` values carried through from the library. */
export const EVIDENCE_LEVELS = [
  'FDA-approved Rx (labeled use)',
  'Region-specific approval (not US FDA)',
  'Mixed/unclear regulatory status',
  'Research/compounded/adjunct (no established FDA indication)',
  'Physiology/diagnostic target (not a therapy)',
] as const
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number]

/**
 * Grades. '—' is Physiology/diagnostic target: not a therapy, so a therapeutic
 * grade does not apply and it sorts last rather than pretending to be weak
 * evidence.
 */
export type Grade = 'A' | 'B' | 'C' | 'D' | '\u2014'

export const GRADE_ORDER: Grade[] = ['A', 'B', 'C', 'D', '\u2014']

/** The one-to-one map. No tiebreaker, by design. */
export const EVIDENCE_TO_GRADE: Record<EvidenceLevel, Grade> = {
  'FDA-approved Rx (labeled use)': 'A',
  'Region-specific approval (not US FDA)': 'B',
  'Mixed/unclear regulatory status': 'C',
  'Research/compounded/adjunct (no established FDA indication)': 'D',
  'Physiology/diagnostic target (not a therapy)': '\u2014',
}

/**
 * Cardiovascular impact, 0-5. Branded so it cannot be passed where an evidence
 * signal is expected — the type system now carries the rule the comment states.
 */
export type CardiovascularScore = number & { readonly __cv: unique symbol }

export interface Category {
  id: string
  label: string
  name: string
  hue: HueFamily
  order: number
}

export interface Compound {
  id: string
  name: string
  fullName: string
  category: string
  catId: string
  purpose: string
  action: string
  effects: string
  dosage: string
  cautions: string
  interactions: string
  bottomLine: string
  evidence: EvidenceLevel
  grade: Grade
  /** Filled evidence bars, 0-4. Presentational mirror of `grade`. */
  bars: number
  /** Cardiovascular score. Never an evidence signal — see the header. */
  cv: number
  cvNotes: string
  stacksWith: string[]
}

export interface StackEntry {
  id: string
  vialMg: number
  waterMl: number
  doseMcg: number
  /** Percent of vial remaining. */
  supply: number
  supplyDays: number
  days: number
  schedule: string
  site: string
}

export interface DoseLogEntry {
  when: string
  id: string
  dose: string
  site: string
}

export interface Marker {
  key: string
  label: string
  unit: string
  value: number
  low: number
  high: number
  catId: string
}

export interface Cycle {
  day: number
  length: number
  start: string
  washout: string
  /** Sample-data convenience only. Live adherence is derived — see cycleReport(). */
  adherence: number
  onTime: number
}

export interface Site {
  id: string
  label: string
  x: number
  y: number
}

export interface Counts {
  compounds: number
  categories: number
  stack: number
}

export const CATEGORIES: Category[] = [
  {
    "id": "healing-recovery",
    "label": "HEALING/RECOVERY",
    "name": "Healing/Recovery",
    "hue": "cy",
    "order": 0
  },
  {
    "id": "gh-axis",
    "label": "GH AXIS",
    "name": "GH Axis",
    "hue": "pu",
    "order": 1
  },
  {
    "id": "metabolic-weight",
    "label": "METABOLIC/WEIGHT",
    "name": "Metabolic/Weight",
    "hue": "gr",
    "order": 2
  },
  {
    "id": "cognition-mood",
    "label": "COGNITION/MOOD",
    "name": "Cognition/Mood",
    "hue": "pu",
    "order": 3
  },
  {
    "id": "immune-anti-inf",
    "label": "IMMUNE/ANTI-INF",
    "name": "Immune/Anti-inf",
    "hue": "cy",
    "order": 4
  },
  {
    "id": "cardio-vascular",
    "label": "CARDIO/VASCULAR",
    "name": "Cardio/Vascular",
    "hue": "go",
    "order": 5
  },
  {
    "id": "skin-hair",
    "label": "SKIN/HAIR",
    "name": "Skin/Hair",
    "hue": "cy",
    "order": 6
  },
  {
    "id": "longevity",
    "label": "LONGEVITY",
    "name": "Longevity",
    "hue": "pu",
    "order": 7
  },
  {
    "id": "gi-bone-other",
    "label": "GI/BONE/OTHER",
    "name": "GI/Bone/Other",
    "hue": "gr",
    "order": 8
  },
  {
    "id": "sexual-health",
    "label": "SEXUAL HEALTH",
    "name": "Sexual Health",
    "hue": "go",
    "order": 9
  },
  {
    "id": "sleep",
    "label": "SLEEP",
    "name": "Sleep",
    "hue": "pu",
    "order": 10
  },
  {
    "id": "muscle-performance",
    "label": "MUSCLE/PERFORMANCE",
    "name": "Muscle/Performance",
    "hue": "cy",
    "order": 11
  }
];

export const COMPOUNDS: Record<string, Compound> = {
 "semaglutide": {
  "id": "semaglutide",
  "name": "Semaglutide",
  "fullName": "Semaglutide (Wegovy/Ozempic)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Weight loss",
  "action": "GLP-1 receptor agonist: increases satiety, slows gastric emptying, improves insulin secretion",
  "effects": "Less hunger, slower digestion, better blood sugar; often improves BP and overall CV risk",
  "dosage": "0.25 mg weekly titration up to 1.7–2.4 mg weekly (Wegovy)",
  "cautions": "GI side effects; risk of pancreatitis; gallbladder disease; contraindicated in MTC/MEN2 history",
  "interactions": "Caution with insulin/sulfonylureas (hypoglycemia risk); delays gastric emptying may affect absorption of oral meds; monitor for dehydration if on diuretics.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 5,
  "cvNotes": "Strong human outcomes data via diabetes/obesity trials; improves multiple CV risk factors (weight, glucose, BP).",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "tirzepatide": {
  "id": "tirzepatide",
  "name": "Tirzepatide",
  "fullName": "Tirzepatide (Zepbound/Mounjaro)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Weight loss",
  "action": "Dual GIP/GLP-1 agonist: appetite reduction + improved glycemic control",
  "effects": "Less hunger, slower digestion, better blood sugar; often improves BP and overall CV risk",
  "dosage": "2.5 mg weekly start → 5 mg; may increase by 2.5 mg q≥4 weeks; max 15 mg weekly",
  "cautions": "GI side effects; pancreatitis risk; gallbladder disease; thyroid C-cell tumor warning; hypoglycemia with insulin/sulfonylureas",
  "interactions": "Caution with insulin/sulfonylureas (hypoglycemia risk); delays gastric emptying may affect absorption of oral meds; monitor for dehydration if on diuretics.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 5,
  "cvNotes": "Strong human outcomes data via diabetes/obesity trials; improves multiple CV risk factors (weight, glucose, BP).",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "liraglutide": {
  "id": "liraglutide",
  "name": "Liraglutide",
  "fullName": "Liraglutide (Saxenda/Victoza)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Weight loss",
  "action": "GLP-1 receptor agonist: reduces appetite and improves glycemic control",
  "effects": "Less hunger, slower digestion, better blood sugar; often improves BP and overall CV risk",
  "dosage": "0.6 mg daily titration up to 3 mg daily (Saxenda)",
  "cautions": "GI side effects; pancreatitis; gallbladder disease; thyroid C-cell tumor warning",
  "interactions": "Caution with insulin/sulfonylureas (hypoglycemia risk); delays gastric emptying may affect absorption of oral meds; monitor for dehydration if on diuretics.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 5,
  "cvNotes": "Strong human outcomes data via diabetes/obesity trials; improves multiple CV risk factors (weight, glucose, BP).",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "exenatide": {
  "id": "exenatide",
  "name": "Exenatide",
  "fullName": "Exenatide (Byetta/Bydureon)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Diabetes",
  "action": "GLP-1 receptor agonist: improves insulin secretion and satiety",
  "effects": "Less hunger, slower digestion, better blood sugar; often improves BP and overall CV risk",
  "dosage": "Labeled dosing varies by formulation (see product PI)",
  "cautions": "GI effects; pancreatitis; renal considerations",
  "interactions": "Caution with insulin/sulfonylureas (hypoglycemia risk); delays gastric emptying may affect absorption of oral meds; monitor for dehydration if on diuretics.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 5,
  "cvNotes": "Strong human outcomes data via diabetes/obesity trials; improves multiple CV risk factors (weight, glucose, BP).",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "dulaglutide": {
  "id": "dulaglutide",
  "name": "Dulaglutide",
  "fullName": "Dulaglutide (Trulicity)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Diabetes",
  "action": "GLP-1 receptor agonist: improves glycemic control",
  "effects": "Less hunger, slower digestion, better blood sugar; often improves BP and overall CV risk",
  "dosage": "Labeled dosing varies by product PI",
  "cautions": "GI effects; pancreatitis; thyroid C-cell tumor warning",
  "interactions": "Caution with insulin/sulfonylureas (hypoglycemia risk); delays gastric emptying may affect absorption of oral meds; monitor for dehydration if on diuretics.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 5,
  "cvNotes": "Strong human outcomes data via diabetes/obesity trials; improves multiple CV risk factors (weight, glucose, BP).",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "pramlintide": {
  "id": "pramlintide",
  "name": "Pramlintide",
  "fullName": "Pramlintide (Symlin)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Diabetes",
  "action": "Amylin analog: slows gastric emptying, suppresses glucagon, promotes satiety",
  "effects": "More satiety + slower digestion; improves post-meal blood sugar",
  "dosage": "T1D: start 15 mcg pre-meals; titrate; T2D: start 60 mcg pre-meals → 120 mcg",
  "cautions": "Hypoglycemia risk (requires insulin dose reduction); nausea; careful glucose monitoring",
  "interactions": "Requires mealtime insulin dose reduction (hypoglycemia risk); delays gastric emptying—separate timing for oral meds that need rapid absorption.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 3,
  "cvNotes": "Improves post-meal glucose and satiety; indirect CV benefit via glycemic control (less direct outcomes data).",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "cagrilintide": {
  "id": "cagrilintide",
  "name": "Cagrilintide",
  "fullName": "Cagrilintide (research)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Weight loss",
  "action": "Long-acting amylin analog; increases satiety",
  "effects": "More satiety + slower digestion; improves post-meal blood sugar",
  "dosage": "N/A (no established labeled dosing)",
  "cautions": "Not FDA-approved; unknown long-term safety; avoid self-administration",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "Limited direct cardiovascular evidence.",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "retatrutide": {
  "id": "retatrutide",
  "name": "Retatrutide",
  "fullName": "Retatrutide (research)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Weight loss",
  "action": "Triple agonist (GLP-1/GIP/glucagon) to reduce weight and increase energy expenditure",
  "effects": "Less hunger, slower digestion, better blood sugar; often improves BP and overall CV risk",
  "dosage": "N/A (no established labeled dosing)",
  "cautions": "Not FDA-approved; GI effects common in class; avoid self-administration",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "Limited direct cardiovascular evidence.",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "leptin-metreleptin": {
  "id": "leptin-metreleptin",
  "name": "Leptin / Metreleptin",
  "fullName": "Leptin / Metreleptin",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Endocrine / Metabolic",
  "action": "Leptin replacement therapy in specific leptin-deficiency states",
  "effects": "Leptin replacement therapy in specific leptin-deficiency states",
  "dosage": "Product-specific dosing (specialist use)",
  "cautions": "Restricted indications; immune/antibody risks; specialist-only",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Mixed/unclear regulatory status",
  "grade": "C",
  "bars": 2,
  "cv": 1,
  "cvNotes": "Limited direct cardiovascular evidence.",
  "stacksWith": [
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin",
   "ghrp-2",
   "ghrp-6",
   "bpc-157",
   "tb-500"
  ]
 },
 "glucagon": {
  "id": "glucagon",
  "name": "Glucagon",
  "fullName": "Glucagon",
  "category": "GI/Bone/Other",
  "catId": "gi-bone-other",
  "purpose": "Endocrine / Emergency",
  "action": "Raises blood glucose via hepatic glycogenolysis",
  "effects": "Raises blood glucose via hepatic glycogenolysis",
  "dosage": "Product-specific dosing (emergency use)",
  "cautions": "Nausea/vomiting; effectiveness depends on glycogen stores",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 3,
  "cvNotes": "Clinically important in acute care settings; not a chronic 'heart health' therapy.",
  "stacksWith": [
   "desmopressin-ddavp",
   "teriparatide-forteo",
   "abaloparatide-tymlos",
   "cgrp-calcitonin-gene-related-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide"
  ]
 },
 "tesamorelin": {
  "id": "tesamorelin",
  "name": "Tesamorelin",
  "fullName": "Tesamorelin (Egrifta SV/WR)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "GH axis / Body composition",
  "action": "GHRH analog: stimulates endogenous GH; reduces visceral adipose tissue in HIV lipodystrophy",
  "effects": "Signals the GH axis; can affect body composition, fluid retention, and glucose",
  "dosage": "Egrifta SV: 1.4 mg SC once daily; Egrifta WR: 1.28 mg SC once daily",
  "cautions": "Glucose intolerance/diabetes risk; fluid retention; contraindications per PI; not indicated for weight loss",
  "interactions": "Can raise glucose; monitor if on diabetes meds; fluid retention may affect BP/CHF; avoid with active malignancy (per clinical guidance).",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 3,
  "cvNotes": "Improves visceral fat in a specific indication; indirect cardiometabolic benefits; monitor glucose.",
  "stacksWith": [
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin",
   "glucagon"
  ]
 },
 "somatropin": {
  "id": "somatropin",
  "name": "Somatropin",
  "fullName": "Somatropin (Human Growth Hormone)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "Endocrine",
  "action": "Recombinant GH for deficiency states",
  "effects": "Signals the GH axis; can affect body composition, fluid retention, and glucose",
  "dosage": "Product-specific dosing (endocrinology)",
  "cautions": "Edema, joint pain, glucose effects; contraindications in active malignancy; medical supervision required",
  "interactions": "Can raise glucose; monitor if on diabetes meds; fluid retention may affect BP/CHF; avoid with active malignancy (per clinical guidance).",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "tb-500",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "sermorelin": {
  "id": "sermorelin",
  "name": "Sermorelin",
  "fullName": "Sermorelin (research/compounded)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "GH axis",
  "action": "GHRH analog; stimulates GH release",
  "effects": "Signals the GH axis; can affect body composition, fluid retention, and glucose",
  "dosage": "N/A (no FDA-labeled dosing for compounded products)",
  "cautions": "Quality variability; endocrine effects; avoid unsupervised use",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin",
   "glucagon"
  ]
 },
 "cjc-1295": {
  "id": "cjc-1295",
  "name": "CJC-1295",
  "fullName": "CJC-1295 (research)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "GH axis",
  "action": "GHRH analog (research compound)",
  "effects": "Signals the GH axis; can affect body composition, fluid retention, and glucose",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; endocrine risks; avoid self-administration",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin",
   "glucagon"
  ]
 },
 "ipamorelin": {
  "id": "ipamorelin",
  "name": "Ipamorelin",
  "fullName": "Ipamorelin (research)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "GH axis",
  "action": "Ghrelin receptor agonist (GHS): stimulates GH release",
  "effects": "Signals the GH axis; can affect body composition, fluid retention, and glucose",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; endocrine risks; avoid self-administration",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "dsip",
   "epitalon-epithalon",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide"
  ]
 },
 "ghrp-2": {
  "id": "ghrp-2",
  "name": "GHRP-2",
  "fullName": "GHRP-2 (research)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "GH axis",
  "action": "Growth hormone secretagogue",
  "effects": "Signals the GH axis; can affect body composition, fluid retention, and glucose",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; endocrine risks",
  "interactions": "Can raise glucose; monitor if on diabetes meds; fluid retention may affect BP/CHF; avoid with active malignancy (per clinical guidance).",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin",
   "glucagon"
  ]
 },
 "ghrp-6": {
  "id": "ghrp-6",
  "name": "GHRP-6",
  "fullName": "GHRP-6 (research)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "GH axis",
  "action": "Growth hormone secretagogue; may increase appetite",
  "effects": "Signals the GH axis; can affect body composition, fluid retention, and glucose",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; endocrine risks",
  "interactions": "Can raise glucose; monitor if on diabetes meds; fluid retention may affect BP/CHF; avoid with active malignancy (per clinical guidance).",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin",
   "glucagon"
  ]
 },
 "bpc-157": {
  "id": "bpc-157",
  "name": "BPC-157",
  "fullName": "BPC-157 (research)",
  "category": "Healing/Recovery",
  "catId": "healing-recovery",
  "purpose": "Healing / Recovery",
  "action": "Experimental peptide often studied for tissue protection and repair",
  "effects": "Experimental peptide often studied for tissue protection and repair",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; human safety/efficacy not established; avoid self-administration",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "ghk-cu-copper-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "tb-500": {
  "id": "tb-500",
  "name": "TB-500",
  "fullName": "TB-500 (Thymosin beta-4 fragment, research)",
  "category": "Healing/Recovery",
  "catId": "healing-recovery",
  "purpose": "Healing / Recovery",
  "action": "Related to thymosin beta-4 pathways; tissue repair signaling (experimental)",
  "effects": "Related to thymosin beta-4 pathways; tissue repair signaling (experimental)",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; unknown risks; avoid self-administration",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "somatropin",
   "ghk-cu-copper-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide"
  ]
 },
 "thymosin-beta-4-t-4": {
  "id": "thymosin-beta-4-t-4",
  "name": "Thymosin Beta-4 (Tβ4)",
  "fullName": "Thymosin Beta-4 (Tβ4)",
  "category": "Healing/Recovery",
  "catId": "healing-recovery",
  "purpose": "Healing / Immune",
  "action": "Actin-binding peptide involved in wound healing and inflammation modulation",
  "effects": "Actin-binding peptide involved in wound healing and inflammation modulation",
  "dosage": "N/A",
  "cautions": "Not FDA-approved for this use; unknown risks",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Mixed/unclear regulatory status",
  "grade": "C",
  "bars": 2,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "ghk-cu-copper-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "thymosin-alpha-1-thymalfasin": {
  "id": "thymosin-alpha-1-thymalfasin",
  "name": "Thymosin Alpha-1 (Thymalfasin)",
  "fullName": "Thymosin Alpha-1 (Thymalfasin)",
  "category": "Immune/Anti-inf",
  "catId": "immune-anti-inf",
  "purpose": "Immune modulation",
  "action": "Immune signaling peptide used in some countries for certain conditions",
  "effects": "Immune signaling peptide used in some countries for certain conditions",
  "dosage": "Product/country-specific dosing",
  "cautions": "Regulatory status varies; medical supervision required",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Used clinically in some countries; not standard in the US—specialist oversight.",
  "evidence": "Region-specific approval (not US FDA)",
  "grade": "B",
  "bars": 3,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "ll-37": {
  "id": "ll-37",
  "name": "LL-37",
  "fullName": "LL-37 (research)",
  "category": "Immune/Anti-inf",
  "catId": "immune-anti-inf",
  "purpose": "Antimicrobial / Immune",
  "action": "Human cathelicidin antimicrobial peptide (experimental)",
  "effects": "Innate immune antimicrobial signaling (experimental)",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; potential inflammation; avoid self-administration",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "vip-vip": {
  "id": "vip-vip",
  "name": "VIP (VIP)",
  "fullName": "VIP (Vasoactive Intestinal Peptide)",
  "category": "Cardio/Vascular",
  "catId": "cardio-vascular",
  "purpose": "Immune / Neurovascular",
  "action": "Neuropeptide involved in vasodilation and immune signaling",
  "effects": "Widens blood vessels; can lower blood pressure",
  "dosage": "N/A",
  "cautions": "Complex systemic effects; medical supervision required",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Mixed/unclear regulatory status",
  "grade": "C",
  "bars": 2,
  "cv": 1,
  "cvNotes": "Limited direct cardiovascular evidence.",
  "stacksWith": [
   "thymosin-alpha-1-thymalfasin",
   "ll-37",
   "semax",
   "selank",
   "cerebrolysin",
   "dihexa",
   "oxytocin",
   "defensins",
   "thymopentin",
   "semaglutide"
  ]
 },
 "kpv": {
  "id": "kpv",
  "name": "KPV",
  "fullName": "KPV (research)",
  "category": "Skin/Hair",
  "catId": "skin-hair",
  "purpose": "Anti-inflammatory / GI",
  "action": "Tripeptide from α-MSH pathway; experimental anti-inflammatory effects",
  "effects": "Tripeptide from α-MSH pathway; experimental anti-inflammatory effects",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; unknown risks",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin",
   "glucagon"
  ]
 },
 "semax": {
  "id": "semax",
  "name": "Semax",
  "fullName": "Semax (research/region-specific)",
  "category": "Cognition/Mood",
  "catId": "cognition-mood",
  "purpose": "Cognition / Neuroprotection",
  "action": "Neuropeptide analog studied for cognitive effects",
  "effects": "Neuropeptide analog studied for cognitive effects",
  "dosage": "N/A",
  "cautions": "Regulatory status varies; avoid unsupervised use",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "selank": {
  "id": "selank",
  "name": "Selank",
  "fullName": "Selank (research/region-specific)",
  "category": "Cognition/Mood",
  "catId": "cognition-mood",
  "purpose": "Anxiety / Cognition",
  "action": "Neuropeptide analog studied for anxiolytic effects",
  "effects": "Neuropeptide analog studied for anxiolytic effects",
  "dosage": "N/A",
  "cautions": "Regulatory status varies; avoid unsupervised use",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "cerebrolysin": {
  "id": "cerebrolysin",
  "name": "Cerebrolysin",
  "fullName": "Cerebrolysin (region-specific)",
  "category": "Cognition/Mood",
  "catId": "cognition-mood",
  "purpose": "Neurotrophic support",
  "action": "Mixture of neuropeptides used in some countries",
  "effects": "Mixture of neuropeptides used in some countries",
  "dosage": "Country-specific protocols",
  "cautions": "Not FDA-approved in US; adverse effects possible; clinician use",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Used clinically in some countries; not standard in the US—specialist oversight.",
  "evidence": "Region-specific approval (not US FDA)",
  "grade": "B",
  "bars": 3,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "dihexa": {
  "id": "dihexa",
  "name": "Dihexa",
  "fullName": "Dihexa (research)",
  "category": "Cognition/Mood",
  "catId": "cognition-mood",
  "purpose": "Cognition",
  "action": "Experimental compound linked to synaptogenesis pathways",
  "effects": "Experimental compound linked to synaptogenesis pathways",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; unknown safety",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "dsip": {
  "id": "dsip",
  "name": "DSIP",
  "fullName": "DSIP (research)",
  "category": "Sleep",
  "catId": "sleep",
  "purpose": "Sleep",
  "action": "Delta sleep–inducing peptide (experimental)",
  "effects": "Delta sleep–inducing peptide (experimental)",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; limited evidence",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "ipamorelin",
   "epitalon-epithalon",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide"
  ]
 },
 "epitalon-epithalon": {
  "id": "epitalon-epithalon",
  "name": "Epitalon / Epithalon",
  "fullName": "Epitalon / Epithalon (research)",
  "category": "Longevity",
  "catId": "longevity",
  "purpose": "Longevity / Circadian",
  "action": "Peptide studied for telomere/circadian effects",
  "effects": "Peptide studied for telomere/circadian effects",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; unknown human efficacy/safety",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "ipamorelin",
   "dsip",
   "mots-c",
   "ghk-cu-copper-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide"
  ]
 },
 "nad": {
  "id": "nad",
  "name": "NAD+",
  "fullName": "NAD+ (not a peptide, but commonly discussed)",
  "category": "Longevity",
  "catId": "longevity",
  "purpose": "Cellular energy",
  "action": "Coenzyme involved in redox/mitochondrial function",
  "effects": "Coenzyme involved in redox/mitochondrial function",
  "dosage": "Oral/IV protocols vary; no single labeled dose for 'NAD+' products",
  "cautions": "Quality varies; IV reactions possible; discuss with clinician",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "mots-c",
   "ghk-cu-copper-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide"
  ]
 },
 "mots-c": {
  "id": "mots-c",
  "name": "MOTS-c",
  "fullName": "MOTS-c (research)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Metabolic / Longevity",
  "action": "Mitochondrial-derived peptide involved in metabolic signaling",
  "effects": "Mitochondrial-derived peptide involved in metabolic signaling",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; unknown risks",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "Limited direct cardiovascular evidence.",
  "stacksWith": [
   "epitalon-epithalon",
   "nad",
   "humanin",
   "ghk-cu-copper-peptide",
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin",
   "cjc-1295",
   "ipamorelin"
  ]
 },
 "humanin": {
  "id": "humanin",
  "name": "Humanin",
  "fullName": "Humanin (research)",
  "category": "Longevity",
  "catId": "longevity",
  "purpose": "Mitochondrial / Neuroprotection",
  "action": "Mitochondrial-derived peptide with cytoprotective signaling (experimental)",
  "effects": "Mitochondrial-derived peptide with cytoprotective signaling (experimental)",
  "dosage": "N/A",
  "cautions": "Not FDA-approved",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "mots-c",
   "ghk-cu-copper-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide"
  ]
 },
 "ghk-cu-copper-peptide": {
  "id": "ghk-cu-copper-peptide",
  "name": "GHK-Cu (Copper peptide)",
  "fullName": "GHK-Cu (Copper peptide)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "Skin / Hair",
  "action": "Signals collagen remodeling and wound repair",
  "effects": "Signals the GH axis; can affect body composition, fluid retention, and glucose",
  "dosage": "Topical concentrations vary by product",
  "cautions": "Skin irritation possible; avoid unverified injectables",
  "interactions": "Can raise glucose; monitor if on diabetes meds; fluid retention may affect BP/CHF; avoid with active malignancy (per clinical guidance).",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Mixed/unclear regulatory status",
  "grade": "C",
  "bars": 2,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "bpc-157",
   "tb-500",
   "thymosin-beta-4-t-4",
   "epitalon-epithalon",
   "nad",
   "mots-c",
   "humanin",
   "matrixyl-palmitoyl-pentapeptide",
   "argireline-acetyl-hexapeptide-8",
   "melanotan-ii"
  ]
 },
 "matrixyl-palmitoyl-pentapeptide": {
  "id": "matrixyl-palmitoyl-pentapeptide",
  "name": "Matrixyl (Palmitoyl pentapeptide)",
  "fullName": "Matrixyl (Palmitoyl pentapeptide)",
  "category": "Skin/Hair",
  "catId": "skin-hair",
  "purpose": "Cosmetic",
  "action": "Peptide used in cosmetics to support collagen appearance",
  "effects": "Supports skin repair/collagen signaling (usually topical products)",
  "dosage": "Topical product-dependent",
  "cautions": "Irritation/allergy possible",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Mixed/unclear regulatory status",
  "grade": "C",
  "bars": 2,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "ghk-cu-copper-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "argireline-acetyl-hexapeptide-8": {
  "id": "argireline-acetyl-hexapeptide-8",
  "name": "Argireline (Acetyl hexapeptide-8)",
  "fullName": "Argireline (Acetyl hexapeptide-8)",
  "category": "Skin/Hair",
  "catId": "skin-hair",
  "purpose": "Cosmetic",
  "action": "Cosmetic peptide aimed at reducing expression lines",
  "effects": "Cosmetic peptide aimed at reducing expression lines",
  "dosage": "Topical product-dependent",
  "cautions": "Irritation possible",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Mixed/unclear regulatory status",
  "grade": "C",
  "bars": 2,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "ghk-cu-copper-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "bremelanotide-vyleesi-pt-141-analog": {
  "id": "bremelanotide-vyleesi-pt-141-analog",
  "name": "Bremelanotide (Vyleesi; PT-141 analog)",
  "fullName": "Bremelanotide (Vyleesi; PT-141 analog)",
  "category": "Sexual Health",
  "catId": "sexual-health",
  "purpose": "Sexual health",
  "action": "Melanocortin receptor agonist; indicated for premenopausal HSDD",
  "effects": "Melanocortin receptor agonist; indicated for premenopausal HSDD",
  "dosage": "1.75 mg SC as needed ≥45 min before; max 1 dose/24h; max 8 doses/month",
  "cautions": "Can raise BP, nausea/flushing; not for performance enhancement; avoid in uncontrolled HTN/CVD",
  "interactions": "Can raise BP/HR; avoid with uncontrolled HTN/CVD; caution with antihypertensives; nausea common.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "oxytocin",
   "melanotan-ii",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide"
  ]
 },
 "kisspeptin": {
  "id": "kisspeptin",
  "name": "Kisspeptin",
  "fullName": "Kisspeptin (research/clinical research)",
  "category": "Sexual Health",
  "catId": "sexual-health",
  "purpose": "Reproductive axis",
  "action": "Stimulates GnRH → LH/FSH release",
  "effects": "Stimulates GnRH → LH/FSH release",
  "dosage": "N/A (protocol-specific)",
  "cautions": "Not routine; endocrine effects; clinician supervision",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "oxytocin",
   "melanotan-ii",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide"
  ]
 },
 "oxytocin": {
  "id": "oxytocin",
  "name": "Oxytocin",
  "fullName": "Oxytocin",
  "category": "Cognition/Mood",
  "catId": "cognition-mood",
  "purpose": "Neuroendocrine",
  "action": "Bonding/social neuropeptide; uterotonic in obstetrics",
  "effects": "Bonding/social neuropeptide; uterotonic in obstetrics",
  "dosage": "Indication-specific dosing (obstetrics)",
  "cautions": "Serious obstetric risks if misused; do not self-administer",
  "interactions": "Obstetric medication—avoid self-use; interactions managed clinically.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Mixed/unclear regulatory status",
  "grade": "C",
  "bars": 2,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "bremelanotide-vyleesi-pt-141-analog",
   "kisspeptin",
   "melanotan-ii",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide"
  ]
 },
 "hcg-not-a-peptide-glycoprotein-hormone": {
  "id": "hcg-not-a-peptide-glycoprotein-hormone",
  "name": "hCG (not a peptide; glycoprotein hormone)",
  "fullName": "hCG (not a peptide; glycoprotein hormone)",
  "category": "Longevity",
  "catId": "longevity",
  "purpose": "Reproductive",
  "action": "LH-like activity; supports gonadal function",
  "effects": "LH-like activity; supports gonadal function",
  "dosage": "Indication-specific dosing",
  "cautions": "Thromboembolic/ovarian hyperstimulation risks; prescription required",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin",
   "glucagon"
  ]
 },
 "anp-atrial-natriuretic-peptide": {
  "id": "anp-atrial-natriuretic-peptide",
  "name": "ANP (Atrial natriuretic peptide)",
  "fullName": "ANP (Atrial natriuretic peptide)",
  "category": "Cardio/Vascular",
  "catId": "cardio-vascular",
  "purpose": "Cardiovascular",
  "action": "Regulates natriuresis/vasodilation (endogenous)",
  "effects": "Widens blood vessels; can lower blood pressure",
  "dosage": "N/A",
  "cautions": "Not a self-treatment; significant BP effects",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Important in biology/diagnostics, not a self-treatment.",
  "evidence": "Physiology/diagnostic target (not a therapy)",
  "grade": "—",
  "bars": 0,
  "cv": 2,
  "cvNotes": "Key cardiovascular physiology/diagnostic relevance; not used as a self-therapy.",
  "stacksWith": [
   "apelin",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "bnp-b-type-natriuretic-peptide": {
  "id": "bnp-b-type-natriuretic-peptide",
  "name": "BNP (B-type natriuretic peptide)",
  "fullName": "BNP (B-type natriuretic peptide)",
  "category": "Cardio/Vascular",
  "catId": "cardio-vascular",
  "purpose": "Cardiovascular",
  "action": "Marker and mediator in heart failure physiology",
  "effects": "Marker and mediator in heart failure physiology",
  "dosage": "N/A",
  "cautions": "Not a self-treatment",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Important in biology/diagnostics, not a self-treatment.",
  "evidence": "Physiology/diagnostic target (not a therapy)",
  "grade": "—",
  "bars": 0,
  "cv": 2,
  "cvNotes": "Key cardiovascular physiology/diagnostic relevance; not used as a self-therapy.",
  "stacksWith": [
   "apelin",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "apelin": {
  "id": "apelin",
  "name": "Apelin",
  "fullName": "Apelin (research)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Cardiovascular / Metabolic",
  "action": "Peptide ligand involved in vascular tone and cardiac function",
  "effects": "Peptide ligand involved in vascular tone and cardiac function",
  "dosage": "N/A",
  "cautions": "Not FDA-approved",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 2,
  "cvNotes": "Promising mechanisms for cardiac/vascular function, but mainly research-stage.",
  "stacksWith": [
   "anp-atrial-natriuretic-peptide",
   "bnp-b-type-natriuretic-peptide",
   "adrenomedullin",
   "vasopressin",
   "bivalirudin",
   "eptifibatide",
   "glucagon",
   "tesamorelin",
   "somatropin",
   "sermorelin"
  ]
 },
 "adrenomedullin": {
  "id": "adrenomedullin",
  "name": "Adrenomedullin",
  "fullName": "Adrenomedullin (research)",
  "category": "Cardio/Vascular",
  "catId": "cardio-vascular",
  "purpose": "Vascular",
  "action": "Vasodilatory peptide hormone",
  "effects": "Vasodilatory peptide hormone",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; hypotension risk",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 2,
  "cvNotes": "Promising mechanisms for cardiac/vascular function, but mainly research-stage.",
  "stacksWith": [
   "apelin",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "glp-2-analog-teduglutide": {
  "id": "glp-2-analog-teduglutide",
  "name": "GLP-2 analog (Teduglutide)",
  "fullName": "GLP-2 analog (Teduglutide)",
  "category": "GI/Bone/Other",
  "catId": "gi-bone-other",
  "purpose": "GI / Short bowel syndrome",
  "action": "GLP-2 analog increases intestinal absorption and mucosal growth",
  "effects": "GLP-2 analog increases intestinal absorption and mucosal growth",
  "dosage": "Product-specific dosing (PI)",
  "cautions": "Risk of GI obstruction, biliary/pancreatic issues; clinician-only",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "desmopressin-ddavp",
   "teriparatide-forteo",
   "abaloparatide-tymlos",
   "cgrp-calcitonin-gene-related-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide"
  ]
 },
 "desmopressin-ddavp": {
  "id": "desmopressin-ddavp",
  "name": "Desmopressin (DDAVP)",
  "fullName": "Desmopressin (DDAVP)",
  "category": "Metabolic/Weight",
  "catId": "metabolic-weight",
  "purpose": "Endocrine / Hemostasis",
  "action": "Vasopressin analog; reduces urine output; increases vWF release",
  "effects": "Vasopressin analog; reduces urine output; increases vWF release",
  "dosage": "Indication-specific dosing",
  "cautions": "Hyponatremia/seizure risk; requires monitoring",
  "interactions": "Hyponatremia risk—caution with SSRIs/SNRIs, diuretics; fluid restriction and sodium monitoring.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 1,
  "cvNotes": "Limited direct cardiovascular evidence.",
  "stacksWith": [
   "glucagon",
   "glp-2-analog-teduglutide",
   "calcitonin",
   "teriparatide-forteo",
   "abaloparatide-tymlos",
   "cgrp-calcitonin-gene-related-peptide",
   "substance-p",
   "tesamorelin",
   "somatropin",
   "sermorelin"
  ]
 },
 "calcitonin": {
  "id": "calcitonin",
  "name": "Calcitonin",
  "fullName": "Calcitonin",
  "category": "GI/Bone/Other",
  "catId": "gi-bone-other",
  "purpose": "Bone / Calcium",
  "action": "Lowers serum calcium; affects bone turnover",
  "effects": "Lowers serum calcium; affects bone turnover",
  "dosage": "Product-specific dosing",
  "cautions": "Cancer risk warning for some uses; nasal irritation",
  "interactions": "Generally low interaction burden; monitor calcium; follow product guidance.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "desmopressin-ddavp",
   "teriparatide-forteo",
   "abaloparatide-tymlos",
   "cgrp-calcitonin-gene-related-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide"
  ]
 },
 "teriparatide-forteo": {
  "id": "teriparatide-forteo",
  "name": "Teriparatide (Forteo)",
  "fullName": "Teriparatide (Forteo)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "Bone",
  "action": "PTH(1-34) analog: stimulates bone formation",
  "effects": "PTH(1-34) analog: stimulates bone formation",
  "dosage": "20 mcg SC once daily",
  "cautions": "Hypercalcemia; orthostatic hypotension; osteosarcoma warning in animals; duration limits per guidelines",
  "interactions": "Monitor calcium/vitamin D; caution with digoxin (hypercalcemia can increase toxicity risk).",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "glucagon",
   "glp-2-analog-teduglutide",
   "desmopressin-ddavp",
   "calcitonin",
   "cgrp-calcitonin-gene-related-peptide",
   "substance-p",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide"
  ]
 },
 "abaloparatide-tymlos": {
  "id": "abaloparatide-tymlos",
  "name": "Abaloparatide (Tymlos)",
  "fullName": "Abaloparatide (Tymlos)",
  "category": "GH Axis",
  "catId": "gh-axis",
  "purpose": "Bone",
  "action": "PTHrP analog: anabolic bone agent",
  "effects": "PTHrP analog: anabolic bone agent",
  "dosage": "Product-specific dosing (PI)",
  "cautions": "Hypercalcemia; osteosarcoma warning in animals",
  "interactions": "Monitor calcium/vitamin D; caution with digoxin (hypercalcemia can increase toxicity risk).",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "glucagon",
   "glp-2-analog-teduglutide",
   "desmopressin-ddavp",
   "calcitonin",
   "cgrp-calcitonin-gene-related-peptide",
   "substance-p",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide"
  ]
 },
 "vasopressin": {
  "id": "vasopressin",
  "name": "Vasopressin",
  "fullName": "Vasopressin",
  "category": "Cardio/Vascular",
  "catId": "cardio-vascular",
  "purpose": "Critical care",
  "action": "V1/V2 agonist; vasoconstriction and water retention",
  "effects": "V1/V2 agonist; vasoconstriction and water retention",
  "dosage": "Hospital protocols only",
  "cautions": "Severe ischemic risks; ICU-only",
  "interactions": "ICU-only; vasoconstriction—drug interactions managed in hospital protocols.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 3,
  "cvNotes": "Clinically important in acute care settings; not a chronic 'heart health' therapy.",
  "stacksWith": [
   "apelin",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "cgrp-calcitonin-gene-related-peptide": {
  "id": "cgrp-calcitonin-gene-related-peptide",
  "name": "CGRP (Calcitonin gene-related peptide)",
  "fullName": "CGRP (Calcitonin gene-related peptide)",
  "category": "Cardio/Vascular",
  "catId": "cardio-vascular",
  "purpose": "Neurovascular",
  "action": "Pain/vasodilation mediator; target in migraine therapy",
  "effects": "Widens blood vessels; can lower blood pressure",
  "dosage": "N/A (endogenous target)",
  "cautions": "Not a self-treatment",
  "interactions": "Generally low interaction burden; monitor calcium; follow product guidance.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 1,
  "cvNotes": "Limited direct cardiovascular evidence.",
  "stacksWith": [
   "glucagon",
   "glp-2-analog-teduglutide",
   "desmopressin-ddavp",
   "calcitonin",
   "teriparatide-forteo",
   "abaloparatide-tymlos",
   "substance-p",
   "semaglutide",
   "tirzepatide",
   "liraglutide"
  ]
 },
 "substance-p": {
  "id": "substance-p",
  "name": "Substance P",
  "fullName": "Substance P",
  "category": "GI/Bone/Other",
  "catId": "gi-bone-other",
  "purpose": "Pain signaling",
  "action": "Neuropeptide involved in pain and inflammation",
  "effects": "Neuropeptide involved in pain and inflammation",
  "dosage": "N/A",
  "cautions": "Not a self-treatment",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Important in biology/diagnostics, not a self-treatment.",
  "evidence": "Physiology/diagnostic target (not a therapy)",
  "grade": "—",
  "bars": 0,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "desmopressin-ddavp",
   "teriparatide-forteo",
   "abaloparatide-tymlos",
   "cgrp-calcitonin-gene-related-peptide",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide"
  ]
 },
 "bivalirudin": {
  "id": "bivalirudin",
  "name": "Bivalirudin",
  "fullName": "Bivalirudin",
  "category": "Cardio/Vascular",
  "catId": "cardio-vascular",
  "purpose": "Anticoagulation",
  "action": "Direct thrombin inhibitor (peptide)",
  "effects": "Direct thrombin inhibitor (peptide)",
  "dosage": "Hospital protocols only",
  "cautions": "Bleeding risk; medical supervision",
  "interactions": "High bleeding risk with anticoagulants/antiplatelets/NSAIDs; hospital-only protocols.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 4,
  "cvNotes": "Hospital cardiovascular use with strong clinical evidence for specific acute indications (not wellness).",
  "stacksWith": [
   "apelin",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "eptifibatide": {
  "id": "eptifibatide",
  "name": "Eptifibatide",
  "fullName": "Eptifibatide",
  "category": "Cardio/Vascular",
  "catId": "cardio-vascular",
  "purpose": "Antiplatelet",
  "action": "GPIIb/IIIa inhibitor (peptide)",
  "effects": "GPIIb/IIIa inhibitor (peptide)",
  "dosage": "Hospital protocols only",
  "cautions": "Bleeding/thrombocytopenia risk",
  "interactions": "High bleeding risk with anticoagulants/antiplatelets/NSAIDs; hospital-only protocols.",
  "bottomLine": "Strongest data when used for its labeled indication under clinician guidance.",
  "evidence": "FDA-approved Rx (labeled use)",
  "grade": "A",
  "bars": 4,
  "cv": 4,
  "cvNotes": "Hospital cardiovascular use with strong clinical evidence for specific acute indications (not wellness).",
  "stacksWith": [
   "apelin",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "melanotan-ii": {
  "id": "melanotan-ii",
  "name": "Melanotan II",
  "fullName": "Melanotan II (research)",
  "category": "Skin/Hair",
  "catId": "skin-hair",
  "purpose": "Pigmentation / Sexual",
  "action": "Melanocortin agonist (experimental)",
  "effects": "Melanocortin agonist (experimental)",
  "dosage": "N/A",
  "cautions": "Not FDA-approved; nausea, BP effects, hyperpigmentation; melanoma concern; avoid",
  "interactions": "BP effects possible; avoid with uncontrolled HTN; avoid if melanoma/skin cancer risk.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "ghk-cu-copper-peptide",
   "bremelanotide-vyleesi-pt-141-analog",
   "kisspeptin",
   "oxytocin",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide"
  ]
 },
 "msh-analogs": {
  "id": "msh-analogs",
  "name": "α-MSH analogs",
  "fullName": "α-MSH analogs (research)",
  "category": "GI/Bone/Other",
  "catId": "gi-bone-other",
  "purpose": "Inflammation / Pigmentation",
  "action": "Melanocortin pathway signaling",
  "effects": "Melanocortin pathway signaling",
  "dosage": "N/A",
  "cautions": "Not FDA-approved",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin",
   "tesamorelin"
  ]
 },
 "defensins": {
  "id": "defensins",
  "name": "Defensins",
  "fullName": "Defensins (research)",
  "category": "Immune/Anti-inf",
  "catId": "immune-anti-inf",
  "purpose": "Antimicrobial",
  "action": "Innate immune antimicrobial peptides",
  "effects": "Innate immune antimicrobial signaling (experimental)",
  "dosage": "N/A",
  "cautions": "Not FDA-approved",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 },
 "thymopentin": {
  "id": "thymopentin",
  "name": "Thymopentin",
  "fullName": "Thymopentin (research/region-specific)",
  "category": "Immune/Anti-inf",
  "catId": "immune-anti-inf",
  "purpose": "Immune",
  "action": "Thymic peptide fragment studied for immune modulation",
  "effects": "Thymic peptide fragment studied for immune modulation",
  "dosage": "N/A",
  "cautions": "Regulatory status varies",
  "interactions": "No well-established interaction profile for non-approved peptides; avoid combining multiple research compounds; discuss meds with clinician.",
  "bottomLine": "Popular in research/compounding; human safety/benefit not well-established.",
  "evidence": "Research/compounded/adjunct (no established FDA indication)",
  "grade": "D",
  "bars": 1,
  "cv": 1,
  "cvNotes": "No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.",
  "stacksWith": [
   "vip-vip",
   "semaglutide",
   "tirzepatide",
   "liraglutide",
   "exenatide",
   "dulaglutide",
   "pramlintide",
   "cagrilintide",
   "retatrutide",
   "leptin-metreleptin"
  ]
 }
};

export const STACK: StackEntry[] = [
  {
    "id": "bpc-157",
    "vialMg": 5,
    "waterMl": 5,
    "doseMcg": 250,
    "supply": 70,
    "supplyDays": 28,
    "days": 41,
    "schedule": "07:30 daily",
    "site": "ABD L"
  },
  {
    "id": "tb-500",
    "vialMg": 5,
    "waterMl": 5,
    "doseMcg": 2000,
    "supply": 45,
    "supplyDays": 18,
    "days": 41,
    "schedule": "21:00 · 2× weekly",
    "site": "DELT R"
  },
  {
    "id": "cjc-1295",
    "vialMg": 2,
    "waterMl": 2,
    "doseMcg": 100,
    "supply": 82,
    "supplyDays": 33,
    "days": 41,
    "schedule": "12:00 daily",
    "site": "ABD R"
  },
  {
    "id": "ipamorelin",
    "vialMg": 5,
    "waterMl": 10,
    "doseMcg": 100,
    "supply": 14,
    "supplyDays": 4,
    "days": 41,
    "schedule": "12:00 daily",
    "site": "ABD R"
  },
  {
    "id": "ghk-cu-copper-peptide",
    "vialMg": 50,
    "waterMl": 10,
    "doseMcg": 2000,
    "supply": 60,
    "supplyDays": 24,
    "days": 41,
    "schedule": "evenings · topical",
    "site": "TOPICAL"
  },
  {
    "id": "semaglutide",
    "vialMg": 3,
    "waterMl": 3,
    "doseMcg": 500,
    "supply": 90,
    "supplyDays": 36,
    "days": 41,
    "schedule": "weekly · same day",
    "site": "ABD L"
  }
];

export const DOSE_LOG: DoseLogEntry[] = [
  {
    "when": "06 AUG 07:34",
    "id": "bpc-157",
    "dose": "250 mcg",
    "site": "ABD L"
  },
  {
    "when": "05 AUG 21:12",
    "id": "tb-500",
    "dose": "2 mg",
    "site": "DELT R"
  },
  {
    "when": "05 AUG 12:05",
    "id": "cjc-1295",
    "dose": "100 mcg",
    "site": "ABD R"
  },
  {
    "when": "05 AUG 12:05",
    "id": "ipamorelin",
    "dose": "100 mcg",
    "site": "ABD R"
  },
  {
    "when": "04 AUG 08:00",
    "id": "semaglutide",
    "dose": "0.5 mg",
    "site": "ABD L"
  },
  {
    "when": "04 AUG 22:40",
    "id": "ghk-cu-copper-peptide",
    "dose": "2 mg",
    "site": "TOPICAL"
  },
  {
    "when": "03 AUG 07:30",
    "id": "bpc-157",
    "dose": "250 mcg",
    "site": "THIGH L"
  },
  {
    "when": "03 AUG 12:02",
    "id": "cjc-1295",
    "dose": "100 mcg",
    "site": "ABD L"
  }
];

export const MARKERS: Marker[] = [
  {
    "key": "testosterone",
    "label": "Total Testosterone",
    "unit": "ng/dL",
    "value": 412,
    "low": 300,
    "high": 900,
    "catId": "gh-axis"
  },
  {
    "key": "igf1",
    "label": "IGF-1",
    "unit": "ng/mL",
    "value": 118,
    "low": 88,
    "high": 246,
    "catId": "gh-axis"
  },
  {
    "key": "crp",
    "label": "CRP",
    "unit": "mg/L",
    "value": 3.4,
    "low": 0,
    "high": 3,
    "catId": "immune-anti-inf"
  },
  {
    "key": "hba1c",
    "label": "HbA1c",
    "unit": "%",
    "value": 5.6,
    "low": 4,
    "high": 5.7,
    "catId": "metabolic-weight"
  },
  {
    "key": "vitaminD",
    "label": "Vitamin D",
    "unit": "ng/mL",
    "value": 24,
    "low": 30,
    "high": 80,
    "catId": "immune-anti-inf"
  },
  {
    "key": "ldl",
    "label": "LDL",
    "unit": "mg/dL",
    "value": 126,
    "low": 0,
    "high": 100,
    "catId": "cardio-vascular"
  },
  {
    "key": "ironFerritin",
    "label": "Ferritin",
    "unit": "ng/mL",
    "value": 38,
    "low": 30,
    "high": 400,
    "catId": "gi-bone-other"
  },
  {
    "key": "tsh",
    "label": "TSH",
    "unit": "µIU/mL",
    "value": 2.1,
    "low": 0.4,
    "high": 4.5,
    "catId": "gh-axis"
  }
];

export const CYCLE: Cycle = {
  "day": 41,
  "length": 56,
  "start": "27 JUN",
  "washout": "21 AUG",
  "adherence": 96,
  "onTime": 39
};

// Site geometry only. Usage counts are DERIVED from DOSE_LOG (see siteUsage()) so
// they always respect whatever filtering the caller applies — never store them here.
export const SITES: Site[] = [
  {
    "id": "abd-l",
    "label": "ABDOMEN L",
    "x": 44,
    "y": 44
  },
  {
    "id": "abd-r",
    "label": "ABDOMEN R",
    "x": 56,
    "y": 44
  },
  {
    "id": "delt-l",
    "label": "DELT L",
    "x": 26,
    "y": 26
  },
  {
    "id": "delt-r",
    "label": "DELT R",
    "x": 74,
    "y": 26
  },
  {
    "id": "thigh-l",
    "label": "THIGH L",
    "x": 42,
    "y": 70
  },
  {
    "id": "thigh-r",
    "label": "THIGH R",
    "x": 58,
    "y": 70
  }
];

export const COUNTS: Counts = { compounds: 58, categories: 12, stack: 6 };

// ── Derived accessors ────────────────────────────────────────────────────────

/** The only sanctioned way to derive a grade. */
export function gradeFor(evidence: EvidenceLevel): Grade {
  return EVIDENCE_TO_GRADE[evidence]
}

export const COMPOUND_LIST: Compound[] = Object.values(COMPOUNDS)

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
)

export function compound(id: string): Compound | undefined {
  return COMPOUNDS[id]
}

export function compoundsInCategory(catId: string): Compound[] {
  return COMPOUND_LIST.filter((entry) => entry.catId === catId)
}

export function sortByGrade(entries: Compound[]): Compound[] {
  return [...entries].sort(
    (a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade),
  )
}

/**
 * The library disagreeing with itself.
 *
 * GHK-Cu is filed under `goalCategory: 'GH Axis'` while its `primaryPurpose`
 * is Skin / Hair, and it has inherited GH-axis effects text. Rather than guess
 * which field is right, the Mirror surfaces the contradiction. Worth fixing in
 * the source spreadsheet; the detector stays either way.
 */
export function taxonomyMismatch(entry: Compound): Category | null {
  const own = CATEGORY_BY_ID[entry.catId]
  if (!own) return null

  const purpose = normaliseTaxonomyTerm(entry.purpose.split('/')[0] ?? '')
  if (purpose.length <= 3) return null

  // Only a real contradiction if the taxonomy HAS a home for the stated purpose
  // and the compound is filed somewhere else. Merely different vocabulary —
  // "Cardiovascular" vs the "Cardio/Vascular" category — is not a disagreement,
  // and treating it as one flagged 31 of 58 compounds.
  if (matchesCategory(own, purpose)) return null

  return (
    CATEGORIES.find(
      (candidate) => candidate.id !== own.id && matchesCategory(candidate, purpose),
    ) ?? null
  )
}

function normaliseTaxonomyTerm(value: string): string {
  return value.toLowerCase().replace(/[\s\-/]/g, '')
}

function matchesCategory(category: Category, normalisedPurpose: string): boolean {
  const name = normaliseTaxonomyTerm(category.name)
  return name === normalisedPurpose || name.startsWith(normalisedPurpose)
}

/**
 * Compounds whose stated purpose names a category they are not filed under.
 * Three at time of porting: GHK-Cu, VIP and Apelin.
 */
export function mismatchedCompounds(): Compound[] {
  return COMPOUND_LIST.filter((entry) => taxonomyMismatch(entry) !== null)
}

/**
 * Proves grade === gradeFor(evidence) across the catalog, and that no grade was
 * nudged by `cv`. Called by the catalog test; safe to call anywhere.
 */
export function assertGradeIntegrity(): void {
  for (const entry of COMPOUND_LIST) {
    const expected = gradeFor(entry.evidence)
    if (entry.grade !== expected) {
      throw new Error(
        `Evidence grade drift on ${entry.id}: grade "${entry.grade}" but evidence ` +
          `"${entry.evidence}" maps to "${expected}".`,
      )
    }
  }
}
