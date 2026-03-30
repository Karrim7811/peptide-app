import SwiftUI

struct StackView: View {
    @StateObject private var vm = StackViewModel()
    @State private var vialsAppeared = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                LazyVStack(spacing: 12) {
                    // MARK: - Vial Tray
                    if !vm.items.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("YOUR VIALS")
                                .font(.system(size: 11, weight: .semibold))
                                .tracking(2)
                                .foregroundColor(.cxStone)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 14) {
                                    ForEach(Array(vm.items.enumerated()), id: \.element.id) { index, item in
                                        TappableVial(
                                            name: item.name,
                                            dose: item.dose,
                                            unit: item.unit,
                                            fillPercent: 0.7,
                                            isDueNow: false,
                                            usePhotoStyle: true,
                                            recon: nil
                                        )
                                        .scaleEffect(vialsAppeared ? 1.0 : 0.3)
                                        .opacity(vialsAppeared ? 1 : 0)
                                        .animation(
                                            .spring(response: 0.5, dampingFraction: 0.6)
                                            .delay(Double(index) * 0.08),
                                            value: vialsAppeared
                                        )
                                    }
                                }
                                .padding(.vertical, 8)
                                .padding(.horizontal, 4)
                            }
                        }
                        .onAppear {
                            withAnimation { vialsAppeared = true }
                        }
                    }

                    if vm.isLoading {
                        LoadingView()
                            .frame(height: 200)
                    } else if vm.items.isEmpty {
                        EmptyStateView(
                            icon: "square.stack.3d.up",
                            title: "No Stack Items",
                            message: "Add peptides, medications, or supplements to your stack"
                        )
                    } else {
                        ForEach(vm.items) { item in
                            StackItemCard(item: item, vm: vm)
                        }
                    }
                }
                .padding()
            }
            .background(Color.cxParchment)

            // FAB
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
            AddStackItemSheet(vm: vm)
        }
    }
}

struct StackItemCard: View {
    let item: StackItem
    @ObservedObject var vm: StackViewModel

    var typeColor: Color {
        switch item.type {
        case "peptide": return .cxTeal
        case "medication": return .blue
        case "supplement": return .green
        default: return .gray
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(item.name)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.cxBlack)
                        Text(item.type.uppercased())
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(typeColor)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(typeColor.opacity(0.1))
                            .cornerRadius(6)
                    }
                    Text("\(item.dose) \(item.unit)")
                        .font(.system(size: 14))
                        .foregroundColor(.cxStone)
                }
                Spacer()
                Button {
                    Task { await vm.toggleActive(item) }
                } label: {
                    Image(systemName: item.active ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 22))
                        .foregroundColor(item.active ? .cxTeal : .cxStone)
                }
            }

            if !item.notes.isEmpty {
                Text(item.notes)
                    .font(.system(size: 13))
                    .foregroundColor(.cxStone)
                    .lineLimit(2)
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
        .opacity(item.active ? 1 : 0.6)
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                Task { await vm.delete(item) }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

struct AddStackItemSheet: View {
    @ObservedObject var vm: StackViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showSuggestions = false

    private var suggestions: [String] {
        guard !vm.newName.isEmpty else { return [] }
        let q = vm.newName.lowercased()
        return PeptideDataStore.shared.allNames.filter { $0.lowercased().contains(q) }
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Details") {
                    VStack(alignment: .leading, spacing: 4) {
                        TextField("Name", text: $vm.newName)
                            .foregroundColor(.black)
                            .onChange(of: vm.newName) { _ in showSuggestions = !vm.newName.isEmpty }
                        if showSuggestions && !suggestions.isEmpty {
                            ScrollView {
                                VStack(alignment: .leading, spacing: 0) {
                                    ForEach(suggestions.prefix(6), id: \.self) { name in
                                        Button {
                                            vm.newName = name
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
                    Picker("Type", selection: $vm.newType) {
                        ForEach(vm.typeOptions, id: \.self) { Text($0.capitalized) }
                    }
                    HStack {
                        TextField("Dose", text: $vm.newDose)
                            .foregroundColor(.black)
                            .keyboardType(.decimalPad)
                        Picker("Unit", selection: $vm.newUnit) {
                            ForEach(vm.unitOptions, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)
                    }
                }
                Section("Notes") {
                    TextField("Optional notes", text: $vm.newNotes, axis: .vertical)
                        .foregroundColor(.black)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Add to Stack")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { Task { await vm.addItem(); dismiss() } }
                        .disabled(vm.newName.isEmpty)
                }
            }
        }
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundColor(.cxStone.opacity(0.5))
            Text(title)
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.cxBlack)
            Text(message)
                .font(.system(size: 14))
                .foregroundColor(.cxStone)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity)
    }
}
