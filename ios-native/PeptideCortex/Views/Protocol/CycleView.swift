import SwiftUI

struct CycleView: View {
    @StateObject private var vm = CycleViewModel()

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                LazyVStack(spacing: 12) {
                    if vm.isLoading {
                        LoadingView()
                            .frame(height: 200)
                    } else if vm.cycles.isEmpty {
                        EmptyStateView(
                            icon: "arrow.triangle.2.circlepath",
                            title: "No Cycles",
                            message: "Create a cycle to track your on/off protocol"
                        )
                    } else {
                        ForEach(vm.cycles) { cycle in
                            CycleCard(cycle: cycle, vm: vm)
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
            AddCycleSheet(vm: vm)
        }
    }
}

struct CycleCard: View {
    let cycle: Cycle
    @ObservedObject var vm: CycleViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(cycle.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.cxBlack)
                    Text(cycle.peptides.joined(separator: ", "))
                        .font(.system(size: 13))
                        .foregroundColor(.cxStone)
                        .lineLimit(1)
                }
                Spacer()
                HStack(spacing: 6) {
                    if cycle.completed {
                        Text("DONE")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.green)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(6)
                    } else {
                        Text(cycle.currentlyOn ? "ON" : "OFF")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(cycle.currentlyOn ? .cxTeal : .orange)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background((cycle.currentlyOn ? Color.cxTeal : .orange).opacity(0.1))
                            .cornerRadius(6)
                    }
                }
            }

            // Schedule
            HStack(spacing: 16) {
                Label("\(cycle.onWeeks)w on", systemImage: "checkmark.circle")
                    .font(.system(size: 13))
                    .foregroundColor(.cxTeal)
                Label("\(cycle.offWeeks)w off", systemImage: "pause.circle")
                    .font(.system(size: 13))
                    .foregroundColor(.orange)
            }

            // Progress
            if !cycle.completed {
                VStack(alignment: .leading, spacing: 4) {
                    let progress = vm.progress(for: cycle)
                    ProgressView(value: progress)
                        .progressViewStyle(LinearProgressViewStyle(tint: .cxTeal))
                    Text("\(Int(progress * 100))% complete")
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                }
            }

            if !cycle.notes.isEmpty {
                Text(cycle.notes)
                    .font(.system(size: 13))
                    .foregroundColor(.cxStone)
                    .lineLimit(2)
            }

            // Actions
            if !cycle.completed {
                HStack(spacing: 12) {
                    Button {
                        Task { await vm.toggleOn(cycle) }
                    } label: {
                        Text(cycle.currentlyOn ? "Go Off" : "Go On")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.cxTeal)
                    }
                    Button {
                        Task { await vm.markCompleted(cycle) }
                    } label: {
                        Text("Complete")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.green)
                    }
                    Spacer()
                    Button {
                        Task { await vm.delete(cycle) }
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 14))
                            .foregroundColor(.red.opacity(0.6))
                    }
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
    }
}

struct AddCycleSheet: View {
    @ObservedObject var vm: CycleViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Cycle Info") {
                    TextField("Cycle Name", text: $vm.newName)
                        .foregroundColor(.primary)
                    TextField("Peptides (comma-separated)", text: $vm.newPeptides)
                        .foregroundColor(.primary)
                }
                Section("Schedule") {
                    Stepper("On Weeks: \(vm.newOnWeeks)", value: $vm.newOnWeeks, in: 1...52)
                    Stepper("Off Weeks: \(vm.newOffWeeks)", value: $vm.newOffWeeks, in: 0...52)
                    DatePicker("Start Date", selection: $vm.newStartDate, displayedComponents: .date)
                }
                Section("Notes") {
                    TextField("Optional notes", text: $vm.newNotes, axis: .vertical)
                        .foregroundColor(.primary)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("New Cycle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") { Task { await vm.addCycle(); dismiss() } }
                        .disabled(vm.newName.isEmpty)
                }
            }
        }
    }
}
