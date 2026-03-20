import SwiftUI

struct SearchBar: View {
    @Binding var text: String
    var placeholder: String = "Search..."

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16))
                .foregroundColor(.cxStone)
            TextField(placeholder, text: $text)
                .font(.system(size: 15))
                .foregroundColor(.primary)
                .autocorrectionDisabled()
            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundColor(.cxStone)
                }
            }
        }
        .padding(12)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 1)
    }
}

// MARK: - Peptide Autocomplete Field
// Reusable text field with peptide name suggestions from PeptideDataStore

struct PeptideAutocompleteField: View {
    let label: String
    var placeholder: String = ""
    @Binding var text: String
    @State private var showSuggestions = false

    private var suggestions: [String] {
        guard !text.isEmpty else { return [] }
        let q = text.lowercased()
        return PeptideDataStore.shared.allNames.filter { $0.lowercased().contains(q) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.cxStone)
            TextField(placeholder.isEmpty ? label : placeholder, text: $text)
                .font(.system(size: 15))
                .foregroundColor(.primary)
                .padding(12)
                .background(Color.white)
                .cornerRadius(10)
                .onChange(of: text) { _ in showSuggestions = !text.isEmpty }

            if showSuggestions && !suggestions.isEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(suggestions.prefix(5), id: \.self) { name in
                        Button {
                            text = name
                            showSuggestions = false
                        } label: {
                            Text(name)
                                .font(.system(size: 14))
                                .foregroundColor(.cxBlack)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.vertical, 10)
                                .padding(.horizontal, 12)
                        }
                        if name != suggestions.prefix(5).last {
                            Divider().padding(.horizontal, 8)
                        }
                    }
                }
                .background(Color.white)
                .cornerRadius(10)
                .shadow(color: Color.black.opacity(0.08), radius: 6, x: 0, y: 3)
            }
        }
    }
}
