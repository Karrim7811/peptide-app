import SwiftUI

struct VendorsView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Disclaimer
                HStack(spacing: 8) {
                    Image(systemName: "info.circle.fill")
                        .foregroundColor(.cxTeal)
                    Text("This list is for informational purposes only. Peptide Cortex does not endorse or have affiliations with any vendor. Always verify third-party testing certificates (CoA).")
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                }
                .padding(12)
                .background(Color.cxTeal.opacity(0.05))
                .cornerRadius(12)

                // Evaluation criteria
                VStack(alignment: .leading, spacing: 10) {
                    Text("WHAT TO LOOK FOR")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    VStack(spacing: 8) {
                        CriteriaRow(icon: "checkmark.seal.fill", label: "Third-party testing (HPLC, Mass Spec)", color: .green)
                        CriteriaRow(icon: "doc.text.fill", label: "Certificate of Analysis (CoA) available", color: .green)
                        CriteriaRow(icon: "shippingbox.fill", label: "Proper lyophilization and cold shipping", color: .blue)
                        CriteriaRow(icon: "star.fill", label: "Community reputation and reviews", color: .orange)
                        CriteriaRow(icon: "shield.fill", label: "Transparent lab practices", color: .purple)
                    }
                }
                .padding(16)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)

                ForEach(vendorList) { vendor in
                    VendorCard(vendor: vendor)
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct Vendor: Identifiable {
    let id = UUID()
    let name: String
    let region: String
    let highlights: [String]
    let notes: String
}

private let vendorList: [Vendor] = [
    Vendor(
        name: "Amino Asylum",
        region: "United States",
        highlights: ["Wide product selection", "Competitive pricing", "Regular sales and promotions"],
        notes: "Popular US-based vendor with a broad catalog. Check for third-party CoA availability."
    ),
    Vendor(
        name: "Limitless Life Nootropics",
        region: "United States",
        highlights: ["Third-party tested", "CoA available", "Good community reputation"],
        notes: "Known for quality nootropic peptides. Frequently recommended in peptide communities."
    ),
    Vendor(
        name: "PeptideSciences",
        region: "United States",
        highlights: ["Research-grade purity (98%+)", "HPLC & Mass Spec tested", "Published CoA for each batch"],
        notes: "One of the most established US vendors. Higher price point reflects quality and testing standards."
    ),
    Vendor(
        name: "SwissChems",
        region: "United States / Europe",
        highlights: ["International shipping", "SARMs and peptides", "Batch testing available"],
        notes: "Offers both SARMs and peptides. Ships internationally with discrete packaging."
    ),
    Vendor(
        name: "Cosmic Nootropic",
        region: "Russia / International",
        highlights: ["Pharma-grade products", "Semax & Selank specialists", "Long track record"],
        notes: "Specializes in Russian pharmaceutical peptides. Excellent for Semax, Selank, and Epithalon."
    ),
    Vendor(
        name: "Direct Peptides",
        region: "United Kingdom / Europe",
        highlights: ["EU-based shipping", "Quality testing", "Good for UK/EU customers"],
        notes: "One of the more reputable European vendors. Good option for those in the UK and EU."
    ),
]

struct VendorCard: View {
    let vendor: Vendor

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(vendor.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.cxBlack)
                Spacer()
                Text(vendor.region)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.cxStone)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.cxParchment)
                    .cornerRadius(8)
            }

            ForEach(vendor.highlights, id: \.self) { highlight in
                HStack(spacing: 8) {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.cxTeal)
                    Text(highlight)
                        .font(.system(size: 13))
                        .foregroundColor(.cxBlack)
                }
            }

            Text(vendor.notes)
                .font(.system(size: 13))
                .foregroundColor(.cxStone)
                .lineSpacing(2)
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
    }
}

struct CriteriaRow: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(color)
                .frame(width: 24)
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.cxBlack)
            Spacer()
        }
    }
}
