import Foundation

@MainActor
class ReminderViewModel: ObservableObject {
    @Published var reminders: [Reminder] = []
    @Published var stackItems: [StackItem] = []
    @Published var isLoading = false
    @Published var showAddForm = false

    // Add form state
    @Published var selectedStackItemId: UUID?
    @Published var newTime = Date()
    @Published var newDose = ""
    @Published var selectedDays: Set<Int> = [1, 2, 3, 4, 5] // Mon-Fri

    let dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    func load() async {
        isLoading = true
        do {
            reminders = try await SupabaseService.shared.getReminders()
            stackItems = try await SupabaseService.shared.getStackItems()
            if selectedStackItemId == nil {
                selectedStackItemId = stackItems.first?.id
            }
        } catch {
            print("Reminder load error: \(error)")
        }
        isLoading = false
    }

    func addReminder() async {
        guard let userId = SupabaseService.shared.currentUserId,
              let stackItemId = selectedStackItemId else { return }
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        let reminder = Reminder(
            id: UUID(), userId: userId,
            stackItemId: stackItemId,
            time: formatter.string(from: newTime),
            daysOfWeek: Array(selectedDays).sorted(),
            dose: newDose, active: true,
            createdAt: nil, stackItem: nil
        )
        do {
            try await SupabaseService.shared.insertReminder(reminder)
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add reminder error: \(error)")
        }
    }

    func toggleActive(_ reminder: Reminder) async {
        var updated = reminder
        updated.active.toggle()
        do {
            try await SupabaseService.shared.updateReminder(updated)
            await load()
        } catch {
            print("Toggle reminder error: \(error)")
        }
    }

    func delete(_ reminder: Reminder) async {
        do {
            try await SupabaseService.shared.deleteReminder(id: reminder.id)
            await load()
        } catch {
            print("Delete reminder error: \(error)")
        }
    }

    private func resetForm() {
        newDose = ""
        newTime = Date()
        selectedDays = [1, 2, 3, 4, 5]
    }
}
