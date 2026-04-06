import SwiftUI

struct InventoryView: View {
    @StateObject private var vm = InventoryViewModel()
    @State private var vialsAppeared = false
    @State private var showClearInventoryAlert = false
    @State private var editMode = false
    @State private var selectedForDeletion: Set<UUID> = []
    @State private var showVialScanner = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                LazyVStack(spacing: 12) {
                    // MARK: - Vial Tray
                    if !vm.items.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("YOUR VIALS")
                                    .font(.system(size: 11, weight: .semibold))
                                    .tracking(2)
                                    .foregroundColor(.cxStone)
                                Spacer()
                                Button {
                                    showClearInventoryAlert = true
                                } label: {
                                    HStack(spacing: 4) {
                                        Image(systemName: "trash")
                                            .font(.system(size: 11))
                                        Text("Clear All")
                                            .font(.system(size: 12, weight: .medium))
                                    }
                                    .foregroundColor(.red.opacity(0.7))
                                }
                            }

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 14) {
                                    ForEach(Array(vm.items.enumerated()), id: \.element.id) { index, item in
                                        TappableVial(
                                            name: item.name,
                                            dose: String(format: "%.1f", item.quantityRemaining),
                                            unit: item.unit,
                                            fillPercent: item.vialSize > 0 ? item.quantityRemaining / item.vialSize : 0.7,
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
                            icon: "shippingbox",
                            title: "No Inventory",
                            message: "Track your peptide vials, quantities, and expiry dates"
                        )
                    } else {
                        HStack {
                            Spacer()
                            if editMode {
                                if !selectedForDeletion.isEmpty {
                                    Button {
                                        Task {
                                            for id in selectedForDeletion {
                                                if let item = vm.items.first(where: { $0.id == id }) {
                                                    await vm.delete(item)
                                                }
                                            }
                                            selectedForDeletion = []
                                            editMode = false
                                        }
                                    } label: {
                                        Text("Delete (\(selectedForDeletion.count))")
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 6)
                                            .background(Color.red)
                                            .cornerRadius(8)
                                    }
                                }
                                Button {
                                    editMode = false
                                    selectedForDeletion = []
                                } label: {
                                    Text("Done")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.cxTeal)
                                }
                            } else {
                                Button {
                                    editMode = true
                                } label: {
                                    Text("Edit")
                                        .font(.system(size: 13))
                                        .foregroundColor(.cxTeal)
                                }
                            }
                        }

                        ForEach(vm.items) { item in
                            HStack(spacing: 12) {
                                if editMode {
                                    Button {
                                        if selectedForDeletion.contains(item.id) {
                                            selectedForDeletion.remove(item.id)
                                        } else {
                                            selectedForDeletion.insert(item.id)
                                        }
                                    } label: {
                                        Image(systemName: selectedForDeletion.contains(item.id) ? "checkmark.circle.fill" : "circle")
                                            .font(.system(size: 22))
                                            .foregroundColor(selectedForDeletion.contains(item.id) ? .red : .cxStone)
                                    }
                                }
                                InventoryCard(item: item, vm: vm)
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
            AddInventorySheet(vm: vm, showVialScanner: $showVialScanner)
        }
        .sheet(isPresented: $showVialScanner) {
            VialScannerView { scannedVials in
                await vm.addScannedVials(scannedVials)
            }
        }
        .alert("Clear Inventory", isPresented: $showClearInventoryAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Clear All", role: .destructive) {
                Task { await vm.clearAll() }
            }
        } message: {
            Text("Are you sure you want to remove all inventory items? This cannot be undone.")
        }
        .alert("Error", isPresented: Binding(
            get: { vm.errorMessage != nil },
            set: { if !$0 { vm.errorMessage = nil } }
        )) {
            Button("OK") { vm.errorMessage = nil }
        } message: {
            Text(vm.errorMessage ?? "")
        }
    }
}

struct InventoryCard: View {
    let item: InventoryItem
    @ObservedObject var vm: InventoryViewModel
    @State private var showDeleteAlert = false

    var stockColor: Color {
        if item.percentRemaining < 20 { return .red }
        if item.percentRemaining < 50 { return .orange }
        return .cxTeal
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(item.name)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.cxBlack)
                        if item.isLowStock {
                            Text("LOW")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.red)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(4)
                        }
                    }
                    Text("\(String(format: "%.1f", item.quantityRemaining)) / \(String(format: "%.1f", item.vialSize)) \(item.unit)")
                        .font(.system(size: 13))
                        .foregroundColor(.cxStone)
                }
                Spacer()
                Text("\(Int(item.percentRemaining))%")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(stockColor)
            }

            ProgressView(value: item.percentRemaining / 100)
                .progressViewStyle(LinearProgressViewStyle(tint: stockColor))

            HStack {
                if let expiry = item.expiryDate {
                    Label(formatExpiry(expiry), systemImage: "calendar")
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                }
                Spacer()
                Button {
                    showDeleteAlert = true
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 14))
                        .foregroundColor(.red.opacity(0.5))
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
        .alert("Delete \(item.name)?", isPresented: $showDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task { await vm.delete(item) }
            }
        } message: {
            Text("This will permanently remove this inventory item. This cannot be undone.")
        }
    }

    func formatExpiry(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) ?? fallback.date(from: iso) else { return iso }
        let df = DateFormatter()
        df.dateStyle = .medium
        return "Expires: \(df.string(from: date))"
    }
}

struct AddInventorySheet: View {
    @ObservedObject var vm: InventoryViewModel
    @Binding var showVialScanner: Bool
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
                Section {
                    Button {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            showVialScanner = true
                        }
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

                Section("Item Info") {
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
                    Picker("Unit", selection: $vm.newUnit) {
                        ForEach(vm.unitOptions, id: \.self) { Text($0) }
                    }
                    TextField("Vial Size", text: $vm.newVialSize)
                        .foregroundColor(.black)
                        .keyboardType(.decimalPad)
                    TextField("Quantity Remaining", text: $vm.newQuantity)
                        .foregroundColor(.black)
                        .keyboardType(.decimalPad)
                    DatePicker("Expiry Date", selection: $vm.newExpiry, displayedComponents: .date)
                }
                Section("Notes") {
                    TextField("Optional notes", text: $vm.newNotes, axis: .vertical)
                        .foregroundColor(.black)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Add Inventory")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        Task {
                            await vm.addItem()
                            if vm.errorMessage == nil {
                                dismiss()
                            }
                        }
                    }
                    .disabled(vm.newName.isEmpty || vm.newVialSize.isEmpty)
                }
            }
            .alert("Error", isPresented: Binding(
                get: { vm.errorMessage != nil },
                set: { if !$0 { vm.errorMessage = nil } }
            )) {
                Button("OK") { vm.errorMessage = nil }
            } message: {
                Text(vm.errorMessage ?? "")
            }
        }
    }
}
