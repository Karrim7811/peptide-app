import SwiftUI
import AuthenticationServices
import CryptoKit
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

    // Nonce for Apple Sign In
    private var currentNonce: String?

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

    /// Generate a random nonce and return its SHA256 hash for Apple
    func generateNonce() -> String {
        let nonce = randomNonceString()
        currentNonce = nonce
        return sha256(nonce)
    }

    func configureAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let hashedNonce = generateNonce()
        request.requestedScopes = [.email, .fullName]
        request.nonce = hashedNonce
    }

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

            guard let nonce = currentNonce else {
                errorMessage = "Apple sign in failed — missing nonce. Please try again."
                isLoading = false
                return
            }

            do {
                try await SupabaseService.shared.client.auth.signInWithIdToken(
                    credentials: OpenIDConnectCredentials(
                        provider: .apple,
                        idToken: tokenString,
                        nonce: nonce
                    )
                )
                await appState.checkSession()
            } catch {
                print("Apple sign in Supabase error: \(error)")
                errorMessage = "Supabase error: \(error.localizedDescription)"
            }

        case .failure(let error):
            let nsError = error as NSError
            if nsError.code == ASAuthorizationError.canceled.rawValue {
                // User cancelled — no error message needed
            } else {
                print("Apple sign in failure: domain=\(nsError.domain) code=\(nsError.code) desc=\(nsError.localizedDescription)")
                errorMessage = "Apple sign in error (\(nsError.code)): \(nsError.localizedDescription)"
            }
        }
        isLoading = false
    }

    // MARK: - Nonce Helpers

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        var randomBytes = [UInt8](repeating: 0, count: length)
        let errorCode = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
        if errorCode != errSecSuccess {
            fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
        }
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        return String(randomBytes.map { charset[Int($0) % charset.count] })
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        return hashedData.compactMap { String(format: "%02x", $0) }.joined()
    }
}
