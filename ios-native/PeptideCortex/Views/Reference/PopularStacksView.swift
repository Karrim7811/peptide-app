import SwiftUI

struct PopularStacksView: View {
    @State private var searchText = ""

    var filteredStacks: [PopularStack] {
        if searchText.isEmpty { return popularStacks }
        return popularStacks.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.nickname.localizedCaseInsensitiveContains(searchText) ||
            $0.goal.localizedCaseInsensitiveContains(searchText) ||
            $0.peptides.joined().localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                // Search
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.cxStone)
                    TextField("Search stacks...", text: $searchText)
                        .foregroundColor(.black)
                }
                .padding(12)
                .background(Color.white)
                .cornerRadius(12)

                ForEach(filteredStacks) { stack in
                    PopularStackCard(stack: stack)
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct PopularStack: Identifiable {
    let id = UUID()
    let name: String
    let nickname: String
    let goal: String
    let peptides: [String]
    let description: String
    let notes: String
}

private let popularStacks: [PopularStack] = [
    // Named/Famous Stacks
    PopularStack(
        name: "The Wolverine Stack",
        nickname: "Wolverine",
        goal: "Extreme healing, injury recovery, tissue regeneration",
        peptides: ["BPC-157", "TB-500", "GHK-Cu", "Ipamorelin"],
        description: "Named after the X-Men character's regeneration abilities. This is the ultimate healing stack combining BPC-157's angiogenesis and tendon repair, TB-500's cell migration and inflammation reduction, GHK-Cu's tissue remodeling, and Ipamorelin for GH-boosted recovery.",
        notes: "BPC-157 500mcg 2x/day subQ near injury, TB-500 2.5mg 2x/week, GHK-Cu 200mcg/day or topical, Ipamorelin 200mcg before bed. Run 6-8 weeks."
    ),
    PopularStack(
        name: "The VIP Stack",
        nickname: "VIP",
        goal: "Anti-aging, vitality, immune support, longevity",
        peptides: ["Vasoactive Intestinal Peptide (VIP)", "BPC-157", "Thymosin Alpha-1", "Epithalon"],
        description: "The VIP Stack centers on Vasoactive Intestinal Peptide, a powerful neuropeptide that regulates inflammation, protects neurons, and supports circadian rhythm. Combined with BPC-157 for systemic repair, TA-1 for immune optimization, and Epithalon for telomere support.",
        notes: "VIP 50mcg intranasal 1-2x/day, BPC-157 250mcg 2x/day, TA-1 1.5mg 2x/week, Epithalon 5mg/day for 10-20 day cycles."
    ),
    PopularStack(
        name: "The God Stack",
        nickname: "God Stack",
        goal: "Maximum GH release, anti-aging, body recomposition",
        peptides: ["CJC-1295 DAC", "Ipamorelin", "Tesamorelin", "MK-677"],
        description: "The most aggressive GH-optimization stack. CJC-1295 DAC for sustained GHRH, Ipamorelin for clean GH pulses, Tesamorelin for visceral fat targeting, and MK-677 for 24-hour IGF-1 elevation. Often called 'the God stack' for its comprehensive GH pathway coverage.",
        notes: "CJC-1295 DAC 2mg/week, Ipamorelin 300mcg before bed, Tesamorelin 2mg/day, MK-677 10-25mg oral at night. Run 12-16 weeks with bloodwork monitoring."
    ),
    PopularStack(
        name: "The Fountain of Youth",
        nickname: "Fountain of Youth",
        goal: "Comprehensive anti-aging, skin rejuvenation, cellular repair",
        peptides: ["Epithalon", "GHK-Cu", "BPC-157", "Thymosin Beta-4", "NAD+"],
        description: "A multi-pathway anti-aging stack. Epithalon activates telomerase for cellular rejuvenation, GHK-Cu reverses age-related gene expression, BPC-157 provides systemic repair, TB-4 enhances tissue regeneration, and NAD+ restores cellular energy.",
        notes: "Epithalon 5-10mg/day for 10-20 day cycles (2-3x/year), GHK-Cu topical or 200mcg/day, BPC-157 250mcg 2x/day, NAD+ 100-250mg IV or sublingual."
    ),
    PopularStack(
        name: "The Shredder Stack",
        nickname: "Shredder",
        goal: "Aggressive fat loss, metabolic boost, lean muscle preservation",
        peptides: ["Tesamorelin", "AOD-9604", "CJC-1295", "Ipamorelin"],
        description: "Built for cutting. Tesamorelin targets visceral fat specifically, AOD-9604 is the fat-burning fragment of HGH without muscle or blood sugar effects, and CJC-1295/Ipamorelin maintain GH for lean tissue preservation.",
        notes: "Tesamorelin 2mg/day, AOD-9604 300mcg before fasted cardio, CJC-1295 100mcg + Ipamorelin 200mcg before bed. Run 8-12 weeks."
    ),
    PopularStack(
        name: "The Ironman Stack",
        nickname: "Ironman",
        goal: "Endurance, stamina, recovery for athletes",
        peptides: ["TB-500", "BPC-157", "Ipamorelin", "Pentadecapeptide"],
        description: "Designed for endurance athletes. TB-500 and BPC-157 handle joint/tendon maintenance, Ipamorelin optimizes recovery through GH, and the full healing cascade supports the repeated stress of endurance training.",
        notes: "TB-500 2.5mg 2x/week, BPC-157 250mcg 2x/day, Ipamorelin 200-300mcg post-training and before bed."
    ),
    PopularStack(
        name: "The Nootropic Stack",
        nickname: "Brain Stack",
        goal: "Focus, memory, cognitive enhancement, neuroprotection",
        peptides: ["Semax", "Selank", "Dihexa", "P21"],
        description: "The ultimate brain-boosting stack. Semax enhances BDNF for learning and memory, Selank provides anxiolytic clarity, Dihexa is one of the most potent neurotrophic agents discovered (10M times more potent than BDNF), and P21 promotes neurogenesis.",
        notes: "Semax 200-600mcg intranasal 1-2x/day, Selank 250-500mcg intranasal, Dihexa 10-20mg oral, P21 700mcg subQ/day. Semax and Selank daily, Dihexa cycles of 4-6 weeks."
    ),
    PopularStack(
        name: "The GLP-1 Weight Loss Stack",
        nickname: "GLP-1 Stack",
        goal: "Appetite suppression, weight management, metabolic health",
        peptides: ["Semaglutide", "Retatrutide", "Tirzepatide"],
        description: "The most popular weight loss peptides. Semaglutide (Ozempic/Wegovy) is the proven GLP-1 agonist, Retatrutide is the new triple-agonist (GLP-1/GIP/Glucagon), and Tirzepatide (Mounjaro) is the dual GLP-1/GIP. Pick one — don't combine GLP-1 agonists.",
        notes: "Choose ONE: Semaglutide start 0.25mg/week titrate to 2.4mg, Tirzepatide start 2.5mg/week titrate to 15mg, Retatrutide start 1mg/week. Titrate slowly to minimize GI sides."
    ),
    PopularStack(
        name: "The Immune Fortress",
        nickname: "Immune Stack",
        goal: "Immune system optimization, infection recovery",
        peptides: ["Thymosin Alpha-1", "LL-37", "BPC-157", "Thymulin"],
        description: "A comprehensive immune stack. TA-1 modulates T-cell function and is FDA-approved in some countries, LL-37 is a human antimicrobial peptide with direct pathogen-killing ability, BPC-157 supports gut-immune axis, and Thymulin optimizes thymic function.",
        notes: "TA-1 1.5mg 2-3x/week subQ, LL-37 100mcg/day subQ, BPC-157 250mcg 2x/day, Thymulin 1-5mg weekly. Run during illness or 4-6 week preventive cycles."
    ),
    PopularStack(
        name: "The Sleep Master",
        nickname: "Sleep Stack",
        goal: "Deep sleep, overnight recovery, circadian optimization",
        peptides: ["DSIP", "CJC-1295", "Ipamorelin", "Epitalon"],
        description: "DSIP (Delta Sleep-Inducing Peptide) promotes Stage 3/4 deep sleep, CJC-1295 and Ipamorelin amplify the natural overnight GH pulse, and Epithalon helps regulate the pineal gland's melatonin cycle for circadian health.",
        notes: "DSIP 100-200mcg 30min before bed, CJC-1295 100mcg + Ipamorelin 200mcg before bed, Epithalon 5mg/day in 10-20 day cycles."
    ),
    PopularStack(
        name: "The Gut Healer",
        nickname: "Gut Stack",
        goal: "Gut repair, IBS, leaky gut, digestive health",
        peptides: ["BPC-157", "KPV", "Larazotide", "LL-37"],
        description: "BPC-157 is the cornerstone for gut healing with cytoprotective and anti-ulcer effects. KPV is a potent anti-inflammatory tripeptide derived from alpha-MSH, Larazotide tightens intestinal junctions, and LL-37 manages gut microbiome balance.",
        notes: "BPC-157 500mcg oral 2x/day on empty stomach (capsule or sublingual), KPV 200-500mcg oral, Larazotide 0.5-1mg oral before meals, LL-37 100mcg/day."
    ),
    PopularStack(
        name: "The Skin Glow Stack",
        nickname: "Skin Stack",
        goal: "Skin rejuvenation, collagen, hair growth",
        peptides: ["GHK-Cu", "Melanotan II", "BPC-157", "Epithalon"],
        description: "GHK-Cu is the king of skin peptides, promoting collagen, elastin, and glycosaminoglycan synthesis while reversing aging gene expression. Melanotan II provides UV-free tanning, BPC-157 enhances healing, and Epithalon supports cellular renewal.",
        notes: "GHK-Cu topical cream 2x/day or 200mcg subQ, MT-II 250-500mcg 3x/week for loading then 1x/week, BPC-157 250mcg 2x/day."
    ),
    PopularStack(
        name: "The Muscle Builder",
        nickname: "Muscle Stack",
        goal: "Lean mass, strength, hypertrophy",
        peptides: ["CJC-1295", "Ipamorelin", "Follistatin 344", "IGF-1 LR3"],
        description: "Combines GH secretagogues for sustained GH/IGF-1 elevation with Follistatin's myostatin-inhibiting properties and IGF-1 LR3's direct anabolic signaling for maximum muscle growth.",
        notes: "CJC-1295 2mg/week, Ipamorelin 200-300mcg 2-3x/day, Follistatin 100mcg/day for 10-30 days, IGF-1 LR3 20-50mcg post-workout."
    ),
    PopularStack(
        name: "The Joint & Tendon Stack",
        nickname: "Joint Stack",
        goal: "Joint pain, tendinopathy, connective tissue repair",
        peptides: ["BPC-157", "TB-500", "Pentosan Polysulfate", "GHK-Cu"],
        description: "Specifically designed for joint and connective tissue issues. BPC-157 and TB-500 are the core healing duo, Pentosan Polysulfate (used in veterinary medicine for joint disease) supports cartilage, and GHK-Cu enhances collagen remodeling.",
        notes: "BPC-157 250-500mcg subQ near affected joint 2x/day, TB-500 2.5mg 2x/week, PPS per protocol, GHK-Cu topical or 200mcg/day. 6-8 week minimum."
    ),
    PopularStack(
        name: "The Retatrutide Revolution",
        nickname: "Reta Stack",
        goal: "Next-gen weight loss, metabolic reset",
        peptides: ["Retatrutide", "BPC-157"],
        description: "Retatrutide is the most anticipated peptide — the world's first triple agonist (GLP-1/GIP/Glucagon). Phase 2 trials showed up to 24% body weight loss. BPC-157 is added to support gut health and counter any GI side effects.",
        notes: "Retatrutide: start 1mg/week, titrate up by 1mg every 4 weeks. Max studied dose ~12mg/week. BPC-157 250-500mcg oral 2x/day for GI support. Monitor bloodwork."
    ),
    PopularStack(
        name: "The Mold/CIRS Recovery Stack",
        nickname: "CIRS Stack",
        goal: "Biotoxin illness recovery, mold exposure",
        peptides: ["VIP", "BPC-157", "KPV", "Thymosin Alpha-1"],
        description: "Based on the Shoemaker protocol for CIRS (Chronic Inflammatory Response Syndrome). VIP is the final step in the protocol, regulating inflammation cascades. BPC-157 and KPV repair gut damage, TA-1 restores immune regulation.",
        notes: "VIP 50mcg intranasal 4x/day (per Shoemaker protocol), BPC-157 500mcg oral 2x/day, KPV 500mcg oral, TA-1 1.5mg 2x/week. Only after addressing mold exposure."
    ),
    PopularStack(
        name: "The GLOW Stack",
        nickname: "GLOW",
        goal: "Skin rejuvenation, tissue repair, aesthetics, anti-aging",
        peptides: ["GHK-Cu", "BPC-157", "TB-500"],
        description: "The GLOW Stack (also called Wolverine 2.0) combines three powerful repair peptides. GHK-Cu reverses age-related gene expression and boosts collagen/elastin, BPC-157 provides systemic tissue repair, and TB-500 enhances cell migration for full-body healing and radiant skin.",
        notes: "GHK-Cu 1-2mg/day subQ or topical, BPC-157 250-500mcg/day subQ, TB-500 2-5mg twice weekly subQ. Run 8-12 weeks. Available as a pre-mixed 70mg blend."
    ),
    PopularStack(
        name: "The KLOW Stack",
        nickname: "KLOW",
        goal: "Immune modulation, inflammation control, healing, skin",
        peptides: ["KPV", "BPC-157", "TB-500", "GHK-Cu"],
        description: "KLOW takes the GLOW Stack and adds KPV — a potent anti-inflammatory tripeptide derived from alpha-MSH. This shifts the focus from pure tissue repair to systemic immune modulation and deep inflammation control. Sometimes called Wolverine 3.0.",
        notes: "KPV 250-500mcg/day, BPC-157 250mcg 1-2x/day, TB-500 2-2.5mg twice weekly, GHK-Cu 1-2mg/day. Run 8-12 weeks with 4-6 weeks off. Available as pre-mixed 80mg blend."
    ),
    PopularStack(
        name: "The Tri-Heal Stack",
        nickname: "Tri-Heal",
        goal: "Triple-action healing, recovery, immune support",
        peptides: ["TB-500", "BPC-157", "KPV"],
        description: "Tri-Heal combines the healing powerhouse duo of TB-500 and BPC-157 with the anti-inflammatory KPV peptide. Designed for comprehensive tissue repair with strong immune and anti-inflammatory support.",
        notes: "Available as pre-mixed 45mg blend (TB-500 25mg + BPC-157 10mg + KPV 10mg). Typical dose: 300-500mcg combined blend daily subQ. Run 6-8 weeks."
    ),
    PopularStack(
        name: "The Triple GH Release Stack",
        nickname: "Triple GH",
        goal: "Maximum natural GH release, anti-aging",
        peptides: ["Sermorelin", "CJC-1295", "Ipamorelin"],
        description: "Three GH secretagogues working through complementary pathways. Sermorelin provides direct GHRH stimulation, CJC-1295 extends the GH release window, and Ipamorelin adds clean GH pulses without cortisol or prolactin spikes.",
        notes: "100-300mcg each peptide, dosed together at night before bed. Run 12-16 weeks with breaks. Monitor IGF-1 levels."
    ),
    PopularStack(
        name: "The Longevity Stack",
        nickname: "Longevity",
        goal: "Telomere support, cellular repair, healthy aging",
        peptides: ["Epitalon", "CJC-1295", "Ipamorelin", "MOTS-C"],
        description: "Epitalon activates telomerase to protect telomere length, CJC-1295 and Ipamorelin maintain youthful GH levels, and MOTS-C is a mitochondrial-derived peptide that improves metabolic function and insulin sensitivity — key markers of biological aging.",
        notes: "Epitalon 5-10mg/day for 10-20 day cycles (2-3x/year), CJC/Ipamorelin 100-300mcg each at night ongoing, MOTS-C 5-10mg 3x/week."
    ),
    PopularStack(
        name: "The Sexual Health Stack",
        nickname: "Libido Stack",
        goal: "Libido, sexual performance, tanning",
        peptides: ["PT-141", "Melanotan II", "Kisspeptin"],
        description: "PT-141 (Bremelanotide) works on the central nervous system to boost sexual desire in both men and women. Melanotan II provides tanning plus libido effects, and Kisspeptin stimulates GnRH for natural testosterone/hormone support.",
        notes: "PT-141 1-2mg subQ 2-4 hours before activity (max 1x every 72h), MT-II 250-500mcg for tanning/libido, Kisspeptin 10-20mcg for hormonal support."
    ),
    PopularStack(
        name: "The Advanced Body Recomp Stack",
        nickname: "Advanced Recomp",
        goal: "Simultaneous fat loss and muscle gain",
        peptides: ["CJC-1295", "Ipamorelin", "Tesamorelin", "IGF-1 LR3"],
        description: "The most advanced body recomposition stack. CJC-1295 and Ipamorelin for sustained GH release, Tesamorelin specifically targets visceral fat, and IGF-1 LR3 provides direct anabolic signaling for muscle growth — allowing simultaneous fat loss and lean mass gain.",
        notes: "CJC/Ipamorelin 100-300mcg each at night, Tesamorelin 1-2mg in the morning, IGF-1 LR3 20-50mcg post-workout. Run 6-8 weeks max for IGF-1, 8-12 weeks for others."
    ),
]

struct PopularStackCard: View {
    let stack: PopularStack
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            Button(action: { withAnimation { isExpanded.toggle() } }) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 8) {
                            Text(stack.name)
                                .font(.system(size: 17, weight: .bold))
                                .foregroundColor(.cxBlack)
                            if !stack.nickname.isEmpty && stack.nickname != stack.name {
                                Text(stack.nickname)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(.cxTeal)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(Color.cxTeal.opacity(0.1))
                                    .cornerRadius(6)
                            }
                        }
                        Text(stack.goal)
                            .font(.system(size: 13))
                            .foregroundColor(.cxTeal)
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.cxStone)
                        .font(.system(size: 14))
                }
            }
            .buttonStyle(.plain)

            // Peptide chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(stack.peptides, id: \.self) { name in
                        Text(name)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.cxTeal)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.cxTeal.opacity(0.08))
                            .cornerRadius(8)
                    }
                }
            }

            if isExpanded {
                Text(stack.description)
                    .font(.system(size: 14))
                    .foregroundColor(.cxSmoke)
                    .lineSpacing(3)

                Divider()

                VStack(alignment: .leading, spacing: 4) {
                    Text("Dosing Notes")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.cxStone)
                    Text(stack.notes)
                        .font(.system(size: 13))
                        .foregroundColor(.cxBlack)
                        .lineSpacing(2)
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}
