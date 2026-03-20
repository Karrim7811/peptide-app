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
