import Foundation

@MainActor
class ProtocolPlannerViewModel: ObservableObject {
    @Published var currentStep: Int = 0  // 0=Welcome, 10=Consult, 1=Peptides, 2=Profile, 3=Generating, 4=Results, 5=Reminders

    // Step 1 - Peptide selection
    @Published var selectedPeptides: [String] = []
    @Published var peptideInput = ""
    @Published var showSuggestions = false

    // Step 2 - Profile
    @Published var age = ""
    @Published var weight = ""
    @Published var weightUnit = "lbs"
    @Published var sex = "Male"
    @Published var experience = "Beginner"
    @Published var selectedConditions: Set<String> = []
    @Published var selectedGoals: Set<String> = []

    // Consult flow (conversational step)
    @Published var userGoalText = ""
    @Published var cortexQuestions: [CortexQA] = []
    @Published var consultHistory: [[String: String]] = []
    @Published var consultRound = 0
    @Published var isConsulting = false
    @Published var consultDone = false

    // Generation
    @Published var isGenerating = false
    @Published var generationStep = ""
    @Published var plan: ProtocolPlan?
    @Published var errorMessage: String?

    // Results view mode
    @Published var resultsViewMode = 0  // 0=Weekly, 1=Timeline, 2=List

    // Reminders
    @Published var reminderSelections: [String: Bool] = [:]

    let conditionOptions = ["Diabetes", "Heart Disease", "Thyroid", "High Blood Pressure", "Liver Issues", "Kidney Issues", "None"]
    let goalOptions = ["Fat Loss", "Muscle Growth", "Recovery", "Anti-Aging", "Cognitive Enhancement", "Sleep", "Immune Support", "Healing"]
    let sexOptions = ["Male", "Female", "Other"]
    let experienceOptions = ["Beginner", "Intermediate", "Advanced"]

    var peptideSuggestions: [String] {
        guard !peptideInput.isEmpty else { return [] }
        let q = peptideInput.lowercased()
        return PeptideDataStore.shared.allNames
            .filter { $0.lowercased().contains(q) && !selectedPeptides.contains($0) }
    }

    func addPeptide(_ name: String) {
        guard !selectedPeptides.contains(name) else { return }
        selectedPeptides.append(name)
        peptideInput = ""
        showSuggestions = false
    }

    func removePeptide(_ name: String) {
        selectedPeptides.removeAll { $0 == name }
    }

    func toggleCondition(_ condition: String) {
        if condition == "None" {
            if selectedConditions.contains("None") {
                selectedConditions.remove("None")
            } else {
                selectedConditions = ["None"]
            }
        } else {
            selectedConditions.remove("None")
            if selectedConditions.contains(condition) {
                selectedConditions.remove(condition)
            } else {
                selectedConditions.insert(condition)
            }
        }
    }

    func toggleGoal(_ goal: String) {
        if selectedGoals.contains(goal) {
            selectedGoals.remove(goal)
        } else {
            selectedGoals.insert(goal)
        }
    }

    func askCortex() async {
        guard !userGoalText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        isConsulting = true
        errorMessage = nil

        // Add user message to history
        consultHistory.append(["role": "user", "content": userGoalText])

        do {
            let response = try await APIService.shared.protocolConsult(
                message: userGoalText,
                history: consultHistory
            )

            if response.type == "recommendation" {
                // Cortex has enough info — apply recommendations
                if let peptides = response.peptides {
                    for p in peptides {
                        addPeptide(p)
                    }
                }
                if let profile = response.profile {
                    if let a = profile.age, !a.isEmpty { age = a }
                    if let w = profile.weight, !w.isEmpty { weight = w }
                    if let s = profile.sex, !s.isEmpty { sex = s }
                    if let e = profile.experience, !e.isEmpty { experience = e }
                    if let goals = profile.goals {
                        for g in goals { selectedGoals.insert(g) }
                    }
                    if let conditions = profile.conditions {
                        for c in conditions { selectedConditions.insert(c) }
                    }
                }
                // Add assistant summary to history
                if let summary = response.summary {
                    consultHistory.append(["role": "assistant", "content": summary])
                }
                consultDone = true
            } else if let questions = response.questions {
                // Cortex wants to ask follow-up questions
                cortexQuestions = questions.map { CortexQA(question: $0, answer: "") }
                let formatted = questions.enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n")
                consultHistory.append(["role": "assistant", "content": formatted])
                consultRound += 1
            }
        } catch {
            errorMessage = "Failed to consult Cortex AI. Please try again."
        }

        userGoalText = ""
        isConsulting = false
    }

