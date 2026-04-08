import SwiftUI

enum NavDestination: String, CaseIterable {
    case dashboard, aiChat, checker, stackFinder, bloodwork, protocolPlanner
    case stack, reconstitution, dosing, cycle, sites
    case log, reminders, inventory, sideEffects, notes
    case reference, popularStacks, regulatory, vendors
    case pricing, about

    var label: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .aiChat: return "Cortex AI"
        case .checker: return "Interaction Checker"
        case .stackFinder: return "Stack Finder"
        case .bloodwork: return "Bloodwork Reference"
        case .protocolPlanner: return "Protocol Planner"
        case .stack: return "My Stack"
        case .reconstitution: return "Reconstitution"
        case .dosing: return "Dosing Reference"
        case .cycle: return "Cycle Tracker"
        case .sites: return "Injection Sites"
        case .log: return "Dose Log"
        case .reminders: return "Reminders"
        case .inventory: return "Fridge Inventory"
        case .sideEffects: return "Side Effects"
        case .notes: return "Research Notes"
        case .reference: return "Peptide Bible"
        case .popularStacks: return "Popular Stacks"
        case .regulatory: return "Legal & Regulatory"
        case .vendors: return "Top Vendors"
        case .pricing: return "Upgrade to Pro"
        case .about: return "About"
        }
    }

    var subtitle: String {
        switch self {
        case .dashboard: return "Overview of your protocol"
        case .aiChat: return "Ask anything about peptides"
        case .checker: return "Research peptide interaction information"
        case .stackFinder: return "Find peptides that complement your stack"
        case .bloodwork: return "AI-powered educational lab reference"
        case .protocolPlanner: return "AI-powered protocol reference"
        case .stack: return "Add your peptides, meds & supplements"
        case .reconstitution: return "BAC water reference and unit converter"
        case .dosing: return "Research-based dosing reference info"
        case .cycle: return "Track your on/off cycling schedule"
        case .sites: return "Rotate injection sites to avoid irritation"
        case .log: return "Log each dose — tracks when to reorder"
        case .reminders: return "Set alerts so you never miss a dose"
        case .inventory: return "Track what's in your fridge & expiry dates"
        case .sideEffects: return "Record side effects by peptide & severity"
        case .notes: return "Save research notes & links by peptide"
        case .reference: return "Browse 58+ peptides with full details"
        case .popularStacks: return "Curated stacks for common goals"
        case .regulatory: return "FDA status & legal info by country"
        case .vendors: return "Trusted sources for peptides"
        case .pricing: return "Unlock unlimited features"
        case .about: return "Version, privacy policy & legal"
        }
    }

    var icon: String {
        switch self {
        case .dashboard: return "square.grid.2x2"
        case .aiChat: return "message"
        case .checker: return "shield"
        case .stackFinder: return "sparkles"
        case .bloodwork: return "heart.text.square"
        case .protocolPlanner: return "wand.and.stars"
        case .stack: return "square.stack.3d.up"
        case .reconstitution: return "flask"
        case .dosing: return "function"
        case .cycle: return "arrow.triangle.2.circlepath"
        case .sites: return "mappin.and.ellipse"
        case .log: return "book"
        case .reminders: return "bell"
        case .inventory: return "shippingbox"
        case .sideEffects: return "exclamationmark.triangle"
        case .notes: return "doc.text"
        case .reference: return "books.vertical"
        case .popularStacks: return "square.stack.3d.up.fill"
        case .regulatory: return "scale.3d"
        case .vendors: return "storefront"
        case .pricing: return "star.fill"
        case .about: return "info.circle"
        }
    }

    static var sections: [(label: String, items: [NavDestination])] {
        [
            ("Intelligence", [.dashboard, .aiChat, .checker, .stackFinder, .bloodwork, .protocolPlanner]),
            ("My Protocol", [.stack, .reconstitution, .dosing, .cycle, .sites]),
            ("Tracking", [.log, .reminders, .inventory, .sideEffects, .notes]),
            ("Reference", [.reference, .popularStacks, .regulatory, .vendors]),
            ("Settings", [.about]),
        ]
    }
}

struct DrawerMenu: View {
    @Binding var selectedTab: NavDestination
    @Binding var isOpen: Bool
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var storeService: StoreService
    @State private var showResetAlert = false
    @State private var isResetting = false

