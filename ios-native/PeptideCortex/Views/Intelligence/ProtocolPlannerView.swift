import SwiftUI

struct ProtocolPlannerView: View {
    @EnvironmentObject var storeService: StoreService
    @StateObject private var vm = ProtocolPlannerViewModel()
    @Binding var selectedTab: NavDestination

    var body: some View {
        if !storeService.isProUser {
            ProGateView(featureName: "Protocol Planner")
        } else {
            ScrollView {
                VStack(spacing: 16) {
                    // Progress dots
                    if vm.currentStep < 5 {
                        HStack(spacing: 8) {
                            ForEach(0..<5, id: \.self) { i in
                                Circle()
                                    .fill(i <= vm.currentStep ? Color.cxTeal : Color.cxStone.opacity(0.3))
                                    .frame(width: 8, height: 8)
                            }
                        }
                        .padding(.top, 8)
                    }

                    switch vm.currentStep {
                    case 0: welcomeStep
                    case 1: peptideStep
                    case 2: profileStep
                    case 3: generatingStep
                    case 4: resultsStep
                    default: completedStep
                    }
                }
                .padding()
            }
            .background(Color.cxParchment)
        }
    }

    // MARK: - Step 0: Welcome

    var welcomeStep: some View {
        VStack(spacing: 20) {
            aiBubble("Welcome! I'm Cortex AI. I'll help you build a personalized peptide protocol tailored to your body and goals.")

            Image(systemName: "wand.and.stars")
                .font(.system(size: 48))
                .foregroundColor(.cxTeal)
                .padding()

            aiBubble("Would you like me to create an optimized dosing plan for you? I'll check interactions, calculate doses, and set up reminders.")

            Button {
                vm.currentStep = 1
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "sparkles")
                    Text("Let Cortex AI Plan For Me")
                }
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.cxTeal)
                .cornerRadius(12)
            }

            Button {
                selectedTab = .stack
            } label: {
                Text("I'll set it up manually")
                    .font(.system(size: 15))
                    .foregroundColor(.cxStone)
            }
        }
    }

    // MARK: - Step 1: Peptides

    var peptideStep: some View {
        VStack(spacing: 16) {
            aiBubble("What peptides will you be using? Add all the peptides you plan to take — I'll check if they work well together.")

            // Added peptides
            if !vm.selectedPeptides.isEmpty {
                FlowLayout(spacing: 8) {
                    ForEach(vm.selectedPeptides, id: \.self) { name in
                        HStack(spacing: 4) {
                            Text(name)
                                .font(.system(size: 14, weight: .medium))
                            Button { vm.removePeptide(name) } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.system(size: 14))
                            }
                        }
                        .foregroundColor(.cxTeal)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.cxTeal.opacity(0.1))
                        .cornerRadius(20)
                    }
                }
            }

            // Input
            VStack(alignment: .leading, spacing: 4) {
                TextField("Type a peptide name...", text: $vm.peptideInput)
                    .font(.system(size: 15))
                    .foregroundColor(.black)
                    .padding(12)
                    .background(Color.white)
                    .cornerRadius(10)

                if !vm.peptideSuggestions.isEmpty {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(vm.peptideSuggestions.prefix(5), id: \.self) { name in
                            Button {
                                vm.addPeptide(name)
                            } label: {
                                Text(name)
                                    .font(.system(size: 14))
                                    .foregroundColor(.cxBlack)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.vertical, 10)
                                    .padding(.horizontal, 12)
                            }
                            Divider().padding(.horizontal, 8)
                        }
                    }
                    .background(Color.white)
                    .cornerRadius(10)
                    .shadow(color: .black.opacity(0.08), radius: 6, y: 3)
                }
            }

            // Quick picks
            if vm.selectedPeptides.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("POPULAR CHOICES")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    FlowLayout(spacing: 6) {
                        ForEach(["BPC-157", "TB-500", "Semaglutide", "Ipamorelin", "CJC-1295", "GHK-Cu", "Sermorelin", "Retatrutide"], id: \.self) { name in
                            Button { vm.addPeptide(name) } label: {
                                Text(name)
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxBlack)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(Color.white)
                                    .cornerRadius(16)
                            }
                        }
                    }
                }
            }

            navButtons(backStep: 0, canNext: !vm.selectedPeptides.isEmpty, nextAction: { vm.currentStep = 2 })
        }
    }

    // MARK: - Step 2: Profile

    var profileStep: some View {
        VStack(spacing: 16) {
            aiBubble("Tell me about yourself so I can personalize your protocol. This helps me calculate the right doses and flag any concerns.")

            // Age & Weight
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Age")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.cxStone)
                    TextField("30", text: $vm.age)
                        .font(.system(size: 15))
                        .foregroundColor(.black)
                        .keyboardType(.numberPad)
                        .padding(12)
                        .background(Color.white)
                        .cornerRadius(10)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Weight")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.cxStone)
                    HStack(spacing: 0) {
                        TextField("180", text: $vm.weight)
                            .font(.system(size: 15))
                            .foregroundColor(.black)
                            .keyboardType(.decimalPad)
                            .padding(12)
                        Picker("", selection: $vm.weightUnit) {
                            Text("lbs").tag("lbs")
                            Text("kg").tag("kg")
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 80)
                        .padding(.trailing, 4)
                    }
                    .background(Color.white)
                    .cornerRadius(10)
                }
            }

            // Sex
            VStack(alignment: .leading, spacing: 4) {
                Text("Sex")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.cxStone)
                Picker("", selection: $vm.sex) {
                    Text("Male").tag("Male")
                    Text("Female").tag("Female")
                    Text("Other").tag("Other")
                }
                .pickerStyle(.segmented)
            }

            // Experience
            VStack(alignment: .leading, spacing: 4) {
                Text("Experience Level")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.cxStone)
                Picker("", selection: $vm.experience) {
                    Text("Beginner").tag("Beginner")
                    Text("Intermediate").tag("Intermediate")
                    Text("Advanced").tag("Advanced")
                }
                .pickerStyle(.segmented)
            }

            // Goals
            VStack(alignment: .leading, spacing: 8) {
                Text("GOALS")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(.cxStone)

                FlowLayout(spacing: 6) {
                    ForEach(ProtocolPlannerViewModel.goalOptions, id: \.self) { goal in
                        Button {
                            if vm.selectedGoals.contains(goal) {
                                vm.selectedGoals.remove(goal)
                            } else {
                                vm.selectedGoals.insert(goal)
                            }
                        } label: {
                            Text(goal)
                                .font(.system(size: 13, weight: vm.selectedGoals.contains(goal) ? .semibold : .regular))
                                .foregroundColor(vm.selectedGoals.contains(goal) ? .white : .cxBlack)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(vm.selectedGoals.contains(goal) ? Color.cxTeal : Color.white)
                                .cornerRadius(20)
                        }
                    }
                }
            }

            // Conditions
            VStack(alignment: .leading, spacing: 8) {
                Text("MEDICAL CONDITIONS")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(.cxStone)

                FlowLayout(spacing: 6) {
                    ForEach(ProtocolPlannerViewModel.conditionOptions, id: \.self) { cond in
                        Button {
                            if cond == "None" {
                                vm.selectedConditions = ["None"]
                            } else {
                                vm.selectedConditions.remove("None")
                                if vm.selectedConditions.contains(cond) {
                                    vm.selectedConditions.remove(cond)
                                } else {
                                    vm.selectedConditions.insert(cond)
                                }
                            }
                        } label: {
                            Text(cond)
                                .font(.system(size: 13, weight: vm.selectedConditions.contains(cond) ? .semibold : .regular))
                                .foregroundColor(vm.selectedConditions.contains(cond) ? .white : .cxBlack)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(vm.selectedConditions.contains(cond) ? (cond == "None" ? Color.green : Color.orange) : Color.white)
                                .cornerRadius(20)
                        }
                    }
                }
            }

            if let error = vm.errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red)
                    .padding(12)
                    .background(Color.red.opacity(0.08))
                    .cornerRadius(10)
            }

            navButtons(backStep: 1, canNext: true, nextAction: { Task { await vm.generatePlan() } }, nextLabel: "Generate My Plan")
        }
    }

    // MARK: - Step 3: Generating

    var generatingStep: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 40)

            ProgressView()
                .scaleEffect(1.5)
                .tint(.cxTeal)

            Text("Cortex AI is building your protocol...")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.cxBlack)

            Text(vm.generatingStep)
                .font(.system(size: 14))
                .foregroundColor(.cxTeal)
                .animation(.easeInOut, value: vm.generatingStep)

            Spacer().frame(height: 40)
        }
    }

    // MARK: - Step 4: Results

    var resultsStep: some View {
        VStack(spacing: 16) {
            if let plan = vm.plan {
                aiBubble("Your personalized protocol is ready! Here's what I recommend based on your profile and goals.")

                // View picker
                Picker("", selection: $vm.selectedPlanView) {
                    Text("Schedule").tag(0)
                    Text("Timeline").tag(1)
                    Text("List").tag(2)
                }
                .pickerStyle(.segmented)

                // Summary
                Text(plan.summary)
                    .font(.system(size: 14))
                    .foregroundColor(.cxBlack)
                    .lineSpacing(4)
                    .padding(14)
                    .background(Color.white)
                    .cornerRadius(12)

                // Warnings
                if !plan.warnings.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("WARNINGS")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.orange)

                        ForEach(plan.warnings, id: \.self) { warning in
                            HStack(alignment: .top, spacing: 8) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.orange)
                                    .font(.system(size: 12))
                                Text(warning)
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxBlack)
                            }
                        }
                    }
                    .padding(14)
                    .background(Color.orange.opacity(0.08))
                    .cornerRadius(12)
                }

                // Interactions
                if !plan.interactions.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("INTERACTIONS")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.cxStone)

                        ForEach(plan.interactions) { interaction in
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(interaction.level == "safe" ? Color.green : interaction.level == "caution" ? Color.orange : Color.red)
                                    .frame(width: 10, height: 10)
                                Text("\(interaction.peptideA) + \(interaction.peptideB)")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.cxBlack)
                                Spacer()
                                Text(interaction.level.uppercased())
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(interaction.level == "safe" ? Color.green : interaction.level == "caution" ? Color.orange : Color.red)
                                    .cornerRadius(6)
                            }
                            Text(interaction.note)
                                .font(.system(size: 12))
                                .foregroundColor(.cxStone)
                        }
                    }
                    .padding(14)
                    .background(Color.white)
                    .cornerRadius(12)
                }

                // Plan view
                switch vm.selectedPlanView {
                case 0: scheduleView(plan)
                case 1: timelineView(plan)
                default: listView(plan)
                }

                // Reconstitution
                if !plan.reconstitution.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("RECONSTITUTION GUIDE")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.cxStone)

                        ForEach(plan.reconstitution) { recon in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(recon.peptide)
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.cxBlack)
                                HStack(spacing: 16) {
                                    Label(recon.vialSize, systemImage: "cube.box")
                                    Label(recon.bacWater + " BAC", systemImage: "drop.fill")
                                }
                                .font(.system(size: 12))
                                .foregroundColor(.cxTeal)
                                Text(recon.typicalDose)
                                    .font(.system(size: 12))
                                    .foregroundColor(.cxStone)
                            }
                            .padding(12)
                            .background(Color.white)
                            .cornerRadius(10)
                        }
                    }
                }

                // Create reminders button
                Button {
                    vm.currentStep = 5
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "bell.fill")
                        Text("Set Up Reminders")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.cxTeal)
                    .cornerRadius(12)
                }
            }
        }
    }

    // MARK: - Step 5: Confirm Reminders

    var completedStep: some View {
        VStack(spacing: 16) {
            if vm.remindersCreated {
                // Done!
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 56))
                        .foregroundColor(.green)

                    Text("Protocol Created!")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.cxBlack)

                    aiBubble("Your reminders are set! You'll get notified when it's time to take each dose. Check your dashboard to see today's schedule.")

                    Button {
                        selectedTab = .dashboard
                    } label: {
                        Text("Go to Dashboard")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.cxTeal)
                            .cornerRadius(12)
                    }
                }
            } else if let plan = vm.plan {
                aiBubble("Review the reminders below. Toggle off any you don't want, then tap Create to set them up.")

                ForEach(plan.suggestedReminders) { reminder in
                    HStack(spacing: 12) {
                        Toggle("", isOn: Binding(
                            get: { vm.reminderSelections[reminder.id] ?? true },
                            set: { vm.reminderSelections[reminder.id] = $0 }
                        ))
                        .labelsHidden()

                        VStack(alignment: .leading, spacing: 2) {
                            Text(reminder.peptide)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.cxBlack)
                            HStack(spacing: 8) {
                                Text(reminder.dose)
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxTeal)
                                Text("at \(reminder.time)")
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxStone)
                            }
                            Text(dayNames(reminder.days))
                                .font(.system(size: 11))
                                .foregroundColor(.cxStone)
                        }

                        Spacer()
                    }
                    .padding(14)
                    .background(Color.white)
                    .cornerRadius(12)
                }

                if let error = vm.errorMessage {
                    Text(error).font(.system(size: 13)).foregroundColor(.red)
                }

                Button {
                    Task { await vm.createReminders() }
                } label: {
                    Text("Create Reminders")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.cxTeal)
                        .cornerRadius(12)
                }

                Button {
                    selectedTab = .dashboard
                } label: {
                    Text("Skip for now")
                        .font(.system(size: 14))
                        .foregroundColor(.cxStone)
                }
            }
        }
    }

    // MARK: - Plan Views

    func scheduleView(_ plan: ProtocolPlan) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("WEEKLY SCHEDULE")
                .font(.system(size: 11, weight: .semibold))
                .tracking(2)
                .foregroundColor(.cxStone)

            ForEach(plan.weeklySchedule) { day in
                VStack(alignment: .leading, spacing: 6) {
                    Text(day.day.uppercased())
                        .font(.system(size: 12, weight: .bold))
                        .tracking(1)
                        .foregroundColor(.cxTeal)

                    if day.doses.isEmpty {
                        Text("Rest day")
                            .font(.system(size: 13))
                            .foregroundColor(.cxStone)
                            .italic()
                    } else {
                        ForEach(day.doses) { dose in
                            HStack(spacing: 8) {
                                Text(dose.time)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.cxTeal)
                                    .cornerRadius(6)
                                Text(dose.peptide)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.cxBlack)
                                Spacer()
                                Text(dose.dose)
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxStone)
                            }
                        }
                    }
                }
                .padding(12)
                .background(Color.white)
                .cornerRadius(10)
            }
        }
    }

    func timelineView(_ plan: ProtocolPlan) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("TIMELINE")
                .font(.system(size: 11, weight: .semibold))
                .tracking(2)
                .foregroundColor(.cxStone)

            let peptides = Array(Set(plan.weeklySchedule.flatMap { $0.doses.map { $0.peptide } }))
            let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

            // Header
            HStack(spacing: 0) {
                Text("").frame(width: 100)
                ForEach(days, id: \.self) { d in
                    Text(d)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.cxStone)
                        .frame(maxWidth: .infinity)
                }
            }

            ForEach(peptides, id: \.self) { peptide in
                HStack(spacing: 0) {
                    Text(peptide)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.cxBlack)
                        .frame(width: 100, alignment: .leading)
                        .lineLimit(1)

                    ForEach(plan.weeklySchedule) { day in
                        let hasIt = day.doses.contains { $0.peptide == peptide }
                        Circle()
                            .fill(hasIt ? Color.cxTeal : Color.cxStone.opacity(0.2))
                            .frame(width: 16, height: 16)
                            .frame(maxWidth: .infinity)
                    }
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(12)
    }

    func listView(_ plan: ProtocolPlan) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("PROTOCOL LIST")
                .font(.system(size: 11, weight: .semibold))
                .tracking(2)
                .foregroundColor(.cxStone)

            let peptides = Array(Set(plan.weeklySchedule.flatMap { $0.doses.map { $0.peptide } }))

            ForEach(peptides, id: \.self) { peptide in
                let allDoses = plan.weeklySchedule.flatMap { $0.doses.filter { $0.peptide == peptide } }
                if let first = allDoses.first {
                    let daysUsed = plan.weeklySchedule.filter { $0.doses.contains { $0.peptide == peptide } }.map { $0.day }

                    VStack(alignment: .leading, spacing: 6) {
                        Text(peptide)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.cxBlack)
                        HStack(spacing: 16) {
                            Label(first.dose, systemImage: "eyedropper")
                            Label(first.time, systemImage: "clock")
                            Label(first.route, systemImage: "syringe")
                        }
                        .font(.system(size: 12))
                        .foregroundColor(.cxTeal)
                        Text("Days: \(daysUsed.joined(separator: ", "))")
                            .font(.system(size: 12))
                            .foregroundColor(.cxStone)
                        if !first.notes.isEmpty {
                            Text(first.notes)
                                .font(.system(size: 12))
                                .foregroundColor(.cxStone)
                                .italic()
                        }
                    }
                    .padding(12)
                    .background(Color.white)
                    .cornerRadius(10)
                }
            }
        }
    }

    // MARK: - Helpers

    func aiBubble(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 18))
                .foregroundColor(.cxTeal)
                .frame(width: 32, height: 32)
                .background(Color.cxTeal.opacity(0.1))
                .cornerRadius(16)

            Text(text)
                .font(.system(size: 14))
                .foregroundColor(.cxBlack)
                .lineSpacing(4)
                .padding(12)
                .background(Color.white)
                .cornerRadius(12)
        }
    }

    func navButtons(backStep: Int, canNext: Bool, nextAction: @escaping () -> Void, nextLabel: String = "Next") -> some View {
        HStack(spacing: 12) {
            Button {
                vm.currentStep = backStep
            } label: {
                Text("Back")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.cxStone)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.white)
                    .cornerRadius(10)
            }

            Button(action: nextAction) {
                Text(nextLabel)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(canNext ? Color.cxTeal : Color.cxStone.opacity(0.3))
                    .cornerRadius(10)
            }
            .disabled(!canNext)
        }
    }

    func dayNames(_ days: [Int]) -> String {
        let names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return days.compactMap { $0 < names.count ? names[$0] : nil }.joined(separator: ", ")
    }
}

// MARK: - Flow Layout for chips

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = computeLayout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = computeLayout(proposal: proposal, subviews: subviews)
        for (index, subview) in subviews.enumerated() {
            if index < result.positions.count {
                let pos = result.positions[index]
                subview.place(at: CGPoint(x: bounds.minX + pos.x, y: bounds.minY + pos.y), proposal: .unspecified)
            }
        }
    }

    private func computeLayout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), positions)
    }
}
