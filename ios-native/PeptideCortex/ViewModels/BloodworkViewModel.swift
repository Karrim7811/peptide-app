import Foundation

@MainActor
class BloodworkViewModel: ObservableObject {
    // MARK: - Marker Inputs (strings so user can type freely)
    @Published var testosterone = ""
    @Published var freeTestosterone = ""
    @Published var igf1 = ""
    @Published var estradiol = ""
    @Published var tsh = ""
    @Published var t3Free = ""
    @Published var t4Free = ""
    @Published var fastingGlucose = ""
    @Published var hba1c = ""
    @Published var totalCholesterol = ""
    @Published var ldl = ""
    @Published var hdl = ""
    @Published var triglycerides = ""
    @Published var alt = ""
    @Published var ast = ""
    @Published var gfr = ""
    @Published var creatinine = ""
    @Published var crp = ""
    @Published var vitaminD = ""
    @Published var b12 = ""
    @Published var ironFerritin = ""
    @Published var wbc = ""
    @Published var rbc = ""
    @Published var hemoglobin = ""
    @Published var hematocrit = ""

    // MARK: - Context
    @Published var currentStack = ""
    @Published var goals = ""

    // MARK: - Results
    @Published var analysis = ""
    @Published var recommendations: [BloodworkRecommendation] = []
    @Published var warnings: [String] = []

    // MARK: - State
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var hasResults = false

    // All marker definitions for building the request
    private var markerDefinitions: [(label: String, unit: String, keyPath: KeyPath<BloodworkViewModel, String>)] {
        [
            ("Testosterone", "ng/dL", \.testosterone),
            ("Free Testosterone", "pg/mL", \.freeTestosterone),
            ("IGF-1", "ng/mL", \.igf1),
            ("Estradiol", "pg/mL", \.estradiol),
            ("TSH", "mIU/L", \.tsh),
            ("T3 Free", "pg/mL", \.t3Free),
            ("T4 Free", "ng/dL", \.t4Free),
            ("Fasting Glucose", "mg/dL", \.fastingGlucose),
            ("HbA1c", "%", \.hba1c),
            ("Total Cholesterol", "mg/dL", \.totalCholesterol),
            ("LDL", "mg/dL", \.ldl),
            ("HDL", "mg/dL", \.hdl),
            ("Triglycerides", "mg/dL", \.triglycerides),
            ("ALT", "U/L", \.alt),
            ("AST", "U/L", \.ast),
            ("GFR", "mL/min", \.gfr),
            ("Creatinine", "mg/dL", \.creatinine),
            ("CRP", "mg/L", \.crp),
            ("Vitamin D", "ng/mL", \.vitaminD),
            ("B12", "pg/mL", \.b12),
            ("Iron/Ferritin", "ng/mL", \.ironFerritin),
            ("WBC", "K/uL", \.wbc),
            ("RBC", "M/uL", \.rbc),
            ("Hemoglobin", "g/dL", \.hemoglobin),
            ("Hematocrit", "%", \.hematocrit),
        ]
    }

    var filledMarkerCount: Int {
        markerDefinitions.filter { !self[keyPath: $0.keyPath].trimmingCharacters(in: .whitespaces).isEmpty }.count
    }

    func analyze() async {
        // Build markers array from non-empty fields
        var markers: [[String: Any]] = []
        for def in markerDefinitions {
            let value = self[keyPath: def.keyPath].trimmingCharacters(in: .whitespaces)
            guard !value.isEmpty, let numValue = Double(value) else { continue }
            markers.append([
                "name": def.label,
                "value": numValue,
                "unit": def.unit
            ])
        }

        guard !markers.isEmpty else {
            errorMessage = "Please enter at least one bloodwork marker."
            return
        }

        isLoading = true
        errorMessage = nil
        hasResults = false

        do {
            let stackArray = currentStack
                .split(separator: ",")
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty }

            let result = try await APIService.shared.analyzeBloodwork(
                markers: markers,
                currentStack: stackArray,
                goals: goals
            )

            analysis = result.analysis
            recommendations = result.recommendations
            warnings = result.warnings
            hasResults = true

            // Save results to database
            await saveResults()
        } catch let urlError as URLError where urlError.code == .timedOut {
            errorMessage = "Request timed out. The server may be busy -- please try again."
        } catch let urlError as URLError where urlError.code == .notConnectedToInternet {
            errorMessage = "No internet connection. Please check your network."
        } catch let nsError as NSError where nsError.domain == "API" {
            errorMessage = "Server error (status \(nsError.code)). Please try again later."
        } catch {
            errorMessage = "Failed to analyze bloodwork: \(error.localizedDescription)"
        }

