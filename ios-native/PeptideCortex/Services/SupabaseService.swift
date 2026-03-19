import Foundation
import Supabase

@MainActor
class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: AppConstants.supabaseURL)!,
            supabaseKey: AppConstants.supabaseAnonKey
        )
    }

    // MARK: - Auth

    func signIn(email: String, password: String) async throws {
        try await client.auth.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String) async throws {
        try await client.auth.signUp(email: email, password: password)
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    var currentUser: User? {
        client.auth.currentUser
    }

    var currentUserId: UUID? {
        currentUser?.id
    }

    // MARK: - Profile

    func getProfile() async throws -> Profile? {
        guard let userId = currentUserId else { return nil }
        return try await client.from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .single()
            .execute()
            .value
    }

    // MARK: - Stack Items

    func getStackItems() async throws -> [StackItem] {
        guard let userId = currentUserId else { return [] }
        return try await client.from("stack_items")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    func insertStackItem(_ item: StackItem) async throws {
        try await client.from("stack_items")
            .insert(item)
            .execute()
    }

    func updateStackItem(_ item: StackItem) async throws {
        try await client.from("stack_items")
            .update(item)
            .eq("id", value: item.id.uuidString)
            .execute()
    }

    func deleteStackItem(id: UUID) async throws {
        try await client.from("stack_items")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Dose Logs

    func getDoseLogs() async throws -> [DoseLog] {
        guard let userId = currentUserId else { return [] }
        return try await client.from("dose_logs")
            .select("*, stack_item:stack_items(*)")
            .eq("user_id", value: userId.uuidString)
            .order("taken_at", ascending: false)
            .execute()
            .value
    }

    func insertDoseLog(_ log: DoseLog) async throws {
        struct InsertLog: Codable {
            let id: UUID
            let user_id: UUID
            let stack_item_id: UUID
            let taken_at: String
            let dose: String
            let notes: String
        }
        let insert = InsertLog(
            id: log.id, user_id: log.userId,
            stack_item_id: log.stackItemId,
            taken_at: log.takenAt, dose: log.dose, notes: log.notes
        )
        try await client.from("dose_logs").insert(insert).execute()
    }

    func deleteDoseLog(id: UUID) async throws {
        try await client.from("dose_logs")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Reminders

    func getReminders() async throws -> [Reminder] {
        guard let userId = currentUserId else { return [] }
        return try await client.from("reminders")
            .select("*, stack_item:stack_items(*)")
            .eq("user_id", value: userId.uuidString)
            .order("time", ascending: true)
            .execute()
            .value
    }

    func insertReminder(_ reminder: Reminder) async throws {
        struct InsertReminder: Codable {
            let id: UUID
            let user_id: UUID
            let stack_item_id: UUID
            let time: String
            let days_of_week: [Int]
            let dose: String
            let active: Bool
        }
        let insert = InsertReminder(
            id: reminder.id, user_id: reminder.userId,
            stack_item_id: reminder.stackItemId,
            time: reminder.time, days_of_week: reminder.daysOfWeek,
            dose: reminder.dose, active: reminder.active
        )
        try await client.from("reminders").insert(insert).execute()
    }

    func updateReminder(_ reminder: Reminder) async throws {
        try await client.from("reminders")
            .update(reminder)
            .eq("id", value: reminder.id.uuidString)
            .execute()
    }

    func deleteReminder(id: UUID) async throws {
        try await client.from("reminders")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Cycles

    func getCycles() async throws -> [Cycle] {
        guard let userId = currentUserId else { return [] }
        return try await client.from("cycles")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    func insertCycle(_ cycle: Cycle) async throws {
        try await client.from("cycles").insert(cycle).execute()
    }

    func updateCycle(_ cycle: Cycle) async throws {
        try await client.from("cycles")
            .update(cycle)
            .eq("id", value: cycle.id.uuidString)
            .execute()
    }

    func deleteCycle(id: UUID) async throws {
        try await client.from("cycles")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Injection Sites

    func getInjectionLogs() async throws -> [InjectionLog] {
        guard let userId = currentUserId else { return [] }
        return try await client.from("injection_sites")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("injected_at", ascending: false)
            .execute()
            .value
    }

    func insertInjectionLog(_ log: InjectionLog) async throws {
        try await client.from("injection_sites").insert(log).execute()
    }

    // MARK: - Inventory

    func getInventory() async throws -> [InventoryItem] {
        guard let userId = currentUserId else { return [] }
        return try await client.from("inventory")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    func insertInventoryItem(_ item: InventoryItem) async throws {
        try await client.from("inventory").insert(item).execute()
    }

    func updateInventoryItem(_ item: InventoryItem) async throws {
        try await client.from("inventory")
            .update(item)
            .eq("id", value: item.id.uuidString)
            .execute()
    }

    func deleteInventoryItem(id: UUID) async throws {
        try await client.from("inventory")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Side Effects

    func getSideEffects() async throws -> [SideEffect] {
        guard let userId = currentUserId else { return [] }
        return try await client.from("side_effects")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("occurred_at", ascending: false)
            .execute()
            .value
    }

    func insertSideEffect(_ effect: SideEffect) async throws {
        try await client.from("side_effects").insert(effect).execute()
    }

    func deleteSideEffect(id: UUID) async throws {
        try await client.from("side_effects")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Research Notes

    func getResearchNotes() async throws -> [ResearchNote] {
        guard let userId = currentUserId else { return [] }
        return try await client.from("research_notes")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    func insertResearchNote(_ note: ResearchNote) async throws {
        try await client.from("research_notes").insert(note).execute()
    }

    func deleteResearchNote(id: UUID) async throws {
        try await client.from("research_notes")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }
}
