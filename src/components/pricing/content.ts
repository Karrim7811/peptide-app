// Copy for the Pricing screen, originally from
// design_handoff_peptide_cortex/Peptide Cortex Pricing.dc.html (FREE_FEATURES,
// PRO_FEATURES, FAQS). Reworded 2026-09 into plain English (UX overhaul,
// batch 2): the prototype's "field / form / resolve" metaphors read as jargon
// to people deciding whether to pay. The library count is live — never
// hard-code it (it said 58 long after the library reached 124).

import { COUNTS } from '@/lib/catalog'

export interface PricingFeature {
  on: boolean
  label: string
}

export const FREE_FEATURES: PricingFeature[] = [
  { on: true, label: `The full library — all ${COUNTS.compounds} compounds, with every evidence grade` },
  { on: true, label: 'Mixing calculator, with the working shown' },
  { on: true, label: 'Cautions, contraindications and documented interactions' },
  { on: true, label: 'Dose log and injection-site record' },
  { on: true, label: 'One peptide from your stack shown in full, with what it is often stacked with' },
  { on: false, label: 'Comparing your peptides against each other' },
  { on: false, label: 'Bloodwork, cycle planning and Cortex answers' },
]

export const PRO_FEATURES: PricingFeature[] = [
  { on: true, label: 'Every peptide in your stack shown in full, with no limit' },
  { on: true, label: 'Low-supply alerts across your whole stack — what runs out first, and when, against your cycle' },
  { on: true, label: 'Bloodwork: add your lab results and see which markers are outside range' },
  { on: true, label: 'Cycle planning, washout windows and adherence' },
  { on: true, label: 'Cortex answers that synthesise across your stack, not one compound at a time' },
  { on: true, label: 'Injection-site history and which site you have used least' },
  { on: true, label: 'Export a plain record to take to your physician' },
]

export interface PricingFaq {
  q: string
  a: string
}

export const FAQS: PricingFaq[] = [
  {
    q: 'Why only one compound on Free?',
    a: 'Because a trial that expires would have been the easy answer, and we wanted Free to still be worth opening after one ended. Free shows one peptide from your stack in full, and the rest of your stack still appears, dimmed, so you can see what you have. The Pro trial sits on top of that: a month with everything open, after which Free is still there rather than a locked door.',
  },
  {
    q: 'What happens to my data if I stop paying?',
    a: 'Nothing is deleted. Your stack, log and bloodwork stay exactly as they were; anything past the Free allowance is shown dimmed instead of in full. Resubscribe and it all opens again with the history intact.',
  },
  {
    q: 'Is any safety information behind the paywall?',
    a: 'No. Reconstitution maths, cautions, contraindications and interaction text are readable at every tier, including for peptides that are locked on your plan. Gating those would be indefensible.',
  },
  {
    q: 'Does Cortex tell me what to take?',
    a: 'No, and it is built not to. It describes how compounds are studied, what your own log says, and where those two disagree. Every dosing figure is your own recorded protocol played back with the arithmetic shown, not a recommendation.',
  },
  {
    q: 'Can I cancel whenever?',
    a: 'Yes, from the account page. Cancel during the free month and you are never charged; cancel later and it runs to the end of the period you have paid for. Either way the account drops back to Free rather than closing — cycles run eight to twelve weeks, which is why annual works out cheaper than stopping and restarting around each washout.',
  },
]
