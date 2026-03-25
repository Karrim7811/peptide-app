import Foundation

@MainActor
class ProtocolPlannerViewModel: ObservableObject {
    @Published var currentStep: Int = 0  // 0=Welcome, 1=Peptides, 2=Profile, 3=Generating, 4=Results, 5=Reminders

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
    }
}
