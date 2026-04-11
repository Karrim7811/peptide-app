import Foundation

/// One peptide the user is currently taking, as they describe it in the
/// Bloodwork Reference form. All fields are strings so the user can type
/// freely — conversion happens when building the API payload.
struct CurrentStackEntry: Identifiable, Equatable {
    let id: UUID
    var name: String
    /// Total mg in the vial the user actually has (e.g. "5" means a 5 mg vial).
    var vialMg: String
    /// Amount per dose, typed by the user and interpreted alongside `doseUnit`.
    var doseAmount: String
    var doseUnit: DoseUnit
    /// Free-text timing note, e.g. "daily at 8am" or "Mon/Thu morning".
    var schedule: String

    init(
        id: UUID = UUID(),
        name: String = "",
        vialMg: String = "",
        doseAmount: String = "",
        doseUnit: DoseUnit = .mcg,
        schedule: String = ""
    ) {
        self.id = id
        self.name = name
        self.vialMg = vialMg
        self.doseAmount = doseAmount
        self.doseUnit = doseUnit
        self.schedule = schedule
    }

    /// True if the user has typed anything useful into this row.
    var hasContent: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    /// Human-readable description used both for the Cortex prompt and for
    /// the existingSchedule string handed off to Protocol Planner.
    /// Only includes the fields the user actually filled in.
    var promptDescription: String {
        var parts: [String] = []
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { return "" }
        parts.append(trimmedName)

        let vial = vialMg.trimmingCharacters(in: .whitespaces)
        if !vial.isEmpty {
            parts.append("(\(vial) mg vial)")
        }
        let dose = doseAmount.trimmingCharacters(in: .whitespaces)
        if !dose.isEmpty {
            parts.append("— \(dose) \(doseUnit.label) per dose")
        }
        let timing = schedule.trimmingCharacters(in: .whitespaces)
        if !timing.isEmpty {
            parts.append(", \(timing)")
        }
        return parts.joined(separator: " ")
    }
}

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
    /// Structured list of the peptides the user is currently taking — one
    /// row per vial, each with name, vial mg, dose, unit and schedule.
    /// Replaces the old free-text `currentStack` + `currentStackSchedule`.
    @Published var currentStackEntries: [CurrentStackEntry] = []
    @Published var goals = ""

    /// Entries that actually have a peptide name filled in.
    var filledStackEntries: [CurrentStackEntry] {
        currentStackEntries.filter { $0.hasContent }
    }

    func addStackEntry() {
        currentStackEntries.append(CurrentStackEntry())
    }

    func removeStackEntry(id: UUID) {
        currentStackEntries.removeAll { $0.id == id }
    }

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
            // Build structured stack payload from filled entries. Each entry
            // becomes a JSON object the backend uses to write a richer
            // prompt description than a comma-separated list ever could.
            let stackPayload: [[String: Any]] = filledStackEntries.map { entry in
                var obj: [String: Any] = [
                    "name": entry.name.trimmingCharacters(in: .whitespaces)
                ]
                let vial = entry.vialMg.trimmingCharacters(in: .whitespaces)
                if !vial.isEmpty { obj["vialMg"] = vial }
                let dose = entry.doseAmount.trimmingCharacters(in: .whitespaces)
                if !dose.isEmpty {
                    obj["doseAmount"] = dose
                    obj["doseUnit"] = entry.doseUnit.rawValue
                }
                let sched = entry.schedule.trimmingCharacters(in: .whitespaces)
                if !sched.isEmpty { obj["schedule"] = sched }
                return obj
            }

            let result = try await APIService.shared.analyzeBloodwork(
                markers: markers,
                currentStack: stackPayload,
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

        // Encode recommendations as JSON. suggestedVialMg is optional —
        // older results won't have it and that's fine.
        let recsArray: [[String: String]] = recommendations.map { rec in
            var obj: [String: String] = [
                "peptide": rec.peptide,
                "reason": rec.reason,
                "priority": rec.priority
            ]
            if let vial = rec.suggestedVialMg, !vial.isEmpty {
                obj["suggestedVialMg"] = vial
            }
            return obj
        }
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
        currentStackEntries = []
        goals = ""
        analysis = ""
        recommendations = []
        warnings = []
        errorMessage = nil
        hasResults = false
    }
}
