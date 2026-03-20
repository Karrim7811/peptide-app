import SwiftUI

struct DoseLogView: View {
    @StateObject private var vm = DoseLogViewModel()

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                LazyVStack(spacing: 12) {
                    // Low stock warning
                    if let alert = vm.lowStockAlert {
                        HStack(spacing: 10) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text(alert)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.cxBlack)
                        }
                        .padding(14)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
                        )
                    }

                    if vm.isLoading {
                        LoadingView()
                            .frame(height: 200)
                    } else if vm.logs.isEmpty {
                        EmptyStateView(
                            icon: "book",
                            title: "No Dose Logs",
                            message: "Log your doses to track consistency and progress"
                        )
                    } else {
                        ForEach(vm.logs) { log in
                            DoseLogCard(log: log, vm: vm)
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
            AddDoseLogSheet(vm: vm)
        }
    }
}

struct DoseLogCard: View {
    let log: DoseLog
    @ObservedObject var vm: DoseLogViewModel

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.cxTeal.opacity(0.15))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: "syringe.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.cxTeal)
                )
            VStack(alignment: .leading, spacing: 4) {
                Text(log.stackItem?.name ?? "Unknown")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.cxBlack)
                HStack(spacing: 8) {
                    Text(log.dose)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.cxTeal)
                    Text(formatDate(log.takenAt))
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                }
                if !log.notes.isEmpty {
                    Text(log.notes)
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                        .lineLimit(1)
                }
            }
            Spacer()
            Button {
                Task { await vm.delete(log) }
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 14))
                    .foregroundColor(.red.opacity(0.5))
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
    }

    func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) ?? fallback.date(from: iso) else { return iso }
        let df = DateFormatter()
        df.dateStyle = .medium
        df.timeStyle = .short
        return df.string(from: date)
    }
}

struct AddDoseLogSheet: View {
    @ObservedObject var vm: DoseLogViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Details") {
                    if vm.stackItems.isEmpty {
                        Text("Add items to your stack first")
                            .foregroundColor(.cxStone)
                    } else {
                        Picker("Compound", selection: $vm.selectedStackItemId) {
                            ForEach(vm.stackItems) { item in
                                Text(item.name).tag(Optional(item.id))
                            }
                        }
                    }
                    TextField("Dose (e.g., 250mcg)", text: $vm.newDose)
                        .foregroundColor(.primary)
                    DatePicker("Taken At", selection: $vm.newDate)
                }
                Section("Notes") {
                    TextField("Optional notes", text: $vm.newNotes, axis: .vertical)
                        .foregroundColor(.primary)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Log Dose")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Log") { Task { await vm.addLog(); dismiss() } }
                        .disabled(vm.selectedStackItemId == nil)
                }
            }
        }
    }
}
