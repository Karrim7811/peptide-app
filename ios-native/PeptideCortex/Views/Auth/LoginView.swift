import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var vm = AuthViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Color.cxParchment.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 0) {
                        Spacer().frame(height: 60)

                        // Brand
                        VStack(spacing: 4) {
                            Text("PEPTIDE")
                                .font(.system(size: 11, weight: .medium))
                                .tracking(4)
                                .foregroundColor(.cxStone)
                            HStack(spacing: 0) {
                                Text("CORTE")
                                    .font(.system(size: 32, weight: .light))
                                    .tracking(4)
                                Text("X")
                                    .font(.system(size: 32, weight: .light))
                                    .tracking(4)
                                    .foregroundColor(.cxTeal)
                            }
                            .foregroundColor(.cxBlack)
                            Text("INTELLIGENCE ENGINE")
                                .font(.system(size: 9, weight: .medium))
                                .tracking(3)
                                .foregroundColor(.cxStone)
                        }
                        .padding(.bottom, 36)

                        // Login Card
                        VStack(spacing: 18) {
                            Text("Sign in to your account")
                                .font(.system(size: 15, weight: .regular))
                                .foregroundColor(.cxSmoke)

                            // Social Sign In
                            VStack(spacing: 10) {
                                // Apple Sign In
                                SignInWithAppleButton(.signIn) { request in
                                    request.requestedScopes = [.email, .fullName]
                                } onCompletion: { result in
                                    Task { await vm.handleAppleSignIn(result: result, appState: appState) }
                                }
                                .signInWithAppleButtonStyle(.black)
                                .frame(height: 50)
                                .cornerRadius(12)

                                // Email sign-in is below
                            }

                            // Divider
                            HStack {
                                Rectangle().fill(Color.cxBorder).frame(height: 1)
                                Text("or")
                                    .font(.system(size: 13))
                                    .foregroundColor(.cxStone)
                                    .padding(.horizontal, 12)
                                Rectangle().fill(Color.cxBorder).frame(height: 1)
                            }

                            VStack(spacing: 14) {
                                // Email
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
                                        .disableAutocorrection(true)
                                        .padding(14)
                                        .background(Color.white)
                                        .cornerRadius(10)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(Color.cxBorder, lineWidth: 1)
                                        )
                                }

                                // Password
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Password")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.cxBlack)
                                    SecureField("Enter your password", text: $vm.password)
                                        .textFieldStyle(.plain)
                                        .foregroundColor(.black)
                                        .textContentType(.password)
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

                            Button {
                                Task { await vm.signIn(appState: appState) }
                            } label: {
                                Group {
                                    if vm.isLoading {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Sign In")
                                    }
                                }
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(Color.cxTeal)
                                .cornerRadius(12)
                            }
                            .disabled(vm.isLoading)

                            NavigationLink {
                                SignupView()
                                    .environmentObject(appState)
                            } label: {
                                Text("Don't have an account? ")
                                    .foregroundColor(.cxSmoke) +
                                Text("Sign up")
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

                        Spacer().frame(height: 40)

                        // Footer
                        HStack(spacing: 8) {
                            Text("HIPAA-compliant")
                            Text("•").foregroundColor(.cxStone)
                            Text("Secure")
                            Text("•").foregroundColor(.cxStone)
                            Text("Privacy-first")
                        }
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.cxStone)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}
