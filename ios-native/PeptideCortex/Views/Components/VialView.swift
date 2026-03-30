import SwiftUI

// MARK: - Cap Color by Category
func vialCapColor(for type: String, name: String = "") -> Color {
    let n = name.lowercased()
    if n.contains("semaglutide") || n.contains("tirzepatide") || n.contains("retatrutide") || n.contains("aod") {
        return Color.green // Weight loss
    } else if n.contains("semax") || n.contains("selank") || n.contains("dsip") || n.contains("pinealon") {
        return Color.purple // Cognitive
    } else if n.contains("bpc") || n.contains("tb-500") || n.contains("wolverine") || n.contains("glow") || n.contains("klow") || n.contains("tri-heal") {
        return Color.cxTeal // Healing
    } else if n.contains("ipamorelin") || n.contains("cjc") || n.contains("sermorelin") || n.contains("tesamorelin") || n.contains("ghrp") {
        return Color(red: 0.85, green: 0.65, blue: 0.2) // Gold - GH
    }
    return Color.cxTeal
}

// MARK: - Vector Vial (Illustrated Style)

struct VectorVialView: View {
    let name: String
    let dose: String
    let unit: String
    let fillPercent: Double // 0.0 to 1.0
    let isDueNow: Bool

    @State private var shimmer = false

    var capColor: Color { vialCapColor(for: "", name: name) }

    var body: some View {
        VStack(spacing: 0) {
            // Cap
            RoundedRectangle(cornerRadius: 3)
                .fill(
                    LinearGradient(colors: [capColor.opacity(0.7), capColor, capColor.opacity(0.7)],
                                   startPoint: .leading, endPoint: .trailing)
                )
                .frame(width: 32, height: 10)

            // Neck
            RoundedRectangle(cornerRadius: 2)
                .fill(
                    LinearGradient(colors: [Color.gray.opacity(0.15), Color.gray.opacity(0.3), Color.gray.opacity(0.15)],
                                   startPoint: .leading, endPoint: .trailing)
                )
                .frame(width: 18, height: 8)

            // Body
            ZStack(alignment: .bottom) {
                // Glass
                RoundedRectangle(cornerRadius: 6)
                    .fill(
                        LinearGradient(colors: [
                            Color.white.opacity(0.9),
                            Color.gray.opacity(0.08),
                            Color.white.opacity(0.6),
                            Color.gray.opacity(0.12)
                        ], startPoint: .leading, endPoint: .trailing)
                    )
                    .frame(width: 44, height: 64)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color.gray.opacity(0.25), lineWidth: 1)
                    )

                // Fill level
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        LinearGradient(colors: [capColor.opacity(0.15), capColor.opacity(0.25)],
                                       startPoint: .top, endPoint: .bottom)
                    )
                    .frame(width: 40, height: max(4, 58 * fillPercent))
                    .padding(.bottom, 2)

                // Label
                VStack(spacing: 1) {
                    Text("CORTEX")
                        .font(.system(size: 5, weight: .bold))
                        .tracking(1)
                        .foregroundColor(.cxTeal)

                    Text(shortName(name))
                        .font(.system(size: 6, weight: .semibold))
                        .foregroundColor(.cxBlack)
                        .lineLimit(2)
                        .multilineTextAlignment(.center)

                    if !dose.isEmpty {
                        Text("\(dose)\(unit.isEmpty ? "" : " \(unit)")")
                            .font(.system(size: 5, weight: .medium))
                            .foregroundColor(.cxStone)
                    }
                }
                .frame(width: 38)
                .padding(.vertical, 3)
                .background(Color.white.opacity(0.85))
                .cornerRadius(3)
                .padding(.bottom, 14)

                // Glass reflection
                RoundedRectangle(cornerRadius: 6)
                    .fill(
                        LinearGradient(colors: [Color.white.opacity(0.4), Color.clear],
                                       startPoint: .topLeading, endPoint: .center)
                    )
                    .frame(width: 44, height: 64)
                    .allowsHitTesting(false)
            }
        }
        .overlay(
            // Glow for due-now vials
            RoundedRectangle(cornerRadius: 8)
                .stroke(capColor.opacity(isDueNow && shimmer ? 0.6 : 0), lineWidth: 2)
                .frame(width: 50, height: 88)
                .blur(radius: 3)
        )
        .onAppear {
            if isDueNow {
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                    shimmer = true
                }
            }
        }
    }

    func shortName(_ name: String) -> String {
        // Shorten long names
        let cleaned = name
            .replacingOccurrences(of: " (research)", with: "")
            .replacingOccurrences(of: " (not a peptide, but commonly discussed)", with: "")
            .replacingOccurrences(of: "Vasoactive Intestinal Peptide", with: "VIP")
        if cleaned.count > 12 {
            return String(cleaned.prefix(11)) + "..."
        }
        return cleaned
    }
}

// MARK: - Photo Vial (Realistic Style)

struct PhotoVialView: View {
    let name: String
    let dose: String
    let unit: String
    let isDueNow: Bool

    @State private var shimmer = false

    var capColor: Color { vialCapColor(for: "", name: name) }

