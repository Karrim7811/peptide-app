import SwiftUI

struct DashboardView: View {
    @StateObject private var vm = DashboardViewModel()
    @Binding var selectedTab: NavDestination

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 6) {
                    Text(greeting.uppercased())
                        .font(.system(size: 10, weight: .regular))
                        .tracking(3)
                        .foregroundColor(.cxStone)
                    Text("Your Protocol\nOverview")
                        .font(.custom("Georgia", size: 28))
                        .fontWeight(.light)
                        .foregroundColor(.cxBlack)
                        .lineSpacing(4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 24)

                // Stat cards
                if vm.isLoading {
                    LoadingView().frame(height: 160)
                } else {
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 10),
                        GridItem(.flexible(), spacing: 10)
                    ], spacing: 10) {
                        DashStatCard(title: "Active Stack", value: "\(vm.stackCount)", icon: "square.stack.3d.up") {
                            selectedTab = .stack
                        }
                        DashStatCard(title: "Reminders", value: "\(vm.remindersToday)", icon: "bell", color: .orange) {
                            selectedTab = .reminders
                        }
                        DashStatCard(title: "Logs This Week", value: "\(vm.logsThisWeek)", icon: "book", color: .blue) {
                            selectedTab = .log
                        }
                        DashStatCard(title: "Active Cycles", value: "\(vm.activeCycles)", icon: "arrow.triangle.2.circlepath", color: .purple) {
                            selectedTab = .cycle
                        }
                    }
                    .padding(.horizontal, 20)
                }

                // Quick Actions
                VStack(alignment: .leading, spacing: 10) {
                    Text("QUICK ACTIONS")
                        .font(.system(size: 10, weight: .medium))
                        .tracking(3)
                        .foregroundColor(.cxStone)
                        .padding(.top, 28)

                    QuickAction(icon: "plus.circle.fill", label: "Log a Dose", subtitle: "Record your latest dose", color: .cxTeal) {
                        selectedTab = .log
                    }
                    QuickAction(icon: "message.fill", label: "Ask Peptide AI", subtitle: "Chat with your AI assistant", color: Color(red: 0.3, green: 0.5, blue: 0.8)) {
                        selectedTab = .aiChat
                    }
                    QuickAction(icon: "shield.fill", label: "Check Interaction", subtitle: "Verify compound safety", color: .orange) {
                        selectedTab = .checker
                    }
                    QuickAction(icon: "books.vertical.fill", label: "Peptide Bible", subtitle: "Browse 58+ peptides", color: .purple) {
                        selectedTab = .reference
                    }
                }
                .padding(.horizontal, 20)

                // News Feed
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("PEPTIDE NEWS & FDA UPDATES")
                            .font(.system(size: 10, weight: .medium))
                            .tracking(3)
                            .foregroundColor(.cxStone)
                        Spacer()
                        if vm.newsLoading {
                            ProgressView().scaleEffect(0.7)
                        }
                    }
                    .padding(.top, 28)

                    if let pulse = vm.marketPulse {
                        // Trending
                        if !pulse.trendingPeptides.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(pulse.trendingPeptides, id: \.self) { peptide in
                                        Text(peptide)
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundColor(.cxTeal)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 6)
                                            .background(Color.cxTeal.opacity(0.08))
                                            .cornerRadius(20)
                                    }
                                }
                            }
                        }

                        // FDA Watch
                        if !pulse.fdaWatch.isEmpty {
                            VStack(spacing: 0) {
                                ForEach(pulse.fdaWatch) { item in
                                    HStack(alignment: .top, spacing: 12) {
                                        Image(systemName: "cross.case.fill")
                                            .font(.system(size: 14))
                                            .foregroundColor(.red)
                                            .frame(width: 28, height: 28)
                                            .background(Color.red.opacity(0.08))
                                            .cornerRadius(8)
                                        VStack(alignment: .leading, spacing: 3) {
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
                                    .padding(.vertical, 12)
                                    if item.id != pulse.fdaWatch.last?.id {
                                        Divider()
                                    }
                                }
                            }
                            .padding(16)
                            .background(Color.white)
                            .cornerRadius(14)
                            .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
                        }

                        // Headlines
                        ForEach(pulse.headlines) { headline in
                            NewsCard(headline: headline)
                        }
                    } else if !vm.newsLoading {
                        Text("Pull to refresh for latest news")
                            .font(.system(size: 13))
                            .foregroundColor(.cxStone)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
        }
        .background(Color.cxParchment)
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 12 { return "Good morning" }
        if hour < 17 { return "Good afternoon" }
        return "Good evening"
    }
}

// MARK: - Stat Card

struct DashStatCard: View {
    let title: String
    let value: String
    let icon: String
    var color: Color = .cxTeal
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: 16))
                        .foregroundColor(color)
                    Spacer()
                }
                Text(value)
                    .font(.system(size: 28, weight: .light, design: .serif))
                    .foregroundColor(.cxBlack)
                Text(title.uppercased())
                    .font(.system(size: 9, weight: .medium))
                    .tracking(2)
                    .foregroundColor(.cxStone)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            .cornerRadius(14)
            .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Quick Action

struct QuickAction: View {
    let icon: String
    let label: String
    let subtitle: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(color)
                    .frame(width: 40, height: 40)
                    .background(color.opacity(0.08))
                    .cornerRadius(10)
                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.cxBlack)
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundColor(.cxStone)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.cxStone.opacity(0.5))
            }
            .padding(14)
            .background(Color.white)
            .cornerRadius(14)
            .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - News Card

struct NewsCard: View {
    let headline: MarketPulseResponse.Headline

    var sentimentColor: Color {
        switch headline.sentiment {
        case "positive": return .green
        case "negative": return .red
        case "warning": return .orange
        default: return .cxStone
        }
    }

    var categoryIcon: String {
        switch headline.category {
        case "FDA": return "cross.case"
        case "Research": return "flask"
        case "Market": return "chart.line.uptrend.xyaxis"
        case "Regulatory": return "scale.3d"
        case "Clinical": return "stethoscope"
        default: return "newspaper"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: categoryIcon)
                    .font(.system(size: 11))
                    .foregroundColor(sentimentColor)
                Text(headline.category.uppercased())
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(sentimentColor)
                Spacer()
                Circle()
                    .fill(sentimentColor)
                    .frame(width: 6, height: 6)
            }
            Text(headline.title)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.cxBlack)
                .lineLimit(2)
            Text(headline.summary)
                .font(.system(size: 12))
                .foregroundColor(.cxStone)
                .lineLimit(3)
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.03), radius: 4, y: 1)
    }
}
