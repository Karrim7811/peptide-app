import Foundation

struct ResearchNote: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var peptideName: String
    var note: String
    var url: String?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, note, url
        case userId = "user_id"
        case peptideName = "peptide_name"
        case createdAt = "created_at"
    }
}
