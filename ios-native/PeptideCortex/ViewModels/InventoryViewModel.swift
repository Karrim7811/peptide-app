import Foundation

@MainActor
class InventoryViewModel: ObservableObject {
    @Published var items: [InventoryItem] = []
    @Published var isLoading = false
    @Published var showAddForm = false
    @Published var errorMessage: String?

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
            errorMessage = "Failed to load inventory: \(error.localizedDescription)"
        }
        isLoading = false
    }

    func addItem() async {
        guard !newName.isEmpty,
              let vialSize = Double(newVialSize), vialSize > 0 else {
            errorMessage = "Please enter a name and valid vial size."
            return
        }
        guard let userId = SupabaseService.shared.currentUserId else {
            errorMessage = "Not signed in. Please sign in and try again."
            return
        }
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
            errorMessage = "Failed to add item: \(error.localizedDescription)"
        }
    }

    /// Batch-add scanned vials directly to inventory
    func addScannedVials(_ vials: [ScannedVial]) async {
        guard let userId = SupabaseService.shared.currentUserId else {
            errorMessage = "Not signed in. Please sign in and try again."
            return
        }
        let formatter = ISO8601DateFormatter()
        var added = 0
        for vial in vials {
            let amt = vial.amount.filter { $0.isNumber || $0 == "." }
            let vialSize = Double(amt) ?? 5.0
            let item = InventoryItem(
                id: UUID(), userId: userId,
                name: vial.name, unit: "mg",
                vialSize: vialSize,
                quantityRemaining: vialSize,
                expiryDate: formatter.string(from: Date()),
                notes: vial.notes, createdAt: nil
            )
            do {
                try await SupabaseService.shared.insertInventoryItem(item)
                added += 1
            } catch {
                print("Add scanned vial error: \(error)")
                errorMessage = "Failed to save \(vial.name): \(error.localizedDescription)"
            }
        }
        if added > 0 {
            await load()
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
