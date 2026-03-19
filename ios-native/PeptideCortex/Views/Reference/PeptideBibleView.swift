import SwiftUI

struct PeptideBibleView: View {
    @StateObject private var vm = ReferenceViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                SearchBar(text: $vm.searchText, placeholder: "Search 60+ peptides...")

                // Category filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(vm.categories, id: \.self) { cat in
                            Button {
                                vm.selectedCategory = cat
                            } label: {
                                Text(cat)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(vm.selectedCategory == cat ? .white : .cxBlack)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 7)
                                    .background(vm.selectedCategory == cat ? Color.cxTeal : Color.white)
                                    .cornerRadius(18)
                            }
                        }
                    }
                }

                // Results count
                Text("\(vm.filteredPeptides.count) peptides")
                    .font(.system(size: 13))
                    .foregroundColor(.cxStone)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // Peptide list
                LazyVStack(spacing: 10) {
                    ForEach(vm.filteredPeptides) { peptide in
                        PeptideBibleCard(
                            peptide: peptide,
                            isExpanded: vm.expandedId == peptide.id,
                            onToggle: { vm.toggleExpand(peptide) }
                        )
                    }
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct PeptideBibleCard: View {
    let peptide: PeptideKnowledge
    let isExpanded: Bool
    let onToggle: () -> Void

    var cvColor: Color {
        if peptide.cvRating >= 7 { return .green }
        if peptide.cvRating >= 4 { return .orange }
        return .red
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header (always visible)
            Button(action: onToggle) {
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(peptide.name)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.cxBlack)
                        Text(peptide.primaryPurpose)
                            .font(.system(size: 13))
                            .foregroundColor(.cxStone)
                            .lineLimit(1)
                    }
                    Spacer()
                    HStack(spacing: 8) {
                        Text("CV \(peptide.cvRating)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(cvColor)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(cvColor.opacity(0.1))
                            .cornerRadius(6)
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 12))
                            .foregroundColor(.cxStone)
                    }
                }
                .padding(14)
            }

            // Expanded content
            if isExpanded {
                VStack(alignment: .leading, spacing: 12) {
                    Divider()

                    // Categories
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(peptide.goalCategories, id: \.self) { cat in
                                Text(cat)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(.cxTeal)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.cxTeal.opacity(0.08))
                                    .cornerRadius(6)
                            }
                        }
                    }

                    InfoRow(label: "What It Does", value: peptide.whatItDoes)
                    InfoRow(label: "Common Uses", value: peptide.commonUseExamples)
                    InfoRow(label: "Dosage Range", value: peptide.dosageRange)
                    InfoRow(label: "Key Effects", value: peptide.keyEffects)
                    InfoRow(label: "Best For", value: peptide.bestFor)
                    InfoRow(label: "Evidence Level", value: peptide.evidenceLevel)

                    Divider()

                    InfoRow(label: "Risk / Cautions", value: peptide.riskCautions)
                    InfoRow(label: "Avoid If", value: peptide.avoidIf)
                    InfoRow(label: "Drug Interactions", value: peptide.drugInteractions)
                    InfoRow(label: "CV Notes", value: peptide.cvNotes)

                    Divider()

                    InfoRow(label: "Bottom Line", value: peptide.bottomLine)

                    if !peptide.stacksWellWith.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Stacks Well With")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.cxStone)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(peptide.stacksWellWith, id: \.self) { name in
                                        Text(name)
                                            .font(.system(size: 12))
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
                .padding(.horizontal, 14)
                .padding(.bottom, 14)
            }
        }
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}
