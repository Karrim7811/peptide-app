"""
Adds missing compounds to the master spreadsheet — 2026-08-07.

Run once:  python add_peptides_2026_08.py
Then:      python generate_knowledge.py

CONVENTIONS TAKEN FROM THE EXISTING DATA, NOT INVENTED:
  * Research/compounded compounds carry Dosage Range = 'N/A'. The library
    deliberately does not publish dosing for anything without an FDA label.
    Do not "improve" this by adding community protocol numbers.
  * Research rows share the same cautions / bottom line / interactions
    boilerplate, so the tier reads consistently.
  * Evidence Level maps ONE-TO-ONE to the displayed grade. It is the only
    thing that sets it — never cvRating.

Idempotent: re-running skips any peptide already present by name.
"""
import openpyxl

XLSX = 'Peptides_Master_List_FULL_Explainers_CV_Interactions_Dropdowns.xlsx'

# Shared boilerplate, copied verbatim from existing research-tier rows.
R_CAUTION = 'Not FDA-approved; avoid self-administration; unverified sourcing and purity'
R_BOTTOM = 'Popular in research/compounding; human safety/benefit not well-established.'
R_AVOID = 'Avoid self-injection and unverified sources; discuss with a clinician.'
R_INTERACT = ('No well-established interaction profile for non-approved peptides; avoid combining '
              'multiple research compounds; discuss meds with clinician.')
R_EVID = 'Research/compounded/adjunct (no established FDA indication)'
A_EVID = 'FDA-approved Rx (labeled use)'
B_EVID = 'Region-specific approval (not US FDA)'
C_EVID = 'Mixed/unclear regulatory status'
A_BOTTOM = 'Strongest data when used for its labeled indication under clinician guidance.'

def research(name, purpose, does, effects, goal, cv, cvnotes, best, cats, use='Research'):
    return dict(name=name, purpose=purpose, does=does, use=use, dose='N/A',
                caution=R_CAUTION, best=best, effects=effects, evid=R_EVID,
                bottom=R_BOTTOM, avoid=R_AVOID, cv=cv, cvnotes=cvnotes,
                interact=R_INTERACT, goal=goal, cats=cats)

def approved(name, purpose, does, use, dose, caution, best, effects, bottom, avoid,
             cv, cvnotes, interact, goal, cats, evid=A_EVID):
    return dict(name=name, purpose=purpose, does=does, use=use, dose=dose,
                caution=caution, best=best, effects=effects, evid=evid, bottom=bottom,
                avoid=avoid, cv=cv, cvnotes=cvnotes, interact=interact, goal=goal, cats=cats)

CV_NO_DATA = 'No solid direct cardiovascular outcomes evidence; any benefit is indirect or unproven.'

