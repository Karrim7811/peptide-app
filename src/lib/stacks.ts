// ─── Types ────────────────────────────────────────────────────────────────────

export interface StackComponent {
  peptide: string
  dose: string
  frequency: string
}

export interface Stack {
  name: string
  goal: string
  components: StackComponent[]
  description: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  tags: string[]
}

// ─── Stack Data ───────────────────────────────────────────────────────────────

export const STACKS: Stack[] = [
  {
    name: 'Healing & Recovery Stack',
    goal: 'Injury recovery, tissue repair',
    components: [
      { peptide: 'BPC-157', dose: '250 mcg', frequency: 'Twice daily (AM + PM)' },
      { peptide: 'TB-500', dose: '2 mg', frequency: 'Twice weekly (loading), then 1 mg 1x/week' },
    ],
    description:
      'BPC-157 and TB-500 are widely considered the gold-standard healing combination. BPC-157 drives local and systemic tissue repair via growth factor upregulation, while TB-500 promotes systemic actin remodeling and angiogenesis. Together they accelerate healing of tendons, ligaments, muscles, and gut lining significantly faster than either alone.',
    duration: '4–8 weeks on, 4 weeks off. Can repeat cycles as needed.',
    difficulty: 'Beginner',
    tags: ['Recovery', 'Anti-inflammatory', 'Tendon', 'Muscle', 'Gut Health'],
  },
  {
    name: 'GH Optimization Stack',
    goal: 'GH pulse amplification, fat loss, sleep quality',
    components: [
      { peptide: 'Ipamorelin', dose: '200–300 mcg', frequency: '3x daily — AM (fasted), pre-workout, before bed' },
      { peptide: 'CJC-1295 (no DAC)', dose: '100–200 mcg', frequency: '3x daily — dosed with each Ipamorelin injection' },
    ],
    description:
      'Ipamorelin (GHRP) and CJC-1295 no DAC (GHRH) work synergistically to produce powerful, natural-mimicking GH pulses. CJC-1295 amplifies the GHRH signal while Ipamorelin triggers GH release at the pituitary — together producing GH output several times greater than either alone. The before-bed dose takes advantage of natural nocturnal GH secretion for enhanced recovery and fat loss.',
    duration: '8–12 weeks on, 4 weeks off.',
    difficulty: 'Beginner',
    tags: ['GH', 'Fat Loss', 'Muscle', 'Sleep', 'Anti-Aging'],
  },
  {
    name: 'Fat Loss Stack',
    goal: 'Aggressive fat burning with GH support',
    components: [
      { peptide: 'AOD-9604', dose: '300–500 mcg', frequency: 'Once daily, fasted AM' },
      { peptide: 'Ipamorelin', dose: '200–300 mcg', frequency: 'Twice daily — fasted AM + before bed' },
      { peptide: 'CJC-1295 (no DAC)', dose: '100–200 mcg', frequency: 'Twice daily — dosed with Ipamorelin' },
    ],
    description:
      'AOD-9604 directly stimulates lipolysis and inhibits lipogenesis without affecting GH receptors or blood glucose. Stacking it with Ipamorelin + CJC-1295 adds the metabolic and body composition benefits of elevated GH pulses. This combination targets fat loss from multiple angles simultaneously, making it one of the most effective peptide-based fat-burning protocols.',
    duration: '8–12 weeks on, 4 weeks off.',
    difficulty: 'Intermediate',
    tags: ['Fat Loss', 'GH', 'Body Composition', 'Lipolysis'],
  },
  {
    name: 'Anti-Aging & Longevity Stack',
    goal: 'Cellular longevity, skin health, immune resilience',
    components: [
      { peptide: 'Epithalon', dose: '5–10 mg', frequency: 'Once daily for 10–20 consecutive days (course)' },
      { peptide: 'GHK-Cu', dose: '1–2 mg', frequency: 'Once daily (SubQ or topical)' },
      { peptide: 'Thymosin Alpha-1', dose: '1.6 mg', frequency: 'Twice weekly' },
    ],
    description:
      'Epithalon activates telomerase to support telomere lengthening and cellular longevity. GHK-Cu drives collagen synthesis, skin regeneration, and wound healing through copper-dependent pathways. Thymosin Alpha-1 modulates and strengthens immune function, shown to enhance T-cell activity and antiviral response. Together this stack addresses aging at the cellular, structural, and immune levels.',
    duration: 'Epithalon: 10–20 day courses 1–2x/year. GHK-Cu + TA1: 8–12 weeks, then 4 weeks off.',
    difficulty: 'Intermediate',
    tags: ['Anti-Aging', 'Longevity', 'Skin', 'Immune', 'Telomere'],
  },
  {
    name: 'Cognitive Enhancement Stack',
    goal: 'Focus, memory, anxiety reduction, neuroprotection',
    components: [
      { peptide: 'Selank', dose: '500–1000 mcg', frequency: 'Twice daily (AM + midday), intranasal' },
      { peptide: 'Semax', dose: '300–600 mcg', frequency: 'Twice daily (AM + midday), intranasal' },
    ],
    description:
      'Selank is an anxiolytic nootropic that reduces anxiety and improves mood without sedation, acting on GABA and serotonin systems. Semax powerfully upregulates BDNF (brain-derived neurotrophic factor), enhancing neuroplasticity, focus, and memory. Used together, they provide complementary nootropic effects — Semax drives cognitive performance while Selank manages stress and anxiety that might otherwise impair cognition.',
    duration: '2–4 weeks on, 2 weeks off. Can be used situationally.',
    difficulty: 'Beginner',
    tags: ['Cognitive', 'Focus', 'Memory', 'Anxiety', 'Neuroprotection', 'BDNF'],
  },
  {
    name: 'Body Recomposition Stack',
    goal: 'Simultaneous muscle gain, fat loss, and recovery',
    components: [
      { peptide: 'BPC-157', dose: '250 mcg', frequency: 'Twice daily (AM + PM)' },
      { peptide: 'TB-500', dose: '2 mg', frequency: 'Twice weekly' },
      { peptide: 'Ipamorelin', dose: '200–300 mcg', frequency: 'Twice daily — fasted AM + before bed' },
      { peptide: 'CJC-1295 (no DAC)', dose: '100–200 mcg', frequency: 'Twice daily — dosed with Ipamorelin' },
    ],
    description:
      'This comprehensive stack combines the anabolic and fat-burning benefits of elevated GH pulses (via Ipamorelin + CJC-1295) with the tissue repair and anti-inflammatory benefits of the BPC-157 + TB-500 healing stack. Elevated GH promotes muscle growth and lipolysis, while BPC-157 and TB-500 ensure the connective tissue and muscles can keep up with increased training load and recover faster between sessions.',
    duration: '8–12 weeks on, 4–6 weeks off.',
    difficulty: 'Intermediate',
    tags: ['Muscle', 'Fat Loss', 'Recovery', 'GH', 'Body Composition'],
  },
  {
    name: 'Libido & Sexual Performance Stack',
    goal: 'Enhanced sexual function, arousal, and performance',
    components: [
      { peptide: 'PT-141 (Bremelanotide)', dose: '1–2 mg', frequency: 'As needed, 45–60 min before activity' },
      { peptide: 'Melanotan II', dose: '0.25–1 mg (start low)', frequency: 'Daily during loading (2–4 weeks), then 2x/week' },
    ],
    description:
      'PT-141 acts directly on melanocortin receptors in the brain to enhance sexual desire and arousal in both men and women — it works centrally, not through the vascular system like PDE5 inhibitors. Melanotan II provides lasting tanning, libido enhancement, and can improve erectile quality with consistent use. Used together, Melanotan II provides the baseline libido enhancement while PT-141 is used acutely for sexual events.',
    duration: 'PT-141: On-demand. Melanotan II: 2–4 week loading, then maintenance as needed.',
    difficulty: 'Intermediate',
    tags: ['Libido', 'Sexual Function', 'Tanning', 'Arousal'],
  },
  {
    name: 'Immune Support Stack',
    goal: 'Immune modulation, antiviral support, systemic healing',
    components: [
      { peptide: 'Thymosin Alpha-1', dose: '1.6 mg', frequency: 'Twice weekly' },
      { peptide: 'BPC-157', dose: '250 mcg', frequency: 'Once to twice daily' },
    ],
    description:
      'Thymosin Alpha-1 is a clinically validated immune modulator used in approved medicines in multiple countries. It enhances T-cell maturation, NK cell activity, and antiviral immune response. BPC-157 contributes anti-inflammatory effects and supports gut health — where a large portion of immune function originates. This stack is widely used for post-illness recovery, chronic immune challenges, and as a general immune resilience protocol.',
    duration: '4–12 weeks depending on indication. Can be used long-term at maintenance doses.',
    difficulty: 'Beginner',
    tags: ['Immune', 'Antiviral', 'Anti-inflammatory', 'Gut Health', 'Recovery'],
  },
  {
    name: 'GLP-1 Weight Loss Protocol',
    goal: 'Significant weight reduction, metabolic health',
    components: [
      {
        peptide: 'Semaglutide (or Tirzepatide)',
        dose: 'Sema: 0.25 mg → titrate to 1–2.4 mg | Tirz: 2.5 mg → titrate to 10–15 mg',
        frequency: 'Once weekly (both)',
      },
      { peptide: 'AOD-9604 (optional add-on)', dose: '300–500 mcg', frequency: 'Once daily, fasted AM' },
    ],
    description:
      'Semaglutide and Tirzepatide are GLP-1 receptor agonists (Tirzepatide also targets GIP) that reduce appetite, slow gastric emptying, and improve insulin sensitivity — producing clinically significant weight loss of 15–25%+ over 6–12 months. AOD-9604 can be added to enhance direct lipolytic activity without interfering with GLP-1 pathways, potentially amplifying fat loss outcomes. Titrate GLP-1 agents slowly to minimize GI side effects.',
    duration: 'GLP-1 agent: Ongoing (typically 20–52+ weeks). AOD-9604: 8–12 weeks, repeated cycles.',
    difficulty: 'Intermediate',
    tags: ['Weight Loss', 'GLP-1', 'Appetite', 'Metabolic Health', 'Fat Loss'],
  },
  {
    name: 'IGF-1 Muscle Growth Stack',
    goal: 'Muscle hypertrophy, satellite cell activation, recovery',
    components: [
      { peptide: 'IGF-1 LR3', dose: '20–60 mcg', frequency: 'Once daily post-workout (training days only)' },
      { peptide: 'BPC-157', dose: '250 mcg', frequency: 'Twice daily (AM + PM)' },
      { peptide: 'PEG-MGF (optional)', dose: '200–400 mcg', frequency: 'Twice weekly, post-workout' },
    ],
    description:
      'IGF-1 LR3 is one of the most anabolic peptides available, directly stimulating muscle protein synthesis, nitrogen retention, and satellite cell activation. BPC-157 is added to protect connective tissue and joints from the increased mechanical stress that comes with accelerated muscle growth. PEG-MGF (Mechano Growth Factor) complements IGF-1 LR3 by further activating muscle satellite cells via a different receptor. Eat carbohydrates immediately after injection to prevent hypoglycemia.',
    duration: 'Maximum 4–6 weeks on IGF-1 LR3, then 4+ weeks off. Strict cycling is essential.',
    difficulty: 'Advanced',
    tags: ['Muscle Growth', 'Hypertrophy', 'IGF-1', 'Recovery', 'Anabolic'],
  },
]
