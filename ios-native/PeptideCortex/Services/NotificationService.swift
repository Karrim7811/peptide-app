import Foundation
import UserNotifications
import EventKit

/// Local dosing-reminder alarms and calendar export.
///
/// Reminders are rows in Supabase; this service turns the ACTIVE ones into real
/// device alarms two ways:
///   1. Local notifications (UNUserNotificationCenter) — one repeating weekly
///      trigger per selected weekday. Kept in sync with the DB on every load.
///   2. Optional EventKit export — weekly-recurring calendar events with an
///      alarm, so the reminder also lives in the user's calendar app.
@MainActor
final class NotificationService {
    static let shared = NotificationService()
    private init() {}

    private let center = UNUserNotificationCenter.current()
    private static let idPrefix = "pc-reminder-"

    // MARK: Notifications

    @discardableResult
    func requestAuthorization() async -> Bool {
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            print("Notification auth error: \(error)")
            return false
        }
    }

    private func identifier(for reminderId: UUID, day: Int) -> String {
        "\(Self.idPrefix)\(reminderId.uuidString)-\(day)"
    }

    private func parseTime(_ time: String) -> (hour: Int, minute: Int)? {
        let parts = time.split(separator: ":")
        guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]),
              (0...23).contains(h), (0...59).contains(m) else { return nil }
        return (h, m)
    }

    /// Reconcile all local notifications with the current reminder set. Removes
    /// every Peptide Cortex reminder, then reschedules the active ones — so a
    /// toggle or delete is reflected simply by reloading.
    func syncAll(_ reminders: [Reminder]) async {
        let pending = await center.pendingNotificationRequests()
        let staleIds = pending.map(\.identifier).filter { $0.hasPrefix(Self.idPrefix) }
        center.removePendingNotificationRequests(withIdentifiers: staleIds)

        for reminder in reminders where reminder.active {
            await schedule(reminder)
        }
    }

    private func schedule(_ reminder: Reminder) async {
        guard reminder.active, let (hour, minute) = parseTime(reminder.time) else { return }
        let name = reminder.stackItem?.name ?? "your peptide"
        let dose = reminder.dose.trimmingCharacters(in: .whitespaces)

        let content = UNMutableNotificationContent()
        content.title = "Peptide Cortex"
        content.body = dose.isEmpty ? "Time for \(name)." : "Time for \(name) — \(dose)."
        content.sound = .default

        for day in reminder.daysOfWeek where (0...6).contains(day) {
            var comps = DateComponents()
            comps.weekday = day + 1 // iOS weekday: 1=Sun..7=Sat; ours: 0=Sun..6=Sat
            comps.hour = hour
            comps.minute = minute
            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
            let request = UNNotificationRequest(
                identifier: identifier(for: reminder.id, day: day),
                content: content,
                trigger: trigger
            )
            do {
                try await center.add(request)
            } catch {
                print("Schedule error: \(error)")
            }
        }
    }

    // MARK: Calendar (EventKit)

    /// Add the active reminders to the user's calendar as weekly-recurring
    /// events with an alarm. Returns false if access was denied or nothing saved.
    func addToCalendar(_ reminders: [Reminder]) async -> Bool {
        let store = EKEventStore()
        let granted: Bool
        do {
            if #available(iOS 17.0, *) {
                granted = try await store.requestWriteOnlyAccessToEvents()
            } else {
                granted = try await store.requestAccess(to: .event)
            }
        } catch {
            print("Calendar access error: \(error)")
            return false
        }
        guard granted, let calendar = store.defaultCalendarForNewEvents else { return false }

        var savedAny = false
        for reminder in reminders where reminder.active {
            guard let (hour, minute) = parseTime(reminder.time),
                  !reminder.daysOfWeek.isEmpty,
                  let start = nextOccurrence(hour: hour, minute: minute, days: reminder.daysOfWeek)
            else { continue }

            let name = reminder.stackItem?.name ?? "Peptide"
            let dose = reminder.dose.trimmingCharacters(in: .whitespaces)

            let event = EKEvent(eventStore: store)
            event.calendar = calendar
            event.title = dose.isEmpty ? "Peptide Cortex — \(name)" : "Peptide Cortex — \(name) (\(dose))"
            event.notes = "Dosing reminder from Peptide Cortex. For research and educational reference only — not medical advice."
            event.startDate = start
            event.endDate = start.addingTimeInterval(15 * 60)

            let ekDays = reminder.daysOfWeek.compactMap { day -> EKRecurrenceDayOfWeek? in
                guard let weekday = EKWeekday(rawValue: day + 1) else { return nil }
                return EKRecurrenceDayOfWeek(weekday)
            }
            if !ekDays.isEmpty {
                event.recurrenceRules = [
                    EKRecurrenceRule(recurrenceWith: .weekly, interval: 1, daysOfTheWeek: ekDays,
                                     daysOfTheMonth: nil, monthsOfTheYear: nil, weeksOfTheYear: nil,
                                     daysOfTheYear: nil, setPositions: nil, end: nil)
                ]
            }
            event.addAlarm(EKAlarm(relativeOffset: 0))

            do {
                try store.save(event, span: .futureEvents, commit: false)
                savedAny = true
            } catch {
                print("Calendar save error: \(error)")
            }
        }

        guard savedAny else { return false }
        do {
            try store.commit()
            return true
        } catch {
            print("Calendar commit error: \(error)")
            return false
        }
    }

    private func nextOccurrence(hour: Int, minute: Int, days: [Int]) -> Date? {
        let cal = Calendar.current
        let now = Date()
        for offset in 0..<8 {
            guard let base = cal.date(byAdding: .day, value: offset, to: now) else { continue }
            var comps = cal.dateComponents([.year, .month, .day], from: base)
            comps.hour = hour
            comps.minute = minute
            comps.second = 0
            guard let candidate = cal.date(from: comps) else { continue }
            let weekday = cal.component(.weekday, from: candidate) - 1 // 0=Sun..6=Sat
            if days.contains(weekday) && candidate >= now { return candidate }
        }
        return nil
    }
}