ROWS = [
    # ── TIER 1 — research-tier staples ────────────────────────────────────
    research('AOD-9604 (research)', 'Metabolic / Weight',
             'Synthetic C-terminal fragment of hGH (residues 176-191); stimulates lipolysis and inhibits lipogenesis without binding the GH receptor',
             'Targets fat metabolism without raising IGF-1 or affecting blood sugar in trials to date',
             'Metabolic/Weight', 1,
             'Six Phase I/II trials showed a clean safety profile in ~900 participants, but the Phase IIb weight-loss endpoint was not met and development stopped in 2007.',
             'Body composition (medical oversight)', ['Metabolic/Weight']),

    research('Hexarelin (research)', 'GH axis',
             'Ghrelin receptor agonist (GHS); among the most potent GH-releasing peptides, with reported desensitisation over continued use',
             'Signals the GH axis strongly; can affect body composition, fluid retention, cortisol and prolactin',
             'GH Axis', 1,
             'Studied for cardiac effects independent of GH release, but no outcomes data; any benefit is unproven.',
             'Hormone axis support (medical oversight)', ['GH Axis', 'Muscle/Performance']),

    research('CJC-1295 with DAC (research)', 'GH axis',
             'GHRH analog bound to a Drug Affinity Complex, extending half-life to roughly a week versus hours for the unmodified peptide',
             'Signals the GH axis continuously rather than in pulses, which is a meaningfully different exposure profile from the no-DAC form',
             'GH Axis', 1, CV_NO_DATA,
             'Hormone axis support (medical oversight)', ['GH Axis']),

    research('IGF-1 LR3 (research)', 'Muscle / Performance',
             'Long-acting IGF-1 analog with reduced binding-protein affinity, extending activity well beyond native IGF-1',
             'Drives tissue growth signalling directly rather than via the GH axis; can affect blood sugar',
             'Muscle/Performance', 1,
             'No cardiovascular outcomes data; growth-factor signalling carries theoretical proliferative concerns.',
             'Tissue growth signalling (medical oversight)', ['Muscle/Performance', 'GH Axis']),

    research('MGF (Mechano Growth Factor, research)', 'Muscle / Performance',
             'Splice variant of IGF-1 expressed in muscle after mechanical loading; studied for satellite-cell activation',
             'Studied for local repair signalling in muscle after damage',
             'Muscle/Performance', 1, CV_NO_DATA,
             'Tissue repair signalling (medical oversight)', ['Muscle/Performance', 'Healing/Recovery']),

    research('Follistatin-344 (research)', 'Muscle / Performance',
             'Glycoprotein that binds and neutralises myostatin and related TGF-beta proteins that limit muscle growth',
             'Targets the natural brake on muscle growth rather than stimulating growth directly',
             'Muscle/Performance', 1,
             'No cardiovascular outcomes data; systemic myostatin inhibition has unclear long-term effects including on cardiac muscle.',
             'Muscle signalling (medical oversight)', ['Muscle/Performance']),

    research('ARA-290 (Cibinetide, research)', 'Healing / Recovery',
             'Non-erythropoietic EPO-derived peptide targeting the innate repair receptor; studied in small-fibre neuropathy',
             'Studied for nerve repair and inflammatory signalling without the blood-thickening effects of EPO',
             'Healing/Recovery', 1,
             'Designed specifically to avoid EPO’s haematocrit and thrombotic effects, but no cardiovascular outcomes data exists.',
             'Nerve and tissue repair (medical oversight)', ['Healing/Recovery', 'Immune/Anti-inf']),

    research('P-21 (research)', 'Cognition / Mood',
             'Synthetic peptide analog of ciliary neurotrophic factor; studied for neurogenesis in preclinical models',
             'Studied for learning and memory signalling; human data is absent',
             'Cognition/Mood', 0, CV_NO_DATA,
             'Cognitive research (medical oversight)', ['Cognition/Mood']),

    research('Larazotide (research)', 'GI / Bone / Other',
             'Tight-junction regulator studied for intestinal permeability in coeliac disease',
             'Studied for gut barrier integrity; failed its Phase 3 endpoint in coeliac disease in 2022',
             'GI/Bone/Other', 0, CV_NO_DATA,
             'Gut barrier research (medical oversight)', ['GI/Bone/Other']),

    research('MK-677 (Ibutamoren; not a peptide)', 'GH axis',
             'Orally active non-peptide ghrelin receptor agonist; included here because it is used interchangeably with GH secretagogue peptides',
             'Raises GH and IGF-1 orally; commonly increases appetite, water retention and fasting glucose',
             'GH Axis', 1,
             'Raises IGF-1 and can worsen insulin sensitivity and fluid retention; a heart-failure trial was stopped early.',
             'Hormone axis support (medical oversight)', ['GH Axis', 'Muscle/Performance']),

    research('5-Amino-1MQ (not a peptide)', 'Metabolic / Weight',
             'Small-molecule NNMT inhibitor; included here because it is used alongside metabolic peptides',
             'Studied for fat-cell metabolism in preclinical models; no human trials',
             'Metabolic/Weight', 0, CV_NO_DATA,
             'Metabolic research (medical oversight)', ['Metabolic/Weight', 'Longevity']),

    research('Snap-8 (Acetyl octapeptide-3)', 'Cosmetic',
             'Topical peptide that interferes with SNARE-complex formation, reducing muscle contraction at the skin surface',
             'Topical only; studied for expression-line appearance',
             'Skin/Hair', 0,
             'Topical cosmetic use; no systemic cardiovascular relevance.',
             'Cosmetic appearance', ['Skin/Hair'], use='Topical cosmetic formulations'),

    # ── Region-specific approvals ─────────────────────────────────────────
    dict(name='Thymalin (region-specific)', purpose='Immune modulation',
         does='Thymic peptide preparation used in Russia and some CIS states for immune restoration; part of the Khavinson peptide work',
         use='Immune support where approved', dose='Per local prescribing information where approved',
         caution='Not FDA-approved; approval and quality standards vary by country',
         best='Immune support (medical oversight)',
         effects='Studied for immune restoration in older adults; often paired with Epitalon in longevity protocols',
         evid=B_EVID, bottom='Approved in some jurisdictions; not FDA-reviewed, so US access is via unregulated channels.',
         avoid='Avoid unverified sources; approval does not transfer across jurisdictions.',
         cv=1, cvnotes='Long-term follow-up studies claim mortality benefit but are small and not independently replicated.',
         interact='Limited interaction data; discuss with a clinician, particularly alongside immunosuppressants.',
         goal='Immune/Anti-inf', cats=['Immune/Anti-inf', 'Longevity']),

    dict(name='Pinealon (region-specific)', purpose='Cognition / Mood',
         does='Short peptide bioregulator from the Khavinson series, studied for neuronal protection',
         use='Cognitive support where approved', dose='Per local prescribing information where approved',
         caution='Not FDA-approved; approval and quality standards vary by country',
         best='Cognitive support (medical oversight)',
         effects='Studied for neuronal resilience; human evidence is limited and largely single-group',
         evid=B_EVID, bottom='Approved in some jurisdictions; not FDA-reviewed, so US access is via unregulated channels.',
         avoid='Avoid unverified sources; approval does not transfer across jurisdictions.',
         cv=0, cvnotes=CV_NO_DATA,
         interact='Limited interaction data; discuss with a clinician.',
         goal='Cognition/Mood', cats=['Cognition/Mood', 'Longevity']),

    # ── TIER 2 — FDA-approved peptide drugs ───────────────────────────────
    approved('Elamipretide (Forzinity/SS-31)', 'Longevity / Mitochondrial',
             'Mitochondria-targeting tetrapeptide that binds cardiolipin in the inner mitochondrial membrane, improving cristae structure and respiration',
             'Barth syndrome', '40 mg SC once daily (per labelled indication)',
             'Injection-site reactions; approved only for Barth syndrome — longevity use is off-label and unstudied',
             'Mitochondrial support (labelled indication)',
             'Restores mitochondrial membrane structure; the first mitochondria-targeted peptide to reach FDA approval (2025)',
             A_BOTTOM, 'Not indicated or studied for ageing, performance or general fatigue.',
             2, 'Cardiolipin is concentrated in cardiac tissue and heart-failure trials were run, but the approved indication is Barth syndrome, not cardiac disease.',
             'Limited published interaction data; follow the prescribing information and clinician guidance.',
             'Longevity', ['Longevity', 'Muscle/Performance']),

    approved('Afamelanotide (Scenesse / Melanotan I)', 'Skin / Photoprotection',
             'Melanocortin-1 receptor agonist; increases eumelanin to raise the skin’s tolerance of light',
             'Erythropoietic protoporphyria (EPP)', '16 mg subcutaneous implant every 2 months',
             'Implant-site reactions; darkening of skin and moles requires skin monitoring; not a tanning product',
             'Photoprotection (labelled indication)',
             'Raises light tolerance in a rare photosensitivity disorder; distinct from Melanotan II, which is unapproved',
             A_BOTTOM, 'Not indicated for cosmetic tanning; skin surveillance is required on treatment.',
             1, 'No meaningful cardiovascular signal at the labelled dose; unlike Melanotan II it is MC1R-selective.',
             'Follow the prescribing information; regular full-body skin examination is required.',
             'Skin/Hair', ['Skin/Hair']),

    approved('Gonadorelin (GnRH)', 'Reproductive axis',
             'Synthetic gonadotropin-releasing hormone; stimulates pituitary LH and FSH release',
             'Diagnostic evaluation of pituitary function; fertility protocols',
             'Diagnostic: 100 mcg SC or IV; other regimens per prescribing information',
             'Pulsatile dosing matters — continuous exposure downregulates the axis and suppresses gonadotropins',
             'Hormone axis support (medical oversight)',
             'Stimulates the body’s own LH and FSH rather than replacing testosterone; commonly used alongside TRT to maintain testicular function',
             A_BOTTOM, 'Continuous rather than pulsatile administration produces the opposite of the intended effect.',
             1, 'No direct cardiovascular outcomes data; effects are mediated through sex-hormone changes.',
             'Effects are altered by sex-hormone therapies and other GnRH agents; coordinate with the prescribing clinician.',
             'Sexual Health', ['Sexual Health']),

    approved('Setmelanotide (Imcivree)', 'Metabolic / Weight',
             'MC4R agonist restoring signalling in the melanocortin pathway for specific genetic obesity syndromes',
             'POMC, PCSK1, LEPR deficiency and Bardet-Biedl syndrome',
             '2-3 mg SC once daily following titration (per prescribing information)',
             'Skin hyperpigmentation; injection-site reactions; sexual adverse events including priapism; depression and suicidal ideation reported',
             'Genetic obesity (labelled indication)',
             'Targets a specific inherited defect in appetite signalling; not a general weight-loss drug',
             A_BOTTOM, 'Not indicated for common obesity; genetic confirmation is required.',
             1, 'Weight reduction in the labelled population is substantial, but no cardiovascular outcomes trials support broader use.',
             'Monitor for depression and skin changes; follow the prescribing information.',
             'Metabolic/Weight', ['Metabolic/Weight']),

    approved('Octreotide (Sandostatin)', 'Endocrine / GI',
             'Somatostatin analog suppressing GH, insulin, glucagon and multiple GI hormones',
             'Acromegaly; carcinoid syndrome; VIPoma',
             'Immediate release 50-100 mcg SC two to three times daily; LAR 20 mg IM every 4 weeks',
             'Gallstones with prolonged use; glucose dysregulation in both directions; bradycardia; GI upset',
             'Hormone suppression (labelled indication)',
             'Suppresses the GH axis rather than stimulating it — the mirror image of the secretagogue peptides',
             A_BOTTOM, 'Long-term use requires gallbladder and glucose monitoring.',
             2, 'Can cause bradycardia and conduction changes; monitor in patients with existing cardiac disease.',
             'Alters insulin and oral diabetes medication requirements; affects ciclosporin and bromocriptine levels; monitor thyroid function.',
             'GI/Bone/Other', ['GI/Bone/Other', 'GH Axis']),

    approved('Lanreotide (Somatuline Depot)', 'Endocrine / GI',
             'Long-acting somatostatin analog; suppresses GH and IGF-1 and slows neuroendocrine tumour progression',
             'Acromegaly; gastroenteropancreatic neuroendocrine tumours; carcinoid syndrome',
             '90-120 mg by deep subcutaneous injection every 4 weeks',
             'Gallstones; glucose dysregulation; bradycardia; injection-site reactions',
             'Hormone suppression (labelled indication)',
             'Same axis as octreotide with a longer dosing interval',
             A_BOTTOM, 'Long-term use requires gallbladder and glucose monitoring.',
             2, 'Bradycardia and conduction effects are recognised; monitor in patients with existing cardiac disease.',
             'Alters insulin and oral diabetes medication requirements; affects ciclosporin levels.',
             'GI/Bone/Other', ['GI/Bone/Other', 'GH Axis']),

    approved('Leuprolide (Lupron Depot)', 'Reproductive axis',
             'GnRH agonist; after an initial flare it downregulates the pituitary and suppresses sex-hormone production',
             'Prostate cancer; endometriosis; uterine fibroids; central precocious puberty',
             '7.5 mg IM monthly (depot); other depot strengths per prescribing information',
             'Initial testosterone flare; bone-density loss with prolonged use; hot flushes; mood changes',
             'Hormone suppression (labelled indication)',
             'Shuts the reproductive axis down rather than stimulating it; the opposite direction to gonadorelin',
             A_BOTTOM, 'Bone density requires monitoring on extended therapy.',
             2, 'Androgen deprivation is associated with adverse cardiometabolic changes over time; monitor lipids and glucose.',
             'Additive effects with other hormone therapies; may prolong QT; review concurrent QT-prolonging drugs.',
             'Sexual Health', ['Sexual Health']),

    approved('Triptorelin (Trelstar)', 'Reproductive axis',
             'GnRH agonist producing sustained gonadotropin suppression after an initial flare',
             'Advanced prostate cancer; central precocious puberty',
             '3.75 mg IM monthly; longer-acting depots per prescribing information',
             'Initial hormone flare; bone-density loss; hot flushes; injection-site reactions',
             'Hormone suppression (labelled indication)',
             'Same mechanism as leuprolide with a different depot profile',
             A_BOTTOM, 'Bone density requires monitoring on extended therapy.',
             2, 'Androgen deprivation carries recognised cardiometabolic risk over time.',
             'Additive with other hormone therapies; may prolong QT.',
             'Sexual Health', ['Sexual Health']),

    approved('Degarelix (Firmagon)', 'Reproductive axis',
             'GnRH receptor antagonist; suppresses testosterone immediately with no initial flare',
             'Advanced prostate cancer',
             '240 mg SC loading dose, then 80 mg SC every 28 days',
             'Injection-site reactions are common; hot flushes; transaminase elevations',
             'Hormone suppression (labelled indication)',
             'Blocks the receptor directly, avoiding the testosterone surge that agonists cause',
             A_BOTTOM, 'Liver enzymes require periodic monitoring.',
             2, 'Some comparative data suggest fewer cardiovascular events than GnRH agonists in men with existing cardiac disease.',
             'Additive with other hormone therapies; may prolong QT.',
             'Sexual Health', ['Sexual Health', 'Cardio/Vascular']),

    approved('Linaclotide (Linzess)', 'GI',
             'Guanylate cyclase-C agonist; increases intestinal fluid secretion and accelerates transit',
             'Chronic idiopathic constipation; IBS with constipation',
             '72-290 mcg orally once daily depending on indication',
             'Diarrhoea is the most common adverse effect; contraindicated under 2 years of age',
             'Gut motility (labelled indication)',
             'Acts locally in the gut with minimal systemic absorption',
             A_BOTTOM, 'Contraindicated in young children and in known mechanical obstruction.',
             0, 'Minimal systemic absorption; no meaningful cardiovascular signal.',
             'Severe diarrhoea can affect absorption of other oral medicines and electrolyte balance.',
             'GI/Bone/Other', ['GI/Bone/Other']),

    approved('Plecanatide (Trulance)', 'GI',
             'Guanylate cyclase-C agonist structurally close to uroguanylin; increases intestinal fluid secretion',
             'Chronic idiopathic constipation; IBS with constipation',
             '3 mg orally once daily; 6 mg for IBS-C per prescribing information',
             'Diarrhoea; contraindicated under 6 years of age and in known mechanical obstruction',
             'Gut motility (labelled indication)',
             'Same target as linaclotide with pH-dependent activity',
             A_BOTTOM, 'Contraindicated in young children and in known mechanical obstruction.',
             0, 'Minimal systemic absorption; no meaningful cardiovascular signal.',
             'Severe diarrhoea can affect absorption of other oral medicines and electrolyte balance.',
             'GI/Bone/Other', ['GI/Bone/Other']),

    approved('Icatibant (Firazyr)', 'Immune / Inflammatory',
             'Bradykinin B2 receptor antagonist; blocks the mediator driving hereditary angioedema attacks',
             'Acute attacks of hereditary angioedema',
             '30 mg SC as a single dose; may repeat per prescribing information',
             'Injection-site reactions are near-universal; laryngeal attacks still require emergency care',
             'Acute angioedema (labelled indication)',
             'Treats an attack in progress rather than preventing one',
             A_BOTTOM, 'Not a substitute for emergency care in airway involvement.',
             1, 'No adverse cardiovascular signal at labelled use; bradykinin blockade is theoretically relevant to ACE-inhibitor effects.',
             'May reduce the antihypertensive effect of ACE inhibitors; discuss with the prescribing clinician.',
             'Immune/Anti-inf', ['Immune/Anti-inf']),

    approved('Enfuvirtide (Fuzeon)', 'Antiviral',
             'HIV-1 fusion inhibitor; binds gp41 and prevents viral entry into the cell',
             'HIV-1 infection, in combination with other antiretrovirals',
             '90 mg SC twice daily',
             'Injection-site reactions are near-universal; hypersensitivity reactions; increased bacterial pneumonia risk',
             'Antiviral therapy (labelled indication)',
             'A peptide that works mechanically by blocking viral entry rather than by signalling',
             A_BOTTOM, 'Must be used as part of a combination regimen, never alone.',
             1, 'No direct cardiovascular signal attributable to the drug itself.',
             'No significant CYP-mediated interactions; coordinate within the full antiretroviral regimen.',
             'Immune/Anti-inf', ['Immune/Anti-inf']),

    # ── TIER 3 — the 2026 incretin pipeline ───────────────────────────────
    dict(name='Mazdutide (region-specific)', purpose='Metabolic / Weight',
         does='Dual GLP-1 and glucagon receptor agonist; the glucagon arm adds energy expenditure to appetite suppression',
         use='Weight management where approved', dose='Per local prescribing information where approved',
         caution='Approved in China; not FDA-approved. GI effects typical of the incretin class.',
         best='Weight management (medical oversight)',
         effects='Beat semaglutide 1 mg on both weight and glycaemic control in a head-to-head Phase 3 trial',
         evid=B_EVID, bottom='Approved in some jurisdictions; not FDA-reviewed, so US access is via unregulated channels.',
         avoid='Avoid unverified sources; approval does not transfer across jurisdictions.',
         cv=3, cvnotes='Strong metabolic and weight effects imply cardiometabolic benefit, but no dedicated cardiovascular outcomes trial has reported.',
         interact='Delays gastric emptying, which affects absorption of oral medicines; hypoglycaemia risk with insulin or sulfonylureas.',
         goal='Metabolic/Weight', cats=['Metabolic/Weight']),

    research('Survodutide (research)', 'Metabolic / Weight',
             'Dual GLP-1 and glucagon receptor agonist in Phase 3 development',
             'Produced 16.6% weight loss at 76 weeks in Phase 3; also studied in MASH',
             'Metabolic/Weight', 2,
             'Phase 3 weight and liver data are strong, but no cardiovascular outcomes trial has reported and it is not approved anywhere.',
             'Weight management (medical oversight)', ['Metabolic/Weight'],
             use='Investigational — Phase 3'),

    research('CagriSema (research)', 'Metabolic / Weight',
             'Fixed-dose combination of cagrilintide (amylin analog) and semaglutide (GLP-1 agonist)',
             'Combines two established mechanisms; among the most-watched obesity candidates',
             'Metabolic/Weight', 2,
             'Semaglutide has cardiovascular outcomes data on its own; the combination does not yet.',
             'Weight management (medical oversight)', ['Metabolic/Weight'],
             use='Investigational — Phase 3'),

    research('Pemvidutide (research)', 'Metabolic / Weight',
             'GLP-1 and glucagon dual agonist in development for obesity and MASH',
             'Studied for weight loss with a stated emphasis on preserving lean mass',
             'Metabolic/Weight', 1, CV_NO_DATA,
             'Weight management (medical oversight)', ['Metabolic/Weight'],
             use='Investigational'),

    research('Petrelintide (research)', 'Metabolic / Weight',
             'Long-acting amylin analog developed as a monotherapy and as an incretin combination partner',
             'Targets satiety through the amylin pathway rather than GLP-1',
             'Metabolic/Weight', 1, CV_NO_DATA,
             'Weight management (medical oversight)', ['Metabolic/Weight'],
             use='Investigational'),

    research('MariTide (maridebart cafraglutide, research)', 'Metabolic / Weight',
             'GLP-1 receptor agonist and GIP receptor antagonist antibody-peptide conjugate; dosed monthly or less often',
             'Blocks GIP rather than agonising it — the opposite approach to tirzepatide',
             'Metabolic/Weight', 1, CV_NO_DATA,
             'Weight management (medical oversight)', ['Metabolic/Weight'],
             use='Investigational — Phase 3'),

    research('Ecnoglutide (research)', 'Metabolic / Weight',
             'Long-acting GLP-1 receptor agonist engineered for cAMP-biased signalling',
             'Phase 3 weight and glycaemic data reported; regulatory status outside the US varies',
             'Metabolic/Weight', 1, CV_NO_DATA,
             'Weight management (medical oversight)', ['Metabolic/Weight'],
             use='Investigational'),
]

