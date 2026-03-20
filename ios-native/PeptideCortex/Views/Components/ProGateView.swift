import SwiftUI

struct ProGateView: View {
    let featureName: String
    @EnvironmentObject var storeService: StoreService
    @State private var showPricing = false

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "lock.fill")
                .font(.system(size: 48))
                .foregroundColor(.cxStone.opacity(0.5))

            VStack(spacing: 8) {
                Text(featureName)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.cxBlack)

                Text("This is a Pro feature. Upgrade to unlock full access.")
                    .font(.system(size: 15))
                    .foregroundColor(.cxStone)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Button {
                showPricing = true
            } label: {
                Text("Upgrade to Pro")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.cxTeal)
                    .cornerRadius(14)
            }
            .padding(.horizontal, 40)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.cxParchment)
        .sheet(isPresented: $showPricing) {
            NavigationView {
                PricingView()
                    .environmentObject(storeService)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Done") { showPricing = false }
                                .foregroundColor(.cxTeal)
                        }
                    }
            }
        }
    }
}
