import Foundation

@MainActor
class ReferenceViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var selectedCategory = "All"
    @Published var expandedId: String?

    var categories: [String] {
        ["All"] + PeptideDataStore.shared.allCategories
    }

    var filteredPeptides: [PeptideKnowledge] {
        var results = PeptideDataStore.shared.search(searchText)
        if selectedCategory != "All" {
            results = results.filter { $0.goalCategories.contains(selectedCategory) }
        }
        return results
    }

    func toggleExpand(_ peptide: PeptideKnowledge) {
        if expandedId == peptide.id {
            expandedId = nil
        } else {
            expandedId = peptide.id
        }
    }
}
