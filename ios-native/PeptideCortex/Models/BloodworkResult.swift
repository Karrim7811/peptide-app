import Foundation

struct BloodworkResult: Codable, Identifiable {
    var id: UUID
    let userId: UUID
    var markers: String       // JSON string of marker values
    var analysis: String
    var recommendations: String  // JSON string of recommendations
    var warnings: String      // JSON string of warnings
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, markers, analysis, recommendations, warnings
        case userId = "user_id"
        case createdAt = "created_at"
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(userId, forKey: .userId)
        try container.encode(markers, forKey: .markers)
        try container.encode(analysis, forKey: .analysis)
        try container.encode(recommendations, forKey: .recommendations)
        try container.encode(warnings, forKey: .warnings)
        try container.encodeIfPresent(createdAt, forKey: .createdAt)
    }
}
