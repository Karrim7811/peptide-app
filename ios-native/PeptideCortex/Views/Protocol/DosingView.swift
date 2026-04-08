import SwiftUI

struct DosingView: View {
    @StateObject private var vm = DosingViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                SearchBar(text: $vm.searchText, placeholder: "Search peptide for dosing info...")

                if let peptide = vm.selectedPeptide {
                    DosingDetailCard(peptide: peptide)
                } else if !vm.searchText.isEmpty {
                    LazyVStack(spacing: 8) {
                        ForEach(vm.searchResults) { peptide in
                            Button {
                                vm.selectPeptide(peptide)
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(peptide.name)
                                            .font(.system(size: 15, weight: .medium))
                                            .foregroundColor(.cxBlack)
                                        Text(peptide.primaryPurpose)
                                            .font(.system(size: 13))
                                            .foregroundColor(.cxStone)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12))
                                        .foregroundColor(.cxStone)
                                }
                                .padding(14)
                                .background(Color.white)
                                .cornerRadius(12)
                            }
                        }
                    }
                } else {
                    EmptyStateView(
                        icon: "function",
                        title: "Dosing Reference",
                        message: "Search for a peptide to see detailed dosing information"
                    )
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct DosingDetailCard: View {
    let peptide: PeptideKnowledge

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Text(peptide.name)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.cxBlack)
                Spacer()
                Text("CV: \(peptide.cvRating)/10")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(peptide.cvRating >= 7 ? .green : peptide.cvRating >= 4 ? .orange : .red)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.white)
                    .cornerRadius(8)
            }

            InfoRow(label: "Primary Purpose", value: peptide.primaryPurpose)
            InfoRow(label: "Dosage Range", value: peptide.dosageRange)
            InfoRow(label: "Key Effects", value: peptide.keyEffects)
            InfoRow(label: "Best For", value: peptide.bestFor)
            InfoRow(label: "Evidence Level", value: peptide.evidenceLevel)

            Divider()

            InfoRow(label: "Risk / Cautions", value: peptide.riskCautions)
            InfoRow(label: "Avoid If", value: peptide.avoidIf)
            InfoRow(label: "Drug Interactions", value: peptide.drugInteractions)

            Divider()

            InfoRow(label: "Bottom Line", value: peptide.bottomLine)

            if !peptide.stacksWellWith.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Stacks Well With")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.cxStone)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(peptide.stacksWellWith, id: \.self) { name in
                                Text(name)
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxTeal)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Color.cxTeal.opacity(0.1))
                                    .cornerRadius(8)
                            }
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

struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.cxStone)
            Text(value)
                .font(.system(size: 14))
                .foregroundColor(.cxBlack)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
