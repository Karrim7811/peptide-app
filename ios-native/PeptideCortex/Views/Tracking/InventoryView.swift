import SwiftUI

struct InventoryView: View {
    @StateObject private var vm = InventoryViewModel()

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                LazyVStack(spacing: 12) {
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
                        ForEach(vm.items) { item in
                            InventoryCard(item: item, vm: vm)
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
            AddInventorySheet(vm: vm)
        }
    }
}

struct InventoryCard: View {
    let item: InventoryItem
    @ObservedObject var vm: InventoryViewModel

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
                    Task { await vm.delete(item) }
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
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Item Info") {
                    TextField("Name", text: $vm.newName)
                    Picker("Unit", selection: $vm.newUnit) {
                        ForEach(vm.unitOptions, id: \.self) { Text($0) }
                    }
                    TextField("Vial Size", text: $vm.newVialSize)
                        .keyboardType(.decimalPad)
                    TextField("Quantity Remaining", text: $vm.newQuantity)
                        .keyboardType(.decimalPad)
                    DatePicker("Expiry Date", selection: $vm.newExpiry, displayedComponents: .date)
                }
                Section("Notes") {
                    TextField("Optional notes", text: $vm.newNotes, axis: .vertical)
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
                    Button("Add") { Task { await vm.addItem(); dismiss() } }
                        .disabled(vm.newName.isEmpty || vm.newVialSize.isEmpty)
                }
            }
        }
    }
}
