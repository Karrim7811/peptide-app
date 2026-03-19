import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showSignup = false
    @Published var signupSuccess = false

    func signIn(appState: AppState) async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please enter email and password"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            try await SupabaseService.shared.signIn(email: email, password: password)
            await appState.checkSession()
        } catch {
            errorMessage = "Invalid email or password"
        }
        isLoading = false
    }

    func signUp() async {
        guard !email.isEmpty else {
            errorMessage = "Please enter your email"
            return
        }
        guard password.count >= 6 else {
            errorMessage = "Password must be at least 6 characters"
            return
        }
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            try await SupabaseService.shared.signUp(email: email, password: password)
            signupSuccess = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
