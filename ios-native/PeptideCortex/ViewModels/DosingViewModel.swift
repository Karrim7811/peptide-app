import Foundation

@MainActor
class DosingViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var selectedPeptide: PeptideKnowledge?

    var searchResults: [PeptideKnowledge] {
        PeptideDataStore.shared.search(searchText)
    }

    func selectPeptide(_ peptide: PeptideKnowledge) {
        selectedPeptide = peptide
        searchText = peptide.name
    }

    func clear() {
        searchText = ""
        selectedPeptide = nil
    }
}
