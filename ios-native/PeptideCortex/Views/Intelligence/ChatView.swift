import SwiftUI

struct ChatView: View {
    @StateObject private var vm = ChatViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(vm.messages) { message in
                            ChatBubble(message: message)
                                .id(message.id)
                        }
                        if vm.isLoading {
                            HStack(spacing: 8) {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .cxTeal))
                                Text("Thinking...")
                                    .font(.system(size: 14))
                                    .foregroundColor(.cxStone)
                                Spacer()
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding()
                }
                .onChange(of: vm.messages.count) { _ in
                    if let last = vm.messages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            Divider()

            // Input bar
            HStack(spacing: 10) {
                TextField("Ask about peptides...", text: $vm.inputText, axis: .vertical)
                    .font(.system(size: 15))
                    .padding(12)
                    .background(Color.white)
                    .cornerRadius(12)
                    .lineLimit(1...4)

                Button {
                    Task { await vm.send() }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 34))
                        .foregroundColor(vm.inputText.trimmingCharacters(in: .whitespaces).isEmpty ? .cxStone : .cxTeal)
                }
                .disabled(vm.inputText.trimmingCharacters(in: .whitespaces).isEmpty || vm.isLoading)
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
            .background(Color.cxParchment)
        }
        .background(Color.cxParchment)
    }
}

struct ChatBubble: View {
    let message: DisplayMessage

    var isUser: Bool { message.role == "user" }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 48) }
            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.system(size: 15))
                    .foregroundColor(isUser ? .white : .cxBlack)
                    .padding(12)
                    .background(isUser ? Color.cxTeal : Color.white)
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
            }
            if !isUser { Spacer(minLength: 48) }
        }
    }
}
