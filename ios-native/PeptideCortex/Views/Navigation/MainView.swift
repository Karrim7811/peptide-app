import SwiftUI

struct MainView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab: NavDestination = .dashboard
    @State private var drawerOpen = false

    var body: some View {
        ZStack {
            Color.cxParchment.ignoresSafeArea()

            VStack(spacing: 0) {
                // Top bar
                HStack {
                    Button {
                        withAnimation(.spring(response: 0.35)) {
                            drawerOpen.toggle()
                        }
                    } label: {
                        Image(systemName: drawerOpen ? "xmark" : "line.3.horizontal")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.cxBlack)
                            .frame(width: 40, height: 40)
                    }

                    Spacer()

                    Text(selectedTab.label)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.cxBlack)

                    Spacer()

                    // Balance spacer
                    Color.clear.frame(width: 40, height: 40)
                }
                .padding(.horizontal, 12)
                .background(
                    Color.cxParchment.opacity(0.85)
                        .background(.ultraThinMaterial)
                )

                // Content
                contentView
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            // Drawer overlay
            DrawerMenu(selectedTab: $selectedTab, isOpen: $drawerOpen)
                .environmentObject(appState)
        }
    }

    @ViewBuilder
    var contentView: some View {
        switch selectedTab {
        case .dashboard:
            DashboardView()
        case .aiChat:
            ChatView()
        case .checker:
            CheckerView()
        case .stackFinder:
            StackFinderView()
        case .stack:
            StackView()
        case .reconstitution:
            ReconstitutionView()
        case .dosing:
            DosingView()
        case .cycle:
            CycleView()
        case .sites:
            SitesView()
        case .log:
            DoseLogView()
        case .reminders:
            RemindersView()
        case .inventory:
            InventoryView()
        case .sideEffects:
            SideEffectsView()
        case .notes:
            NotesView()
        case .reference:
            PeptideBibleView()
        case .popularStacks:
            PopularStacksView()
        case .regulatory:
            RegulatoryView()
        case .vendors:
            VendorsView()
        case .pricing:
            PricingView()
        }
    }
}
