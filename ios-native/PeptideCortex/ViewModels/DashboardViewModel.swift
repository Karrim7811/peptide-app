import Foundation

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var stackCount = 0
    @Published var remindersToday = 0
    @Published var logsThisWeek = 0
    @Published var activeCycles = 0
    @Published var isLoading = false
    @Published var marketPulse: MarketPulseResponse?
    @Published var newsLoading = false
    @Published var newsError: String?
    @Published var activeStackItems: [StackItem] = []
    @Published var reconResults: [UUID: ReconstitutionResult] = [:]

    func load() async {
        isLoading = true
        do {
            let items = try await SupabaseService.shared.getStackItems()
            activeStackItems = items.filter(\.active)
            stackCount = activeStackItems.count

            let reminders = try await SupabaseService.shared.getReminders()
            let todayWeekday = Calendar.current.component(.weekday, from: Date()) - 1
            remindersToday = reminders.filter { $0.active && $0.daysOfWeek.contains(todayWeekday) }.count

            let logs = try await SupabaseService.shared.getDoseLogs()
            let oneWeekAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let fallback = ISO8601DateFormatter()
            logsThisWeek = logs.filter { log in
                if let date = formatter.date(from: log.takenAt) ?? fallback.date(from: log.takenAt) {
                    return date >= oneWeekAgo
                }
                return false
            }.count

            let cycles = try await SupabaseService.shared.getCycles()
            activeCycles = cycles.filter { $0.currentlyOn && !$0.completed }.count
        } catch {
            print("Dashboard load error: \(error)")
        }
        isLoading = false

        // Load reconstitution for peptide items that have a dose in mg
        await loadReconstitution()

        // Load news
        await loadNews()
    }

    func loadReconstitution() async {
        for item in activeStackItems where item.type == "peptide" {
            // Parse mg amount from dose string
            let doseStr = item.dose.lowercased().replacingOccurrences(of: "mg", with: "").trimmingCharacters(in: .whitespaces)
            guard let mg = Double(doseStr), mg > 0 else { continue }

            do {
                let result = try await APIService.shared.getReconstitution(peptideName: item.name, amountMg: mg)
                reconResults[item.id] = result
            } catch {
                print("Recon error for \(item.name): \(error)")
            }
        }
    }

    func loadNews() async {
        newsLoading = true
        newsError = nil
        do {
            marketPulse = try await APIService.shared.getMarketPulse()
        } catch {
            newsError = "Could not load news. Pull to refresh."
            print("Market pulse error: \(error)")
        }
        newsLoading = false
    }
}
