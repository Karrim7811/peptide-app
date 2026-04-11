import Foundation

/// Units the user can choose when entering a dose amount. Shared by the
/// Reconstitution dose calculator and the Bloodwork Reference stack entries.
/// mcg / mg are mass; units are U-100 insulin-syringe units (1 u = 0.01 mL);
/// mL and cc are direct volume inputs (1 cc = 1 mL).
enum DoseUnit: String, CaseIterable, Identifiable {
    case mcg
    case mg
    case units
    case ml
    case cc
    var id: String { rawValue }
    var label: String {
        switch self {
        case .mcg: return "mcg"
        case .mg: return "mg"
        case .units: return "units"
        case .ml: return "mL"
        case .cc: return "cc"
        }
    }
    /// True if this unit describes a volume (mL/cc/units) rather than a mass.
    var isVolume: Bool {
        switch self {
        case .units, .ml, .cc: return true
        case .mcg, .mg: return false
        }
    }
}

@MainActor
class ReconstitutionViewModel: ObservableObject {
    // Manual calc
    @Published var peptideAmountMg = ""
    @Published var bacWaterMl = ""
    /// Raw amount-to-convert value as typed by the user; interpret alongside `doseUnit`.
    @Published var desiredDose = ""
    @Published var doseUnit: DoseUnit = .mcg

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

    /// The user's entered amount normalised to mcg.
    /// - mcg: as-typed
    /// - mg: ×1000
    /// - units (U-100): converted to mL (raw/100) then × concentration
    /// - mL / cc: raw × concentration (they are the same volume)
    var desiredDoseMcg: Double? {
        guard let raw = Double(desiredDose), raw > 0 else { return nil }
        switch doseUnit {
        case .mcg:
            return raw
        case .mg:
            return raw * 1000
        case .units:
            guard let conc = concentrationMcgPerMl else { return nil }
            return (raw / 100) * conc
        case .ml, .cc:
            guard let conc = concentrationMcgPerMl else { return nil }
            return raw * conc
        }
    }

    /// Injection volume in mL required to deliver the desired amount.
    /// Volume-typed inputs (units/mL/cc) can compute volume without needing
    /// concentration at all.
    var volumePerDose: Double? {
        if let raw = Double(desiredDose), raw > 0 {
            switch doseUnit {
            case .units: return raw / 100
            case .ml, .cc: return raw
            case .mcg, .mg: break
            }
        }
        guard let conc = concentrationMcgPerMl, let doseMcg = desiredDoseMcg, conc > 0 else { return nil }
        return doseMcg / conc
    }

    /// Injection volume expressed in U-100 insulin-syringe units.
    var unitsPerDose: Double? {
        guard let vol = volumePerDose else { return nil }
        return vol * 100
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
        desiredDose = ""
        doseUnit = .mcg
        peptideName = ""
        aiResult = nil
        errorMessage = nil
    }
}
