import Foundation
import Supabase

@MainActor
class AIConsentManager: ObservableObject {
    static let shared = AIConsentManager()

    private static let consentVersion = "1.0"
    private static let localKey = "ai_consent_granted"
    private static let localVersionKey = "ai_consent_version"

    @Published var showConsentSheet = false
    @Published var consentGranted = false

    private var consentContinuation: CheckedContinuation<Bool, Never>?

    private init() {
        // Check local cache on init
        consentGranted = Self.cachedConsent()
    }

    // MARK: - Public API

    /// Call before any AI API request. Returns true if consent is granted.
    /// Shows consent sheet and awaits user decision if not yet consented.
    func requireConsent() async -> Bool {
        // Fast path: already consented
        if consentGranted { return true }

        // Check Supabase user_metadata
        if let user = SupabaseService.shared.currentUser,
           let meta = user.userMetadata["ai_consent_granted"],
           case .bool(let granted) = meta, granted,
           let version = user.userMetadata["ai_consent_version"],
           case .string(let v) = version, v == Self.consentVersion {
            Self.setCachedConsent(true)
            consentGranted = true
            return true
        }

        // Show consent sheet and wait for user decision
        return await withCheckedContinuation { continuation in
            consentContinuation = continuation
            showConsentSheet = true
        }
    }

    /// Called when user accepts consent
    func acceptConsent() async {
        // Save to Supabase user_metadata
        do {
            try await SupabaseService.shared.client.auth.update(user: .init(data: [
                "ai_consent_granted": .bool(true),
                "ai_consent_granted_at": .string(ISO8601DateFormatter().string(from: Date())),
                "ai_consent_version": .string(Self.consentVersion)
            ]))
        } catch {
            print("Failed to save AI consent: \(error)")
        }

        Self.setCachedConsent(true)
        consentGranted = true
        showConsentSheet = false
        consentContinuation?.resume(returning: true)
        consentContinuation = nil
    }

    /// Called when user declines consent
    func declineConsent() {
        Self.setCachedConsent(false)
        consentGranted = false
        showConsentSheet = false
        consentContinuation?.resume(returning: false)
        consentContinuation = nil
    }

    // MARK: - Local Cache

    private static func cachedConsent() -> Bool {
        UserDefaults.standard.bool(forKey: localKey) &&
        UserDefaults.standard.string(forKey: localVersionKey) == consentVersion
    }

    private static func setCachedConsent(_ granted: Bool) {
        UserDefaults.standard.set(granted, forKey: localKey)
        if granted {
            UserDefaults.standard.set(consentVersion, forKey: localVersionKey)
        } else {
            UserDefaults.standard.removeObject(forKey: localVersionKey)
        }
    }
}
