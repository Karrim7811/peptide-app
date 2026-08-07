// Copy for the Pricing screen, verbatim from
// design_handoff_peptide_cortex/Peptide Cortex Pricing.dc.html (FREE_FEATURES,
// PRO_FEATURES, FAQS). Do not paraphrase — see that file if this ever needs
// re-syncing.

export interface PricingFeature {
  on: boolean
  label: string
}

export const FREE_FEATURES: PricingFeature[] = [
  { on: true, label: 'The full library — all 58 compounds, browsable, with every evidence grade and the taxonomy behind it' },
  { on: true, label: 'Reconstitution arithmetic, with the working shown' },
  { on: true, label: 'Cautions, contraindications and documented interactions' },
  { on: true, label: 'Dose log and injection-site record' },
  { on: true, label: 'One resolved compound — its edges still draw out to everything adjacent' },
  { on: false, label: 'Weighing compounds against each other' },
  { on: false, label: 'Bloodwork, cycle planning and Cortex answers' },
]

export const PRO_FEATURES: PricingFeature[] = [
  { on: true, label: 'Every compound in your stack resolved, with no limit' },
  { on: true, label: 'Supply tension across the whole stack — what runs out, and when against your cycle' },
  { on: true, label: 'Bloodwork attach: markers re-tune the form against your real values' },
  { on: true, label: 'Cycle planning, washout windows and adherence' },
  { on: true, label: 'Cortex answers that synthesise across your stack, not one compound at a time' },
  { on: true, label: 'Rotation history and next-site suggestion' },
  { on: true, label: 'Export a plain record to take to your physician' },
]

export interface PricingFaq {
  q: string
  a: string
}

export const FAQS: PricingFaq[] = [
  {
    q: 'Why only one compound on Free?',
    a: 'Because a trial that expires would have been the easy answer, and we wanted Free to still be worth opening after one ended. One resolved compound still draws every relationship it has out into the ones you have not unlocked, so Free is not a crippled version of the map — it is the map, with most of it dimmed. The Pro trial sits on top of that: a month with everything resolved, after which Free is still there rather than a locked door.',
  },
  {
    q: 'What happens to my data if I stop paying?',
    a: 'Nothing is deleted. Your stack, log and bloodwork stay exactly as they were; the form stops resolving the compounds past your free allowance and shows them dashed instead. Resubscribe and they light up again with the history intact.',
  },
  {
    q: 'Is any safety information behind the paywall?',
    a: 'No. Reconstitution maths, cautions, contraindications and interaction text are readable at every tier, including for compounds your plan has not resolved. Gating those would be indefensible.',
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
