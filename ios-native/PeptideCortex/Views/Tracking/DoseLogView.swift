import SwiftUI

enum DoseLogViewMode: String, CaseIterable {
    case list = "List View"
    case calendar = "Calendar View"
}

enum DoseTimeGroup: String, CaseIterable {
    case morning = "Morning"
    case afternoon = "Afternoon"
    case evening = "Evening"

    var icon: String {
        switch self {
        case .morning: return "sunrise.fill"
        case .afternoon: return "sun.max.fill"
        case .evening: return "moon.fill"
        }
    }

    var color: Color {
        switch self {
        case .morning: return .orange
        case .afternoon: return .yellow
        case .evening: return .indigo
        }
    }
}

struct DoseLogView: View {
    @StateObject private var vm = DoseLogViewModel()
    @State private var viewMode: DoseLogViewMode = .list
    @State private var showDoseSuggestion: String?
    @State private var vialsAppeared = false

    /// Unique active peptides from recent logs
    private var recentActivePeptides: [StackItem] {
        var seen = Set<UUID>()
        var result: [StackItem] = []
        for log in vm.logs {
            if let item = log.stackItem, !seen.contains(item.id) {
                seen.insert(item.id)
                result.append(item)
            }
        }
        // Also include active stack items not yet logged
        for item in vm.stackItems where item.active && !seen.contains(item.id) {
            seen.insert(item.id)
            result.append(item)
        }
        return result
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                LazyVStack(spacing: 12) {
                    // MARK: - Vial Tray
                    if !recentActivePeptides.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("YOUR VIALS")
                                .font(.system(size: 11, weight: .semibold))
                                .tracking(2)
                                .foregroundColor(.cxStone)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 14) {
                                    ForEach(Array(recentActivePeptides.enumerated()), id: \.element.id) { index, item in
                                        TappableVial(
                                            name: item.name,
                                            dose: item.dose,
                                            unit: item.unit,
                                            fillPercent: 0.7,
                                            isDueNow: false,
                                            usePhotoStyle: false,
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

                    // View toggle
                    Picker("View", selection: $viewMode) {
                        ForEach(DoseLogViewMode.allCases, id: \.self) { mode in
                            Text(mode.rawValue).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)

                    // Dose Streak
                    if vm.doseStreak > 0 {
                        HStack(spacing: 10) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 20))
                                .foregroundColor(.orange)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Dose Streak")
                                    .font(.system(size: 11, weight: .semibold))
                                    .tracking(1)
                                    .foregroundColor(.cxStone)
                                Text("\(vm.doseStreak) day\(vm.doseStreak == 1 ? "" : "s") in a row")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.cxBlack)
                            }
                            Spacer()
                        }
                        .padding(14)
                        .background(Color.orange.opacity(0.08))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.orange.opacity(0.2), lineWidth: 1)
                        )
                    }

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

                    // AI dose suggestion
                    if let suggestion = showDoseSuggestion {
                        HStack(spacing: 10) {
                            Image(systemName: "brain.head.profile")
                                .font(.system(size: 16))
                                .foregroundColor(.purple)
                            Text(suggestion)
                                .font(.system(size: 13))
                                .foregroundColor(.cxBlack)
                            Spacer()
                            Button {
                                withAnimation { showDoseSuggestion = nil }
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.system(size: 16))
                                    .foregroundColor(.cxStone)
                            }
                        }
                        .padding(14)
                        .background(Color.purple.opacity(0.08))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.purple.opacity(0.2), lineWidth: 1)
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
                        switch viewMode {
                        case .list:
                            listView
                        case .calendar:
                            calendarView
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
            AddDoseLogSheet(vm: vm, onLogged: { log in
                checkDoseSuggestion(log: log)
            })
        }
    }

    // MARK: - List View with Time Grouping

    private var listView: some View {
        VStack(spacing: 16) {
            ForEach(DoseTimeGroup.allCases, id: \.self) { group in
                let groupLogs = logsForGroup(group)
                if !groupLogs.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: group.icon)
                                .font(.system(size: 14))
                                .foregroundColor(group.color)
                            Text(group.rawValue.uppercased())
                                .font(.system(size: 11, weight: .semibold))
                                .tracking(2)
                                .foregroundColor(.cxStone)
                            Spacer()

                            // Batch log button for morning
                            if group == .morning {
                                Button {
                                    Task { await batchLogMorningDoses() }
                                } label: {
                                    Text("Log All Morning")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.cxTeal)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(Color.cxTeal.opacity(0.1))
                                        .cornerRadius(8)
                                }
                            }
                        }

                        ForEach(groupLogs) { log in
                            DoseLogCard(log: log, vm: vm)
                        }
                    }
                }
            }

            // Ungrouped (logs without parseable time)
            let ungrouped = logsWithoutGroup()
            if !ungrouped.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("OTHER")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    ForEach(ungrouped) { log in
                        DoseLogCard(log: log, vm: vm)
                    }
                }
            }
        }
    }

    // MARK: - Calendar View

    private var calendarView: some View {
        VStack(spacing: 16) {
            let calendar = Calendar.current
            let now = Date()
            let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: now))!
            let daysInMonth = calendar.range(of: .day, in: .month, for: now)!.count
            let firstWeekday = calendar.component(.weekday, from: monthStart) - 1

            // Month header
            Text(monthYearString(from: now))
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.cxBlack)

            // Day headers
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 8) {
                ForEach(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], id: \.self) { day in
                    Text(day)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.cxStone)
                }

                // Empty cells for offset
                ForEach(0..<firstWeekday, id: \.self) { _ in
                    Text("")
                }

                // Day cells
                ForEach(1...daysInMonth, id: \.self) { day in
                    let dayStatus = vm.dayStatus(day: day, month: now)
                    VStack(spacing: 2) {
                        Text("\(day)")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.cxBlack)
                        Circle()
                            .fill(dayStatusColor(dayStatus))
                            .frame(width: 6, height: 6)
                            .opacity(dayStatus == .none ? 0 : 1)
                    }
                    .frame(height: 36)
                }
            }
            .padding(14)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.03), radius: 4, y: 1)

            // Legend
            HStack(spacing: 16) {
                legendItem(color: .green, label: "All taken")
                legendItem(color: .yellow, label: "Partial")
                legendItem(color: .red, label: "Missed")
            }
            .font(.system(size: 11))
        }
    }

    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text(label).foregroundColor(.cxStone)
        }
    }

    private func monthYearString(from date: Date) -> String {
        let df = DateFormatter()
        df.dateFormat = "MMMM yyyy"
        return df.string(from: date)
    }

    private func dayStatusColor(_ status: DayDoseStatus) -> Color {
        switch status {
        case .allTaken: return .green
        case .partial: return .yellow
        case .missed: return .red
        case .none: return .clear
        }
    }

    // MARK: - Time Grouping Helpers

    private func parseDate(_ iso: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()
        return formatter.date(from: iso) ?? fallback.date(from: iso)
    }

    private func timeGroup(for log: DoseLog) -> DoseTimeGroup? {
        guard let date = parseDate(log.takenAt) else { return nil }
        let hour = Calendar.current.component(.hour, from: date)
        if hour < 12 { return .morning }
        if hour < 18 { return .afternoon }
        return .evening
    }

    private func logsForGroup(_ group: DoseTimeGroup) -> [DoseLog] {
        vm.logs.filter { timeGroup(for: $0) == group }
    }

    private func logsWithoutGroup() -> [DoseLog] {
        vm.logs.filter { timeGroup(for: $0) == nil }
    }

    // MARK: - Batch Logging

    private func batchLogMorningDoses() async {
        // Find morning reminders from stack items that haven't been logged today
        guard let userId = SupabaseService.shared.currentUserId else { return }
        let morningItems = vm.stackItems.filter(\.active)
        let formatter = ISO8601DateFormatter()
        for item in morningItems {
            let alreadyLogged = vm.logs.contains { log in
                guard log.stackItemId == item.id, let date = parseDate(log.takenAt) else { return false }
                return Calendar.current.isDateInToday(date)
            }
            guard !alreadyLogged else { continue }
            let log = DoseLog(
                id: UUID(), userId: userId,
                stackItemId: item.id,
                takenAt: formatter.string(from: Date()),
                dose: item.dose, notes: "Batch logged — morning",
                createdAt: nil, stackItem: nil
            )
            do {
                try await SupabaseService.shared.insertDoseLog(log)
            } catch {
                print("Batch log error for \(item.name): \(error)")
            }
        }
        await vm.load()
    }

    // MARK: - AI Dose Suggestions

    private func checkDoseSuggestion(log: DoseLog) {
        guard let stackItem = vm.stackItems.first(where: { $0.id == log.stackItemId }) else { return }
        guard let knowledge = PeptideDataStore.shared.find(stackItem.name) else { return }
        let range = knowledge.dosageRange.lowercased()
        guard !range.isEmpty else { return }

        // Parse logged dose
        let doseStr = log.dose.lowercased()
            .replacingOccurrences(of: "mg", with: "")
            .replacingOccurrences(of: "mcg", with: "")
            .replacingOccurrences(of: "ml", with: "")
            .trimmingCharacters(in: .whitespaces)
        guard let doseVal = Double(doseStr) else { return }

        // Try to extract numbers from dosage range
        let numbers = range.components(separatedBy: CharacterSet.decimalDigits.inverted)
            .compactMap { Double($0) }
            .filter { $0 > 0 }

        guard numbers.count >= 2 else { return }
        let low = numbers[0]
        let high = numbers[numbers.count - 1]

        // Check if dose is in mcg vs mg mismatch - use simple heuristic
        if doseVal < low * 0.5 {
            withAnimation {
                showDoseSuggestion = "\(stackItem.name): Your dose (\(log.dose)) appears low. Typical range: \(knowledge.dosageRange)"
            }
        } else if doseVal > high * 1.5 {
            withAnimation {
                showDoseSuggestion = "\(stackItem.name): Your dose (\(log.dose)) appears high. Typical range: \(knowledge.dosageRange)"
            }
        }
    }
}

// MARK: - Day Status for Calendar

enum DayDoseStatus {
    case allTaken, partial, missed, none
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
    var onLogged: ((DoseLog) -> Void)?

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
                        .foregroundColor(.black)
                    DatePicker("Taken At", selection: $vm.newDate)
                }
                Section("Notes") {
                    TextField("Optional notes", text: $vm.newNotes, axis: .vertical)
                        .foregroundColor(.black)
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
                    Button("Log") {
                        let formatter = ISO8601DateFormatter()
                        let logSnapshot = DoseLog(
                            id: UUID(), userId: SupabaseService.shared.currentUserId ?? UUID(),
                            stackItemId: vm.selectedStackItemId ?? UUID(),
                            takenAt: formatter.string(from: vm.newDate),
                            dose: vm.newDose, notes: vm.newNotes,
                            createdAt: nil, stackItem: nil
                        )
                        Task {
                            await vm.addLog()
                            onLogged?(logSnapshot)
                            dismiss()
                        }
                    }
                    .disabled(vm.selectedStackItemId == nil)
                }
            }
        }
    }
}
