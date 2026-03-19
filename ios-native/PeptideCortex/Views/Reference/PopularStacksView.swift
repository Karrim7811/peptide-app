import SwiftUI

struct PopularStacksView: View {
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(popularStacks) { stack in
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
    let goal: String
    let peptides: [String]
    let description: String
    let notes: String
}

private let popularStacks: [PopularStack] = [
    PopularStack(
        name: "Healing & Recovery",
        goal: "Injury repair, tendon/ligament healing",
        peptides: ["BPC-157", "TB-500", "GHK-Cu"],
        description: "The gold standard healing stack. BPC-157 promotes angiogenesis and tendon repair, TB-500 enhances cell migration and reduces inflammation, while GHK-Cu supports tissue remodeling and collagen synthesis.",
        notes: "Run for 4-8 weeks. BPC-157 at 250-500mcg 2x/day, TB-500 at 2.5mg 2x/week, GHK-Cu topical or 200mcg/day subQ."
    ),
    PopularStack(
        name: "Fat Loss & Metabolism",
        goal: "Body recomposition, metabolic optimization",
        peptides: ["Tesamorelin", "Ipamorelin", "CJC-1295 DAC"],
        description: "A powerful GH-releasing stack for fat loss. Tesamorelin specifically targets visceral fat, Ipamorelin provides clean GH release without cortisol or prolactin spikes, and CJC-1295 DAC extends GH elevation.",
        notes: "Best taken before bed on an empty stomach. Run 8-12 week cycles. Tesamorelin 2mg/day, Ipamorelin 200-300mcg, CJC-1295 DAC 2mg/week."
    ),
    PopularStack(
        name: "Muscle Growth",
        goal: "Lean mass, strength gains",
        peptides: ["CJC-1295", "Ipamorelin", "Follistatin 344"],
        description: "Combines GH secretagogues for sustained GH and IGF-1 elevation with Follistatin's myostatin-inhibiting properties for enhanced muscle growth.",
        notes: "CJC-1295 at 2mg/week, Ipamorelin 200-300mcg 2-3x/day, Follistatin 100mcg/day for 10-30 days."
    ),
    PopularStack(
        name: "Anti-Aging & Longevity",
        goal: "Cellular repair, skin health, vitality",
        peptides: ["Epitalon", "GHK-Cu", "BPC-157", "Thymosin Alpha-1"],
        description: "Epitalon activates telomerase for cellular rejuvenation, GHK-Cu reverses gene expression related to aging, BPC-157 provides systemic healing, and Thymosin Alpha-1 optimizes immune function.",
        notes: "Epitalon 5-10mg/day for 10-20 day cycles. GHK-Cu topical or 200mcg/day. TA-1 at 1.5mg 2x/week."
    ),
    PopularStack(
        name: "Sleep & Recovery",
        goal: "Deep sleep, overnight recovery",
        peptides: ["DSIP", "CJC-1295", "Ipamorelin"],
        description: "DSIP (Delta Sleep-Inducing Peptide) promotes deep restorative sleep while CJC-1295 and Ipamorelin maximize the natural overnight GH pulse for enhanced recovery.",
        notes: "Take 30 min before bed. DSIP 100-200mcg, CJC-1295 100mcg, Ipamorelin 200mcg."
    ),
    PopularStack(
        name: "Cognitive Enhancement",
        goal: "Focus, memory, neuroprotection",
        peptides: ["Semax", "Selank", "Dihexa"],
        description: "Semax enhances BDNF and cognitive function, Selank provides anxiolytic effects and mental clarity, and Dihexa is a potent neurotrophic agent that promotes synaptogenesis.",
        notes: "Semax 200-600mcg intranasal, Selank 250-500mcg intranasal, Dihexa 10-20mg oral. Can be used daily."
    ),
    PopularStack(
        name: "Immune Optimization",
        goal: "Immune system support, illness recovery",
        peptides: ["Thymosin Alpha-1", "BPC-157", "LL-37"],
        description: "Thymosin Alpha-1 modulates T-cell function, BPC-157 supports gut immune axis, and LL-37 provides direct antimicrobial and immunomodulatory effects.",
        notes: "TA-1 at 1.5mg 2-3x/week, BPC-157 at 250mcg 2x/day, LL-37 at 100mcg/day subQ."
    ),
    PopularStack(
        name: "Gut Health",
        goal: "Gut repair, IBS, leaky gut",
        peptides: ["BPC-157", "KPV", "Larazotide"],
        description: "BPC-157 is the cornerstone for gut healing with its protective effects on the GI tract. KPV is a potent anti-inflammatory tripeptide, and Larazotide tightens gut junctions.",
        notes: "BPC-157 500mcg oral 2x/day (can also subQ), KPV 200-500mcg oral, Larazotide 0.5-1mg oral before meals."
    ),
]

struct PopularStackCard: View {
    let stack: PopularStack

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(stack.name)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.cxBlack)
                    Text(stack.goal)
                        .font(.system(size: 13))
                        .foregroundColor(.cxTeal)
                }
                Spacer()
            }

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
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}
