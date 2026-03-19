import Foundation

@MainActor
class DoseLogViewModel: ObservableObject {
    @Published var logs: [DoseLog] = []
    @Published var stackItems: [StackItem] = []
    @Published var isLoading = false
    @Published var showAddForm = false

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
            if selectedStackItemId == nil {
                selectedStackItemId = stackItems.first?.id
            }
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
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add dose log error: \(error)")
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
}
