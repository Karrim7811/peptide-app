import SwiftUI

enum NavDestination: String, CaseIterable {
    case dashboard, aiChat, checker, stackFinder
    case stack, reconstitution, dosing, cycle, sites
    case log, reminders, inventory, sideEffects, notes
    case reference, popularStacks, regulatory, vendors
    case pricing

    var label: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .aiChat: return "Peptide AI"
        case .checker: return "Interaction Checker"
        case .stackFinder: return "Stack Finder"
        case .stack: return "My Stack"
        case .reconstitution: return "Reconstitution"
        case .dosing: return "Dosage Calculator"
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
        }
    }

    var icon: String {
        switch self {
        case .dashboard: return "square.grid.2x2"
        case .aiChat: return "message"
        case .checker: return "shield"
        case .stackFinder: return "sparkles"
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
        }
    }

    static var sections: [(label: String, items: [NavDestination])] {
        [
            ("Intelligence", [.dashboard, .aiChat, .checker, .stackFinder]),
            ("My Protocol", [.stack, .reconstitution, .dosing, .cycle, .sites]),
            ("Tracking", [.log, .reminders, .inventory, .sideEffects, .notes]),
            ("Reference", [.reference, .popularStacks, .regulatory, .vendors]),
        ]
    }
}

struct DrawerMenu: View {
    @Binding var selectedTab: NavDestination
    @Binding var isOpen: Bool
    @EnvironmentObject var appState: AppState

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
                Text(item.label)
                    .font(.system(size: 15, weight: isActive ? .semibold : .regular))
                    .foregroundColor(isActive ? .cxTeal : .cxBlack)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.cxStone.opacity(0.5))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(isActive ? Color.cxTeal.opacity(0.08) : Color.clear)
        }
    }
}
