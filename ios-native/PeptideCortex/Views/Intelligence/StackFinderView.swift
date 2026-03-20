import SwiftUI

struct StackFinderView: View {
    @StateObject private var vm = StackFinderViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Get AI-powered stack recommendations based on a peptide and your goals")
                        .font(.system(size: 14))
                        .foregroundColor(.cxStone)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Peptide name
                PeptideAutocompleteField(
                    label: "Peptide",
                    placeholder: "e.g. BPC-157",
                    text: $vm.peptideName
                )

                // Goal picker
                VStack(alignment: .leading, spacing: 6) {
                    Text("Goal (optional)")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.cxStone)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(vm.goalOptions, id: \.self) { goal in
                                Button {
                                    vm.goal = vm.goal == goal ? "" : goal
                                } label: {
                                    Text(goal)
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(vm.goal == goal ? .white : .cxBlack)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(vm.goal == goal ? Color.cxTeal : Color.white)
                                        .cornerRadius(20)
                                }
                            }
                        }
                    }
                }

                // Find button
                Button {
                    Task { await vm.findStacks() }
                } label: {
                    HStack {
                        if vm.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        }
                        Text(vm.isLoading ? "Finding..." : "Find Stacks")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.cxTeal)
                    .cornerRadius(12)
                }
                .disabled(vm.isLoading)

                if let error = vm.errorMessage {
                    Text(error)
                        .font(.system(size: 14))
                        .foregroundColor(.red)
                }

                if let result = vm.result {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Recommendations")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.cxBlack)
                        Text(result)
                            .font(.system(size: 14))
                            .foregroundColor(.cxSmoke)
                            .lineSpacing(4)
                    }
                    .padding(16)
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}
