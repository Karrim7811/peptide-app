import SwiftUI

struct SideEffectsView: View {
    @StateObject private var vm = SideEffectsViewModel()

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                VStack(spacing: 12) {
                    // Filters
                    HStack(spacing: 10) {
                        Menu {
                            ForEach(vm.peptideNames, id: \.self) { name in
                                Button(name) { vm.filterPeptide = name }
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Text(vm.filterPeptide)
                                    .font(.system(size: 13))
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 10))
                            }
                            .foregroundColor(.cxBlack)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .cornerRadius(8)
                        }

                        Menu {
                            Button("All Severities") { vm.filterSeverity = 0 }
                            ForEach(1...5, id: \.self) { level in
                                Button("Severity \(level)") { vm.filterSeverity = level }
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Text(vm.filterSeverity == 0 ? "All Severities" : "Severity \(vm.filterSeverity)")
                                    .font(.system(size: 13))
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 10))
                            }
                            .foregroundColor(.cxBlack)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .cornerRadius(8)
                        }

                        Spacer()
                    }

                    if vm.isLoading {
                        LoadingView()
                            .frame(height: 200)
                    } else if vm.filteredEffects.isEmpty {
                        EmptyStateView(
                            icon: "exclamationmark.triangle",
                            title: "No Side Effects",
                            message: "Track any side effects you experience"
                        )
                    } else {
                        LazyVStack(spacing: 10) {
                            ForEach(vm.filteredEffects) { effect in
                                SideEffectCard(effect: effect, vm: vm)
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
            AddSideEffectSheet(vm: vm)
        }
    }
}

struct SideEffectCard: View {
    let effect: SideEffect
    @ObservedObject var vm: SideEffectsViewModel

    var severityColor: Color {
        switch effect.severity {
        case 1: return .green
        case 2: return .blue
        case 3: return .orange
        case 4: return .red.opacity(0.7)
        case 5: return .red
        default: return .gray
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            // Severity indicator
            RoundedRectangle(cornerRadius: 3)
                .fill(severityColor)
                .frame(width: 6)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(effect.effect)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.cxBlack)
                    Spacer()
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { i in
                            Image(systemName: i <= effect.severity ? "circle.fill" : "circle")
                                .font(.system(size: 6))
                                .foregroundColor(i <= effect.severity ? severityColor : .cxStone.opacity(0.3))
                        }
                    }
                }
                HStack(spacing: 8) {
                    Text(effect.peptideName)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.cxTeal)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.cxTeal.opacity(0.1))
                        .cornerRadius(6)
                    Text(formatDate(effect.occurredAt))
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                    Spacer()
                    Button {
                        Task { await vm.delete(effect) }
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 13))
                            .foregroundColor(.red.opacity(0.4))
                    }
                }
                if !effect.notes.isEmpty {
                    Text(effect.notes)
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                        .lineLimit(2)
                }
            }
        }
        .padding(12)
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

struct AddSideEffectSheet: View {
    @ObservedObject var vm: SideEffectsViewModel
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
                Section("Details") {
                    VStack(alignment: .leading, spacing: 4) {
                        TextField("Peptide Name", text: $vm.newPeptideName)
                            .foregroundColor(.black)
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
                    TextField("Side Effect", text: $vm.newEffect)
                        .foregroundColor(.black)
                    Stepper("Severity: \(vm.newSeverity)/5", value: $vm.newSeverity, in: 1...5)
                    DatePicker("Occurred At", selection: $vm.newDate)
                }
                Section("Notes") {
                    TextField("Optional notes", text: $vm.newNotes, axis: .vertical)
                        .foregroundColor(.black)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Log Side Effect")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await vm.addEffect(); dismiss() } }
                        .disabled(vm.newPeptideName.isEmpty || vm.newEffect.isEmpty)
                }
            }
        }
    }
}
