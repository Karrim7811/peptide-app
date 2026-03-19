import Foundation

struct PeptideKnowledge: Codable, Identifiable {
    var id: String { name }
    let name: String
    let primaryPurpose: String
    let whatItDoes: String
    let commonUseExamples: String
    let dosageRange: String
    let riskCautions: String
    let bestFor: String
    let keyEffects: String
    let evidenceLevel: String
    let bottomLine: String
    let avoidIf: String
    let cvRating: Int
    let cvNotes: String
    let drugInteractions: String
    let goalCategory: String
    let goalCategories: [String]
    let stacksWellWith: [String]
}

class PeptideDataStore {
    static let shared = PeptideDataStore()

    let peptides: [PeptideKnowledge]

    private init() {
        guard let url = Bundle.main.url(forResource: "PeptideData", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode([PeptideKnowledge].self, from: data) else {
            peptides = []
            return
        }
        peptides = decoded
    }

    func search(_ query: String) -> [PeptideKnowledge] {
        guard !query.isEmpty else { return peptides }
        let q = query.lowercased()
        return peptides.filter {
            $0.name.lowercased().contains(q) ||
            $0.primaryPurpose.lowercased().contains(q) ||
            $0.goalCategory.lowercased().contains(q)
        }
    }

    func find(_ name: String) -> PeptideKnowledge? {
        peptides.first { $0.name.lowercased() == name.lowercased() }
    }

    var allNames: [String] {
        peptides.map(\.name).sorted()
    }

    var allCategories: [String] {
        Array(Set(peptides.flatMap(\.goalCategories))).sorted()
    }
}
