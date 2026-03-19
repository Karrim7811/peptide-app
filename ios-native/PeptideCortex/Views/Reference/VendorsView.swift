import SwiftUI

struct VendorsView: View {
    @State private var selectedSection = 0

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

                // Section picker
                Picker("", selection: $selectedSection) {
                    Text("US & International").tag(0)
                    Text("Direct from China").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.vertical, 4)

                if selectedSection == 0 {
                    ForEach(usVendorList) { vendor in
                        VendorCard(vendor: vendor)
                    }
                } else {
                    // China vendors disclaimer
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                        Text("Direct China vendors offer lower prices but require more due diligence. Always request CoA, start with small orders, and verify purity before committing to larger purchases.")
                            .font(.system(size: 12))
                            .foregroundColor(.cxSmoke)
                    }
                    .padding(12)
                    .background(Color.orange.opacity(0.08))
                    .cornerRadius(12)

                    ForEach(chinaVendorList) { vendor in
                        VendorCard(vendor: vendor)
                    }
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

private let usVendorList: [Vendor] = [
    Vendor(
        name: "PeptideSciences",
        region: "United States",
        highlights: ["Research-grade purity (98%+)", "HPLC & Mass Spec tested", "Published CoA for each batch"],
        notes: "One of the most established US vendors. Higher price point reflects quality and testing standards."
    ),
    Vendor(
        name: "Limitless Life Nootropics",
        region: "United States",
        highlights: ["Third-party tested", "CoA available", "Good community reputation"],
        notes: "Known for quality nootropic peptides. Frequently recommended in peptide communities."
    ),
    Vendor(
        name: "Amino Asylum",
        region: "United States",
        highlights: ["Wide product selection", "Competitive pricing", "Regular sales and promotions"],
        notes: "Popular US-based vendor with a broad catalog. Check for third-party CoA availability."
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
    Vendor(
        name: "Paradigm Peptides",
        region: "United States",
        highlights: ["US-manufactured", "Third-party tested", "Wide selection"],
        notes: "Solid US vendor with a growing catalog. Provides CoA and third-party testing results."
    ),
    Vendor(
        name: "Blue Sky Peptide",
        region: "United States",
        highlights: ["Competitive pricing", "Established since 2013", "Research chemicals"],
        notes: "Long-standing US vendor. Known for competitive pricing on popular peptides."
    ),
    Vendor(
        name: "Peptide Pros",
        region: "United States",
        highlights: ["USA-made", "Fast shipping", "HPLC tested"],
        notes: "US-based with quick turnaround times. Good for researchers needing fast delivery."
    ),
    Vendor(
        name: "Biotech Peptides",
        region: "United States",
        highlights: ["Lab-tested purity", "Bulk discounts", "Research-grade"],
        notes: "Offers competitive bulk pricing. Good for researchers looking for volume discounts."
    ),
]

private let chinaVendorList: [Vendor] = [
    Vendor(
        name: "QingDao Sigma Chemical",
        region: "China (Qingdao)",
        highlights: ["GMP-certified facility", "Custom synthesis available", "Bulk pricing"],
        notes: "Large-scale manufacturer with GMP certification. Popular for bulk orders with competitive pricing."
    ),
    Vendor(
        name: "Hangzhou Peptide Biochem",
        region: "China (Hangzhou)",
        highlights: ["ISO 9001 certified", "CoA provided", "Custom peptide synthesis"],
        notes: "Established manufacturer specializing in custom peptide synthesis with quality certifications."
    ),
    Vendor(
        name: "Xi'an Geekee Biotech",
        region: "China (Xi'an)",
        highlights: ["Wide catalog", "Competitive pricing", "International shipping"],
        notes: "Known for competitive pricing on popular research peptides. Ships worldwide."
    ),
    Vendor(
        name: "Wuhan Hengheda Pharm",
        region: "China (Wuhan)",
        highlights: ["Pharmaceutical-grade", "API manufacturer", "Large scale production"],
        notes: "Major API manufacturer with pharmaceutical-grade production capabilities."
    ),
    Vendor(
        name: "Hubei Vanz Pharm",
        region: "China (Hubei)",
        highlights: ["GMP facility", "Custom synthesis", "Bulk and retail"],
        notes: "GMP-certified manufacturer offering both bulk and smaller research quantities."
    ),
    Vendor(
        name: "Shenzhen Simeiquan Biological",
        region: "China (Shenzhen)",
        highlights: ["Fast production", "Quality testing", "Export experience"],
        notes: "Experienced exporter with quick turnaround. Provides testing documentation on request."
    ),
    Vendor(
        name: "Wuxi AppTec (Peptide Division)",
        region: "China (Wuxi)",
        highlights: ["World-class facility", "FDA-inspected", "Pharma partnerships"],
        notes: "Major CDMO with peptide manufacturing. Works with global pharma companies. Premium pricing."
    ),
    Vendor(
        name: "GenScript ProBio",
        region: "China (Nanjing)",
        highlights: ["Global reputation", "Custom peptide synthesis", "High purity guaranteed"],
        notes: "Publicly traded biotech company. Trusted globally for custom peptide synthesis and high purity."
    ),
    Vendor(
        name: "Ontores Biotechnologies",
        region: "China (Hangzhou)",
        highlights: ["Peptide specialists", "GMP-compliant", "Research to commercial scale"],
        notes: "Focused exclusively on peptides. Offers research through commercial-scale manufacturing."
    ),
    Vendor(
        name: "China Peptides Co.",
        region: "China (Shanghai)",
        highlights: ["Large catalog", "Bulk discounts", "International logistics"],
        notes: "One of China's largest peptide suppliers. Competitive pricing with established shipping logistics."
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
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.cxStone)
                    .padding(.horizontal, 8)
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
