import SwiftUI

@main
struct PeptideCortexApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var storeService = StoreService()
    @ObservedObject private var consentManager = AIConsentManager.shared

    var body: some Scene {
        WindowGroup {
            Group {
                if appState.isLoading {
                    LaunchView()
                } else if appState.isAuthenticated {
                    MainView()
                        .environmentObject(appState)
                        .environmentObject(storeService)
                        .onAppear {
                            Task {
                                let email = try? await SupabaseService.shared.client.auth.session.user.email
                                storeService.checkOwnerAccess(email: email)
                            }
                        }
                } else {
                    LoginView()
                        .environmentObject(appState)
                        .environmentObject(storeService)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: appState.isAuthenticated)
            .animation(.easeInOut(duration: 0.3), value: appState.isLoading)
            .preferredColorScheme(.light)
            .sheet(isPresented: $consentManager.showConsentSheet) {
                AIConsentSheet()
            }
            .onOpenURL { url in
                // Handle OAuth callbacks (e.g. peptidecortex://auth-callback)
                Task {
                    try? await SupabaseService.shared.client.auth.session(from: url)
                    await appState.checkSession()
                }
            }
        }
    }
}

struct LaunchView: View {
    var body: some View {
        ZStack {
            Color.cxParchment.ignoresSafeArea()
            VStack(spacing: 8) {
                Text("CORTEX")
                    .font(.system(size: 36, weight: .light, design: .default))
                    .tracking(8)
                    .foregroundColor(.cxBlack)
                ProgressView()
                    .tint(.cxTeal)
            }
        }
    }
}
