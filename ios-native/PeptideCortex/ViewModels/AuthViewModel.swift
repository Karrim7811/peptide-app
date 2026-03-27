import SwiftUI
import AuthenticationServices
import Supabase
import Auth

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
                    credentials: OpenIDConnectCredentials(
                        provider: .apple,
                        idToken: tokenString
                    )
                )
                await appState.checkSession()
            } catch let error as NSError {
                print("Apple sign in error: \(error)")
                print("Error domain: \(error.domain), code: \(error.code)")
                print("Error description: \(error.localizedDescription)")
                if let underlyingError = error.userInfo[NSUnderlyingErrorKey] as? Error {
                    print("Underlying error: \(underlyingError)")
                }
                errorMessage = "Apple sign in failed. Please try email sign in or try again later."
            } catch {
                print("Apple sign in error: \(error)")
                errorMessage = "Apple sign in failed. Please try email sign in or try again later."
            }

        case .failure(let error):
            let nsError = error as NSError
            if nsError.code != ASAuthorizationError.canceled.rawValue {
                errorMessage = "Apple sign in was cancelled or failed. Please try again."
                print("Apple sign in failure: \(error)")
            }
        }
        isLoading = false
    }

    // MARK: - Google Sign In (via Supabase OAuth in Safari)

    func signInWithGoogle(appState: AppState) async {
        isLoading = true
        errorMessage = nil

        do {
            // Get the OAuth URL from Supabase and open in Safari
            let baseURL = AppConstants.supabaseURL
            let redirectTo = "peptidecortex://auth-callback"
            let urlString = "\(baseURL)/auth/v1/authorize?provider=google&redirect_to=\(redirectTo)"

            guard let url = URL(string: urlString) else {
                errorMessage = "Invalid URL"
                isLoading = false
                return
            }
            await UIApplication.shared.open(url)
        } catch {
            errorMessage = "Google sign in failed: \(error.localizedDescription)"
        }
        isLoading = false
    }
}
