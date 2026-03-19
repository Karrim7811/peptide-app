import SwiftUI
import Supabase

@MainActor
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var profile: Profile?

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