COLUMNS = ['name', 'purpose', 'does', 'use', 'dose', 'caution', 'best', 'effects',
           'evid', 'bottom', 'avoid', 'cv', 'cvnotes', 'interact', 'goal']

wb = openpyxl.load_workbook(XLSX)
master = wb['Master Peptide List']
matrix = wb['Peptide Matrix']

existing = {str(c.value).strip() for c in master['A'] if c.value}
matrix_headers = [c.value for c in matrix[1]]
cats_in_order = matrix_headers[1:]

# Correct a factual error: bremelanotide IS PT-141, not an analog of it.
for cell in master['A']:
    if cell.value and 'PT-141 analog' in str(cell.value):
        old = cell.value
        cell.value = 'Bremelanotide (Vyleesi / PT-141)'
        for mrow in matrix.iter_rows(min_row=2):
            if mrow[0].value == old:
                mrow[0].value = cell.value
        print(f'corrected: {old!r} -> {cell.value!r}')

added = 0
for r in ROWS:
    if r['name'] in existing:
        print(f'skip (already present): {r["name"]}')
        continue
    master.append([r[c] for c in COLUMNS])
    matrix.append([r['name']] + ['✔' if c in r['cats'] else None for c in cats_in_order])
    added += 1

wb.save(XLSX)
print(f'\nadded {added} compounds; master now has {master.max_row - 1} rows')
