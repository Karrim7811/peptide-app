import Foundation

struct ChatMessage: Codable {
    let role: String  // "user" or "assistant"
    let content: String
}

struct ChatResponse: Codable {
    let reply: String
}

struct InteractionResult: Codable {
    let level: String  // "safe", "caution", "danger", "unknown"
    let summary: String
    let details: String
    let recommendations: [String]
}

struct StackFinderResponse: Codable {
    let reply: String
}

struct MarketPulseResponse: Codable {
    let lastUpdated: String
    let headlines: [Headline]
    let fdaWatch: [FDAWatch]
    let trendingPeptides: [String]

    struct Headline: Codable, Identifiable {
        var id: String { title }
        let title: String
        let summary: String
        let category: String
        let sentiment: String
    }

    struct FDAWatch: Codable, Identifiable {
        var id: String { peptide }
        let peptide: String
        let status: String
        let update: String
    }
}

@MainActor
class APIService {
    static let shared = APIService()
    private let baseURL = AppConstants.apiBaseURL

    private static let aiPaths: Set<String> = [
        "/api/chat",
        "/api/check-interaction",
        "/api/stack-finder",
        "/api/scan-vials"
    ]

    private init() {}

    private func makeRequest<T: Decodable>(
        path: String,
        method: String = "POST",
        body: [String: Any]? = nil
    ) async throws -> T {
        // Check AI consent for AI endpoints
        if Self.aiPaths.contains(path) {
            let consented = await AIConsentManager.shared.requireConsent()
            if !consented {
                throw NSError(domain: "API", code: 403, userInfo: [
                    NSLocalizedDescriptionKey: "AI features require data consent. Please accept the AI data disclosure to continue."
                ])
            }
        }

        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 60
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add auth token if available
        if let session = try? await SupabaseService.shared.client.auth.session {
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            let bodyText = String(data: data, encoding: .utf8) ?? "No response body"
            throw NSError(domain: "API", code: statusCode, userInfo: [
                NSLocalizedDescriptionKey: "Request to \(path) failed with status \(statusCode): \(bodyText.prefix(200))"
            ])
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            let bodyText = String(data: data, encoding: .utf8) ?? "Unable to read response"
            throw NSError(domain: "API", code: -1, userInfo: [
                NSLocalizedDescriptionKey: "Failed to decode response from \(path). Body: \(bodyText.prefix(300))"
            ])
        }
    }

    // MARK: - AI Chat

    func sendChatMessage(messages: [ChatMessage], stackContext: String? = nil) async throws -> String {
        var body: [String: Any] = [
            "messages": messages.map { ["role": $0.role, "content": $0.content] }
        ]
        if let context = stackContext {
            body["stackContext"] = context
        }
        let response: ChatResponse = try await makeRequest(path: "/api/chat", body: body)
        return response.reply
    }

    // MARK: - Interaction Checker

    func checkInteraction(itemA: String, itemB: String) async throws -> InteractionResult {
        try await makeRequest(path: "/api/check-interaction", body: [
            "itemA": itemA,
            "itemB": itemB
        ])
    }

    // MARK: - Stack Finder

    func findStacks(peptideName: String, goal: String? = nil) async throws -> StackFinderResponse {
        var body: [String: Any] = ["peptideName": peptideName]
        if let goal = goal { body["goal"] = goal }
        return try await makeRequest(path: "/api/stack-finder", body: body)
    }

    // MARK: - Market Pulse

    func getMarketPulse() async throws -> MarketPulseResponse {
        try await makeRequest(path: "/api/market-pulse", method: "GET")
    }

    // MARK: - Vial Scanner

    struct VialScanResponse: Codable {
        let vials: [VialScanItem]?
        let error: String?

        struct VialScanItem: Codable {
            let name: String
            let amount: String?
            let type: String?
            let notes: String?
        }
    }

    func scanVials(imageBase64: String, mimeType: String) async throws -> [ScannedVial] {
        let response: VialScanResponse = try await makeRequest(
            path: "/api/scan-vials",
            body: ["image": imageBase64, "mimeType": mimeType]
        )
        if let error = response.error {
            throw NSError(domain: "API", code: 422, userInfo: [NSLocalizedDescriptionKey: error])
        }
        return (response.vials ?? []).map { item in
            ScannedVial(
                name: item.name,
                amount: item.amount ?? "",
                type: item.type ?? "peptide",
                notes: item.notes ?? ""
            )
        }
    }

}
