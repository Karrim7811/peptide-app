import Foundation

@MainActor
class ReminderViewModel: ObservableObject {
    @Published var reminders: [Reminder] = []
    @Published var stackItems: [StackItem] = []
    @Published var isLoading = false
    @Published var showAddForm = false
    @Published var calendarMessage: String?
    @Published var isAddingToCalendar = false

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
            // Keep device alarms in sync with the DB (covers add/toggle/delete).
            await NotificationService.shared.syncAll(reminders)
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
        // Ask for notification permission the first time a reminder is created,
        // so the alarms scheduled in load() can actually fire.
        await NotificationService.shared.requestAuthorization()
        do {
            try await SupabaseService.shared.insertReminder(reminder)
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add reminder error: \(error)")
        }
    }

    func addAllToCalendar() async {
        isAddingToCalendar = true
        let active = reminders.filter { $0.active && !$0.daysOfWeek.isEmpty }
        if active.isEmpty {
            calendarMessage = "No active reminders to add."
            isAddingToCalendar = false
            return
        }
        let ok = await NotificationService.shared.addToCalendar(active)
        calendarMessage = ok
            ? "Added \(active.count) reminder\(active.count == 1 ? "" : "s") to your calendar."
            : "Couldn't add to your calendar. Enable calendar access in Settings."
        isAddingToCalendar = false
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
