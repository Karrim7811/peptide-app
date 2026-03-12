import Navbar from '@/components/Navbar'

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24">{children}</main>
    </div>
  )
}
