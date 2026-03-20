import Foundation

@MainActor
class StackFinderViewModel: ObservableObject {
    @Published var peptideName = ""
    @Published var goal = ""
    @Published var result: String?
    @Published var isLoading = false
    @Published var errorMessage: String?

    let goalOptions = [
        "Fat Loss", "Muscle Growth", "Recovery", "Sleep",
        "Anti-Aging", "Cognitive", "Healing", "General Wellness"
    ]

    func findStacks() async {
        guard !peptideName.isEmpty else {
            errorMessage = "Please enter a peptide name"
            return
        }
        isLoading = true
        errorMessage = nil
        result = nil
        do {
            let response = try await APIService.shared.findStacks(
                peptideName: peptideName,
                goal: goal.isEmpty ? nil : goal
            )
            result = response.reply
        } catch let urlError as URLError where urlError.code == .timedOut {
            errorMessage = "Request timed out. The server may be busy -- please try again."
        } catch let urlError as URLError where urlError.code == .notConnectedToInternet {
            errorMessage = "No internet connection. Please check your network."
        } catch let nsError as NSError where nsError.domain == "API" {
            errorMessage = "Server error (status \(nsError.code)). Please try again later."
        } catch {
            errorMessage = "Failed to get recommendations: \(error.localizedDescription)"
        }
        isLoading = false
    }

    func reset() {
        peptideName = ""
        goal = ""
        result = nil
        errorMessage = nil
    }
}
