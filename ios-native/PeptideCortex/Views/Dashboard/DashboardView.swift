import SwiftUI

struct DashboardView: View {
    @StateObject private var vm = DashboardViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Welcome
                VStack(alignment: .leading, spacing: 4) {
                    Text("Welcome back")
                        .font(.system(size: 14))
                        .foregroundColor(.cxStone)
                    Text("Your Protocol Overview")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.cxBlack)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Stat cards grid
                if vm.isLoading {
                    LoadingView()
                        .frame(height: 200)
                } else {
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12)
                    ], spacing: 12) {
                        StatCard(
                            title: "Active Stack",
                            value: "\(vm.stackCount)",
                            icon: "square.stack.3d.up"
                        )
                        StatCard(
                            title: "Reminders Today",
                            value: "\(vm.remindersToday)",
                            icon: "bell.fill",
                            color: .orange
                        )
                        StatCard(
                            title: "Logs This Week",
                            value: "\(vm.logsThisWeek)",
                            icon: "book.fill",
                            color: .blue
                        )
                        StatCard(
                            title: "Active Cycles",
                            value: "\(vm.activeCycles)",
                            icon: "arrow.triangle.2.circlepath",
                            color: .purple
                        )
                    }
                }

                // Quick actions
                VStack(alignment: .leading, spacing: 12) {
                    Text("QUICK ACTIONS")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    VStack(spacing: 8) {
                        QuickActionRow(icon: "plus.circle.fill", label: "Log a Dose", color: .cxTeal)
                        QuickActionRow(icon: "message.fill", label: "Ask Peptide AI", color: .blue)
                        QuickActionRow(icon: "shield.fill", label: "Check Interaction", color: .orange)
                        QuickActionRow(icon: "books.vertical.fill", label: "Browse Peptide Bible", color: .purple)
                    }
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }
}

struct QuickActionRow: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(color)
                .frame(width: 36, height: 36)
                .background(color.opacity(0.1))
                .cornerRadius(10)
            Text(label)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(.cxBlack)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundColor(.cxStone)
        }
        .padding(14)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
    }
}
