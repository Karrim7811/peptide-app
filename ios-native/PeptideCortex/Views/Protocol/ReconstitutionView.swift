import SwiftUI

struct ReconstitutionView: View {
    @StateObject private var vm = ReconstitutionViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Manual calculator
                VStack(alignment: .leading, spacing: 14) {
                    Text("MANUAL CALCULATOR")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    VStack(spacing: 12) {
                        FormField(label: "Peptide Amount (mg)", text: $vm.peptideAmountMg, keyboard: .decimalPad)
                        FormField(label: "Bacteriostatic Water (mL)", text: $vm.bacWaterMl, keyboard: .decimalPad)
                        FormField(label: "Amount to Convert (mcg)", text: $vm.desiredDoseMcg, keyboard: .decimalPad)
                    }

                    if let conc = vm.concentrationMcgPerMl {
                        VStack(spacing: 8) {
                            CalcResultRow(label: "Concentration", value: String(format: "%.1f mcg/mL", conc))
                            if let vol = vm.volumePerDose {
                                CalcResultRow(label: "Equivalent Volume", value: String(format: "%.3f mL (%.0f units)", vol, vol * 100))
                            }
                            if let doses = vm.dosesPerVial {
                                CalcResultRow(label: "Doses per Vial", value: "\(doses)")
                            }
                        }
                        .padding(14)
                        .background(Color.cxTeal.opacity(0.05))
                        .cornerRadius(12)
                    }
                }
                .padding(16)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)

                // AI recommendation
                VStack(alignment: .leading, spacing: 14) {
                    Text("AI RECOMMENDATION")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(2)
                        .foregroundColor(.cxStone)

                    PeptideAutocompleteField(label: "Peptide Name", placeholder: "e.g. BPC-157", text: $vm.peptideName)

                    Button {
                        Task { await vm.getAIRecommendation() }
                    } label: {
                        HStack {
                            if vm.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            }
                            Image(systemName: "sparkles")
                            Text(vm.isLoading ? "Looking up..." : "Get AI Reference")
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cxTeal)
                        .cornerRadius(12)
                    }
                    .disabled(vm.isLoading)

                    if let error = vm.errorMessage {
                        Text(error)
                            .font(.system(size: 14))
                            .foregroundColor(.red)
                    }

                    if let result = vm.aiResult {
                        VStack(alignment: .leading, spacing: 10) {
                            CalcResultRow(label: "Recommended BAC Water", value: String(format: "%.1f mL", result.recommendedBacWaterMl))
                            CalcResultRow(label: "Concentration", value: String(format: "%.1f mcg/mL", result.concentrationMcgPerMl))
                            CalcResultRow(label: "Research-Reported Range", value: result.tipicalDoseRange)
                            CalcResultRow(label: "Storage", value: result.storageNote)

                            Text("Reasoning")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.cxStone)
                            Text(result.reasoning)
                                .font(.system(size: 14))
                                .foregroundColor(.cxBlack)
                                .lineSpacing(3)
                        }
                        .padding(14)
                        .background(Color.cxTeal.opacity(0.05))
                        .cornerRadius(12)
                    }
                }
                .padding(16)
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
            }
            .padding()
        }
        .background(Color.cxParchment)
    }
}

struct FormField: View {
    let label: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.cxStone)
            TextField(label, text: $text)
                .font(.system(size: 15))
                .foregroundColor(.black)
                .keyboardType(keyboard)
                .padding(12)
                .background(Color.cxParchment.opacity(0.5))
                .cornerRadius(10)
        }
    }
}

struct CalcResultRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(.cxStone)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.cxBlack)
        }
    }
}
