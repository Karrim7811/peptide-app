import Foundation

@MainActor
class CycleViewModel: ObservableObject {
    @Published var cycles: [Cycle] = []
    @Published var isLoading = false
    @Published var showAddForm = false

    // Add form state
    @Published var newName = ""
    @Published var newPeptides = ""
    @Published var newOnWeeks = 4
    @Published var newOffWeeks = 2
    @Published var newStartDate = Date()
    @Published var newNotes = ""

    func load() async {
        isLoading = true
        do {
            cycles = try await SupabaseService.shared.getCycles()
        } catch {
            print("Cycle load error: \(error)")
        }
        isLoading = false
    }

    func addCycle() async {
        guard !newName.isEmpty else { return }
        guard let userId = SupabaseService.shared.currentUserId else { return }
        let formatter = ISO8601DateFormatter()
        let cycle = Cycle(
            id: UUID(), userId: userId,
            name: newName,
            peptides: newPeptides.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) },
            onWeeks: newOnWeeks, offWeeks: newOffWeeks,
            startDate: formatter.string(from: newStartDate),
            currentlyOn: true, completed: false,
            notes: newNotes, createdAt: nil
        )
        do {
            try await SupabaseService.shared.insertCycle(cycle)
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add cycle error: \(error)")
        }
    }

    func toggleOn(_ cycle: Cycle) async {
        var updated = cycle
        updated.currentlyOn.toggle()
        do {
            try await SupabaseService.shared.updateCycle(updated)
            await load()
        } catch {
            print("Toggle cycle error: \(error)")
        }
    }

    func markCompleted(_ cycle: Cycle) async {
        var updated = cycle
        updated.completed = true
        updated.currentlyOn = false
        do {
            try await SupabaseService.shared.updateCycle(updated)
            await load()
        } catch {
            print("Complete cycle error: \(error)")
        }
    }

    func delete(_ cycle: Cycle) async {
        do {
            try await SupabaseService.shared.deleteCycle(id: cycle.id)
            await load()
        } catch {
            print("Delete cycle error: \(error)")
        }
    }

    func progress(for cycle: Cycle) -> Double {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()
        guard let start = formatter.date(from: cycle.startDate) ?? fallback.date(from: cycle.startDate) else { return 0 }
        let totalDays = Double((cycle.onWeeks + cycle.offWeeks) * 7)
        guard totalDays > 0 else { return 0 }
        let elapsed = Date().timeIntervalSince(start) / 86400
        return min(max(elapsed / totalDays, 0), 1)
    }

    private func resetForm() {
        newName = ""
        newPeptides = ""
        newOnWeeks = 4
        newOffWeeks = 2
        newStartDate = Date()
        newNotes = ""
    }
}
