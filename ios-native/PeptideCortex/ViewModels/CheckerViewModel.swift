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
        } catch let urlError as URLError where urlError.code == .timedOut {
            errorMessage = "Request timed out. The server may be busy -- please try again."
        } catch let urlError as URLError where urlError.code == .notConnectedToInternet {
            errorMessage = "No internet connection. Please check your network."
        } catch let nsError as NSError where nsError.domain == "API" {
            errorMessage = "Server error (status \(nsError.code)). Please try again later."
        } catch {
            errorMessage = "Failed to check interaction: \(error.localizedDescription)"
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
