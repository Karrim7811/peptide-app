import SwiftUI
import UIKit

// MARK: - ScannedVial Model

struct ScannedVial: Identifiable {
    let id = UUID()
    var name: String
    var amount: String
    var type: String
    var notes: String
    var selected: Bool = true
}

// MARK: - VialScannerView

struct VialScannerView: View {
    let onComplete: ([ScannedVial]) -> Void
    @Environment(\.dismiss) var dismiss

    @State private var showCamera = false
    @State private var showPhotoPicker = false
    @State private var capturedImage: UIImage?
    @State private var isScanning = false
    @State private var scannedVials: [ScannedVial] = []
    @State private var errorMessage: String?
    @State private var scanComplete = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if scanComplete {
                    resultsView
                } else if isScanning, let image = capturedImage {
                    scanningView(image: image)
                } else if let image = capturedImage {
                    // Image captured but not yet scanning (shouldn't happen, but handle)
                    scanningView(image: image)
                } else {
                    captureView
                }
            }
            .background(Color.cxParchment)
            .navigationTitle("Scan Vials")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .sheet(isPresented: $showCamera) {
                ImagePickerView(sourceType: .camera) { image in
                    handleCapturedImage(image)
                }
                .ignoresSafeArea()
            }
            .sheet(isPresented: $showPhotoPicker) {
                ImagePickerView(sourceType: .photoLibrary) { image in
                    handleCapturedImage(image)
                }
                .ignoresSafeArea()
            }
        }
    }

    // MARK: - Capture View

    private var captureView: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "camera.viewfinder")
                .font(.system(size: 64))
                .foregroundColor(.cxTeal)

            Text("Scan Your Peptide Vials")
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(.cxBlack)

            Text("Take a photo of your vials and Cortex AI will identify them automatically.")
                .font(.system(size: 14))
                .foregroundColor(.cxStone)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            VStack(spacing: 12) {
                Button {
                    showCamera = true
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "camera.fill")
                        Text("Take Photo")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.cxTeal)
                    .cornerRadius(12)
                }

                Button {
                    showPhotoPicker = true
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "photo.on.rectangle")
                        Text("Choose from Library")
                    }
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.cxTeal)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.cxTeal, lineWidth: 1)
                    )
                }
            }
            .padding(.horizontal, 24)

            Spacer()
        }
    }

    // MARK: - Scanning View

    private func scanningView(image: UIImage) -> some View {
        VStack(spacing: 20) {
            Spacer()

            ZStack {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 300)
                    .cornerRadius(16)
                    .opacity(0.6)

                VStack(spacing: 12) {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.white)
                    Text("Cortex AI is scanning...")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                }
                .padding(24)
                .background(Color.black.opacity(0.6))
                .cornerRadius(16)
            }
            .padding(.horizontal, 24)

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red)
                    .padding(12)
                    .background(Color.red.opacity(0.08))
                    .cornerRadius(10)
                    .padding(.horizontal, 24)

                Button("Try Again") {
                    capturedImage = nil
                    errorMessage = nil
                    isScanning = false
                    scanComplete = false
                }
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(.cxTeal)
            }

            Spacer()
        }
    }

    // MARK: - Results View

    private var resultsView: some View {
        VStack(spacing: 0) {
            if scannedVials.isEmpty {
                VStack(spacing: 16) {
                    Spacer()
                    Image(systemName: "viewfinder.circle")
                        .font(.system(size: 48))
                        .foregroundColor(.cxStone.opacity(0.5))
                    Text("No Vials Detected")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.cxBlack)
                    Text("Try taking a clearer photo with the labels visible.")
                        .font(.system(size: 14))
                        .foregroundColor(.cxStone)
                        .multilineTextAlignment(.center)
                    Button("Try Again") {
                        capturedImage = nil
                        scanComplete = false
                        scannedVials = []
                    }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.cxTeal)
                    .padding(.top, 8)
                    Spacer()
                }
                .padding(.horizontal, 32)
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        HStack(spacing: 10) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("\(scannedVials.count) vial\(scannedVials.count == 1 ? "" : "s") identified")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.cxBlack)
                            Spacer()
                        }
                        .padding(.horizontal, 4)

                        ForEach($scannedVials) { $vial in
                            HStack(spacing: 12) {
                                Button {
                                    vial.selected.toggle()
                                } label: {
                                    Image(systemName: vial.selected ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 24))
                                        .foregroundColor(vial.selected ? .cxTeal : .cxStone)
                                }

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(vial.name)
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(.cxBlack)
                                    HStack(spacing: 8) {
                                        if !vial.amount.isEmpty {
                                            Text(vial.amount)
                                                .font(.system(size: 13))
                                                .foregroundColor(.cxTeal)
                                        }
                                        Text(vial.type.capitalized)
                                            .font(.system(size: 12, weight: .medium))
                                            .foregroundColor(.white)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 2)
                                            .background(Color.cxTeal.opacity(0.7))
                                            .cornerRadius(6)
                                    }
                                    if !vial.notes.isEmpty {
                                        Text(vial.notes)
                                            .font(.system(size: 12))
                                            .foregroundColor(.cxStone)
                                            .lineLimit(2)
                                    }
                                }

                                Spacer()
                            }
                            .padding(14)
                            .background(Color.white)
                            .cornerRadius(12)
                            .opacity(vial.selected ? 1 : 0.5)
                        }
                    }
                    .padding()
                }

                // Add Selected button
                Button {
                    let selected = scannedVials.filter { $0.selected }
                    onComplete(selected)
                    dismiss()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "plus.circle.fill")
                        Text("Add Selected (\(scannedVials.filter { $0.selected }.count))")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.cxTeal)
                    .cornerRadius(12)
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
                .disabled(scannedVials.filter { $0.selected }.isEmpty)
            }
        }
    }

    // MARK: - Helpers

    private func handleCapturedImage(_ image: UIImage) {
        capturedImage = image
        isScanning = true
        errorMessage = nil
        Task {
            await scanImage(image)
        }
    }

    private func scanImage(_ image: UIImage) async {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            errorMessage = "Failed to process image."
            isScanning = false
            return
        }

        let base64 = imageData.base64EncodedString()

        do {
            let vials = try await APIService.shared.scanVials(imageBase64: base64, mimeType: "image/jpeg")
            scannedVials = vials
            scanComplete = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isScanning = false
    }
}

// MARK: - UIImagePickerController Wrapper

struct ImagePickerView: UIViewControllerRepresentable {
    let sourceType: UIImagePickerController.SourceType
    let onImagePicked: (UIImage) -> Void

    @Environment(\.dismiss) var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePickerView

        init(_ parent: ImagePickerView) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.onImagePicked(image)
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
