import type { Metadata } from 'next'
import IpamorelinSpecimen from './IpamorelinSpecimen'

export const metadata: Metadata = {
  title: 'Ipamorelin — Specimen Sheet · Peptide Cortex',
  description:
    'Apothecary specimen sheet for Ipamorelin — a selective ghrelin mimetic isolated for GH release without cortisol stimulation. For research and reference only.',
}

export default function Page() {
  return <IpamorelinSpecimen />
}
