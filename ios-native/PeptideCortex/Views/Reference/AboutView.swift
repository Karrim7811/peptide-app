import SwiftUI

struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // App Info Card
                VStack(spacing: 16) {
                    // Logo
                    VStack(spacing: 6) {
                        Text("PEPTIDE")
                            .font(.system(size: 11, weight: .medium))
                            .tracking(4)
                            .foregroundColor(.cxStone)
                        HStack(spacing: 0) {
                            Text("CORTE")
                            Text("X").foregroundColor(.cxTeal)
                        }
                        .font(.system(size: 36, weight: .light))
                        .tracking(3)
                        .foregroundColor(.cxBlack)
                        Text("INTELLIGENCE ENGINE")
                            .font(.system(size: 9, weight: .medium))
                            .tracking(3)
                            .foregroundColor(.cxStone)
                    }
                    .padding(.top, 8)

                    Divider()

                    // Version Info
                    VStack(spacing: 8) {
                        AboutInfoRow(label: "Version", value: "1.0.0")
                        AboutInfoRow(label: "Build", value: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—")
                        AboutInfoRow(label: "Platform", value: "iOS \(UIDevice.current.systemVersion)")
                    }
                }
                .padding(20)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.04), radius: 8, y: 2)

                // Company Info
                VStack(alignment: .leading, spacing: 12) {
                    Text("DEVELOPED BY")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Tigris Tech Labs")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.cxBlack)
                        Text("Where Intelligence Begins")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.cxTeal)
                        Text("Building intelligent tools for the peptide research community.")
                            .font(.system(size: 14))
                            .foregroundColor(.cxStone)
                            .lineSpacing(3)
                        Button {
                            if let url = URL(string: "https://tigristechlabs.com") {
                                UIApplication.shared.open(url)
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "globe")
                                    .font(.system(size: 12))
                                Text("tigristechlabs.com")
                                    .font(.system(size: 14, weight: .medium))
                            }
                            .foregroundColor(.cxTeal)
                        }
                        .padding(.top, 2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(20)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.04), radius: 8, y: 2)

                // What's New
                VStack(alignment: .leading, spacing: 12) {
                    Text("WHAT'S NEW IN v1.0")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    VStack(alignment: .leading, spacing: 10) {
                        UpdateItem(icon: "sparkles", text: "Cortex AI — your peptide intelligence assistant")
                        UpdateItem(icon: "shield.fill", text: "Interaction Checker — verify compound safety")
                        UpdateItem(icon: "square.stack.3d.up.fill", text: "Stack Finder — AI-powered recommendations")
                        UpdateItem(icon: "flask.fill", text: "Auto Reconstitution Calculator")
                        UpdateItem(icon: "books.vertical.fill", text: "Peptide Bible — 58+ peptides with full details")
                        UpdateItem(icon: "bell.fill", text: "Dose logging, reminders & inventory tracking")
                        UpdateItem(icon: "newspaper.fill", text: "Peptide news & FDA update feed")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(20)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.04), radius: 8, y: 2)

                // Legal Links
                VStack(spacing: 0) {
                    LegalRow(icon: "lock.shield.fill", label: "Privacy Policy") {
                        if let url = URL(string: "https://www.peptidecortex.com/privacy") {
                            UIApplication.shared.open(url)
                        }
                    }
                    Divider().padding(.horizontal, 16)
                    LegalRow(icon: "doc.text.fill", label: "User Agreement") {
                        if let url = URL(string: "https://www.peptidecortex.com/terms") {
                            UIApplication.shared.open(url)
                        }
                    }
                    Divider().padding(.horizontal, 16)
                    LegalRow(icon: "envelope.fill", label: "Contact Support") {
                        if let url = URL(string: "mailto:support@tigristechlabs.com") {
                            UIApplication.shared.open(url)
                        }
                    }
                }
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.04), radius: 8, y: 2)

                // Disclaimer
                VStack(alignment: .leading, spacing: 8) {
                    Text("DISCLAIMER")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    Text("Peptide Cortex is an educational and informational tool for the research community. It is not intended to provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before using any peptide or supplement. The information provided is for research purposes only.")
                        .font(.system(size: 13))
                        .foregroundColor(.cxStone)
                        .lineSpacing(3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(20)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.04), radius: 8, y: 2)

                // Copyright
                Text("© 2025 Tigris Tech Labs. All rights reserved.")
                    .font(.system(size: 12))
                    .foregroundColor(.cxStone)
                    .padding(.top, 8)
                    .padding(.bottom, 20)
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct AboutInfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.cxStone)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.cxBlack)
        }
    }
}

struct UpdateItem: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(.cxTeal)
                .frame(width: 24)
            Text(text)
                .font(.system(size: 14))
                .foregroundColor(.cxBlack)
            Spacer()
        }
    }
}

struct LegalRow: View {
    let icon: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(.cxTeal)
                    .frame(width: 24)
                Text(label)
                    .font(.system(size: 15))
                    .foregroundColor(.cxBlack)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.cxStone)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }
}
