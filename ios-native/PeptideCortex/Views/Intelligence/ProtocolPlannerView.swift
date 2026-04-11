import SwiftUI

struct ProtocolPlannerView: View {
    @EnvironmentObject var storeService: StoreService
    @EnvironmentObject var appState: AppState
    @StateObject private var vm = ProtocolPlannerViewModel()
    @Binding var selectedTab: NavDestination
    @State private var showVialScanner = false

    var body: some View {
        if !storeService.isProUser {
            ProGateView(featureName: "Protocol Planner")
        } else {
            ScrollView {
                VStack(spacing: 16) {
                    // Progress dots
                    HStack(spacing: 8) {
                        ForEach(0..<5, id: \.self) { i in
                            let effectiveStep = vm.currentStep == 10 ? 0 : vm.currentStep
                            Circle()
                                .fill(i <= effectiveStep ? Color.cxTeal : Color.cxStone.opacity(0.3))
                                .frame(width: 8, height: 8)
                        }
                    }
                    .padding(.top, 8)

                    switch vm.currentStep {
                    case 0: welcomeStep
                    case 10: consultStep
                    case 1: peptideStep
                    case 2: profileStep
                    case 3: generatingStep
                    case 4: resultsStep
                    default: remindersStep
                    }
                }
                .padding()
            }
            .background(Color.cxParchment)
            .onAppear {
                if let bloodwork = appState.pendingBloodwork {
                    vm.prefillFromBloodwork(
                        analysis: bloodwork.analysis,
                        recommendations: bloodwork.recommendations,
                        warnings: bloodwork.warnings,
                        existingStack: bloodwork.existingStack,
                        existingSchedule: bloodwork.existingSchedule
                    )
                    appState.pendingBloodwork = nil
                    // Go straight to plan generation
                    Task { await vm.generatePlan() }
                }
            }
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

            aiBubble("Would you like me to create an optimized dosing plan? I'll check interactions, calculate doses, and set up reminders.")

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
                vm.currentStep = 10
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "bubble.left.and.text.bubble.right")
                    Text("Tell Cortex AI What You Need")
                }
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.cxTeal)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.cxTeal.opacity(0.1))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.cxTeal.opacity(0.3), lineWidth: 1)
                )
            }

            Button { selectedTab = .stack } label: {
                Text("I'll set it up manually")
                    .font(.system(size: 15))
                    .foregroundColor(.cxStone)
            }
        }
    }

    // MARK: - Step 10: Consult (Conversational)

    var consultStep: some View {
        VStack(spacing: 16) {
            aiBubble("Tell me what you're looking to achieve. What are your goals, concerns, or interests? I'll ask you some questions and then create a personalized protocol for you.")

            if vm.cortexQuestions.isEmpty && !vm.consultDone {
                // Initial text input or follow-up free text
                ZStack(alignment: .topLeading) {
                    if vm.userGoalText.isEmpty {
                        Text("e.g., I want to lose weight and improve recovery after workouts. I'm also interested in anti-aging...")
                            .font(.system(size: 14))
                            .foregroundColor(.cxStone.opacity(0.6))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                    }
                    TextEditor(text: $vm.userGoalText)
                        .font(.system(size: 15))
                        .foregroundColor(.cxBlack)
                        .scrollContentBackground(.hidden)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                }
                .frame(minHeight: 120)
                .background(Color.white)
                .cornerRadius(12)

                Button {
                    Task { await vm.askCortex() }
                } label: {
                    HStack(spacing: 8) {
                        if vm.isConsulting {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: "paperplane.fill")
                        }
                        Text("Send to Cortex")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(vm.userGoalText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || vm.isConsulting ? Color.cxStone.opacity(0.3) : Color.cxTeal)
                    .cornerRadius(12)
                }
                .disabled(vm.userGoalText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || vm.isConsulting)
            }

            // Show Cortex follow-up questions
            if !vm.cortexQuestions.isEmpty {
                aiBubble("I have a few questions to help me build the best protocol for you:")

                ForEach(vm.cortexQuestions.indices, id: \.self) { index in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(vm.cortexQuestions[index].question)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.cxBlack)

                        TextField("Your answer...", text: $vm.cortexQuestions[index].answer)
                            .font(.system(size: 15))
                            .foregroundColor(.cxBlack)
                            .padding(12)
                            .background(Color.white)
                            .cornerRadius(10)
                    }
                }

                Button {
                    Task { await vm.submitConsultAnswers() }
                } label: {
                    HStack(spacing: 8) {
                        if vm.isConsulting {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: "paperplane.fill")
                        }
                        Text(vm.consultRound >= 2 ? "Get My Protocol" : "Send Answers")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(vm.cortexQuestions.allSatisfy({ !$0.answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) && !vm.isConsulting ? Color.cxTeal : Color.cxStone.opacity(0.3))
                    .cornerRadius(12)
                }
                .disabled(!vm.cortexQuestions.allSatisfy({ !$0.answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) || vm.isConsulting)
            }

            // Consult is done — Cortex has recommendations
            if vm.consultDone {
                aiBubble("Based on our conversation, I've selected peptides and filled in your profile. You can review and adjust before I generate your protocol.")

                if !vm.selectedPeptides.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("SUGGESTED PEPTIDES").font(.system(size: 11, weight: .semibold)).tracking(2).foregroundColor(.cxStone)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(vm.selectedPeptides, id: \.self) { name in
                                    Text(name)
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(.cxTeal)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(Color.cxTeal.opacity(0.1))
                                        .cornerRadius(20)
                                }
                            }
                        }
                    }
                }

                HStack(spacing: 12) {
                    Button { vm.currentStep = 2 } label: {
                        Text("Review Profile")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.cxStone)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.white)
                            .cornerRadius(10)
                    }
                    Button {
                        Task { await vm.generatePlan() }
                    } label: {
                        Text("Generate My Plan")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.cxTeal)
                            .cornerRadius(10)
                    }
                }
            }

            if let error = vm.errorMessage {
                Text(error).font(.system(size: 13)).foregroundColor(.red)
                    .padding(12).background(Color.red.opacity(0.08)).cornerRadius(10)
            }

            Button { vm.currentStep = 0 } label: {
                Text("Back").font(.system(size: 14)).foregroundColor(.cxStone)
            }
        }
    }

    // MARK: - Step 1: Peptides

    var peptideStep: some View {
        VStack(spacing: 16) {
            aiBubble("What peptides will you be using? Add all the peptides you plan to take.")

            Button {
                showVialScanner = true
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "camera.viewfinder")
                        .font(.system(size: 18))
                    Text("Scan Your Vials")
                        .font(.system(size: 15, weight: .semibold))
                }
                .foregroundColor(.cxTeal)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.cxTeal.opacity(0.1))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.cxTeal.opacity(0.3), lineWidth: 1)
                )
            }
            .sheet(isPresented: $showVialScanner) {
                VialScannerView { scannedVials async in
                    for vial in scannedVials {
                        vm.addPeptide(vial.name)
                    }
                }
            }

            if !vm.selectedPeptides.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(vm.selectedPeptides, id: \.self) { name in
                            HStack(spacing: 4) {
                                Text(name).font(.system(size: 14, weight: .medium))
                                Button { vm.removePeptide(name) } label: {
                                    Image(systemName: "xmark.circle.fill").font(.system(size: 14))
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
            }

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
                            Button { vm.addPeptide(name) } label: {
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
            VStack(alignment: .leading, spacing: 8) {
                Text("POPULAR").font(.system(size: 11, weight: .semibold)).tracking(2).foregroundColor(.cxStone)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(["BPC-157", "TB-500", "Semaglutide", "Ipamorelin", "CJC-1295", "GHK-Cu", "Sermorelin", "Retatrutide"], id: \.self) { name in
                            Button { vm.addPeptide(name) } label: {
                                Text(name).font(.system(size: 13)).foregroundColor(.cxBlack)
                                    .padding(.horizontal, 12).padding(.vertical, 8)
                                    .background(Color.white).cornerRadius(16)
                            }
                        }
                    }
                }
            }

            navButtons(backStep: 0, canNext: !vm.selectedPeptides.isEmpty) { vm.currentStep = 2 }
        }
    }

    // MARK: - Step 2: Profile

    var profileStep: some View {
        VStack(spacing: 16) {
            aiBubble("Tell me about yourself so I can personalize your protocol.")

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Age").font(.system(size: 12, weight: .medium)).foregroundColor(.cxStone)
                    TextField("30", text: $vm.age)
                        .font(.system(size: 15)).foregroundColor(.black)
                        .keyboardType(.numberPad)
                        .padding(12).background(Color.white).cornerRadius(10)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Weight").font(.system(size: 12, weight: .medium)).foregroundColor(.cxStone)
                    HStack(spacing: 0) {
                        TextField("180", text: $vm.weight)
                            .font(.system(size: 15)).foregroundColor(.black)
                            .keyboardType(.decimalPad).padding(12)
                        Picker("", selection: $vm.weightUnit) {
                            Text("lbs").tag("lbs")
                            Text("kg").tag("kg")
                        }.pickerStyle(.segmented).frame(width: 80).padding(.trailing, 4)
                    }
                    .background(Color.white).cornerRadius(10)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Sex").font(.system(size: 12, weight: .medium)).foregroundColor(.cxStone)
                Picker("", selection: $vm.sex) {
                    ForEach(vm.sexOptions, id: \.self) { Text($0).tag($0) }
                }.pickerStyle(.segmented)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Experience").font(.system(size: 12, weight: .medium)).foregroundColor(.cxStone)
                Picker("", selection: $vm.experience) {
                    ForEach(vm.experienceOptions, id: \.self) { Text($0).tag($0) }
                }.pickerStyle(.segmented)
            }

            // Goals
            VStack(alignment: .leading, spacing: 8) {
                Text("GOALS").font(.system(size: 11, weight: .semibold)).tracking(2).foregroundColor(.cxStone)
                WrappingHStack(items: vm.goalOptions) { goal in
                    Button { vm.toggleGoal(goal) } label: {
                        Text(goal)
                            .font(.system(size: 13, weight: vm.selectedGoals.contains(goal) ? .semibold : .regular))
                            .foregroundColor(vm.selectedGoals.contains(goal) ? .white : .cxBlack)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(vm.selectedGoals.contains(goal) ? Color.cxTeal : Color.white)
                            .cornerRadius(20)
                    }
                }
            }

            // Conditions
            VStack(alignment: .leading, spacing: 8) {
                Text("MEDICAL CONDITIONS").font(.system(size: 11, weight: .semibold)).tracking(2).foregroundColor(.cxStone)
                WrappingHStack(items: vm.conditionOptions) { cond in
                    Button { vm.toggleCondition(cond) } label: {
                        Text(cond)
                            .font(.system(size: 13, weight: vm.selectedConditions.contains(cond) ? .semibold : .regular))
                            .foregroundColor(vm.selectedConditions.contains(cond) ? .white : .cxBlack)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(vm.selectedConditions.contains(cond) ? (cond == "None" ? Color.green : Color.orange) : Color.white)
                            .cornerRadius(20)
                    }
                }
            }

            if let error = vm.errorMessage {
                Text(error).font(.system(size: 13)).foregroundColor(.red)
                    .padding(12).background(Color.red.opacity(0.08)).cornerRadius(10)
            }

            navButtons(backStep: 1, canNext: true, label: "Generate My Plan") { Task { await vm.generatePlan() } }
        }
    }

    // MARK: - Step 3: Generating

    var generatingStep: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 40)
            ProgressView().scaleEffect(1.5).tint(.cxTeal)
            Text("Cortex AI is building your protocol...")
                .font(.system(size: 18, weight: .semibold)).foregroundColor(.cxBlack)
            Text(vm.generationStep)
                .font(.system(size: 14)).foregroundColor(.cxTeal)
            Spacer().frame(height: 40)
        }
    }

    // MARK: - Step 4: Results

    var resultsStep: some View {
        VStack(spacing: 16) {
            guard let plan = vm.plan else { return AnyView(EmptyView()) }

            return AnyView(VStack(spacing: 16) {
                aiBubble("Your personalized protocol is ready!")

                Picker("", selection: $vm.resultsViewMode) {
                    Text("Schedule").tag(0)
                    Text("Timeline").tag(1)
                    Text("List").tag(2)
                }.pickerStyle(.segmented)

                Text(plan.summary)
                    .font(.system(size: 14)).foregroundColor(.cxBlack).lineSpacing(4)
                    .padding(14).background(Color.white).cornerRadius(12)

                // Warnings
                if !plan.warnings.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("WARNINGS").font(.system(size: 11, weight: .semibold)).tracking(2).foregroundColor(.orange)
                        ForEach(plan.warnings, id: \.self) { w in
                            HStack(alignment: .top, spacing: 8) {
                                Image(systemName: "exclamationmark.triangle.fill").foregroundColor(.orange).font(.system(size: 12))
                                Text(w).font(.system(size: 13)).foregroundColor(.cxBlack)
                            }
                        }
                    }.padding(14).background(Color.orange.opacity(0.08)).cornerRadius(12)
                }

                // Interactions
                if !plan.interactions.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("INTERACTIONS").font(.system(size: 11, weight: .semibold)).tracking(2).foregroundColor(.cxStone)
                        ForEach(plan.interactions) { i in
                            HStack(spacing: 8) {
                                Circle().fill(i.level == "safe" ? Color.green : i.level == "caution" ? Color.orange : Color.red).frame(width: 10, height: 10)
                                Text("\(i.peptideA) + \(i.peptideB)").font(.system(size: 14, weight: .semibold)).foregroundColor(.cxBlack)
                                Spacer()
                                Text(i.level.uppercased()).font(.system(size: 10, weight: .bold)).foregroundColor(.white)
                                    .padding(.horizontal, 8).padding(.vertical, 3)
                                    .background(i.level == "safe" ? Color.green : i.level == "caution" ? Color.orange : Color.red).cornerRadius(6)
                            }
                        }
                    }.padding(14).background(Color.white).cornerRadius(12)
                }

                // Schedule
                if vm.resultsViewMode == 0 {
                    ForEach(plan.weeklySchedule) { day in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(day.day.uppercased()).font(.system(size: 12, weight: .bold)).tracking(1).foregroundColor(.cxTeal)
                            ForEach(day.doses) { dose in
                                HStack(spacing: 8) {
                                    Text(dose.time).font(.system(size: 11, weight: .medium)).foregroundColor(.white)
                                        .padding(.horizontal, 8).padding(.vertical, 3).background(Color.cxTeal).cornerRadius(6)
                                    Text(dose.peptide).font(.system(size: 14, weight: .semibold)).foregroundColor(.cxBlack)
                                    Spacer()
                                    Text(dose.dose).font(.system(size: 13)).foregroundColor(.cxStone)
                                }
                            }
                        }.padding(12).background(Color.white).cornerRadius(10)
                    }
                }

                // Reconstitution
                if !plan.reconstitution.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("RECONSTITUTION").font(.system(size: 11, weight: .semibold)).tracking(2).foregroundColor(.cxStone)
                        ForEach(plan.reconstitution) { r in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(r.peptide).font(.system(size: 15, weight: .semibold)).foregroundColor(.cxBlack)
                                Text("\(r.vialSize) vial + \(r.bacWater) BAC water = \(r.concentration)")
                                    .font(.system(size: 12)).foregroundColor(.cxTeal)
                                Text("Typical dose: \(r.typicalDose)").font(.system(size: 12)).foregroundColor(.cxStone)
                            }.padding(12).background(Color.white).cornerRadius(10)
                        }
                    }
                }

                Button { vm.currentStep = 5 } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "bell.fill")
                        Text("Set Up Reminders")
                    }
                    .font(.system(size: 16, weight: .semibold)).foregroundColor(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 16)
                    .background(Color.cxTeal).cornerRadius(12)
                }
            })
        }
    }

    // MARK: - Step 5: Reminders

    var remindersStep: some View {
        VStack(spacing: 16) {
            aiBubble("Review the reminders below. Toggle off any you don't want.")

            if let plan = vm.plan {
                ForEach(plan.suggestedReminders) { reminder in
                    HStack(spacing: 12) {
                        Toggle("", isOn: Binding(
                            get: { vm.reminderSelections[reminder.id] ?? true },
                            set: { vm.reminderSelections[reminder.id] = $0 }
                        )).labelsHidden()

                        VStack(alignment: .leading, spacing: 2) {
                            Text(reminder.peptide).font(.system(size: 15, weight: .semibold)).foregroundColor(.cxBlack)
                            HStack(spacing: 8) {
                                Text(reminder.dose).font(.system(size: 13)).foregroundColor(.cxTeal)
                                Text("at \(reminder.time)").font(.system(size: 13)).foregroundColor(.cxStone)
                            }
                        }
                        Spacer()
                    }
                    .padding(14).background(Color.white).cornerRadius(12)
                }
            }

            if let error = vm.errorMessage {
                Text(error).font(.system(size: 13)).foregroundColor(.red)
            }

            Button {
                Task {
                    await vm.createReminders()
                    selectedTab = .dashboard
                }
            } label: {
                Text("Create Reminders")
                    .font(.system(size: 16, weight: .semibold)).foregroundColor(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 16)
                    .background(Color.cxTeal).cornerRadius(12)
            }

            Button { selectedTab = .dashboard } label: {
                Text("Skip for now").font(.system(size: 14)).foregroundColor(.cxStone)
            }
        }
    }

    // MARK: - Helpers

    func aiBubble(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 18)).foregroundColor(.cxTeal)
                .frame(width: 32, height: 32)
                .background(Color.cxTeal.opacity(0.1)).cornerRadius(16)
            Text(text)
                .font(.system(size: 14)).foregroundColor(.cxBlack).lineSpacing(4)
                .padding(12).background(Color.white).cornerRadius(12)
        }
    }

    func navButtons(backStep: Int, canNext: Bool, label: String = "Next", action: @escaping () -> Void) -> some View {
        HStack(spacing: 12) {
            Button { vm.currentStep = backStep } label: {
                Text("Back").font(.system(size: 15, weight: .medium)).foregroundColor(.cxStone)
                    .frame(maxWidth: .infinity).padding(.vertical, 14)
                    .background(Color.white).cornerRadius(10)
            }
            Button(action: action) {
                Text(label).font(.system(size: 15, weight: .semibold)).foregroundColor(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 14)
                    .background(canNext ? Color.cxTeal : Color.cxStone.opacity(0.3)).cornerRadius(10)
            }.disabled(!canNext)
        }
    }
}

// Simple wrapping layout that doesn't use Layout protocol (iOS 16 compatible)
struct WrappingHStack<Item: Hashable, Content: View>: View {
    let items: [Item]
    let content: (Item) -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Simple approach: just show items in rows of ~3
            ForEach(chunked(items, size: 3), id: \.self) { row in
                HStack(spacing: 6) {
                    ForEach(row, id: \.self) { item in
                        content(item)
                    }
                }
            }
        }
    }

    private func chunked(_ array: [Item], size: Int) -> [[Item]] {
        stride(from: 0, to: array.count, by: size).map {
            Array(array[$0..<min($0 + size, array.count)])
        }
    }
}
