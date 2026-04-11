import SwiftUI
import Supabase

@MainActor
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var profile: Profile?

    // Pass bloodwork data to Protocol Planner
    @Published var pendingBloodwork: PendingBloodwork?

    struct PendingBloodwork {
        let analysis: String
        let recommendations: [BloodworkRecommendation]
        let warnings: [String]
        /// Peptides the user already references in their current schedule —
        /// the planner must preserve these and slot new recommendations around
        /// them instead of replacing them.
        let existingStack: [String]
        /// Free-text description of when the existing stack is being taken.
        let existingSchedule: String
    }

    init() {
        Task { await checkSession() }
    }

    func checkSession() async {
        isLoading = true
        do {
            let session = try await SupabaseService.shared.client.auth.session
            isAuthenticated = true
            profile = try await SupabaseService.shared.getProfile()
        } catch {
            isAuthenticated = false
            profile = nil
        }
        isLoading = false
    }

    func signOut() async {
        try? await SupabaseService.shared.signOut()
        isAuthenticated = false
        profile = nil
    }
}
