import SwiftUI

struct BloodworkView: View {
    @StateObject private var vm = BloodworkViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "heart.text.square")
                        .font(.system(size: 32))
                        .foregroundColor(.cxTeal)
                    Text("Bloodwork Analyzer")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.cxBlack)
                    Text("Enter your lab results and get AI-powered peptide recommendations.")
                        .font(.system(size: 13))
                        .foregroundColor(.cxStone)
                        .multilineTextAlignment(.center)
                }
                .padding(20)
                .frame(maxWidth: .infinity)
                .background(Color.white)
                .cornerRadius(12)

                // Hormones
                SectionHeader(title: "HORMONES")
                MarkerField(label: "Testosterone", unit: "ng/dL", value: $vm.testosterone)
                MarkerField(label: "Free Testosterone", unit: "pg/mL", value: $vm.freeTestosterone)
                MarkerField(label: "IGF-1", unit: "ng/mL", value: $vm.igf1)
                MarkerField(label: "Estradiol", unit: "pg/mL", value: $vm.estradiol)

                // Thyroid
                SectionHeader(title: "THYROID")
                MarkerField(label: "TSH", unit: "mIU/L", value: $vm.tsh)
                MarkerField(label: "T3 Free", unit: "pg/mL", value: $vm.t3Free)
                MarkerField(label: "T4 Free", unit: "ng/dL", value: $vm.t4Free)

                // Metabolic
                SectionHeader(title: "METABOLIC")
                MarkerField(label: "Fasting Glucose", unit: "mg/dL", value: $vm.fastingGlucose)
                MarkerField(label: "HbA1c", unit: "%", value: $vm.hba1c)

                // Lipids
                SectionHeader(title: "LIPIDS")
                MarkerField(label: "Total Cholesterol", unit: "mg/dL", value: $vm.totalCholesterol)
                MarkerField(label: "LDL", unit: "mg/dL", value: $vm.ldl)
                MarkerField(label: "HDL", unit: "mg/dL", value: $vm.hdl)
                MarkerField(label: "Triglycerides", unit: "mg/dL", value: $vm.triglycerides)

                // Liver & Kidney
                SectionHeader(title: "LIVER & KIDNEY")
                MarkerField(label: "ALT", unit: "U/L", value: $vm.alt)
                MarkerField(label: "AST", unit: "U/L", value: $vm.ast)
                MarkerField(label: "GFR", unit: "mL/min", value: $vm.gfr)
                MarkerField(label: "Creatinine", unit: "mg/dL", value: $vm.creatinine)

                // Inflammation & Vitamins
                SectionHeader(title: "INFLAMMATION & VITAMINS")
                MarkerField(label: "CRP", unit: "mg/L", value: $vm.crp)
                MarkerField(label: "Vitamin D", unit: "ng/mL", value: $vm.vitaminD)
                MarkerField(label: "B12", unit: "pg/mL", value: $vm.b12)
                MarkerField(label: "Iron/Ferritin", unit: "ng/mL", value: $vm.ironFerritin)

                // Blood Counts
                SectionHeader(title: "BLOOD COUNTS")
                MarkerField(label: "WBC", unit: "K/uL", value: $vm.wbc)
                MarkerField(label: "RBC", unit: "M/uL", value: $vm.rbc)
                MarkerField(label: "Hemoglobin", unit: "g/dL", value: $vm.hemoglobin)
                MarkerField(label: "Hematocrit", unit: "%", value: $vm.hematocrit)

                // Context
                SectionHeader(title: "CONTEXT")
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

                // Error
                if let error = vm.errorMessage {
                    Text(error)
                        .font(.system(size: 13))
                        .foregroundColor(.red)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.08))
                        .cornerRadius(10)
                }

                // Results
                if vm.hasResults {
                    // Warnings
                    if !vm.warnings.isEmpty {
                        SectionHeader(title: "WARNINGS")
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(vm.warnings, id: \.self) { warning in
                                HStack(alignment: .top, spacing: 8) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(.orange)
                                        .font(.system(size: 12))
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

                    // Analysis
                    SectionHeader(title: "ANALYSIS")
                    Text(vm.analysis)
                        .font(.system(size: 14))
                        .foregroundColor(.cxBlack)
                        .lineSpacing(4)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.white)
                        .cornerRadius(12)

                    // Recommendations
                    if !vm.recommendations.isEmpty {
                        SectionHeader(title: "PEPTIDE RECOMMENDATIONS")
                        ForEach(vm.recommendations, id: \.peptide) { rec in
                            HStack(alignment: .top, spacing: 12) {
                                Text(rec.priority.uppercased())
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 3)
                                    .background(rec.priority.lowercased() == "high" ? Color.red : rec.priority.lowercased() == "medium" ? Color.orange : Color.cxTeal)
                                    .cornerRadius(4)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(rec.peptide)
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundColor(.cxBlack)
                                    Text(rec.reason)
                                        .font(.system(size: 13))
                                        .foregroundColor(.cxStone)
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
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct SectionHeader: View {
    let title: String
    var body: some View {
        Text(title)
            .font(.system(size: 11, weight: .semibold))
            .tracking(2)
            .foregroundColor(.cxStone)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct MarkerField: View {
    let label: String
    let unit: String
    @Binding var value: String

    var body: some View {
        HStack(spacing: 8) {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.cxBlack)
                .frame(width: 140, alignment: .leading)

            TextField("--", text: $value)
                .font(.system(size: 14))
                .foregroundColor(.primary)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(Color.white)
                .cornerRadius(8)

            Text(unit)
                .font(.system(size: 11))
                .foregroundColor(.cxStone)
                .frame(width: 50, alignment: .leading)
        }
    }
}
