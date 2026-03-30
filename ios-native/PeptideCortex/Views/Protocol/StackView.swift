import SwiftUI

struct StackView: View {
    @StateObject private var vm = StackViewModel()
    @State private var vialsAppeared = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                LazyVStack(spacing: 14) {
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
                        Text("YOUR STACK")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.cxStone)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        ForEach(Array(vm.items.enumerated()), id: \.element.id) { index, item in
                            StackVialRow(item: item, vm: vm)
                                .scaleEffect(vialsAppeared ? 1.0 : 0.8)
                                .opacity(vialsAppeared ? 1 : 0)
                                .animation(
                                    .spring(response: 0.4, dampingFraction: 0.7)
                                    .delay(Double(index) * 0.06),
                                    value: vialsAppeared
                                )
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
        .onAppear { withAnimation { vialsAppeared = true } }
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .sheet(isPresented: $vm.showAddForm) {
            AddStackItemSheet(vm: vm)
        }
    }
}

struct StackVialRow: View {
    let item: StackItem
    @ObservedObject var vm: StackViewModel
    @State private var showDetail = false

    var body: some View {
        HStack(spacing: 16) {
            // Vial
            TappableVial(
                name: item.name,
                dose: item.dose,
                unit: item.unit,
                fillPercent: item.active ? 0.7 : 0.2,
                isDueNow: false,
                usePhotoStyle: true,
                recon: nil,
                showLabel: false,
                size: 1.5
            )

            Spacer()

            // Active toggle
            Button {
                Task { await vm.toggleActive(item) }
            } label: {
                Image(systemName: item.active ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 24))
                    .foregroundColor(item.active ? .cxTeal : .cxStone)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
        .opacity(item.active ? 1 : 0.5)
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                Task { await vm.delete(item) }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

// Keep for backward compatibility
struct StackItemCard: View {
    let item: StackItem
    @ObservedObject var vm: StackViewModel
    var body: some View {
        StackVialRow(item: item, vm: vm)
    }
}

struct AddStackItemSheet: View {
    @ObservedObject var vm: StackViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showSuggestions = false
    @State private var showVialScanner = false

    private var suggestions: [String] {
        guard !vm.newName.isEmpty else { return [] }
        let q = vm.newName.lowercased()
        return PeptideDataStore.shared.allNames.filter { $0.lowercased().contains(q) }
    }

    var body: some View {
        NavigationView {
            Form {
                Section {
                    Button {
                        showVialScanner = true
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "camera.viewfinder")
                                .font(.system(size: 18))
                            Text("Scan Vials")
                                .font(.system(size: 15, weight: .semibold))
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 13))
                                .foregroundColor(.cxStone)
                        }
                        .foregroundColor(.cxTeal)
                    }
                }

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
            .sheet(isPresented: $showVialScanner) {
                VialScannerView { scannedVials in
                    guard let first = scannedVials.first else { return }
                    // Auto-fill with first scanned vial
                    vm.newName = first.name
                    vm.newType = first.type.isEmpty ? "peptide" : first.type
                    vm.newNotes = first.notes
                    // If there are multiple, add the rest directly
                    if scannedVials.count > 1 {
                        Task {
                            for vial in scannedVials.dropFirst() {
                                vm.newName = vial.name
                                vm.newType = vial.type.isEmpty ? "peptide" : vial.type
                                vm.newNotes = vial.notes
                                await vm.addItem()
                            }
                            // Restore first item in form
                            vm.newName = first.name
                            vm.newType = first.type.isEmpty ? "peptide" : first.type
                            vm.newNotes = first.notes
                        }
                    }
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
