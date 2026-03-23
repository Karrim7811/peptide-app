import Foundation

struct TodayReminder: Identifiable {
    let id: UUID
    let reminder: Reminder
    var taken: Bool
}

struct SupplyAlert: Identifiable {
    let id = UUID()
    let name: String
    let dosesLeft: Int
}

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
    @Published var todayReminders: [TodayReminder] = []
    @Published var supplyAlerts: [SupplyAlert] = []

    func load() async {
        isLoading = true
        do {
            let items = try await SupabaseService.shared.getStackItems()
            activeStackItems = items.filter(\.active)
            stackCount = activeStackItems.count

            let reminders = try await SupabaseService.shared.getReminders()
            let todayWeekday = Calendar.current.component(.weekday, from: Date()) - 1
            let todaysActiveReminders = reminders.filter { $0.active && $0.daysOfWeek.contains(todayWeekday) }
            remindersToday = todaysActiveReminders.count

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

            // Build today's reminders with taken status
            let todayStart = Calendar.current.startOfDay(for: Date())
            let todayEnd = Calendar.current.date(byAdding: .day, value: 1, to: todayStart) ?? Date()
            let todayLogs = logs.filter { log in
                if let date = formatter.date(from: log.takenAt) ?? fallback.date(from: log.takenAt) {
                    return date >= todayStart && date < todayEnd
                }
                return false
            }
            todayReminders = todaysActiveReminders.map { reminder in
                let taken = todayLogs.contains { $0.stackItemId == reminder.stackItemId }
                return TodayReminder(id: reminder.id, reminder: reminder, taken: taken)
            }

            // Build supply alerts
            let inventory = try await SupabaseService.shared.getInventory()
            var alerts: [SupplyAlert] = []
            for item in activeStackItems {
                guard let invItem = inventory.first(where: { $0.name.lowercased() == item.name.lowercased() }) else { continue }
                let doseStr = item.dose.lowercased()
                    .replacingOccurrences(of: "mg", with: "")
                    .replacingOccurrences(of: "mcg", with: "")
                    .replacingOccurrences(of: "ml", with: "")
                    .trimmingCharacters(in: .whitespaces)
                guard let doseAmount = Double(doseStr), doseAmount > 0, invItem.quantityRemaining > 0 else { continue }
                let dosesLeft = Int(invItem.quantityRemaining / doseAmount)
                if dosesLeft <= 10 {
                    alerts.append(SupplyAlert(name: item.name, dosesLeft: dosesLeft))
                }
            }
            supplyAlerts = alerts

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

    func quickLogDose(reminder: Reminder) async {
        guard let userId = SupabaseService.shared.currentUserId else { return }
        let formatter = ISO8601DateFormatter()
        let log = DoseLog(
            id: UUID(), userId: userId,
            stackItemId: reminder.stackItemId,
            takenAt: formatter.string(from: Date()),
            dose: reminder.dose, notes: "Quick logged from dashboard",
            createdAt: nil, stackItem: nil
        )
        do {
            try await SupabaseService.shared.insertDoseLog(log)
            // Mark as taken locally
            if let index = todayReminders.firstIndex(where: { $0.id == reminder.id }) {
                todayReminders[index].taken = true
            }
            logsThisWeek += 1
        } catch {
            print("Quick log error: \(error)")
        }
    }

    func loadNews() async {
        newsLoading = true
        newsError = nil
        do {
            marketPulse = try await APIService.shared.getMarketPulse()
        } catch let urlError as URLError where urlError.code == .timedOut {
            newsError = "News request timed out. The server may be waking up -- pull to refresh."
        } catch let urlError as URLError where urlError.code == .notConnectedToInternet {
            newsError = "No internet connection. Please check your network."
        } catch {
            newsError = "Could not load news: \(error.localizedDescription). Pull to refresh."
            print("Market pulse error: \(error)")
        }
        newsLoading = false
    }
}
