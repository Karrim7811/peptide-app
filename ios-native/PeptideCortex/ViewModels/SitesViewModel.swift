import Foundation

@MainActor
class SitesViewModel: ObservableObject {
    @Published var logs: [InjectionLog] = []
    @Published var isLoading = false
    @Published var showAddForm = false

    // Add form state
    @Published var selectedSite: InjectionSiteOption = .leftDeltoid
    @Published var peptideName = ""
    @Published var newNotes = ""
    @Published var newDate = Date()

    func load() async {
        isLoading = true
        do {
            logs = try await SupabaseService.shared.getInjectionLogs()
        } catch {
            print("Injection logs load error: \(error)")
        }
        isLoading = false
    }

    func addLog() async {
        guard !peptideName.isEmpty else { return }
        guard let userId = SupabaseService.shared.currentUserId else { return }
        let formatter = ISO8601DateFormatter()
        let log = InjectionLog(
            id: UUID(), userId: userId,
            site: selectedSite.rawValue,
            peptideName: peptideName,
            injectedAt: formatter.string(from: newDate),
            notes: newNotes, createdAt: nil
        )
        do {
            try await SupabaseService.shared.insertInjectionLog(log)
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add injection log error: \(error)")
        }
    }

    func logsForSite(_ site: InjectionSiteOption) -> [InjectionLog] {
        logs.filter { $0.site == site.rawValue }
    }

    func lastUsed(_ site: InjectionSiteOption) -> String? {
        logsForSite(site).first?.injectedAt
    }

    private func resetForm() {
        peptideName = ""
        newNotes = ""
        newDate = Date()
        selectedSite = .leftDeltoid
    }
}
