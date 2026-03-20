import SwiftUI

struct BloodworkView: View {
    @StateObject private var vm = BloodworkViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header card
                VStack(spacing: 8) {
                    Image(systemName: "heart.text.square")
                        .font(.system(size: 32))
                        .foregroundColor(.cxTeal)
                    Text("Bloodwork Analyzer")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.cxBlack)
                    Text("Enter your lab results and get AI-powered peptide recommendations based on your biomarkers.")
                        .font(.system(size: 13))
                        .foregroundColor(.cxStone)
                        .multilineTextAlignment(.center)
                }
                .padding(20)
                .frame(maxWidth: .infinity)
                .background(Color.white)
                .cornerRadius(12)

                // Hormones Section
                markerSection(title: "HORMONES", markers: [
                    ("Testosterone", "ng/dL", $vm.testosterone),
                    ("Free Testosterone", "pg/mL", $vm.freeTestosterone),
                    ("IGF-1", "ng/mL", $vm.igf1),
                    ("Estradiol", "pg/mL", $vm.estradiol),
                ])

                // Thyroid Section
                markerSection(title: "THYROID", markers: [
                    ("TSH", "mIU/L", $vm.tsh),
                    ("T3 Free", "pg/mL", $vm.t3Free),
                    ("T4 Free", "ng/dL", $vm.t4Free),
                ])

                // Metabolic Section
                markerSection(title: "METABOLIC", markers: [
                    ("Fasting Glucose", "mg/dL", $vm.fastingGlucose),
                    ("HbA1c", "%", $vm.hba1c),
                ])

                // Lipids Section
                markerSection(title: "LIPIDS", markers: [
                    ("Total Cholesterol", "mg/dL", $vm.totalCholesterol),
                    ("LDL", "mg/dL", $vm.ldl),
                    ("HDL", "mg/dL", $vm.hdl),
                    ("Triglycerides", "mg/dL", $vm.triglycerides),
                ])

                // Liver & Kidney Section
                markerSection(title: "LIVER & KIDNEY", markers: [
                    ("ALT", "U/L", $vm.alt),
                    ("AST", "U/L", $vm.ast),
                    ("GFR", "mL/min", $vm.gfr),
                    ("Creatinine", "mg/dL", $vm.creatinine),
                ])

                // Inflammation & Vitamins Section
                markerSection(title: "INFLAMMATION & VITAMINS", markers: [
                    ("CRP", "mg/L", $vm.crp),
                    ("Vitamin D", "ng/mL", $vm.vitaminD),
                    ("B12", "pg/mL", $vm.b12),
                    ("Iron/Ferritin", "ng/mL", $vm.ironFerritin),
                ])

                // Blood Counts Section
                markerSection(title: "BLOOD COUNTS", markers: [
                    ("WBC", "K/uL", $vm.wbc),
                    ("RBC", "M/uL", $vm.rbc),
                    ("Hemoglobin", "g/dL", $vm.hemoglobin),
                    ("Hematocrit", "%", $vm.hematocrit),
                ])

                // Context Section
                VStack(alignment: .leading, spacing: 10) {
                    Text("CONTEXT")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    VStack(spacing: 8) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Current Stack")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.cxStone)
                            TextField("e.g. BPC-157, TB-500, Ipamorelin", text: $vm.currentStack)
                                .font(.system(size: 14))
                                .foregroundColor(.primary)
                                .padding(10)
                                .background(Color.white)
                                .cornerRadius(8)
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Goals")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.cxStone)
                            TextField("e.g. Improve recovery, optimize hormones", text: $vm.goals)
                                .font(.system(size: 14))
                                .foregroundColor(.primary)
                                .padding(10)
                                .background(Color.white)
                                .cornerRadius(8)
                        }
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.5))
                    .cornerRadius(12)
                }

                // Analyze Button
                Button {
                    Task { await vm.analyze() }
                } label: {
                    HStack(spacing: 8) {
                        if vm.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "waveform.path.ecg")
                                .font(.system(size: 16, weight: .medium))
                        }
                        Text(vm.isLoading ? "Analyzing..." : "Analyze Bloodwork (\(vm.filledMarkerCount) markers)")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(vm.filledMarkerCount > 0 && !vm.isLoading ? Color.cxTeal : Color.cxStone.opacity(0.4))
                    .cornerRadius(12)
                }
                .disabled(vm.filledMarkerCount == 0 || vm.isLoading)

                // Error Message
                if let error = vm.errorMessage {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundColor(.red)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.red.opacity(0.08))
                    .cornerRadius(10)
                }

                // Results
                if vm.hasResults {
                    resultsSection
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
    }

    // MARK: - Marker Section Builder

    @ViewBuilder
    func markerSection(title: String, markers: [(label: String, unit: String, binding: Binding<String>)]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .tracking(2)
                .foregroundColor(.cxStone)

            VStack(spacing: 6) {
                ForEach(Array(markers.enumerated()), id: \.offset) { _, marker in
                    HStack(spacing: 8) {
                        Text(marker.label)
                            .font(.system(size: 14))
                            .foregroundColor(.cxBlack)
                            .frame(width: 140, alignment: .leading)

                        TextField("--", text: marker.binding)
                            .font(.system(size: 14))
                            .foregroundColor(.primary)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .cornerRadius(8)

                        Text(marker.unit)
                            .font(.system(size: 11))
                            .foregroundColor(.cxStone)
                            .frame(width: 50, alignment: .leading)
                    }
                }
            }
            .padding(12)
            .background(Color.white.opacity(0.5))
            .cornerRadius(12)
        }
    }

    // MARK: - Results Section

    var resultsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Warnings
            if !vm.warnings.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                        Text("WARNINGS")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.orange)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(vm.warnings, id: \.self) { warning in
                            HStack(alignment: .top, spacing: 8) {
                                Circle()
                                    .fill(Color.orange)
                                    .frame(width: 6, height: 6)
                                    .padding(.top, 5)
                                Text(warning)
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxBlack)
                            }
                        }
                    }
                    .padding(12)
                    .background(Color.orange.opacity(0.08))
                    .cornerRadius(10)
                }
            }

            // Analysis
            VStack(alignment: .leading, spacing: 8) {
                Text("ANALYSIS")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(2)
                    .foregroundColor(.cxStone)

                Text(vm.analysis)
                    .font(.system(size: 14))
                    .foregroundColor(.cxBlack)
                    .lineSpacing(4)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
            }

            // Recommendations
            if !vm.recommendations.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("PEPTIDE RECOMMENDATIONS")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    VStack(spacing: 8) {
                        ForEach(vm.recommendations, id: \.peptide) { rec in
                            HStack(alignment: .top, spacing: 12) {
                                priorityBadge(rec.priority)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(rec.peptide)
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(.cxBlack)
                                    Text(rec.reason)
                                        .font(.system(size: 13))
                                        .foregroundColor(.cxStone)
                                        .lineSpacing(2)
                                }

                                Spacer()
                            }
                            .padding(12)
                            .background(Color.white)
                            .cornerRadius(10)
                        }
                    }
                }
            }
        }
    }

    func priorityBadge(_ priority: String) -> some View {
        let color: Color = {
            switch priority.lowercased() {
            case "high": return .red
            case "medium": return .orange
            case "low": return .cxTeal
            default: return .cxStone
            }
        }()

        return Text(priority.uppercased())
            .font(.system(size: 9, weight: .bold))
            .foregroundColor(.white)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(color)
            .cornerRadius(4)
    }
}
