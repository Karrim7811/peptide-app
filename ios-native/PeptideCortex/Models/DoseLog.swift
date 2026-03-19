import Foundation

struct DoseLog: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var stackItemId: UUID
    var takenAt: String
    var dose: String
    var notes: String
    let createdAt: String?
    var stackItem: StackItem?

    enum CodingKeys: String, CodingKey {
        case id, dose, notes
        case userId = "user_id"
        case stackItemId = "stack_item_id"
        case takenAt = "taken_at"
        case createdAt = "created_at"
        case stackItem = "stack_item"
    }
}
