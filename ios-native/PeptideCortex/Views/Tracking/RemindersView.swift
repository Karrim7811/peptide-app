import SwiftUI

struct RemindersView: View {
    @StateObject private var vm = ReminderViewModel()

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                LazyVStack(spacing: 12) {
                    if vm.isLoading {
                        LoadingView()
                            .frame(height: 200)
                    } else if vm.reminders.isEmpty {
                        EmptyStateView(
                            icon: "bell",
                            title: "No Reminders",
                            message: "Set up reminders to stay on top of your protocol"
                        )
                    } else {
                        ForEach(vm.reminders) { reminder in
                            ReminderCard(reminder: reminder, vm: vm)
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
            AddReminderSheet(vm: vm)
        }
    }
}

struct ReminderCard: View {
    let reminder: Reminder
    @ObservedObject var vm: ReminderViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(reminder.stackItem?.name ?? "Unknown")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.cxBlack)
                    HStack(spacing: 8) {
                        Image(systemName: "clock")
                            .font(.system(size: 13))
                            .foregroundColor(.cxTeal)
                        Text(reminder.time)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.cxBlack)
                        if !reminder.dose.isEmpty {
                            Text("- \(reminder.dose)")
                                .font(.system(size: 13))
                                .foregroundColor(.cxStone)
                        }
                    }
                }
                Spacer()
                Toggle("", isOn: Binding(
                    get: { reminder.active },
                    set: { _ in Task { await vm.toggleActive(reminder) } }
                ))
                .tint(.cxTeal)
                .labelsHidden()
            }

            // Days
            HStack(spacing: 6) {
                ForEach(0..<7) { day in
                    Text(vm.dayLabels[day].prefix(1))
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(reminder.daysOfWeek.contains(day) ? .white : .cxStone)
                        .frame(width: 28, height: 28)
                        .background(reminder.daysOfWeek.contains(day) ? Color.cxTeal : Color.cxParchment)
                        .cornerRadius(14)
                }
                Spacer()
                Button {
                    Task { await vm.delete(reminder) }
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
        .opacity(reminder.active ? 1 : 0.6)
    }
}

struct AddReminderSheet: View {
    @ObservedObject var vm: ReminderViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Reminder") {
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
                    DatePicker("Time", selection: $vm.newTime, displayedComponents: .hourAndMinute)
                    TextField("Dose (e.g., 250mcg)", text: $vm.newDose)
                        .foregroundColor(.primary)
                }

                Section("Days") {
                    HStack(spacing: 8) {
                        ForEach(0..<7) { day in
                            Button {
                                if vm.selectedDays.contains(day) {
                                    vm.selectedDays.remove(day)
                                } else {
                                    vm.selectedDays.insert(day)
                                }
                            } label: {
                                Text(vm.dayLabels[day])
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(vm.selectedDays.contains(day) ? .white : .cxBlack)
                                    .frame(width: 38, height: 34)
                                    .background(vm.selectedDays.contains(day) ? Color.cxTeal : Color.cxParchment)
                                    .cornerRadius(8)
                            }
                        }
                    }
                }
            }
            .navigationTitle("New Reminder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await vm.addReminder(); dismiss() } }
                        .disabled(vm.selectedStackItemId == nil)
                }
            }
        }
    }
}
