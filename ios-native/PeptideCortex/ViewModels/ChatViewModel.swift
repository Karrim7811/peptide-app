import Foundation

struct DisplayMessage: Identifiable {
    let id = UUID()
    let role: String
    let content: String
}

@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [DisplayMessage] = []
    @Published var inputText = ""
    @Published var isLoading = false

    private var chatHistory: [ChatMessage] = []

    init() {
        messages.append(DisplayMessage(
            role: "assistant",
            content: "Hello! I'm Cortex AI, your peptide intelligence assistant. Ask me anything about peptides, dosing protocols, stacking, reconstitution, or research."
        ))
    }

    func send() async {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        inputText = ""
        messages.append(DisplayMessage(role: "user", content: text))
        chatHistory.append(ChatMessage(role: "user", content: text))

        isLoading = true
        do {
            let reply = try await APIService.shared.sendChatMessage(messages: chatHistory)
            chatHistory.append(ChatMessage(role: "assistant", content: reply))
            messages.append(DisplayMessage(role: "assistant", content: reply))
        } catch let urlError as URLError where urlError.code == .timedOut {
            messages.append(DisplayMessage(role: "assistant", content: "The request timed out. The server may be busy -- please try again in a moment."))
        } catch let urlError as URLError where urlError.code == .notConnectedToInternet {
            messages.append(DisplayMessage(role: "assistant", content: "No internet connection. Please check your network and try again."))
        } catch let nsError as NSError where nsError.domain == "API" {
            messages.append(DisplayMessage(role: "assistant", content: "Server error (status \(nsError.code)). Please try again later."))
        } catch {
            messages.append(DisplayMessage(role: "assistant", content: "Something went wrong: \(error.localizedDescription). Please try again."))
        }
        isLoading = false
    }
}
