import Foundation

@MainActor
class CheckerViewModel: ObservableObject {
    @Published var itemA = ""
    @Published var itemB = ""
    @Published var result: InteractionResult?
    @Published var isLoading = false
    @Published var errorMessage: String?

    var allPeptideNames: [String] {
        PeptideDataStore.shared.allNames
    }

    func checkInteraction() async {
        guard !itemA.isEmpty, !itemB.isEmpty else {
            errorMessage = "Please enter both compounds"
            return
        }
        isLoading = true
        errorMessage = nil
        result = nil
        do {
            result = try await APIService.shared.checkInteraction(itemA: itemA, itemB: itemB)
        } catch {
            errorMessage = "Failed to check interaction. Please try again."
        }
        isLoading = false
    }

    func reset() {
        itemA = ""
        itemB = ""
        result = nil
        errorMessage = nil
    }
}
