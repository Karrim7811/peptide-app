import SwiftUI

struct LoadingView: View {
    var message: String = "Loading..."

    var body: some View {
        VStack(spacing: 12) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .cxTeal))
            Text(message)
                .font(.system(size: 14))
                .foregroundColor(.cxStone)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
