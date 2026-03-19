import SwiftUI

struct MainView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab: NavDestination = .dashboard
    @State private var previousTab: NavDestination? = nil
    @State private var drawerOpen = false

    var body: some View {
        ZStack {
            Color.cxParchment.ignoresSafeArea()

            VStack(spacing: 0) {
                // Top bar
                HStack(spacing: 0) {
                    // Back button (shows when not on dashboard)
                    if selectedTab != .dashboard {
                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                selectedTab = previousTab ?? .dashboard
                                previousTab = nil
                            }
                        } label: {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.cxTeal)
                                .frame(width: 40, height: 40)
                        }
                    } else {
                        // Hamburger menu
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
                    }

                    Spacer()

                    Text(selectedTab.label)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.cxBlack)

                    Spacer()

                    // Dashboard shortcut (shows when not on dashboard)
                    if selectedTab != .dashboard {
                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                previousTab = nil
                                selectedTab = .dashboard
                            }
                        } label: {
                            Image(systemName: "square.grid.2x2")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.cxTeal)
                                .frame(width: 40, height: 40)
                        }
                    } else {
                        Color.clear.frame(width: 40, height: 40)
                    }
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
        .onChange(of: selectedTab) { newTab in
            // Track previous tab for back button (but not when going to dashboard)
            if newTab != .dashboard {
                // previousTab is set before the change
            }
        }
    }

    @ViewBuilder
    var contentView: some View {
        switch selectedTab {
        case .dashboard:
            DashboardView(selectedTab: $selectedTab)
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
