import SwiftUI

/// A small bold/italic toolbar that sits above a text field.
/// Uses simple markdown-style markers: **bold** and _italic_
struct FormattingToolbar: View {
    @Binding var text: String

    var body: some View {
        HStack(spacing: 16) {
            Button {
                wrapSelection(with: "**")
            } label: {
                Text("B")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.cxBlack)
                    .frame(width: 32, height: 32)
                    .background(Color.cxStone.opacity(0.12))
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)

            Button {
                wrapSelection(with: "_")
            } label: {
                Text("I")
                    .font(.system(size: 15, weight: .medium).italic())
                    .foregroundColor(.cxBlack)
                    .frame(width: 32, height: 32)
                    .background(Color.cxStone.opacity(0.12))
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)

            Spacer()
        }
    }

    private func wrapSelection(with marker: String) {
        // Since SwiftUI doesn't expose cursor position, append markers at the end
        // If text already ends with the marker pair (empty wrap), remove it
        let pair = marker + marker
        if text.hasSuffix(pair) {
            text = String(text.dropLast(pair.count))
        } else {
            text += " \(marker)text\(marker)"
        }
    }
}

/// A multi-line text field with a bold/italic formatting toolbar above it.
struct RichNotesField: View {
    let placeholder: String
    @Binding var text: String
    var lineLimit: ClosedRange<Int> = 3...8

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            FormattingToolbar(text: $text)
            TextField(placeholder, text: $text, axis: .vertical)
                .foregroundColor(.black)
                .lineLimit(lineLimit)
        }
    }
}