    func submitConsultAnswers() async {
        // Combine Q&A into a single user message
        let answersText = cortexQuestions.map { "Q: \($0.question)\nA: \($0.answer)" }.joined(separator: "\n\n")
        userGoalText = answersText
        cortexQuestions = []
        await askCortex()
    }

    func generatePlan() async {
        isGenerating = true
        errorMessage = nil
        currentStep = 3

        // Animated progress steps
        generationStep = "Checking interactions..."
        try? await Task.sleep(nanoseconds: 800_000_000)
        generationStep = "Calculating doses..."
        try? await Task.sleep(nanoseconds: 600_000_000)
        generationStep = "Building schedule..."

        let profile: [String: Any] = [
            "age": Int(age) ?? 0,
            "weight": Int(weight) ?? 0,
            "sex": sex,
            "goals": Array(selectedGoals),
            "conditions": Array(selectedConditions),
            "experience": experience
        ]

        do {
            let result = try await APIService.shared.generateProtocolPlan(
                peptides: selectedPeptides,
                profile: profile
            )
            plan = result

            // Initialize reminder selections (all on by default)
            reminderSelections = [:]
            for reminder in result.suggestedReminders {
                reminderSelections[reminder.id] = true
            }

            generationStep = "Done!"
            try? await Task.sleep(nanoseconds: 400_000_000)
            currentStep = 4
        } catch {
            errorMessage = error.localizedDescription
            currentStep = 2  // Go back to profile step
        }

        isGenerating = false
    }

    func createReminders() async {
        guard let plan = plan,
              let userId = SupabaseService.shared.currentUserId else { return }

        // First, get existing stack items
        let existingItems: [StackItem]
        do {
            existingItems = try await SupabaseService.shared.getStackItems()
        } catch {
            errorMessage = "Failed to load stack items."
            return
        }

        for reminder in plan.suggestedReminders {
            guard reminderSelections[reminder.id] == true else { continue }

            // Find or create stack item for this peptide
            var stackItemId: UUID
            if let existing = existingItems.first(where: { $0.name.lowercased() == reminder.peptide.lowercased() }) {
                stackItemId = existing.id
            } else {
                // Create a new stack item
                let newItem = StackItem(
                    id: UUID(), userId: userId,
                    name: reminder.peptide, type: "peptide",
                    dose: reminder.dose, unit: "mcg",
                    notes: "Added by Protocol Planner", active: true,
                    createdAt: nil
                )
                do {
                    try await SupabaseService.shared.insertStackItem(newItem)
                    stackItemId = newItem.id
                } catch {
                    print("Failed to create stack item for \(reminder.peptide): \(error)")
                    continue
                }
            }

            // Create the reminder
            let newReminder = Reminder(
                id: UUID(), userId: userId,
                stackItemId: stackItemId,
                time: reminder.time,
                daysOfWeek: reminder.days,
                dose: reminder.dose, active: true,
                createdAt: nil, stackItem: nil
            )
            do {
                try await SupabaseService.shared.insertReminder(newReminder)
            } catch {
                print("Failed to create reminder for \(reminder.peptide): \(error)")
            }
        }
    }

    /// Pre-fill from bloodwork results and go straight to plan generation
    func prefillFromBloodwork(analysis: String, recommendations: [BloodworkRecommendation], warnings: [String]) {
        reset()

        // Pre-add recommended peptides
        for rec in recommendations {
            addPeptide(rec.peptide)
        }

        // Set goals from bloodwork context
        if !warnings.isEmpty {
            for w in warnings {
                let lower = w.lowercased()
                if lower.contains("cholesterol") || lower.contains("lipid") { selectedGoals.insert("Fat Loss") }
                if lower.contains("glucose") || lower.contains("insulin") { selectedGoals.insert("Fat Loss") }
                if lower.contains("testosterone") || lower.contains("igf") { selectedGoals.insert("Muscle Growth") }
                if lower.contains("inflammation") || lower.contains("crp") { selectedGoals.insert("Recovery") }
                if lower.contains("thyroid") { selectedConditions.insert("Thyroid") }
            }
        }
        if selectedGoals.isEmpty {
            selectedGoals.insert("Recovery")
        }
    }

    func reset() {
        currentStep = 0
        selectedPeptides = []
        peptideInput = ""
        age = ""
        weight = ""
        weightUnit = "lbs"
        sex = "Male"
        experience = "Beginner"
        selectedConditions = []
        selectedGoals = []
        plan = nil
        errorMessage = nil
        reminderSelections = [:]
        resultsViewMode = 0
        userGoalText = ""
        cortexQuestions = []
        consultHistory = []
        consultRound = 0
        isConsulting = false
        consultDone = false
    }
}
