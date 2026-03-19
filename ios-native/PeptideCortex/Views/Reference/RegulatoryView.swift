import SwiftUI

struct RegulatoryView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Disclaimer
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                        Text("Important Disclaimer")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.cxBlack)
                    }
                    Text("Peptide Cortex is an educational and tracking tool. Nothing in this app constitutes medical advice. Always consult a licensed healthcare provider before using any peptide, medication, or supplement. Peptides are sold as \"research chemicals\" in many jurisdictions and may not be approved for human use.")
                        .font(.system(size: 14))
                        .foregroundColor(.cxSmoke)
                        .lineSpacing(3)
                }
                .padding(16)
                .background(Color.orange.opacity(0.05))
                .cornerRadius(16)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.orange.opacity(0.2), lineWidth: 1)
                )

                RegulatorySection(
                    title: "FDA Status (United States)",
                    icon: "flag.fill",
                    items: [
                        "Most peptides are NOT FDA-approved for human use",
                        "Some peptides (e.g., Tesamorelin/Egrifta) have FDA approval for specific conditions",
                        "In 2023, the FDA placed several peptides on the Category 2 list, restricting compounding",
                        "Affected peptides include BPC-157, AOD-9604, and others",
                        "Compounding pharmacies may still compound certain peptides under specific conditions",
                        "Buying peptides as 'research chemicals' is legal but using them for self-administration is a gray area",
                    ]
                )

                RegulatorySection(
                    title: "International Regulations",
                    icon: "globe",
                    items: [
                        "Australia (TGA): Many peptides are Schedule 4 (prescription only). Some are prohibited",
                        "Canada: Peptides are not approved drugs. Sale is largely unregulated for research purposes",
                        "UK (MHRA): Peptides are not licensed medicines. Research chemical status applies",
                        "EU: Varies by country. Generally not approved for human use without clinical trial authorization",
                        "Always check your local laws before purchasing or using peptides",
                    ]
                )

                RegulatorySection(
                    title: "Sports & Anti-Doping",
                    icon: "figure.run",
                    items: [
                        "WADA prohibits all GH-releasing peptides (GHRP-2, GHRP-6, Ipamorelin, etc.)",
                        "BPC-157, TB-500, and other healing peptides are also banned in competition",
                        "IGF-1, MGF, and related growth factors are prohibited at all times",
                        "Peptide use may result in competition bans and sanctions",
                        "If you are a competitive athlete, consult your sport's anti-doping agency",
                    ]
                )

                RegulatorySection(
                    title: "Safety Considerations",
                    icon: "heart.text.square",
                    items: [
                        "Source peptides only from reputable vendors with third-party testing (CoA)",
                        "Use bacteriostatic water for reconstitution, not sterile water",
                        "Store reconstituted peptides refrigerated (2-8C / 36-46F)",
                        "Use proper injection technique with insulin syringes",
                        "Rotate injection sites to prevent lipodystrophy",
                        "Start with conservative doses and titrate up",
                        "Monitor for side effects and discontinue if adverse reactions occur",
                    ]
                )
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct RegulatorySection: View {
    let title: String
    let icon: String
    let items: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(.cxTeal)
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.cxBlack)
            }

            VStack(alignment: .leading, spacing: 8) {
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 8) {
                        Circle()
                            .fill(Color.cxTeal.opacity(0.4))
                            .frame(width: 6, height: 6)
                            .padding(.top, 6)
                        Text(item)
                            .font(.system(size: 14))
                            .foregroundColor(.cxSmoke)
                            .lineSpacing(2)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}
