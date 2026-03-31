import Foundation

@MainActor
class InventoryViewModel: ObservableObject {
    @Published var items: [InventoryItem] = []
    @Published var isLoading = false
    @Published var showAddForm = false

    // Add form state
    @Published var newName = ""
    @Published var newUnit = "mg"
    @Published var newVialSize = ""
    @Published var newQuantity = ""
    @Published var newExpiry = Date()
    @Published var newNotes = ""

    let unitOptions = ["mg", "mcg", "mL", "IU"]

    func load() async {
        isLoading = true
        do {
            items = try await SupabaseService.shared.getInventory()
        } catch {
            print("Inventory load error: \(error)")
        }
        isLoading = false
    }

    func addItem() async {
        guard !newName.isEmpty,
              let vialSize = Double(newVialSize), vialSize > 0 else { return }
        guard let userId = SupabaseService.shared.currentUserId else { return }
        let formatter = ISO8601DateFormatter()
        let item = InventoryItem(
            id: UUID(), userId: userId,
            name: newName, unit: newUnit,
            vialSize: vialSize,
            quantityRemaining: Double(newQuantity) ?? vialSize,
            expiryDate: formatter.string(from: newExpiry),
            notes: newNotes, createdAt: nil
        )
        do {
            try await SupabaseService.shared.insertInventoryItem(item)
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add inventory error: \(error)")
        }
    }

    func updateQuantity(_ item: InventoryItem, newQty: Double) async {
        var updated = item
        updated.quantityRemaining = newQty
        do {
            try await SupabaseService.shared.updateInventoryItem(updated)
            await load()
        } catch {
            print("Update inventory error: \(error)")
        }
    }

    func delete(_ item: InventoryItem) async {
        do {
            try await SupabaseService.shared.deleteInventoryItem(id: item.id)
            await load()
        } catch {
            print("Delete inventory error: \(error)")
        }
    }

    func clearAll() async {
        do {
            for item in items {
                try await SupabaseService.shared.deleteInventoryItem(id: item.id)
            }
            await load()
        } catch {
            print("Clear all inventory error: \(error)")
        }
    }

    private func resetForm() {
        newName = ""
        newUnit = "mg"
        newVialSize = ""
        newQuantity = ""
        newExpiry = Date()
        newNotes = ""
    }
}
