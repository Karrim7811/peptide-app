import Foundation

@MainActor
class NotesViewModel: ObservableObject {
    @Published var notes: [ResearchNote] = []
    @Published var isLoading = false
    @Published var showAddForm = false
    @Published var filterPeptide = "All"

    // Add form state
    @Published var newPeptideName = ""
    @Published var newNote = ""
    @Published var newUrl = ""

    var peptideNames: [String] {
        let names = Set(notes.map(\.peptideName))
        return ["All"] + names.sorted()
    }

    var filteredNotes: [ResearchNote] {
        if filterPeptide == "All" { return notes }
        return notes.filter { $0.peptideName == filterPeptide }
    }

    var groupedNotes: [(String, [ResearchNote])] {
        let grouped = Dictionary(grouping: filteredNotes, by: \.peptideName)
        return grouped.sorted { $0.key < $1.key }
    }

    func load() async {
        isLoading = true
        do {
            notes = try await SupabaseService.shared.getResearchNotes()
        } catch {
            print("Notes load error: \(error)")
        }
        isLoading = false
    }

    func addNote() async {
        guard !newPeptideName.isEmpty, !newNote.isEmpty else { return }
        guard let userId = SupabaseService.shared.currentUserId else { return }
        let note = ResearchNote(
            id: UUID(), userId: userId,
            peptideName: newPeptideName,
            note: newNote,
            url: newUrl.isEmpty ? nil : newUrl,
            createdAt: nil
        )
        do {
            try await SupabaseService.shared.insertResearchNote(note)
            resetForm()
            showAddForm = false
            await load()
        } catch {
            print("Add note error: \(error)")
        }
    }

    func delete(_ note: ResearchNote) async {
        do {
            try await SupabaseService.shared.deleteResearchNote(id: note.id)
            await load()
        } catch {
            print("Delete note error: \(error)")
        }
    }

    private func resetForm() {
        newPeptideName = ""
        newNote = ""
        newUrl = ""
    }
}
