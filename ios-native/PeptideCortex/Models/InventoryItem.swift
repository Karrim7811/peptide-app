import Foundation

struct InventoryItem: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var name: String
    var unit: String  // "mg" or "mcg"
    var vialSize: Double
    var quantityRemaining: Double
    var expiryDate: String?
    var notes: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, name, unit, notes
        case userId = "user_id"
        case vialSize = "vial_size_mg"
        case quantityRemaining = "quantity_remaining"
        case expiryDate = "expiry_date"
        case createdAt = "created_at"
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(userId, forKey: .userId)
        try container.encode(name, forKey: .name)
        try container.encode(unit, forKey: .unit)
        try container.encode(vialSize, forKey: .vialSize)  // encodes as "vial_size_mg"
        try container.encode(quantityRemaining, forKey: .quantityRemaining)
        try container.encodeIfPresent(expiryDate, forKey: .expiryDate)
        try container.encode(notes, forKey: .notes)
        try container.encodeIfPresent(createdAt, forKey: .createdAt)
    }

    var percentRemaining: Double {
        guard vialSize > 0 else { return 0 }
        return (quantityRemaining / vialSize) * 100
    }

    var isLowStock: Bool { percentRemaining < 20 }
}
