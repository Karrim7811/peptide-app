import SwiftUI

struct SignupView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var vm = AuthViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var agreedToTerms = false

    var body: some View {
        ZStack {
            Color.cxParchment.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 40)

                    if vm.signupSuccess {
                        // Success state
                        VStack(spacing: 20) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 56))
                                .foregroundColor(.cxTeal)

                            Text("Check your email")
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundColor(.cxBlack)

                            Text("We sent a confirmation link to\n\(vm.email)")
                                .font(.system(size: 15))
                                .foregroundColor(.cxSmoke)
                                .multilineTextAlignment(.center)

                            Button("Back to Sign In") {
                                dismiss()
                            }
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Color.cxTeal)
                            .cornerRadius(12)
                        }
                        .padding(24)
                    } else {
                        // Signup form
                        VStack(spacing: 20) {
                            Text("Create your account")
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundColor(.cxBlack)

                            VStack(spacing: 14) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Email Address")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.cxBlack)
                                    TextField("Enter your email", text: $vm.email)
                                        .textFieldStyle(.plain)
                                        .foregroundColor(.black)
                                        .keyboardType(.emailAddress)
                                        .textContentType(.emailAddress)
                                        .autocapitalization(.none)
                                        .padding(14)
                                        .background(Color.white)
                                        .cornerRadius(10)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(Color.cxBorder, lineWidth: 1)
                                        )
                                }

                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Password")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.cxBlack)
                                    SecureField("At least 6 characters", text: $vm.password)
                                        .textFieldStyle(.plain)
                                        .foregroundColor(.black)
                                        .textContentType(.newPassword)
                                        .padding(14)
                                        .background(Color.white)
                                        .cornerRadius(10)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(Color.cxBorder, lineWidth: 1)
                                        )
                                }

                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Confirm Password")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.cxBlack)
                                    SecureField("Confirm your password", text: $vm.confirmPassword)
                                        .textFieldStyle(.plain)
                                        .foregroundColor(.black)
                                        .textContentType(.newPassword)
                                        .padding(14)
                                        .background(Color.white)
                                        .cornerRadius(10)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(Color.cxBorder, lineWidth: 1)
                                        )
                                }
                            }

                            if let error = vm.errorMessage {
                                Text(error)
                                    .font(.system(size: 13))
                                    .foregroundColor(.red)
                                    .multilineTextAlignment(.center)
                            }

                            // Legal Disclaimer
                            VStack(alignment: .leading, spacing: 10) {
                                Text("By creating an account, you agree to our Terms of Service and Privacy Policy. Peptide Cortex is an educational research tool developed by Tigris Tech Labs. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before starting any peptide protocol. Tigris Tech Labs and Peptide Cortex assume no liability for decisions made based on information provided by this application.")
                                    .font(.system(size: 11))
                                    .foregroundColor(.cxStone)
                                    .lineSpacing(2)

                                Button {
                                    agreedToTerms.toggle()
                                } label: {
                                    HStack(alignment: .top, spacing: 8) {
                                        Image(systemName: agreedToTerms ? "checkmark.square.fill" : "square")
                                            .font(.system(size: 18))
                                            .foregroundColor(agreedToTerms ? .cxTeal : .cxStone)
                                        Text("I agree to the Terms & Disclaimer")
                                            .font(.system(size: 13, weight: .medium))
                                            .foregroundColor(.cxBlack)
                                    }
                                }
                            }

                            Button {
                                Task { await vm.signUp() }
                            } label: {
                                Group {
                                    if vm.isLoading {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Create Account")
                                    }
                                }
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(agreedToTerms ? Color.cxTeal : Color.cxStone.opacity(0.4))
                                .cornerRadius(12)
                            }
                            .disabled(vm.isLoading || !agreedToTerms)

                            Button {
                                dismiss()
                            } label: {
                                Text("Already have an account? ")
                                    .foregroundColor(.cxSmoke) +
                                Text("Sign in")
                                    .foregroundColor(.cxTeal)
                                    .bold()
                            }
                            .font(.system(size: 14))
                        }
                        .padding(24)
                        .background(Color.white.opacity(0.8))
                        .cornerRadius(16)
                        .shadow(color: .black.opacity(0.04), radius: 12, y: 4)
                        .padding(.horizontal, 24)
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}
