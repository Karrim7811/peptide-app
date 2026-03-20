import SwiftUI

struct NotesView: View {
    @StateObject private var vm = NotesViewModel()

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                VStack(spacing: 12) {
                    // Filter
                    if vm.peptideNames.count > 1 {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(vm.peptideNames, id: \.self) { name in
                                    Button {
                                        vm.filterPeptide = name
                                    } label: {
                                        Text(name)
                                            .font(.system(size: 13, weight: .medium))
                                            .foregroundColor(vm.filterPeptide == name ? .white : .cxBlack)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 8)
                                            .background(vm.filterPeptide == name ? Color.cxTeal : Color.white)
                                            .cornerRadius(20)
                                    }
                                }
                            }
                        }
                    }

                    if vm.isLoading {
                        LoadingView()
                            .frame(height: 200)
                    } else if vm.filteredNotes.isEmpty {
                        EmptyStateView(
                            icon: "doc.text",
                            title: "No Research Notes",
                            message: "Save research notes, links, and observations about peptides"
                        )
                    } else {
                        ForEach(vm.groupedNotes, id: \.0) { peptideName, notes in
                            VStack(alignment: .leading, spacing: 8) {
                                Text(peptideName.uppercased())
                                    .font(.system(size: 11, weight: .semibold))
                                    .tracking(2)
                                    .foregroundColor(.cxStone)
                                    .padding(.top, 8)

                                ForEach(notes) { note in
                                    NoteCard(note: note, vm: vm)
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Color.cxParchment)

            Button {
                vm.showAddForm = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.cxTeal)
                    .cornerRadius(28)
                    .shadow(color: Color.cxTeal.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .padding(20)
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .sheet(isPresented: $vm.showAddForm) {
            AddNoteSheet(vm: vm)
        }
    }
}

struct NoteCard: View {
    let note: ResearchNote
    @ObservedObject var vm: NotesViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(note.note)
                .font(.system(size: 14))
                .foregroundColor(.cxBlack)
                .lineSpacing(3)

            HStack {
                if let url = note.url, !url.isEmpty {
                    Link(destination: URL(string: url) ?? URL(string: "https://")!) {
                        HStack(spacing: 4) {
                            Image(systemName: "link")
                                .font(.system(size: 12))
                            Text("Source")
                                .font(.system(size: 12))
                        }
                        .foregroundColor(.cxTeal)
                    }
                }

                if let created = note.createdAt {
                    Text(formatDate(created))
                        .font(.system(size: 11))
                        .foregroundColor(.cxStone)
                }

                Spacer()

                Button {
                    Task { await vm.delete(note) }
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 13))
                        .foregroundColor(.red.opacity(0.4))
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
    }

    func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) ?? fallback.date(from: iso) else { return iso }
        let df = DateFormatter()
        df.dateStyle = .medium
        return df.string(from: date)
    }
}

struct AddNoteSheet: View {
    @ObservedObject var vm: NotesViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showSuggestions = false

    private var suggestions: [String] {
        guard !vm.newPeptideName.isEmpty else { return [] }
        let q = vm.newPeptideName.lowercased()
        return PeptideDataStore.shared.allNames.filter { $0.lowercased().contains(q) }
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Note") {
                    VStack(alignment: .leading, spacing: 4) {
                        TextField("Peptide Name", text: $vm.newPeptideName)
                            .foregroundColor(.primary)
                            .onChange(of: vm.newPeptideName) { _ in showSuggestions = !vm.newPeptideName.isEmpty }
                        if showSuggestions && !suggestions.isEmpty {
                            ScrollView {
                                VStack(alignment: .leading, spacing: 0) {
                                    ForEach(suggestions.prefix(6), id: \.self) { name in
                                        Button {
                                            vm.newPeptideName = name
                                            showSuggestions = false
                                        } label: {
                                            Text(name)
                                                .font(.system(size: 14))
                                                .foregroundColor(.cxBlack)
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                                .padding(.vertical, 8)
                                                .padding(.horizontal, 4)
                                        }
                                        Divider()
                                    }
                                }
                            }
                            .frame(maxHeight: 180)
                        }
                    }
                    TextField("Your note or observation", text: $vm.newNote, axis: .vertical)
                        .foregroundColor(.primary)
                        .lineLimit(4...10)
                }
                Section("Source (Optional)") {
                    TextField("URL link", text: $vm.newUrl)
                        .foregroundColor(.primary)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                }
            }
            .navigationTitle("New Note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await vm.addNote(); dismiss() } }
                        .disabled(vm.newPeptideName.isEmpty || vm.newNote.isEmpty)
                }
            }
        }
    }
}
