import SwiftUI

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    var color: Color = .cxTeal

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(color)
                Spacer()
            }
            Text(value)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.cxBlack)
            Text(title)
                .font(.system(size: 13))
                .foregroundColor(.cxStone)
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}
