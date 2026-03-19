import SwiftUI

struct CheckerView: View {
    @StateObject private var vm = CheckerViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Check if two compounds can be safely combined")
                        .font(.system(size: 14))
                        .foregroundColor(.cxStone)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Compound A
                VStack(alignment: .leading, spacing: 6) {
                    Text("Compound A")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.cxStone)
                    TextField("e.g. BPC-157", text: $vm.itemA)
                        .font(.system(size: 15))
                        .padding(12)
                        .background(Color.white)
                        .cornerRadius(10)
                }

                // Compound B
                VStack(alignment: .leading, spacing: 6) {
                    Text("Compound B")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.cxStone)
                    TextField("e.g. TB-500", text: $vm.itemB)
                        .font(.system(size: 15))
                        .padding(12)
                        .background(Color.white)
                        .cornerRadius(10)
                }

                // Check button
                Button {
                    Task { await vm.checkInteraction() }
                } label: {
                    HStack {
                        if vm.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        }
                        Text(vm.isLoading ? "Checking..." : "Check Interaction")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.cxTeal)
                    .cornerRadius(12)
                }
                .disabled(vm.isLoading)

                // Error
                if let error = vm.errorMessage {
                    Text(error)
                        .font(.system(size: 14))
                        .foregroundColor(.red)
                }

                // Result
                if let result = vm.result {
                    InteractionResultCard(result: result)
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct InteractionResultCard: View {
    let result: InteractionResult

    var levelColor: Color {
        switch result.level.lowercased() {
        case "safe": return .green
        case "caution": return .orange
        case "danger": return .red
        default: return .gray
        }
    }

    var levelIcon: String {
        switch result.level.lowercased() {
        case "safe": return "checkmark.shield.fill"
        case "caution": return "exclamationmark.triangle.fill"
        case "danger": return "xmark.shield.fill"
        default: return "questionmark.circle.fill"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Level badge
            HStack(spacing: 8) {
                Image(systemName: levelIcon)
                    .font(.system(size: 20))
                    .foregroundColor(levelColor)
                Text(result.level.uppercased())
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(levelColor)
                Spacer()
            }
            .padding(12)
            .background(levelColor.opacity(0.1))
            .cornerRadius(10)

            // Summary
            Text(result.summary)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(.cxBlack)

            // Details
            if !result.details.isEmpty {
                Text(result.details)
                    .font(.system(size: 14))
                    .foregroundColor(.cxSmoke)
            }

            // Recommendations
            if !result.recommendations.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Recommendations")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.cxStone)
                    ForEach(result.recommendations, id: \.self) { rec in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "arrow.right.circle.fill")
                                .font(.system(size: 12))
                                .foregroundColor(.cxTeal)
                                .padding(.top, 2)
                            Text(rec)
                                .font(.system(size: 14))
                                .foregroundColor(.cxBlack)
                        }
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
