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

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(userId, forKey: .userId)
        try container.encode(name, forKey: .name)
        try container.encode(type, forKey: .type)
        try container.encode(dose, forKey: .dose)
        try container.encode(unit, forKey: .unit)
        try container.encode(notes, forKey: .notes)
        try container.encode(active, forKey: .active)
        try container.encodeIfPresent(createdAt, forKey: .createdAt)
    }
}
