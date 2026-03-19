import Foundation

@MainActor
class SideEffectsViewModel: ObservableObject {
    @Published var effects: [SideEffect] = []
    @Published var isLoading = false
    @Published var showAddForm = false
    @Published var filterPeptide = "All"
    @Published var filterSeverity = 0  // 0 = all

    // Add form state
    @Published var newPeptideName = ""
    @Published var newEffect = ""
    @Published var newSeverity = 3
    @Published var newNotes = ""
    @Published var newDate = Date()

    var peptideNames: [String] {
        let names = Set(effects.map(\.peptideName))
        return ["All"] + names.sorted()
    }

    var filteredEffects: [SideEffect] {
        var result = effects
        if filterPeptide != "All" {
            result = result.filter { $0.peptideName == filterPeptide }
        }
        if filterSeverity > 0 {
            result = result.filter { $0.severity == filterSeverity }
        }
        return result
    }

    func load() async {
        isLoading = true
        do {
            effects = try await SupabaseService.shared.getSideEffects()
        } catch {
            print("Side effects load error: \(error)")
        }
        isLoading = false
    }

    func addEffect() async {
        guard !newPeptideName.isEmpty, !newEffect.isEmpty else { return }
        guard let userId = SupabaseService.shared.currentUserId else { return }
        let formatter = ISO8601DateFormatter()
        let effect = SideEffect(
            id: UUID(), userId: userId,
            peptideName: newPeptideName, effect: newEffect,
            severity: newSeverity,
            occurredAt: formatter.string(from: newDate),
            notes: newNotes, createdAt: nil
        )
        do {
            try await SupabaseService.shared.insertSideEffect(effect)
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add side effect error: \(error)")
        }
    }

    func delete(_ effect: SideEffect) async {
        do {
            try await SupabaseService.shared.deleteSideEffect(id: effect.id)
            await load()
        } catch {
            print("Delete side effect error: \(error)")
        }
    }

    private func resetForm() {
        newPeptideName = ""
        newEffect = ""
        newSeverity = 3
        newNotes = ""
        newDate = Date()
    }
}
