import Foundation

struct Reminder: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var stackItemId: UUID
    var time: String  // HH:MM
    var daysOfWeek: [Int]  // 0=Sunday..6=Saturday
    var dose: String
    var active: Bool
    let createdAt: String?
    var stackItem: StackItem?

    enum CodingKeys: String, CodingKey {
        case id, time, dose, active
        case userId = "user_id"
        case stackItemId = "stack_item_id"
        case daysOfWeek = "days_of_week"
        case createdAt = "created_at"
        case stackItem = "stack_item"
    }
}
