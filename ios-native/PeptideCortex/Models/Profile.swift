import Foundation

struct Profile: Codable, Identifiable {
    let id: UUID
    let email: String
    let createdAt: String?
    var subscriptionTier: String
    var subscriptionExpiresAt: String?
    var stripeCustomerId: String?

    enum CodingKeys: String, CodingKey {
        case id, email
        case createdAt = "created_at"
        case subscriptionTier = "subscription_tier"
        case subscriptionExpiresAt = "subscription_expires_at"
        case stripeCustomerId = "stripe_customer_id"
    }

    var isPro: Bool {
        if subscriptionTier == "lifetime" { return true }
        if subscriptionTier == "pro" {
            if let expires = subscriptionExpiresAt,
               let date = ISO8601DateFormatter().date(from: expires) {
                return date > Date()
            }
        }
        return false
    }
}
