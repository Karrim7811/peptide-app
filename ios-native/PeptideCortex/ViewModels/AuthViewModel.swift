import SwiftUI
import AuthenticationServices
import Supabase

@MainActor
class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showSignup = false
    @Published var signupSuccess = false

    // MARK: - Email/Password Sign In

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

    // MARK: - Email/Password Sign Up

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

    // MARK: - Apple Sign In

    func handleAppleSignIn(result: Result<ASAuthorization, Error>, appState: AppState) async {
        isLoading = true
        errorMessage = nil

        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityToken = credential.identityToken,
                  let tokenString = String(data: identityToken, encoding: .utf8) else {
                errorMessage = "Failed to get Apple credential"
                isLoading = false
                return
            }

            do {
                try await SupabaseService.shared.client.auth.signInWithIdToken(
                    credentials: .init(
                        provider: .apple,
                        idToken: tokenString
                    )
                )
                await appState.checkSession()
            } catch {
                errorMessage = "Apple sign in failed: \(error.localizedDescription)"
            }

        case .failure(let error):
            let nsError = error as NSError
            if nsError.code != ASAuthorizationError.canceled.rawValue {
                errorMessage = "Apple sign in failed"
            }
        }
        isLoading = false
    }

    // MARK: - Google Sign In (via Supabase OAuth in Safari)

    func signInWithGoogle(appState: AppState) async {
        isLoading = true
        errorMessage = nil

        do {
            let url = try await SupabaseService.shared.client.auth.getOAuthSignInURL(
                provider: .google,
                redirectTo: URL(string: "peptidecortex://auth-callback")
            )
            await UIApplication.shared.open(url)
        } catch {
            errorMessage = "Google sign in failed: \(error.localizedDescription)"
        }
        isLoading = false
    }
}
