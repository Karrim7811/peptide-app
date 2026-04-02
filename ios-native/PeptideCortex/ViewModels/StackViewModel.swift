import Foundation

@MainActor
class StackViewModel: ObservableObject {
    @Published var items: [StackItem] = []
    @Published var isLoading = false
    @Published var showAddForm = false

    // Add form state
    @Published var newName = ""
    @Published var newType = "peptide"
    @Published var newDose = ""
    @Published var newUnit = "mcg"
    @Published var newNotes = ""

    let typeOptions = ["peptide", "medication", "supplement"]
    let unitOptions = ["mcg", "mg", "IU", "mL"]

    func load() async {
        isLoading = true
        do {
            items = try await SupabaseService.shared.getStackItems()
        } catch {
            print("Stack load error: \(error)")
        }
        isLoading = false
    }

    func addItem() async {
        guard !newName.isEmpty else { return }
        guard let userId = SupabaseService.shared.currentUserId else { return }
        let item = StackItem(
            id: UUID(), userId: userId,
            name: newName, type: newType, dose: newDose,
            unit: newUnit, notes: newNotes, active: true,
            createdAt: nil
        )
        do {
            try await SupabaseService.shared.insertStackItem(item)
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add stack item error: \(error)")
        }
    }

    /// Batch-add scanned vials directly to stack
    func addScannedVials(_ vials: [ScannedVial]) async {
        guard let userId = SupabaseService.shared.currentUserId else { return }
        for vial in vials {
            let item = StackItem(
                id: UUID(), userId: userId,
                name: vial.name,
                type: vial.type.isEmpty ? "peptide" : vial.type,
                dose: "", unit: "mcg",
                notes: vial.notes, active: true,
                createdAt: nil
            )
            do {
                try await SupabaseService.shared.insertStackItem(item)
            } catch {
                print("Add scanned vial error: \(error)")
            }
        }
        await load()
    }

    func toggleActive(_ item: StackItem) async {
        var updated = item
        updated.active.toggle()
        do {
            try await SupabaseService.shared.updateStackItem(updated)
            await load()
        } catch {
            print("Toggle error: \(error)")
        }
    }

    func delete(_ item: StackItem) async {
        do {
            try await SupabaseService.shared.deleteStackItem(id: item.id)
            await load()
        } catch {
            print("Delete error: \(error)")
        }
    }

    func clearAll() async {
        do {
            for item in items {
                try await SupabaseService.shared.deleteStackItem(id: item.id)
            }
            await load()
        } catch {
            print("Clear all error: \(error)")
        }
    }

    private func resetForm() {
        newName = ""
        newType = "peptide"
        newDose = ""
        newUnit = "mcg"
        newNotes = ""
    }
}
