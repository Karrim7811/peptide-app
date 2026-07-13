// Catalog of the bloodwork markers the OCR endpoint (/api/bloodwork-ocr)
// extracts, keyed by the exact JSON keys it returns. Maps each to a human
// label and a default unit so the UI can render OCR output, let the user edit
// it, and build the {name, value, unit}[] shape the analyze endpoint expects.

export interface MarkerDef {
  key: string
  label: string
  unit: string
}

export const MARKER_CATALOG: MarkerDef[] = [
  // Hormones
  { key: 'testosterone', label: 'Total Testosterone', unit: 'ng/dL' },
  { key: 'freeTestosterone', label: 'Free Testosterone', unit: 'pg/mL' },
  { key: 'estradiol', label: 'Estradiol', unit: 'pg/mL' },
  { key: 'igf1', label: 'IGF-1', unit: 'ng/mL' },
  // Thyroid
  { key: 'tsh', label: 'TSH', unit: 'µIU/mL' },
  { key: 't3Free', label: 'Free T3', unit: 'pg/mL' },
  { key: 't4Free', label: 'Free T4', unit: 'ng/dL' },
  // Metabolic
  { key: 'fastingGlucose', label: 'Fasting Glucose', unit: 'mg/dL' },
  { key: 'hba1c', label: 'HbA1c', unit: '%' },
  // Lipids
  { key: 'totalCholesterol', label: 'Total Cholesterol', unit: 'mg/dL' },
  { key: 'ldl', label: 'LDL', unit: 'mg/dL' },
  { key: 'hdl', label: 'HDL', unit: 'mg/dL' },
  { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL' },
  // Liver
  { key: 'alt', label: 'ALT', unit: 'U/L' },
  { key: 'ast', label: 'AST', unit: 'U/L' },
  // Kidney
  { key: 'gfr', label: 'eGFR', unit: 'mL/min' },
  { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL' },
  // Inflammation
  { key: 'crp', label: 'CRP', unit: 'mg/L' },
  // Vitamins
  { key: 'vitaminD', label: 'Vitamin D', unit: 'ng/mL' },
  { key: 'b12', label: 'Vitamin B12', unit: 'pg/mL' },
  { key: 'ironFerritin', label: 'Ferritin', unit: 'ng/mL' },
  // CBC
  { key: 'wbc', label: 'WBC', unit: '10³/µL' },
  { key: 'rbc', label: 'RBC', unit: '10⁶/µL' },
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
  { key: 'hematocrit', label: 'Hematocrit', unit: '%' },
]

export const MARKER_BY_KEY: Record<string, MarkerDef> = Object.fromEntries(
  MARKER_CATALOG.map((m) => [m.key, m])
)