    var body: some View {
        ZStack {
            // Vial silhouette (realistic shape)
            VialShape()
                .fill(
                    LinearGradient(colors: [
                        Color.white,
                        Color.gray.opacity(0.05),
                        Color.white.opacity(0.8),
                        Color.gray.opacity(0.1),
                        Color.white
                    ], startPoint: .leading, endPoint: .trailing)
                )
                .frame(width: 44, height: 82)
                .overlay(
                    VialShape()
                        .stroke(Color.gray.opacity(0.3), lineWidth: 0.8)
                )

            // Cap overlay
            VStack {
                RoundedRectangle(cornerRadius: 3)
                    .fill(
                        LinearGradient(colors: [
                            Color.gray.opacity(0.4),
                            Color.gray.opacity(0.6),
                            Color.gray.opacity(0.4)
                        ], startPoint: .leading, endPoint: .trailing)
                    )
                    .frame(width: 30, height: 10)
                Spacer()
            }

            // Color ring at cap
            VStack {
                Spacer().frame(height: 10)
                Rectangle()
                    .fill(capColor)
                    .frame(width: 30, height: 3)
                Spacer()
            }

            // Label
            VStack(spacing: 1) {
                Text("CORTEX")
                    .font(.system(size: 5, weight: .bold))
                    .tracking(1)
                    .foregroundColor(.cxTeal)

                Text(shortName(name))
                    .font(.system(size: 6.5, weight: .semibold))
                    .foregroundColor(.cxBlack)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)

                if !dose.isEmpty {
                    Text("\(dose)\(unit.isEmpty ? "" : " \(unit)")")
                        .font(.system(size: 5.5, weight: .medium))
                        .foregroundColor(.cxStone)
                }
            }
            .frame(width: 36)
            .padding(.vertical, 3)
            .background(
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.white.opacity(0.9))
            )
            .offset(y: 8)

            // Glass shine
            VialShape()
                .fill(
                    LinearGradient(colors: [Color.white.opacity(0.5), Color.clear, Color.clear],
                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                )
                .frame(width: 44, height: 82)
                .allowsHitTesting(false)
        }
        .frame(width: 44, height: 82)
        .overlay(
            Circle()
                .fill(capColor.opacity(isDueNow && shimmer ? 0.3 : 0))
                .frame(width: 60, height: 60)
                .blur(radius: 12)
        )
        .onAppear {
            if isDueNow {
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                    shimmer = true
                }
            }
        }
    }

    func shortName(_ name: String) -> String {
        let cleaned = name
            .replacingOccurrences(of: " (research)", with: "")
            .replacingOccurrences(of: " (not a peptide, but commonly discussed)", with: "")
            .replacingOccurrences(of: "Vasoactive Intestinal Peptide", with: "VIP")
        if cleaned.count > 12 {
            return String(cleaned.prefix(11)) + "..."
        }
        return cleaned
    }
}

// Realistic vial shape
struct VialShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height
        let capW = w * 0.68
        let capH = h * 0.12
        let neckW = w * 0.4
        let neckH = h * 0.1
        let bodyR: CGFloat = 6

        // Cap
        let capX = (w - capW) / 2
        path.addRoundedRect(in: CGRect(x: capX, y: 0, width: capW, height: capH), cornerSize: CGSize(width: 3, height: 3))

        // Neck
        let neckX = (w - neckW) / 2
        path.addRect(CGRect(x: neckX, y: capH, width: neckW, height: neckH))

        // Shoulders + body
        let bodyTop = capH + neckH
        let bodyH = h - bodyTop
        path.move(to: CGPoint(x: neckX, y: bodyTop))
        path.addLine(to: CGPoint(x: bodyR, y: bodyTop + bodyH * 0.12))
        path.addLine(to: CGPoint(x: bodyR, y: h - bodyR))
        path.addQuadCurve(to: CGPoint(x: bodyR + bodyR, y: h), control: CGPoint(x: bodyR, y: h))
        path.addLine(to: CGPoint(x: w - bodyR - bodyR, y: h))
        path.addQuadCurve(to: CGPoint(x: w - bodyR, y: h - bodyR), control: CGPoint(x: w - bodyR, y: h))
        path.addLine(to: CGPoint(x: w - bodyR, y: bodyTop + bodyH * 0.12))
        path.addLine(to: CGPoint(x: neckX + neckW, y: bodyTop))
        path.closeSubpath()

        return path
    }
}

// MARK: - Vial Detail Popup

struct VialDetailPopup: View {
    let name: String
    let dose: String
    let unit: String
    let recon: ReconstitutionResult?
    let onClose: () -> Void

    var capColor: Color { vialCapColor(for: "", name: name) }

