import SwiftUI

struct AIConsentSheet: View {
    @ObservedObject var consentManager = AIConsentManager.shared
    @State private var checked = false
    @State private var saving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header icon
                    Image(systemName: "lock.shield.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.cxTeal)
                        .padding(.top, 8)

                    VStack(spacing: 8) {
                        Text("AI Data Disclosure")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.cxBlack)

                        Text("Peptide Cortex uses AI features powered by **Anthropic's Claude** to analyze your data and provide personalized insights. Before using these features, please review what data is shared.")
                            .font(.system(size: 14))
                            .foregroundColor(.cxBlack.opacity(0.75))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 8)
                    }

                    // Data shared section
                    VStack(alignment: .leading, spacing: 0) {
                        Text("DATA SHARED WITH ANTHROPIC")
                            .font(.system(size: 11, weight: .bold))
                            .tracking(0.8)
                            .foregroundColor(.cxStone)
                            .padding(.bottom, 8)

                        VStack(spacing: 0) {
                            dataRow(icon: "waveform.path.ecg", text: "Bloodwork markers and lab values")
                            dataRow(icon: "doc.text.fill", text: "Lab report images and PDFs")
                            dataRow(icon: "bubble.left.fill", text: "Chat conversation history")
                            dataRow(icon: "flask.fill", text: "Peptide stack details (names, doses, cycles)")
                            dataRow(icon: "heart.fill", text: "Health goals and profile info (age, weight, sex)")
                            dataRow(icon: "cross.case.fill", text: "Medical conditions and medications")
                            dataRow(icon: "camera.fill", text: "Vial photos for identification", isLast: true)
                        }
                        .background(Color.cxParchment.opacity(0.6))
                        .cornerRadius(12)
                    }

                    // How data is handled
                    VStack(alignment: .leading, spacing: 0) {
                        Text("HOW YOUR DATA IS HANDLED")
                            .font(.system(size: 11, weight: .bold))
                            .tracking(0.8)
                            .foregroundColor(.cxStone)
                            .padding(.bottom, 8)

                        VStack(alignment: .leading, spacing: 6) {
                            bulletPoint("Sent securely via encrypted HTTPS connection")
                            bulletPoint("Anthropic does **not** use API data to train their models")
                            bulletPoint("Data is processed and not permanently stored by Anthropic")
                            bulletPoint("Your data is never sold or shared for advertising")
                        }
                        .padding(14)
                        .background(Color.cxParchment.opacity(0.6))
                        .cornerRadius(12)
                    }

                    // Links
                    VStack(alignment: .leading, spacing: 6) {
                        Link(destination: URL(string: "\(AppConstants.apiBaseURL)/privacy")!) {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.up.right.square")
                                    .font(.system(size: 12))
                                Text("Read our Privacy Policy")
                                    .font(.system(size: 13))
                            }
                            .foregroundColor(.cxTeal)
                        }

                        Link(destination: URL(string: "https://www.anthropic.com/privacy")!) {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.up.right.square")
                                    .font(.system(size: 12))
                                Text("Read Anthropic's Privacy Policy")
                                    .font(.system(size: 13))
                            }
                            .foregroundColor(.cxTeal)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    // Error message
                    if let error = errorMessage {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundColor(.red)
                            .padding(12)
                            .frame(maxWidth: .infinity)
                            .background(Color.red.opacity(0.08))
                            .cornerRadius(8)
                    }

                    // Checkbox
                    Button {
                        checked.toggle()
                    } label: {
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: checked ? "checkmark.square.fill" : "square")
                                .font(.system(size: 20))
                                .foregroundColor(checked ? .cxTeal : .cxStone)

                            Text("I understand and consent to sharing my data with Anthropic for AI-powered features")
                                .font(.system(size: 13))
                                .foregroundColor(.cxBlack.opacity(0.75))
                                .multilineTextAlignment(.leading)
                        }
                    }
                    .buttonStyle(.plain)

                    // Continue button
                    Button {
                        Task { await handleAccept() }
                    } label: {
                        Text(saving ? "Saving..." : "Continue")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(checked ? Color.cxTeal : Color.cxStone)
                            .cornerRadius(14)
                    }
                    .disabled(!checked || saving)

                    // Decline button
                    Button {
                        consentManager.declineConsent()
                    } label: {
                        Text("Decline — I'll skip AI features")
                            .font(.system(size: 14))
                            .foregroundColor(.cxStone)
                    }
                    .disabled(saving)
                    .padding(.bottom, 16)
                }
                .padding(.horizontal, 24)
            }
            .background(Color.white)
            .navigationBarTitleDisplayMode(.inline)
            .interactiveDismissDisabled()
        }
    }

    // MARK: - Helpers

    private func dataRow(icon: String, text: String, isLast: Bool = false) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(.cxTeal)
                .frame(width: 20)

            Text(text)
                .font(.system(size: 14))
                .foregroundColor(.cxBlack.opacity(0.75))

            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .overlay(alignment: .bottom) {
            if !isLast {
                Divider().padding(.leading, 46)
            }
        }
    }

    private func bulletPoint(_ text: LocalizedStringKey) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•")
                .font(.system(size: 13))
                .foregroundColor(.cxStone)
            Text(text)
                .font(.system(size: 13))
                .foregroundColor(.cxBlack.opacity(0.75))
        }
    }

    private func handleAccept() async {
        guard checked, !saving else { return }
        saving = true
        errorMessage = nil
        await consentManager.acceptConsent()
        saving = false
    }
}
