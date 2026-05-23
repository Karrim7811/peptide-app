// Display helpers ported from ios-native/PeptideCortex/Views/Components/VialView.swift
// so the iOS vial labels and the web vial labels render identically.

const SUFFIXES_TO_STRIP = [
  ' (research)',
  ' (research/region-specific)',
  ' (research/compounded)',
  ' (research/clinical research)',
  ' (region-specific)',
  ' (not a peptide, but commonly discussed)',
  ' (Thymosin beta-4 fragment, research)',
  ' (Wegovy/Ozempic)',
  ' (Zepbound/Mounjaro)',
  ' (Saxenda/Victoza)',
  ' (Byetta/Bydureon)',
  ' (Trulicity)',
  ' (Egrifta SV/WR)',
  ' (Symlin)',
  ' (Human Growth Hormone)',
]

// Short, uppercased single-line label used on the vial face.
export function vialShortName(name: string): string {
  let cleaned = name
  for (const s of SUFFIXES_TO_STRIP) {
    cleaned = cleaned.split(s).join('')
  }
  cleaned = cleaned.replace('Vasoactive Intestinal Peptide', 'VIP')
  if (cleaned.length > 10) cleaned = cleaned.slice(0, 10)
  return cleaned
}

// Slightly longer name (used under the vial in some places).
export function vialDisplayName(name: string): string {
  let cleaned = name
  for (const s of SUFFIXES_TO_STRIP) {
    cleaned = cleaned.split(s).join('')
  }
  cleaned = cleaned.replace('Vasoactive Intestinal Peptide', 'VIP')
  if (cleaned.length > 14) cleaned = cleaned.slice(0, 13) + '…'
  return cleaned
}

// Cap colour by peptide category — matches the iOS palette.
export type VialColor = {
  // Used for the cap, the fill tint, and the "due-now" glow.
  cap: string
  // Used as a darker variant for the cap shadow edge.
  capShadow: string
}

const PALETTE = {
  weightLoss: { cap: '#22A06B', capShadow: '#1A7E54' },
  cognitive:  { cap: '#8C5BD9', capShadow: '#6E44B0' },
  healing:    { cap: '#1A8A9E', capShadow: '#147180' },
  ghAxis:     { cap: '#D9A832', capShadow: '#A6801F' },
  default:    { cap: '#1A8A9E', capShadow: '#147180' },
}

export function vialCapColor(name: string): VialColor {
  const n = name.toLowerCase()
  if (n.includes('semaglutide') || n.includes('tirzepatide') || n.includes('retatrutide') || n.includes('aod')) {
    return PALETTE.weightLoss
  }
  if (n.includes('semax') || n.includes('selank') || n.includes('dsip') || n.includes('pinealon')) {
    return PALETTE.cognitive
  }
  if (n.includes('bpc') || n.includes('tb-500') || n.includes('wolverine') || n.includes('glow') || n.includes('klow') || n.includes('tri-heal')) {
    return PALETTE.healing
  }
  if (n.includes('ipamorelin') || n.includes('cjc') || n.includes('sermorelin') || n.includes('tesamorelin') || n.includes('ghrp')) {
    return PALETTE.ghAxis
  }
  return PALETTE.default
}
