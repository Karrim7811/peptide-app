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
        case vialSize = "vial_size"
        case quantityRemaining = "quantity_remaining"
        case expiryDate = "expiry_date"
        case createdAt = "created_at"
    }

    var percentRemaining: Double {
        guard vialSize > 0 else { return 0 }
        return (quantityRemaining / vialSize) * 100
    }

    var isLowStock: Bool { percentRemaining < 20 }
}
