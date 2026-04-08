import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct BloodworkView: View {
    @Binding var selectedTab: NavDestination
    @EnvironmentObject var storeService: StoreService
    @EnvironmentObject var appState: AppState
    @StateObject private var vm = BloodworkViewModel()
    @State private var showCamera = false
    @State private var showPhotoPicker = false
    @State private var showFilePicker = false
    @State private var selectedPhoto: PhotosPickerItem?

    var body: some View {
        if !storeService.isProUser {
            ProGateView(featureName: "Bloodwork Reference")
        } else {
        ScrollView {
            VStack(spacing: 16) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "heart.text.square")
                        .font(.system(size: 32))
                        .foregroundColor(.cxTeal)
                    Text("Bloodwork Reference")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.cxBlack)
                    Text("Enter your lab results manually, or scan/import your bloodwork report.")
                        .font(.system(size: 13))
                        .foregroundColor(.cxStone)
                        .multilineTextAlignment(.center)
                }
                .padding(20)
                .frame(maxWidth: .infinity)
                .background(Color.white)
                .cornerRadius(12)

                // Scan / Import buttons
                HStack(spacing: 10) {
                    Button {
                        showCamera = true
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "camera.fill")
                            Text("Take Photo")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cxTeal)
                        .cornerRadius(10)
                    }

                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        HStack(spacing: 6) {
                            Image(systemName: "photo.fill")
                            Text("Photo Library")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(.cxTeal)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cxTeal.opacity(0.1))
                        .cornerRadius(10)
                    }

                    Button {
                        showFilePicker = true
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "doc.fill")
                            Text("Import")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(.cxTeal)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cxTeal.opacity(0.1))
                        .cornerRadius(10)
                    }
                }

                // Scan status
                if vm.isScanning {
                    HStack(spacing: 8) {
                        ProgressView().scaleEffect(0.8)
                        Text(vm.scanMessage ?? "Processing...")
                            .font(.system(size: 13))
                            .foregroundColor(.cxTeal)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity)
                    .background(Color.cxTeal.opacity(0.08))
                    .cornerRadius(10)
                } else if let msg = vm.scanMessage {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text(msg)
                            .font(.system(size: 13))
                            .foregroundColor(.green)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity)
                    .background(Color.green.opacity(0.08))
                    .cornerRadius(10)
                }

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
                        .foregroundColor(.black)
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
                        .foregroundColor(.black)
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

                        // Create a plan CTA
                        Button {
                            appState.pendingBloodwork = AppState.PendingBloodwork(
                                analysis: vm.analysis,
                                recommendations: vm.recommendations,
                                warnings: vm.warnings
                            )
                            selectedTab = .protocolPlanner
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "wand.and.stars")
                                    .font(.system(size: 16))
                                Text("Create Plan with Recommended Peptides")
                                    .font(.system(size: 15, weight: .semibold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.cxTeal)
                            .cornerRadius(12)
                        }
                        .padding(.top, 8)
                    }
                }
            }
            .padding()
        }
        .background(Color.cxParchment)
        .fullScreenCover(isPresented: $showCamera) {
            CameraView { imageData in
                showCamera = false
                if let data = imageData {
                    Task { await vm.processImage(imageData: data, mimeType: "image/jpeg") }
                }
            }
        }
        .onChange(of: selectedPhoto) { newItem in
            guard let item = newItem else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self) {
                    await vm.processImage(imageData: data, mimeType: "image/jpeg")
                }
            }
        }
        .fileImporter(isPresented: $showFilePicker, allowedContentTypes: [.image, .pdf]) { result in
            switch result {
            case .success(let url):
                guard url.startAccessingSecurityScopedResource() else { return }
                defer { url.stopAccessingSecurityScopedResource() }
                if let data = try? Data(contentsOf: url) {
                    let mime = url.pathExtension.lowercased() == "pdf" ? "application/pdf" : "image/jpeg"
                    Task { await vm.processImage(imageData: data, mimeType: mime) }
                }
            case .failure:
                vm.errorMessage = "Failed to import file."
            }
        }
        } // else
    }
}

// MARK: - Camera View
struct CameraView: UIViewControllerRepresentable {
    let completion: (Data?) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(completion: completion) }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let completion: (Data?) -> Void
        init(completion: @escaping (Data?) -> Void) { self.completion = completion }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                completion(image.jpegData(compressionQuality: 0.8))
            } else {
                completion(nil)
            }
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            completion(nil)
        }
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
                .foregroundColor(.black)
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