    var body: some View {
        VStack(spacing: 16) {
            // Large vial
            VectorVialView(name: name, dose: dose, unit: unit, fillPercent: 0.7, isDueNow: false)
                .scaleEffect(2.5)
                .frame(height: 200)

            // Info
            VStack(spacing: 8) {
                Text(name)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.cxBlack)

                if !dose.isEmpty {
                    Text("\(dose) \(unit)")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.cxTeal)
                }

                if let recon = recon {
                    Divider()
                    VStack(spacing: 6) {
                        HStack(spacing: 16) {
                            Label("BAC: \(String(format: "%.1f", recon.recommendedBacWaterMl)) mL", systemImage: "drop.fill")
                                .foregroundColor(.blue)
                            Label("\(String(format: "%.0f", recon.concentrationMcgPerMl)) mcg/mL", systemImage: "eyedropper")
                                .foregroundColor(.green)
                        }
                        .font(.system(size: 13))

                        if !recon.tipicalDoseRange.isEmpty {
                            Text("Typical: \(recon.tipicalDoseRange)")
                                .font(.system(size: 12))
                                .foregroundColor(.cxStone)
                        }
                    }
                }
            }
            .padding(20)
            .background(Color.white)
            .cornerRadius(16)

            Button(action: onClose) {
                Text("Close")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.cxStone)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .cornerRadius(10)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.4))
    }
}

// MARK: - Today's Doses Vial Tray

struct VialTrayView: View {
    let reminders: [TodayReminder]
    let reconResults: [UUID: ReconstitutionResult]
    let onTake: (Reminder) async -> Void

    @State private var appeared = false
    @State private var selectedIndex: Int?
    @State private var showDetail = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("TODAY'S DOSES")
                .font(.system(size: 11, weight: .semibold))
                .tracking(2)
                .foregroundColor(.cxStone)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(Array(reminders.enumerated()), id: \.element.id) { index, item in
                        VStack(spacing: 6) {
                            ZStack {
                                VectorVialView(
                                    name: item.reminder.stackItem?.name ?? "Unknown",
                                    dose: item.reminder.dose,
                                    unit: "",
                                    fillPercent: item.taken ? 0.1 : 0.7,
                                    isDueNow: !item.taken
                                )
                                .scaleEffect(appeared ? 1.0 : 0.3)
                                .opacity(appeared ? 1 : 0)
                                .animation(
                                    .spring(response: 0.5, dampingFraction: 0.6)
                                    .delay(Double(index) * 0.1),
                                    value: appeared
                                )

                                if item.taken {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 20))
                                        .foregroundColor(.green)
                                        .background(Circle().fill(Color.white).frame(width: 18, height: 18))
                                        .offset(x: 16, y: -30)
                                }
                            }

                            Text(item.taken ? "Done" : "at \(item.reminder.time)")
                                .font(.system(size: 9))
                                .foregroundColor(item.taken ? .green : .cxStone)

                            if !item.taken {
                                Button {
                                    Task { await onTake(item.reminder) }
                                } label: {
                                    Text("Take")
                                        .font(.system(size: 10, weight: .semibold))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 4)
                                        .background(Color.cxTeal)
                                        .cornerRadius(6)
                                }
                            }
                        }
                        .onTapGesture {
                            if !item.taken {
                                selectedIndex = index
                                showDetail = true
                            }
                        }
                    }
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 4)
            }
        }
        .onAppear {
            withAnimation {
                appeared = true
            }
        }
        .sheet(isPresented: $showDetail) {
            if let idx = selectedIndex, idx < reminders.count {
                let item = reminders[idx]
                VialDetailPopup(
                    name: item.reminder.stackItem?.name ?? "Unknown",
                    dose: item.reminder.dose,
                    unit: "",
                    recon: item.reminder.stackItem.flatMap { reconResults[$0.id] }
                ) {
                    showDetail = false
                }
            }
        }
    }
}

// MARK: - Active Stack Vial Row

struct VialStackView: View {
    let items: [StackItem]
    let reconResults: [UUID: ReconstitutionResult]
    let onTap: () -> Void

    @State private var appeared = false
    @State private var selectedIndex: Int?
    @State private var showDetail = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("MY ACTIVE STACK")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(.cxStone)
                Spacer()
                Button(action: onTap) {
                    Text("Edit")
                        .font(.system(size: 13))
                        .foregroundColor(.cxTeal)
                }
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                        VStack(spacing: 6) {
                            PhotoVialView(
                                name: item.name,
                                dose: item.dose,
                                unit: item.unit,
                                isDueNow: false
                            )
                            .scaleEffect(appeared ? 1.0 : 0.3)
                            .opacity(appeared ? 1 : 0)
                            .animation(
                                .spring(response: 0.5, dampingFraction: 0.6)
                                .delay(Double(index) * 0.08),
                                value: appeared
                            )

                            Text(item.name.capitalized)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.cxBlack)
                                .lineLimit(1)
                                .frame(width: 60)
                        }
                        .onTapGesture {
                            selectedIndex = index
                            showDetail = true
                        }
                    }
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 4)
            }
        }
        .onAppear {
            withAnimation {
                appeared = true
            }
        }
        .sheet(isPresented: $showDetail) {
            if let idx = selectedIndex, idx < items.count {
                let item = items[idx]
                VialDetailPopup(
                    name: item.name,
                    dose: item.dose,
                    unit: item.unit,
                    recon: reconResults[item.id]
                ) {
                    showDetail = false
                }
            }
        }
    }
}
