import Foundation

@MainActor
class DoseLogViewModel: ObservableObject {
    @Published var logs: [DoseLog] = []
    @Published var stackItems: [StackItem] = []
    @Published var inventory: [InventoryItem] = []
    @Published var isLoading = false
    @Published var showAddForm = false
    @Published var lowStockAlert: String?

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
            checkLowStock()
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
}
