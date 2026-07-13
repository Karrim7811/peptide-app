import SwiftUI

/// Persistent educational-only disclaimer shown above any surface that displays
/// dosing, reconstitution, or AI-generated guidance.
///
/// App Store guideline 1.4.1 (medical advice) / 1.4.2 (dose calculators) posture:
/// every screen that could read as personalized medical/dosing guidance must
/// carry this banner. Do not remove without a compliance review.
struct DisclaimerBanner: View {
    var text: String = "For research and educational reference only. Not medical advice or dosing instructions for human or animal use. Consult a licensed physician before any medical decision."

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 12))
                .foregroundColor(.orange)
                .padding(.top, 1)
            Text(text)
                .font(.system(size: 11))
                .foregroundColor(.cxSmoke)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.orange.opacity(0.06))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.2), lineWidth: 1)
        )
    }
}
