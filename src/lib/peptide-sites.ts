// Per-peptide route-of-administration and injection-site reference data.
//
// Kept as a SIDECAR module (keyed by peptide name) rather than inline in
// peptide-knowledge.ts on purpose: peptide-knowledge.ts is regenerated from a
// spreadsheet by generate_knowledge.py, which would wipe any fields added
// there. This file is hand-maintained and survives regeneration.
//
// Legal posture: reference-framed, not instructional. Strings describe what
// research literature / established pharmacology reports, never "inject here".

export interface PeptideSiteInfo {
  route: string
  // true when site choice is about rotation (systemic action); false when the
  // literature notes local administration near a target area or it is topical.
  systemic: boolean
  siteGuidance: string
  note?: string
}

export const PEPTIDE_SITES: Record<string, PeptideSiteInfo> = {
  'Semaglutide (Wegovy/Ozempic)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; in established practice sites are commonly rotated across the abdomen, thigh, and upper arm.' },
  'Tirzepatide (Zepbound/Mounjaro)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen, thigh, and upper arm.' },
  'Liraglutide (Saxenda/Victoza)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen, thigh, and upper arm.' },
  'Exenatide (Byetta/Bydureon)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen, thigh, and upper arm.' },
  'Dulaglutide (Trulicity)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen, thigh, and upper arm.' },
  'Pramlintide (Symlin)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen and thigh, kept separate from any concurrent insulin site.' },
  'Cagrilintide (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, thigh, and upper arm.' },
  'Retatrutide (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, thigh, and upper arm.' },
  'Leptin / Metreleptin': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen, thigh, and upper arm.' },
  'Glucagon': { route: 'Intramuscular, subcutaneous, or intravenous injection', systemic: true, siteGuidance: 'Described as an emergency rescue agent given in clinical or supervised settings; self-administration site guidance is not applicable.', note: 'Clinical/emergency-use drug; nasal rescue forms also exist.' },
  'Tesamorelin (Egrifta SV/WR)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen.' },
  'Somatropin (Human Growth Hormone)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen, thigh, and upper arm.' },
  'Sermorelin (research/compounded)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research and compounded-use literature describes subcutaneous administration with sites commonly rotated across the abdomen, thigh, and upper arm.' },
  'CJC-1295 (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'Ipamorelin (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'GHRP-2 (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'GHRP-6 (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'BPC-157 (research)': { route: 'Subcutaneous injection', systemic: false, siteGuidance: 'Research literature often describes subcutaneous administration near the area of concern, with site rotation; oral use is also studied.' },
  'TB-500 (Thymosin beta-4 fragment, research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration, sometimes near a target area; sites are commonly rotated across the abdomen and flank.' },
  'Thymosin Beta-4 (Tβ4)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration, sometimes near a target area; sites are commonly rotated across the abdomen and flank.' },
  'Thymosin Alpha-1 (Thymalfasin)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Literature describes subcutaneous administration with sites commonly rotated across the abdomen and thigh.' },
  'LL-37 (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated; some studies note local administration near a target area.' },
  'VIP (Vasoactive Intestinal Peptide)': { route: 'Intranasal', systemic: true, siteGuidance: 'Research literature commonly describes intranasal administration; there is no injection site involved.', note: 'Typically studied as a nasal formulation rather than injected; IV forms exist in clinical research.' },
  'KPV (research)': { route: 'Subcutaneous injection or oral', systemic: true, siteGuidance: 'Research literature describes subcutaneous or oral administration; when injected, sites are commonly rotated across the abdomen and flank.', note: 'Oral and topical use are also described in research.' },
  'Semax (research/region-specific)': { route: 'Intranasal', systemic: true, siteGuidance: 'Research literature commonly describes intranasal administration; there is no injection site involved.', note: 'Region-specific compound typically used as a nasal formulation.' },
  'Selank (research/region-specific)': { route: 'Intranasal', systemic: true, siteGuidance: 'Research literature commonly describes intranasal administration; there is no injection site involved.', note: 'Region-specific compound typically used as a nasal formulation.' },
  'Cerebrolysin (region-specific)': { route: 'Intramuscular or intravenous injection', systemic: true, siteGuidance: 'Literature describes administration in clinical or supervised settings by intramuscular or intravenous route.', note: 'Region-specific clinical product; not a self-administered subcutaneous peptide.' },
  'Dihexa (research)': { route: 'Oral', systemic: true, siteGuidance: 'Research literature describes oral administration; there is no injection site involved.', note: 'Studied as an orally active compound rather than injected.' },
  'DSIP (research)': { route: 'Subcutaneous or intravenous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen and thigh.' },
  'Epitalon / Epithalon (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'NAD+ (not a peptide, but commonly discussed)': { route: 'Subcutaneous or intravenous injection', systemic: true, siteGuidance: 'Research settings describe subcutaneous or intravenous administration; when subcutaneous, sites are commonly rotated across the abdomen and thigh.', note: 'Not a peptide; IV infusion forms are typically given in clinical settings.' },
  'MOTS-c (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'Humanin (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'GHK-Cu (Copper peptide)': { route: 'Topical', systemic: false, siteGuidance: 'Cosmetic and research literature describes topical application to the skin; there is no injection site involved.', note: 'Most commonly used as a topical skincare peptide rather than injected.' },
  'Matrixyl (Palmitoyl pentapeptide)': { route: 'Topical', systemic: false, siteGuidance: 'Cosmetic literature describes topical application to the skin; there is no injection site involved.', note: 'Used as a topical cosmetic ingredient, not injected.' },
  'Argireline (Acetyl hexapeptide-8)': { route: 'Topical', systemic: false, siteGuidance: 'Cosmetic literature describes topical application to the skin; there is no injection site involved.', note: 'Used as a topical cosmetic ingredient, not injected.' },
  'Bremelanotide (Vyleesi; PT-141 analog)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen and thigh.' },
  'Kisspeptin (research/clinical research)': { route: 'Subcutaneous or intravenous injection', systemic: true, siteGuidance: 'Clinical research describes subcutaneous or intravenous administration, typically in supervised settings.', note: 'Primarily studied in clinical-research settings.' },
  'Oxytocin': { route: 'Intravenous, intramuscular, or intranasal', systemic: true, siteGuidance: 'Injectable forms are given in clinical settings; intranasal formulations are used in research, so self-administration site guidance is limited.', note: 'Clinical injectable and research nasal forms both exist.' },
  'hCG (not a peptide; glycoprotein hormone)': { route: 'Subcutaneous or intramuscular injection', systemic: true, siteGuidance: 'Literature describes subcutaneous or intramuscular administration with sites commonly rotated across the abdomen, thigh, and upper arm.', note: 'A glycoprotein hormone rather than a peptide.' },
  'ANP (Atrial natriuretic peptide)': { route: 'Intravenous', systemic: true, siteGuidance: 'Research and clinical literature describes intravenous administration in supervised settings; self-administration site guidance is not applicable.', note: 'Studied as an IV infusion, not self-administered.' },
  'BNP (B-type natriuretic peptide)': { route: 'Intravenous', systemic: true, siteGuidance: 'Clinical literature (e.g., nesiritide) describes intravenous administration in hospital settings; self-administration site guidance is not applicable.', note: 'Hospital IV agent, not self-administered.' },
  'Apelin (research)': { route: 'Intravenous', systemic: true, siteGuidance: 'Research literature describes intravenous administration in supervised settings; self-administration site guidance is not applicable.', note: 'Studied primarily as an IV infusion in research.' },
  'Adrenomedullin (research)': { route: 'Intravenous', systemic: true, siteGuidance: 'Research literature describes intravenous administration in supervised settings; self-administration site guidance is not applicable.', note: 'Studied primarily as an IV infusion in research.' },
  'GLP-2 analog (Teduglutide)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous use; sites are commonly rotated across the abdomen, thigh, and upper arm.' },
  'Desmopressin (DDAVP)': { route: 'Oral, intranasal, or intravenous', systemic: true, siteGuidance: 'Available as oral, intranasal, and clinical injectable forms; injectable use occurs in clinical settings, so self-injection site guidance is limited.', note: 'Oral and nasal forms are common; IV forms are clinical-only.' },
  'Calcitonin': { route: 'Subcutaneous, intramuscular, or intranasal', systemic: true, siteGuidance: 'Literature describes subcutaneous, intramuscular, and intranasal forms; when subcutaneous, sites are commonly rotated across the abdomen and thigh.', note: 'Nasal spray forms are widely used alongside injectable forms.' },
  'Teriparatide (Forteo)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous pen use; sites are commonly rotated across the thigh and abdomen.' },
  'Abaloparatide (Tymlos)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Labeled for subcutaneous pen use; sites are commonly rotated across the lower abdomen.' },
  'Vasopressin': { route: 'Intravenous', systemic: true, siteGuidance: 'Clinical literature describes intravenous administration in hospital settings; self-administration site guidance is not applicable.', note: 'Hospital IV agent, not self-administered.' },
  'CGRP (Calcitonin gene-related peptide)': { route: 'Intravenous', systemic: true, siteGuidance: 'Research literature describes intravenous administration in supervised settings; self-administration site guidance is not applicable.', note: 'Studied primarily as an IV infusion in research.' },
  'Substance P': { route: 'Intravenous', systemic: true, siteGuidance: 'Research literature describes intravenous administration in supervised settings; self-administration site guidance is not applicable.', note: 'Studied primarily as an IV infusion in research.' },
  'Bivalirudin': { route: 'Intravenous', systemic: true, siteGuidance: 'Clinical literature describes intravenous administration in hospital procedural settings; self-administration site guidance is not applicable.', note: 'Hospital IV anticoagulant, not self-administered.' },
  'Eptifibatide': { route: 'Intravenous', systemic: true, siteGuidance: 'Clinical literature describes intravenous administration in hospital procedural settings; self-administration site guidance is not applicable.', note: 'Hospital IV antiplatelet agent, not self-administered.' },
  'Melanotan II (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'α-MSH analogs (research)': { route: 'Subcutaneous injection', systemic: true, siteGuidance: 'Research literature describes subcutaneous administration with sites commonly rotated across the abdomen, flank, and thigh.' },
  'Defensins (research)': { route: 'Topical or subcutaneous (research)', systemic: false, siteGuidance: 'Research literature describes topical or local administration and, in some studies, subcutaneous use; not a commonly self-administered compound.', note: 'Studied mainly in laboratory settings rather than as a self-administered injectable.' },
  'Thymopentin (research/region-specific)': { route: 'Subcutaneous or intramuscular injection', systemic: true, siteGuidance: 'Literature describes subcutaneous or intramuscular administration with sites commonly rotated across the abdomen and thigh.', note: 'Region-specific clinical/research peptide.' },
}

function normalize(s: string): string {
  return s.toLowerCase().split('(')[0].replace(/[·—–-].*$/, '').trim()
}

// Resolve site info for a compound name. Handles the common mismatch where a
// user's stack item is a short name ("BPC-157") but the key is fuller
// ("BPC-157 (research)"). Returns null if no confident match.
export function getSiteInfo(name: string): PeptideSiteInfo | null {
  if (!name) return null
  if (PEPTIDE_SITES[name]) return PEPTIDE_SITES[name]

  const target = normalize(name)
  if (!target) return null

  for (const key of Object.keys(PEPTIDE_SITES)) {
    if (normalize(key) === target) return PEPTIDE_SITES[key]
  }
  for (const key of Object.keys(PEPTIDE_SITES)) {
    const nk = normalize(key)
    if (nk && (nk.startsWith(target) || target.startsWith(nk))) return PEPTIDE_SITES[key]
  }
  return null
}
