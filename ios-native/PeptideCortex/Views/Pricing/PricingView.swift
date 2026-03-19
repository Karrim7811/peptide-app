import SwiftUI

struct PricingView: View {
    @EnvironmentObject var appState: AppState
    @State private var isLoading = false

    var isPro: Bool {
        appState.profile?.isPro ?? false
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Text("Upgrade to Pro")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.cxBlack)
                    Text("Unlock the full power of Peptide Cortex")
                        .font(.system(size: 15))
                        .foregroundColor(.cxStone)
                }
                .padding(.top, 8)

                if isPro {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(.cxTeal)
                        Text("You are a Pro member!")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.cxTeal)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .background(Color.cxTeal.opacity(0.08))
                    .cornerRadius(12)
                }

                // Comparison
                HStack(alignment: .top, spacing: 12) {
                    // Free tier
                    PricingTierCard(
                        tier: "Free",
                        price: "$0",
                        period: "forever",
                        features: [
                            PricingFeature(name: "Stack items", value: "5", included: true),
                            PricingFeature(name: "Interaction checks", value: "3/day", included: true),
                            PricingFeature(name: "Reminders", value: "3", included: true),
                            PricingFeature(name: "Dose logging", value: "Unlimited", included: true),
                            PricingFeature(name: "Peptide Bible", value: "Full", included: true),
                            PricingFeature(name: "AI Chat", value: "", included: false),
                            PricingFeature(name: "Stack Finder", value: "", included: false),
                            PricingFeature(name: "Reconstitution AI", value: "", included: false),
                        ],
                        isFeatured: false
                    )

                    // Pro tier
                    PricingTierCard(
                        tier: "Pro",
                        price: "$9.99",
                        period: "/month",
                        features: [
                            PricingFeature(name: "Stack items", value: "Unlimited", included: true),
                            PricingFeature(name: "Interaction checks", value: "Unlimited", included: true),
                            PricingFeature(name: "Reminders", value: "Unlimited", included: true),
                            PricingFeature(name: "Dose logging", value: "Unlimited", included: true),
                            PricingFeature(name: "Peptide Bible", value: "Full", included: true),
                            PricingFeature(name: "AI Chat", value: "Unlimited", included: true),
                            PricingFeature(name: "Stack Finder", value: "Full", included: true),
                            PricingFeature(name: "Reconstitution AI", value: "Full", included: true),
                        ],
                        isFeatured: true
                    )
                }

                if !isPro {
                    // Monthly button
                    Button {
                        Task { await subscribe(plan: "monthly") }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            }
                            Text("Subscribe Monthly - $9.99/mo")
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.cxTeal)
                        .cornerRadius(14)
                    }
                    .disabled(isLoading)

                    // Lifetime button
                    Button {
                        Task { await subscribe(plan: "lifetime") }
                    } label: {
                        HStack {
                            Text("Lifetime Access - $79.99")
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .foregroundColor(.cxTeal)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.white)
                        .cornerRadius(14)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Color.cxTeal, lineWidth: 2)
                        )
                    }
                    .disabled(isLoading)
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }

    func subscribe(plan: String) async {
        isLoading = true
        do {
            let urlString = try await APIService.shared.createCheckout(plan: plan)
            if let url = URL(string: urlString) {
                await MainActor.run {
                    UIApplication.shared.open(url)
                }
            }
        } catch {
            print("Checkout error: \(error)")
        }
        isLoading = false
    }
}

struct PricingFeature: Identifiable {
    let id = UUID()
    let name: String
    let value: String
    let included: Bool
}

struct PricingTierCard: View {
    let tier: String
    let price: String
    let period: String
    let features: [PricingFeature]
    let isFeatured: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(tier)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(isFeatured ? .cxTeal : .cxStone)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(price)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.cxBlack)
                    Text(period)
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                }
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                ForEach(features) { feature in
                    HStack(spacing: 6) {
                        Image(systemName: feature.included ? "checkmark.circle.fill" : "xmark.circle")
                            .font(.system(size: 13))
                            .foregroundColor(feature.included ? .cxTeal : .cxStone.opacity(0.4))
                        VStack(alignment: .leading, spacing: 0) {
                            Text(feature.name)
                                .font(.system(size: 12))
                                .foregroundColor(feature.included ? .cxBlack : .cxStone.opacity(0.5))
                            if !feature.value.isEmpty {
                                Text(feature.value)
                                    .font(.system(size: 11))
                                    .foregroundColor(.cxStone)
                            }
                        }
                    }
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(isFeatured ? Color.cxTeal : Color.clear, lineWidth: 2)
        )
    }
}
