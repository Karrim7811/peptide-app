import AppSidebar from './AppSidebar'

// Wraps every authenticated page. The shell paints the dark canvas, mounts
// the fixed sidebar, and reserves the right gutter for command-bar / actions.
// Pages render inside `<main>` with their own max-width so dense reference
// pages (Peptide Bible, Vendors) and narrow forms (Reminders, Login) can pick
// the right measure independently.
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app-bg text-app-text font-app antialiased">
      <AppSidebar />
      <main className="ml-[260px] min-h-screen">
        <div className="mx-auto max-w-[1100px] px-10 py-9">{children}</div>
      </main>
    </div>
  )
}
