import Foundation

struct SideEffect: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var peptideName: String
    var effect: String
    var severity: Int  // 1-5
    var occurredAt: String
    var notes: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, effect, severity, notes
        case userId = "user_id"
        case peptideName = "peptide_name"
        case occurredAt = "occurred_at"
        case createdAt = "created_at"
    }
}
