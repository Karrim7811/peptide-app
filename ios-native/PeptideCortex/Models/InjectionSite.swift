import Foundation

struct InjectionLog: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var site: String
    var peptideName: String
    var injectedAt: String
    var notes: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, site, notes
        case userId = "user_id"
        case peptideName = "peptide_name"
        case injectedAt = "injected_at"
        case createdAt = "created_at"
    }
}

enum InjectionSiteOption: String, CaseIterable {
    case leftDeltoid = "Left Deltoid"
    case rightDeltoid = "Right Deltoid"
    case leftGlute = "Left Glute"
    case rightGlute = "Right Glute"
    case leftQuad = "Left Quad"
    case rightQuad = "Right Quad"
    case leftAbdomen = "Left Abdomen"
    case rightAbdomen = "Right Abdomen"
    case leftLoveHandle = "Left Love Handle"
    case rightLoveHandle = "Right Love Handle"
}
