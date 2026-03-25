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

struct ReconstitutionResult: Codable {
    let recommendedBacWaterMl: Double
    let concentrationMgPerMl: Double
    let concentrationMcgPerMl: Double
    let reasoning: String
    let tipicalDoseRange: String
    let storageNote: String
}

struct StackFinderResponse: Codable {
    let reply: String
}

struct BloodworkResponse: Codable {
    let analysis: String
    let recommendations: [BloodworkRecommendation]
    let warnings: [String]
}

struct BloodworkRecommendation: Codable {
    let peptide: String
    let reason: String
    let priority: String
}

// MARK: - Protocol Planner

struct ProtocolPlan: Codable {
    let weeklySchedule: [ScheduleDay]
    let interactions: [PlanInteraction]
    let warnings: [String]
    let reconstitution: [ReconInfo]
    let summary: String
    let suggestedReminders: [SuggestedReminder]

    struct ScheduleDay: Codable, Identifiable {
        var id: String { day }
        let day: String
        let doses: [ScheduleDose]
    }

    struct ScheduleDose: Codable, Identifiable {
        var id: String { "\(peptide)-\(time)" }
        let peptide: String
        let dose: String
        let time: String
        let route: String
        let site: String
        let notes: String
    }

    struct PlanInteraction: Codable, Identifiable {
        var id: String { "\(peptideA)-\(peptideB)" }
        let peptideA: String
        let peptideB: String
        let level: String
        let note: String
    }

    struct ReconInfo: Codable, Identifiable {
        var id: String { peptide }
        let peptide: String
        let vialSize: String
        let bacWater: String
        let concentration: String
        let typicalDose: String
    }

    struct SuggestedReminder: Codable, Identifiable {
        var id: String { "\(peptide)-\(time)" }
        let peptide: String
        let time: String
        let days: [Int]
        let dose: String
    }
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

    private init() {}

    private func makeRequest<T: Decodable>(
        path: String,
        method: String = "POST",
        body: [String: Any]? = nil
    ) async throws -> T {
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

    // MARK: - Reconstitution AI

    func getReconstitution(peptideName: String, amountMg: Double) async throws -> ReconstitutionResult {
        try await makeRequest(path: "/api/reconstitution-ai", body: [
            "peptideName": peptideName,
            "amountMg": amountMg
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

    // MARK: - Bloodwork Analyzer

    func analyzeBloodwork(markers: [[String: Any]], currentStack: [String], goals: String) async throws -> BloodworkResponse {
        try await makeRequest(path: "/api/bloodwork-analyze", body: [
            "markers": markers,
            "currentStack": currentStack,
            "goals": goals
        ])
    }

    // MARK: - Bloodwork OCR

    struct BloodworkOCRResponse: Codable {
        let markers: [String: Double?]?
        let error: String?
    }

    func ocrBloodwork(imageBase64: String, mimeType: String) async throws -> [String: Double] {
        let response: BloodworkOCRResponse = try await makeRequest(
            path: "/api/bloodwork-ocr",
            body: ["image": imageBase64, "mimeType": mimeType]
        )
        if let error = response.error {
            throw NSError(domain: "API", code: 422, userInfo: [NSLocalizedDescriptionKey: error])
        }
        var result: [String: Double] = [:]
        if let markers = response.markers {
            for (key, value) in markers {
                if let v = value {
                    result[key] = v
                }
            }
        }
        return result
    }

    // MARK: - Protocol Planner

    func generateProtocolPlan(peptides: [String], profile: [String: Any]) async throws -> ProtocolPlan {
        try await makeRequest(path: "/api/protocol-plan", body: [
            "peptides": peptides,
            "profile": profile
        ])
    }

    // MARK: - Stripe

    func createCheckout(plan: String) async throws -> String {
        struct CheckoutResponse: Codable { let url: String }
        let response: CheckoutResponse = try await makeRequest(
            path: "/api/stripe/create-checkout",
            body: ["plan": plan]
        )
        return response.url
    }

    func getPortalURL() async throws -> String {
        struct PortalResponse: Codable { let url: String }
        let response: PortalResponse = try await makeRequest(
            path: "/api/stripe/portal"
        )
        return response.url
    }

    // MARK: - Protocol Planner

    func generateProtocolPlan(peptides: [String], profile: [String: Any]) async throws -> ProtocolPlan {
        try await makeRequest(path: "/api/protocol-plan", body: [
            "peptides": peptides,
            "profile": profile
        ])
    }
}

// MARK: - Protocol Plan Models

struct ProtocolPlan: Codable {
    let weeklySchedule: [ScheduleDay]
    let interactions: [PlanInteraction]
    let warnings: [String]
    let reconstitution: [ReconstitutionGuide]
    let summary: String
    let suggestedReminders: [SuggestedReminder]

    struct ScheduleDay: Codable, Identifiable {
        var id: String { day }
        let day: String
        let doses: [ScheduleDose]
    }

    struct ScheduleDose: Codable, Identifiable {
        var id: String { "\(peptide)-\(time)-\(dose)" }
        let peptide: String
        let dose: String
        let time: String
        let route: String
        let site: String
        let notes: String
    }

    struct PlanInteraction: Codable, Identifiable {
        var id: String { "\(peptideA)-\(peptideB)" }
        let peptideA: String
        let peptideB: String
        let level: String  // "safe", "caution", "danger"
        let note: String
    }

    struct ReconstitutionGuide: Codable, Identifiable {
        var id: String { peptide }
        let peptide: String
        let vialSize: String
        let bacWater: String
        let concentration: String
        let typicalDose: String
    }

    struct SuggestedReminder: Codable, Identifiable {
        var id: String { "\(peptide)-\(time)" }
        let peptide: String
        let time: String
        let days: [Int]
        let dose: String
    }
}
