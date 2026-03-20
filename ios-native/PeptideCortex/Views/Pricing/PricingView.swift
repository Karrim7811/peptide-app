import SwiftUI
import StoreKit

struct PricingView: View {
    @EnvironmentObject var storeService: StoreService
    @State private var isPurchasing = false
    @State private var errorMessage: String?

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

                if storeService.isProUser {
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

                // Free features list
                VStack(alignment: .leading, spacing: 10) {
                    Text("FREE")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    let freeFeatures = [
                        "Peptide Bible", "Dosing Calculator", "Reconstitution Calculator",
                        "Injection Sites", "Popular Stacks", "Legal & Regulatory",
                        "Top Vendors", "My Stack", "Dose Log", "Reminders",
                        "Fridge Inventory", "Side Effects", "Research Notes", "Cycle Tracker"
                    ]
                    ForEach(freeFeatures, id: \.self) { feature in
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 14))
                                .foregroundColor(.cxTeal)
                            Text(feature)
                                .font(.system(size: 14))
                                .foregroundColor(.cxBlack)
                        }
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white)
                .cornerRadius(14)

                // Pro features list
                VStack(alignment: .leading, spacing: 10) {
                    Text("PRO")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxTeal)

                    let proFeatures = [
                        ("brain.head.profile", "Cortex AI Chat"),
                        ("arrow.triangle.2.circlepath", "Interaction Checker"),
                        ("square.stack.3d.up", "Stack Finder"),
                        ("heart.text.square", "Bloodwork Analyzer")
                    ]
                    ForEach(proFeatures, id: \.1) { icon, feature in
                        HStack(spacing: 8) {
                            Image(systemName: icon)
                                .font(.system(size: 14))
                                .foregroundColor(.cxTeal)
                                .frame(width: 20)
                            Text(feature)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.cxBlack)
                        }
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.cxTeal.opacity(0.06))
                .cornerRadius(14)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.cxTeal.opacity(0.3), lineWidth: 1)
                )

                if !storeService.isProUser {
                    // Subscription product buttons
                    if storeService.products.isEmpty {
                        ProgressView("Loading plans...")
                            .padding()
                    } else {
                        VStack(spacing: 12) {
                            ForEach(storeService.products, id: \.id) { product in
                                Button {
                                    Task { await purchaseProduct(product) }
                                } label: {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(product.displayName)
                                                .font(.system(size: 16, weight: .semibold))
                                            Text(product.description)
                                                .font(.system(size: 12))
                                                .opacity(0.7)
                                        }
                                        Spacer()
                                        if isPurchasing {
                                            ProgressView()
                                                .progressViewStyle(CircularProgressViewStyle(tint: product.id == "pro_yearly" ? .white : .cxTeal))
                                        } else {
                                            Text(product.displayPrice)
                                                .font(.system(size: 16, weight: .bold))
                                        }
                                    }
                                    .foregroundColor(product.id == "pro_yearly" ? .white : .cxTeal)
                                    .padding(16)
                                    .frame(maxWidth: .infinity)
                                    .background(product.id == "pro_yearly" ? Color.cxTeal : Color.white)
                                    .cornerRadius(14)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(Color.cxTeal, lineWidth: product.id == "pro_yearly" ? 0 : 2)
                                    )
                                }
                                .disabled(isPurchasing)
                            }
                        }
                    }

                    // Error message
                    if let errorMessage {
                        Text(errorMessage)
                            .font(.system(size: 13))
                            .foregroundColor(.red)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.red.opacity(0.08))
                            .cornerRadius(10)
                    }

                    // Restore purchases
                    Button {
                        Task {
                            await storeService.restorePurchases()
                        }
                    } label: {
                        Text("Restore Purchases")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.cxStone)
                    }
                    .padding(.top, 4)
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }

    private func purchaseProduct(_ product: Product) async {
        isPurchasing = true
        errorMessage = nil
        do {
            try await storeService.purchase(product)
        } catch {
            errorMessage = "Purchase failed: \(error.localizedDescription)"
        }
        isPurchasing = false
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
