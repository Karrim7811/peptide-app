import Foundation

struct Cycle: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var name: String
    var peptides: [String]
    var onWeeks: Int
    var offWeeks: Int
    var startDate: String
    var currentlyOn: Bool
    var completed: Bool
    var notes: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, name, peptides, notes, completed
        case userId = "user_id"
        case onWeeks = "on_weeks"
        case offWeeks = "off_weeks"
        case startDate = "start_date"
        case currentlyOn = "currently_on"
        case createdAt = "created_at"
    }
}
