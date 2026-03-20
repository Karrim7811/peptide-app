import Foundation

@MainActor
class ReconstitutionViewModel: ObservableObject {
    // Manual calc
    @Published var peptideAmountMg = ""
    @Published var bacWaterMl = ""
    @Published var desiredDoseMcg = ""

    // AI recommendation
    @Published var peptideName = ""
    @Published var aiResult: ReconstitutionResult?
    @Published var isLoading = false
    @Published var errorMessage: String?

    // Manual calc results
    var concentrationMcgPerMl: Double? {
        guard let mg = Double(peptideAmountMg), let ml = Double(bacWaterMl), ml > 0 else { return nil }
        return (mg * 1000) / ml
    }

    var volumePerDose: Double? {
        guard let conc = concentrationMcgPerMl, let dose = Double(desiredDoseMcg), conc > 0 else { return nil }
        return dose / conc
    }

    var dosesPerVial: Int? {
        guard let ml = Double(bacWaterMl), let vol = volumePerDose, vol > 0 else { return nil }
        return Int(ml / vol)
    }

    func getAIRecommendation() async {
        guard !peptideName.isEmpty, let mg = Double(peptideAmountMg), mg > 0 else {
            errorMessage = "Enter peptide name and amount"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            aiResult = try await APIService.shared.getReconstitution(peptideName: peptideName, amountMg: mg)
        } catch let urlError as URLError where urlError.code == .timedOut {
            errorMessage = "Request timed out. The server may be busy -- please try again."
        } catch let urlError as URLError where urlError.code == .notConnectedToInternet {
            errorMessage = "No internet connection. Please check your network."
        } catch let nsError as NSError where nsError.domain == "API" {
            errorMessage = "Server error (status \(nsError.code)). Please try again later."
        } catch {
            errorMessage = "Failed to get AI recommendation: \(error.localizedDescription)"
        }
        isLoading = false
    }

    func reset() {
        peptideAmountMg = ""
        bacWaterMl = ""
        desiredDoseMcg = ""
        peptideName = ""
        aiResult = nil
        errorMessage = nil
    }
}
