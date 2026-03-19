import SwiftUI

enum AppConstants {
    // MARK: - API
    static let apiBaseURL = "https://peptide-app-nine.vercel.app"
    static let supabaseURL = "https://uvpmrjsgaekejjofgtup.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cG1yanNnYWVrZWpqb2ZndHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjQ0MzksImV4cCI6MjA4ODkwMDQzOX0.Sh75NdFtEAX6OaUbL6EIEeYYARwJ0mcG2yHCCfsJvz4"

    // MARK: - Free Tier Limits
    static let freeStackItems = 5
    static let freeInteractionChecksPerDay = 3
    static let freeReminderCount = 3

    // MARK: - Subscription
    enum SubscriptionTier: String, Codable {
        case free
        case pro
        case lifetime
    }
}

// MARK: - Brand Colors
extension Color {
    static let cxTeal = Color(red: 0.102, green: 0.541, blue: 0.620)       // #1A8A9E
    static let cxBlack = Color(red: 0.102, green: 0.098, blue: 0.082)      // #1A1915
    static let cxParchment = Color(red: 0.961, green: 0.941, blue: 0.910)  // #F5F0E8
    static let cxOffWhite = Color(red: 0.949, green: 0.941, blue: 0.929)   // #F2F0ED
    static let cxStone = Color(red: 0.690, green: 0.667, blue: 0.627)      // #B0AAA0
    static let cxSmoke = Color(red: 0.227, green: 0.216, blue: 0.188)      // #3A3730
    static let cxBorder = Color(red: 0.690, green: 0.667, blue: 0.627).opacity(0.3)
    static let cxSidebarBg = Color(red: 0.910, green: 0.886, blue: 0.855) // #E8E2DA
    static let cxBackground = Color(red: 0.980, green: 0.980, blue: 0.973) // #FAFAF8
}
