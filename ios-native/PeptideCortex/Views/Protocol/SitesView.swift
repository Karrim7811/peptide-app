import SwiftUI

struct SitesView: View {
    @StateObject private var vm = SitesViewModel()

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView {
                VStack(spacing: 20) {
                    // Site grid
                    VStack(alignment: .leading, spacing: 10) {
                        Text("INJECTION SITES")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.cxStone)

                        LazyVGrid(columns: [
                            GridItem(.flexible(), spacing: 10),
                            GridItem(.flexible(), spacing: 10)
                        ], spacing: 10) {
                            ForEach(InjectionSiteOption.allCases, id: \.self) { site in
                                SiteGridCell(site: site, logs: vm.logsForSite(site))
                            }
                        }
                    }

                    // Recent history
                    VStack(alignment: .leading, spacing: 10) {
                        Text("RECENT INJECTIONS")
                            .font(.system(size: 11, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(.cxStone)

                        if vm.isLoading {
                            LoadingView()
                                .frame(height: 100)
                        } else if vm.logs.isEmpty {
                            Text("No injection logs yet")
                                .font(.system(size: 14))
                                .foregroundColor(.cxStone)
                                .padding()
                        } else {
                            ForEach(vm.logs.prefix(20)) { log in
                                HStack(spacing: 12) {
                                    Circle()
                                        .fill(Color.cxTeal.opacity(0.2))
                                        .frame(width: 8, height: 8)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("\(log.peptideName) - \(log.site)")
                                            .font(.system(size: 14, weight: .medium))
                                            .foregroundColor(.cxBlack)
                                        Text(formatDate(log.injectedAt))
                                            .font(.system(size: 12))
                                            .foregroundColor(.cxStone)
                                    }
                                    Spacer()
                                }
                                .padding(12)
                                .background(Color.white)
                                .cornerRadius(10)
                            }
                        }
                    }
                }
                .padding()
            }
            .background(Color.cxParchment)

            Button {
                vm.showAddForm = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.cxTeal)
                    .cornerRadius(28)
                    .shadow(color: Color.cxTeal.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .padding(20)
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .sheet(isPresented: $vm.showAddForm) {
            AddInjectionSheet(vm: vm)
        }
    }

    func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let fallback = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) ?? fallback.date(from: iso) else { return iso }
        let df = DateFormatter()
        df.dateStyle = .medium
        df.timeStyle = .short
        return df.string(from: date)
    }
}

struct SiteGridCell: View {
    let site: InjectionSiteOption
    let logs: [InjectionLog]

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "mappin.circle.fill")
                .font(.system(size: 24))
                .foregroundColor(logs.isEmpty ? .cxStone.opacity(0.4) : .cxTeal)
            Text(site.rawValue)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.cxBlack)
                .multilineTextAlignment(.center)
            Text("\(logs.count) logs")
                .font(.system(size: 11))
                .foregroundColor(.cxStone)
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 1)
    }
}

struct AddInjectionSheet: View {
    @ObservedObject var vm: SitesViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Injection Details") {
                    Picker("Site", selection: $vm.selectedSite) {
                        ForEach(InjectionSiteOption.allCases, id: \.self) { site in
                            Text(site.rawValue).tag(site)
                        }
                    }
                    TextField("Peptide Name", text: $vm.peptideName)
                    DatePicker("Date & Time", selection: $vm.newDate)
                }
                Section("Notes") {
                    TextField("Optional notes", text: $vm.newNotes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Log Injection")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Log") { Task { await vm.addLog(); dismiss() } }
                        .disabled(vm.peptideName.isEmpty)
                }
            }
        }
    }
}