    var body: some View {
        ZStack(alignment: .leading) {
            // Backdrop
            if isOpen {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                    .onTapGesture { withAnimation(.spring(response: 0.35)) { isOpen = false } }
            }

            // Drawer
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 0) {
                    // Brand header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("PEPTIDE")
                            .font(.system(size: 11, weight: .medium))
                            .tracking(4)
                            .foregroundColor(.cxStone)
                        HStack(spacing: 0) {
                            Text("CORTE")
                            Text("X").foregroundColor(.cxTeal)
                        }
                        .font(.system(size: 28, weight: .light))
                        .tracking(3)
                        .foregroundColor(.cxBlack)
                        Text("INTELLIGENCE ENGINE")
                            .font(.system(size: 9, weight: .medium))
                            .tracking(3)
                            .foregroundColor(.cxStone)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 16)

                    Divider().background(Color.cxBorder)

                    // Nav sections
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 20) {
                            ForEach(NavDestination.sections, id: \.label) { section in
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(section.label.uppercased())
                                        .font(.system(size: 11, weight: .semibold))
                                        .tracking(2)
                                        .foregroundColor(.cxStone)
                                        .padding(.horizontal, 16)
                                        .padding(.bottom, 2)

                                    VStack(spacing: 0) {
                                        ForEach(section.items, id: \.self) { item in
                                            DrawerRow(
                                                item: item,
                                                isActive: selectedTab == item
                                            ) {
                                                selectedTab = item
                                                withAnimation(.spring(response: 0.35)) {
                                                    isOpen = false
                                                }
                                            }
                                        }
                                    }
                                    .background(Color.white.opacity(0.6))
                                    .cornerRadius(12)
                                    .padding(.horizontal, 12)
                                }
                            }
                        }
                        .padding(.vertical, 12)
                    }

                    Divider().background(Color.cxBorder)

                    // Bottom actions
                    VStack(spacing: 8) {
                        if !storeService.isProUser {
                            Button {
                                selectedTab = .pricing
                                withAnimation(.spring(response: 0.35)) { isOpen = false }
                            } label: {
                                Text("Upgrade to Pro")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color.cxTeal)
                                    .cornerRadius(12)
                            }
                        }

                        Button {
                            showResetAlert = true
                        } label: {
                            HStack {
                                Image(systemName: "exclamationmark.triangle.fill")
                                Text("Reset Everything")
                            }
                            .font(.system(size: 14))
                            .foregroundColor(.red.opacity(0.8))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.red.opacity(0.05))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.red.opacity(0.15), lineWidth: 1)
                            )
                        }
                        .disabled(isResetting)

                        Button {
                            Task { await appState.signOut() }
                        } label: {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Sign Out")
                            }
                            .font(.system(size: 14))
                            .foregroundColor(.cxStone)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.white.opacity(0.5))
                            .cornerRadius(12)
                        }
                    }
                    .padding(12)
                }
                .frame(width: min(UIScreen.main.bounds.width * 0.85, 320))
                .background(Color.cxParchment)
                .offset(x: isOpen ? 0 : -320)

                Spacer()
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.85), value: isOpen)
        .ignoresSafeArea()
        .alert("Reset Everything", isPresented: $showResetAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Reset All Data", role: .destructive) {
                isResetting = true
                Task {
                    do {
                        try await SupabaseService.shared.resetAllData()
                    } catch {
                        print("Reset error: \(error)")
                    }
                    isResetting = false
                    withAnimation(.spring(response: 0.35)) { isOpen = false }
                }
            }
        } message: {
            Text("Are you sure? This will remove all stack items, inventory, dose logs, and reminders. This cannot be undone.")
        }
    }
}

struct DrawerRow: View {
    let item: NavDestination
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: item.icon)
                    .font(.system(size: 16))
                    .foregroundColor(isActive ? .cxTeal : .cxStone)
                    .frame(width: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.label)
                        .font(.system(size: 15, weight: isActive ? .semibold : .regular))
                        .foregroundColor(isActive ? .cxTeal : .cxBlack)
                    Text(item.subtitle)
                        .font(.system(size: 10))
                        .foregroundColor(.cxStone)
                        .lineLimit(1)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.cxStone.opacity(0.5))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(isActive ? Color.cxTeal.opacity(0.08) : Color.clear)
        }
    }
}