        isLoading = false
    }

    // MARK: - History
    @Published var savedResults: [BloodworkResult] = []

    @Published var isScanning = false
    @Published var scanMessage: String?

    func processImage(imageData: Data, mimeType: String) async {
        isScanning = true
        scanMessage = "AI is reading your bloodwork..."
        errorMessage = nil

        do {
            let base64 = imageData.base64EncodedString()
            let markers = try await APIService.shared.ocrBloodwork(imageBase64: base64, mimeType: mimeType)
            applyMarkers(markers)
            scanMessage = "Found \(markers.count) markers! Review and tap Analyze."
        } catch {
            errorMessage = "Could not read bloodwork: \(error.localizedDescription)"
            scanMessage = nil
        }

        isScanning = false
    }

    private func applyMarkers(_ markers: [String: Double]) {
        for (key, value) in markers {
            let str = value.truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", value) : String(format: "%.2f", value)
            switch key {
            case "testosterone": testosterone = str
            case "freeTestosterone": freeTestosterone = str
            case "igf1": igf1 = str
            case "estradiol": estradiol = str
            case "tsh": tsh = str
            case "t3Free": t3Free = str
            case "t4Free": t4Free = str
            case "fastingGlucose": fastingGlucose = str
            case "hba1c": hba1c = str
            case "totalCholesterol": totalCholesterol = str
            case "ldl": ldl = str
            case "hdl": hdl = str
            case "triglycerides": triglycerides = str
            case "alt": alt = str
            case "ast": ast = str
            case "gfr": gfr = str
            case "creatinine": creatinine = str
            case "crp": crp = str
            case "vitaminD": vitaminD = str
            case "b12": b12 = str
            case "ironFerritin": ironFerritin = str
            case "wbc": wbc = str
            case "rbc": rbc = str
            case "hemoglobin": hemoglobin = str
            case "hematocrit": hematocrit = str
            default: break
            }
        }
    }

    private func saveResults() async {
        guard let userId = SupabaseService.shared.currentUserId else { return }

        // Encode markers as JSON
        var markersDict: [String: Double] = [:]
        for def in markerDefinitions {
            let value = self[keyPath: def.keyPath].trimmingCharacters(in: .whitespaces)
            if let num = Double(value) { markersDict[def.label] = num }
        }
        let markersJson = (try? JSONSerialization.data(withJSONObject: markersDict))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"

        // Encode recommendations as JSON
        let recsArray = recommendations.map { ["peptide": $0.peptide, "reason": $0.reason, "priority": $0.priority] }
        let recsJson = (try? JSONSerialization.data(withJSONObject: recsArray))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "[]"

        let warningsJson = (try? JSONSerialization.data(withJSONObject: warnings))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "[]"

        let result = BloodworkResult(
            id: UUID(), userId: userId,
            markers: markersJson,
            analysis: analysis,
            recommendations: recsJson,
            warnings: warningsJson,
            createdAt: nil
        )
        do {
            try await SupabaseService.shared.insertBloodworkResult(result)
        } catch {
            print("Save bloodwork error: \(error)")
            errorMessage = "Results analyzed but failed to save: \(error.localizedDescription)"
        }
    }

    func loadHistory() async {
        do {
            savedResults = try await SupabaseService.shared.getBloodworkResults()
        } catch {
            print("Load bloodwork history error: \(error)")
        }
    }

    func reset() {
        testosterone = ""
        freeTestosterone = ""
        igf1 = ""
        estradiol = ""
        tsh = ""
        t3Free = ""
        t4Free = ""
        fastingGlucose = ""
        hba1c = ""
        totalCholesterol = ""
        ldl = ""
        hdl = ""
        triglycerides = ""
        alt = ""
        ast = ""
        gfr = ""
        creatinine = ""
        crp = ""
        vitaminD = ""
        b12 = ""
        ironFerritin = ""
        wbc = ""
        rbc = ""
        hemoglobin = ""
        hematocrit = ""
        currentStack = ""
        goals = ""
        analysis = ""
        recommendations = []
        warnings = []
        errorMessage = nil
        hasResults = false
    }
}
