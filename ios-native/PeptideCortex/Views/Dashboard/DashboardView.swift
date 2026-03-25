import SwiftUI

struct DashboardView: View {
    @StateObject private var vm = DashboardViewModel()
    @Binding var selectedTab: NavDestination

    var body: some View {
        ScrollView(showsIndicators: false) {
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

                // Protocol Planner CTA
                Button {
                    selectedTab = .protocolPlanner
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "wand.and.stars")
                            .font(.system(size: 24))
                            .foregroundColor(.white)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Plan My Protocol")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            Text("Let Cortex AI build your personalized dosing plan")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.85))
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.white.opacity(0.7))
                    }
                    .padding(16)
                    .background(
                        LinearGradient(colors: [Color.cxTeal, Color.cxTeal.opacity(0.8)], startPoint: .leading, endPoint: .trailing)
                    )
                    .cornerRadius(14)
                }
                .buttonStyle(.plain)

                // Stat cards grid
                if vm.isLoading {
                    LoadingView()
                        .frame(height: 200)
                } else {
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12)
                    ], spacing: 12) {
                        StatCard(title: "Active Stack", value: "\(vm.stackCount)", icon: "square.stack.3d.up")
                            .onTapGesture { selectedTab = .stack }
                        StatCard(title: "Reminders Today", value: "\(vm.remindersToday)", icon: "bell.fill", color: .orange)
                            .onTapGesture { selectedTab = .reminders }
                        StatCard(title: "Logs This Week", value: "\(vm.logsThisWeek)", icon: "book.fill", color: .blue)
                            .onTapGesture { selectedTab = .log }
                        StatCard(title: "Active Cycles", value: "\(vm.activeCycles)", icon: "arrow.triangle.2.circlepath", color: .purple)
                            .onTapGesture { selectedTab = .cycle }
                    }
                }

                // Today's Doses
                if !vm.todayReminders.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("TODAY'S DOSES")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.cxStone)

                        VStack(spacing: 0) {
                            ForEach(Array(vm.todayReminders.enumerated()), id: \.element.id) { index, item in
                                HStack(spacing: 12) {
                                    Image(systemName: item.taken ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 20))
                                        .foregroundColor(item.taken ? .green : .cxStone)

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(item.reminder.stackItem?.name ?? "Unknown")
                                            .font(.system(size: 15, weight: .semibold))
                                            .foregroundColor(.cxBlack)
                                        HStack(spacing: 6) {
                                            Text(item.reminder.dose)
                                                .font(.system(size: 13, weight: .medium))
                                                .foregroundColor(.cxTeal)
                                            Text("at \(item.reminder.time)")
                                                .font(.system(size: 12))
                                                .foregroundColor(.cxStone)
                                        }
                                    }

                                    Spacer()

                                    if !item.taken {
                                        Button {
                                            Task { await vm.quickLogDose(reminder: item.reminder) }
                                        } label: {
                                            Text("Take")
                                                .font(.system(size: 13, weight: .semibold))
                                                .foregroundColor(.white)
                                                .padding(.horizontal, 16)
                                                .padding(.vertical, 8)
                                                .background(Color.cxTeal)
                                                .cornerRadius(8)
                                        }
                                    } else {
                                        Text("Done")
                                            .font(.system(size: 13, weight: .medium))
                                            .foregroundColor(.green)
                                    }
                                }
                                .padding(.vertical, 12)
                                .padding(.horizontal, 14)
                                if index < vm.todayReminders.count - 1 {
                                    Divider().padding(.horizontal, 14)
                                }
                            }
                        }
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
                    }
                }

                // Active Stack with Reconstitution
                if !vm.activeStackItems.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("MY ACTIVE STACK")
                                .font(.system(size: 11, weight: .semibold))
                                .tracking(2)
                                .foregroundColor(.cxStone)
                            Spacer()
                            Button {
                                selectedTab = .stack
                            } label: {
                                Text("Edit")
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxTeal)
                            }
                        }

                        VStack(spacing: 0) {
                            ForEach(Array(vm.activeStackItems.enumerated()), id: \.element.id) { index, item in
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        // Type badge
                                        Text(item.type.uppercased())
                                            .font(.system(size: 8, weight: .bold))
                                            .tracking(1)
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(typeBadgeColor(item.type))
                                            .cornerRadius(4)

                                        Text(item.name)
                                            .font(.system(size: 15, weight: .semibold))
                                            .foregroundColor(.cxBlack)

                                        Spacer()

                                        if !item.dose.isEmpty {
                                            Text("\(item.dose)\(item.unit.isEmpty ? "" : " \(item.unit)")")
                                                .font(.system(size: 14, weight: .medium))
                                                .foregroundColor(.cxTeal)
                                        }
                                    }

                                    // Auto reconstitution for peptides
                                    if let recon = vm.reconResults[item.id] {
                                        HStack(spacing: 16) {
                                            HStack(spacing: 4) {
                                                Image(systemName: "drop.fill")
                                                    .font(.system(size: 10))
                                                    .foregroundColor(.blue)
                                                Text("BAC Water: \(String(format: "%.1f", recon.recommendedBacWaterMl)) mL")
                                                    .font(.system(size: 12))
                                                    .foregroundColor(.cxSmoke)
                                            }
                                            HStack(spacing: 4) {
                                                Image(systemName: "eyedropper")
                                                    .font(.system(size: 10))
                                                    .foregroundColor(.green)
                                                Text("\(String(format: "%.0f", recon.concentrationMcgPerMl)) mcg/mL")
                                                    .font(.system(size: 12))
                                                    .foregroundColor(.cxSmoke)
                                            }
                                        }
                                        .padding(.top, 2)

                                        if !recon.tipicalDoseRange.isEmpty {
                                            Text("Typical dose: \(recon.tipicalDoseRange)")
                                                .font(.system(size: 11))
                                                .foregroundColor(.cxStone)
                                        }
                                    }

                                    if !item.notes.isEmpty {
                                        Text(item.notes)
                                            .font(.system(size: 12))
                                            .foregroundColor(.cxStone)
                                            .lineLimit(1)
                                    }
                                }
                                .padding(.vertical, 12)
                                .padding(.horizontal, 14)
                                if index < vm.activeStackItems.count - 1 {
                                    Divider().padding(.horizontal, 14)
                                }
                            }
                        }
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
                    }
                }

                // Supply Alerts
                if !vm.supplyAlerts.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("SUPPLY ALERTS")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.cxStone)

                        VStack(spacing: 8) {
                            ForEach(vm.supplyAlerts) { alert in
                                HStack(spacing: 10) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .font(.system(size: 16))
                                        .foregroundColor(.orange)
                                    Text("\(alert.name): ~\(alert.dosesLeft) doses left — reorder soon")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.cxBlack)
                                    Spacer()
                                }
                                .padding(14)
                                .background(Color.orange.opacity(0.08))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.orange.opacity(0.25), lineWidth: 1)
                                )
                            }
                        }
                    }
                }

                // Quick actions
                VStack(alignment: .leading, spacing: 12) {
                    Text("QUICK ACTIONS")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    VStack(spacing: 8) {
                        QuickActionRow(icon: "shippingbox.fill", label: "Fridge Inventory", color: .cxTeal) {
                            selectedTab = .inventory
                        }
                        QuickActionRow(icon: "plus.circle.fill", label: "Log a Dose", color: .cxTeal) {
                            selectedTab = .log
                        }
                        QuickActionRow(icon: "square.stack.3d.up.fill", label: "Manage Stack", color: .cxTeal) {
                            selectedTab = .stack
                        }
                        QuickActionRow(icon: "message.fill", label: "Ask Cortex AI", color: .blue) {
                            selectedTab = .aiChat
                        }
                        QuickActionRow(icon: "shield.fill", label: "Check Interaction", color: .orange) {
                            selectedTab = .checker
                        }
                        QuickActionRow(icon: "flask.fill", label: "Reconstitution Calculator", color: .green) {
                            selectedTab = .reconstitution
                        }
                        QuickActionRow(icon: "books.vertical.fill", label: "Browse Peptide Bible", color: .purple) {
                            selectedTab = .reference
                        }
                    }
                }

                // Peptide News Feed
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("PEPTIDE NEWS & FDA UPDATES")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.cxStone)
                        Spacer()
                        if vm.newsLoading {
                            ProgressView().scaleEffect(0.7)
                        }
                    }

                    if let error = vm.newsError {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(.orange)
                            Text(error)
                                .font(.system(size: 13))
                                .foregroundColor(.cxStone)
                        }
                        .padding(14)
                        .background(Color.white)
                        .cornerRadius(12)

                        Button {
                            Task { await vm.loadNews() }
                        } label: {
                            Text("Retry")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.cxTeal)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.cxTeal.opacity(0.1))
                                .cornerRadius(10)
                        }
                    }

                    if let pulse = vm.marketPulse {
                        // Trending peptides
                        if !pulse.trendingPeptides.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(pulse.trendingPeptides, id: \.self) { name in
                                        Text(name)
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundColor(.cxTeal)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 6)
                                            .background(Color.cxTeal.opacity(0.1))
                                            .cornerRadius(16)
                                    }
                                }
                            }
                        }

                        // FDA Watch
                        if !pulse.fdaWatch.isEmpty {
                            VStack(spacing: 0) {
                                ForEach(Array(pulse.fdaWatch.enumerated()), id: \.element.id) { index, item in
                                    HStack(alignment: .top, spacing: 12) {
                                        Image(systemName: "cross.case.fill")
                                            .font(.system(size: 13))
                                            .foregroundColor(.red)
                                            .frame(width: 28, height: 28)
                                            .background(Color.red.opacity(0.1))
                                            .cornerRadius(8)
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(item.peptide)
                                                .font(.system(size: 14, weight: .semibold))
                                                .foregroundColor(.cxBlack)
                                            Text(item.status)
                                                .font(.system(size: 12))
                                                .foregroundColor(.cxTeal)
                                            Text(item.update)
                                                .font(.system(size: 12))
                                                .foregroundColor(.cxStone)
                                                .lineLimit(2)
                                        }
                                        Spacer()
                                    }
                                    .padding(.vertical, 10)
                                    if index < pulse.fdaWatch.count - 1 {
                                        Divider()
                                    }
                                }
                            }
                            .padding(14)
                            .background(Color.white)
                            .cornerRadius(12)
                            .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
                        }

                        // Headlines
                        ForEach(pulse.headlines) { headline in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text(headline.category.uppercased())
                                        .font(.system(size: 9, weight: .semibold))
                                        .tracking(1.5)
                                        .foregroundColor(sentimentColor(headline.sentiment))
                                    Spacer()
                                    Circle()
                                        .fill(sentimentColor(headline.sentiment))
                                        .frame(width: 6, height: 6)
                                }
                                Text(headline.title)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.cxBlack)
                                Text(headline.summary)
                                    .font(.system(size: 12))
                                    .foregroundColor(.cxStone)
                                    .lineLimit(3)
                            }
                            .padding(14)
                            .background(Color.white)
                            .cornerRadius(12)
                            .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
                        }
                    } else if !vm.newsLoading && vm.newsError == nil {
                        VStack(spacing: 8) {
                            Image(systemName: "newspaper")
                                .font(.system(size: 24))
                                .foregroundColor(.cxStone)
                            Text("Loading peptide news...")
                                .font(.system(size: 13))
                                .foregroundColor(.cxStone)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 20)
                    }
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    func typeBadgeColor(_ type: String) -> Color {
        switch type {
        case "peptide": return .cxTeal
        case "medication": return .blue
        case "supplement": return .green
        default: return .cxStone
        }
    }

    func sentimentColor(_ sentiment: String) -> Color {
        switch sentiment {
        case "positive": return .green
        case "negative": return .red
        case "warning": return .orange
        default: return .cxStone
        }
    }
}

struct QuickActionRow: View {
    let icon: String
    let label: String
    let color: Color
    var action: () -> Void

    var body: some View {
        Button(action: action) {
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
        .buttonStyle(.plain)
    }
}
