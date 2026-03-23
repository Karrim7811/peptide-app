import Foundation

@MainActor
class DoseLogViewModel: ObservableObject {
    @Published var logs: [DoseLog] = []
    @Published var stackItems: [StackItem] = []
    @Published var inventory: [InventoryItem] = []
    @Published var isLoading = false
    @Published var showAddForm = false
    @Published var lowStockAlert: String?
    @Published var doseStreak: Int = 0
    @Published var reminders: [Reminder] = []

    // Add form state
    @Published var selectedStackItemId: UUID?
    @Published var newDose = ""
    @Published var newNotes = ""
    @Published var newDate = Date()

    func load() async {
        isLoading = true
        do {
            logs = try await SupabaseService.shared.getDoseLogs()
            stackItems = try await SupabaseService.shared.getStackItems()
            inventory = try await SupabaseService.shared.getInventory()
            if selectedStackItemId == nil {
                selectedStackItemId = stackItems.first?.id
            }
            reminders = try await SupabaseService.shared.getReminders()
            checkLowStock()
            calculateStreak()
        } catch {
            print("DoseLog load error: \(error)")
        }
        isLoading = false
    }

    func addLog() async {
        guard let userId = SupabaseService.shared.currentUserId,
              let stackItemId = selectedStackItemId else { return }
        let formatter = ISO8601DateFormatter()
        let log = DoseLog(
            id: UUID(), userId: userId,
            stackItemId: stackItemId,
            takenAt: formatter.string(from: newDate),
            dose: newDose, notes: newNotes,
            createdAt: nil, stackItem: nil
        )
        do {
            try await SupabaseService.shared.insertDoseLog(log)

            // Deduct from inventory if matching item exists
            await deductFromInventory(stackItemId: stackItemId, dose: newDose)

            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add dose log error: \(error)")
        }
    }

    private func deductFromInventory(stackItemId: UUID, dose: String) async {
        // Find the stack item name
        guard let stackItem = stackItems.first(where: { $0.id == stackItemId }) else { return }

        // Find matching inventory item by name
        guard var invItem = inventory.first(where: {
            $0.name.lowercased() == stackItem.name.lowercased()
        }) else { return }

        // Parse dose amount (strip units)
        let doseStr = dose.lowercased()
            .replacingOccurrences(of: "mg", with: "")
            .replacingOccurrences(of: "mcg", with: "")
            .replacingOccurrences(of: "ml", with: "")
            .trimmingCharacters(in: .whitespaces)
        guard let doseAmount = Double(doseStr), doseAmount > 0 else { return }

        // Deduct
        invItem.quantityRemaining = max(0, invItem.quantityRemaining - doseAmount)

        do {
            try await SupabaseService.shared.updateInventoryItem(invItem)
        } catch {
            print("Inventory deduct error: \(error)")
        }
    }

    private func checkLowStock() {
        let lowItems = inventory.filter { $0.isLowStock && $0.quantityRemaining > 0 }
        if !lowItems.isEmpty {
            let names = lowItems.map(\.name).joined(separator: ", ")
            lowStockAlert = "Running low on: \(names). Time to reorder!"
        } else {
            let emptyItems = inventory.filter { $0.quantityRemaining <= 0 }
            if !emptyItems.isEmpty {
                let names = emptyItems.map(\.name).joined(separator: ", ")
                lowStockAlert = "Out of stock: \(names). Order now!"
            } else {
                lowStockAlert = nil
            }
        }
    }

    func delete(_ log: DoseLog) async {
        do {
            try await SupabaseService.shared.deleteDoseLog(id: log.id)
            await load()
        } catch {
            print("Delete log error: \(error)")
        }
    }

    private func resetForm() {
        newDose = ""
        newNotes = ""
        newDate = Date()
    }

    private func calculateStreak() {
        let calendar = Calendar.current
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()

        // Get unique days with logs
        var daysWithLogs = Set<DateComponents>()
        for log in logs {
            if let date = formatter.date(from: log.takenAt) ?? fallback.date(from: log.takenAt) {
                let comps = calendar.dateComponents([.year, .month, .day], from: date)
                daysWithLogs.insert(comps)
            }
        }

        var streak = 0
        var checkDate = Date()

        // Check if today has logs; if not, start from yesterday
        let todayComps = calendar.dateComponents([.year, .month, .day], from: checkDate)
        if !daysWithLogs.contains(todayComps) {
            checkDate = calendar.date(byAdding: .day, value: -1, to: checkDate) ?? checkDate
        }

        while true {
            let comps = calendar.dateComponents([.year, .month, .day], from: checkDate)
            if daysWithLogs.contains(comps) {
                streak += 1
                checkDate = calendar.date(byAdding: .day, value: -1, to: checkDate) ?? checkDate
            } else {
                break
            }
        }

        doseStreak = streak
    }

    func dayStatus(day: Int, month: Date) -> DayDoseStatus {
        let calendar = Calendar.current
        guard let dayDate = calendar.date(from: {
            var comps = calendar.dateComponents([.year, .month], from: month)
            comps.day = day
            return comps
        }()) else { return .none }

        // Don't show status for future days
        if dayDate > Date() { return .none }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()

        let dayLogs = logs.filter { log in
            if let date = formatter.date(from: log.takenAt) ?? fallback.date(from: log.takenAt) {
                return calendar.isDate(date, inSameDayAs: dayDate)
            }
            return false
        }

        if dayLogs.isEmpty {
            // Check if there were reminders for this day
            let weekday = calendar.component(.weekday, from: dayDate) - 1
            let hadReminders = reminders.contains { $0.active && $0.daysOfWeek.contains(weekday) }
            return hadReminders ? .missed : .none
        }

        // Check if all reminders were covered
        let weekday = calendar.component(.weekday, from: dayDate) - 1
        let dayReminders = reminders.filter { $0.active && $0.daysOfWeek.contains(weekday) }
        if dayReminders.isEmpty { return .allTaken }

        let loggedItemIds = Set(dayLogs.map(\.stackItemId))
        let reminderItemIds = Set(dayReminders.map(\.stackItemId))
        if reminderItemIds.isSubset(of: loggedItemIds) {
            return .allTaken
        }
        return .partial
    }
}
