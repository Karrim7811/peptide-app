import Foundation

struct StackItem: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var name: String
    var type: String  // "peptide", "medication", "supplement"
    var dose: String
    var unit: String
    var notes: String
    var active: Bool
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, name, type, dose, unit, notes, active
        case userId = "user_id"
        case createdAt = "created_at"
    }
}
