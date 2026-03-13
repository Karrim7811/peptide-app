'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FlaskConical,
  LayoutDashboard,
  Shield,
  Layers,
  Bell,
  BookOpen,
  LogOut,
  Calculator,
  FlaskRound,
  MapPin,
  Package,
  FileText,
  AlertCircle,
  MessageSquare,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Library,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stack', label: 'My Stack', icon: Layers },
  { href: '/checker', label: 'Interaction Checker', icon: Shield },
  { href: '/ai-chat', label: 'Peptide AI', icon: MessageSquare },
  { href: '/dosing', label: 'Dosage Calculator', icon: Calculator },
  { href: '/reconstitution', label: 'Reconstitution', icon: FlaskRound },
  { href: '/cycle', label: 'Cycle Tracker', icon: RotateCcw },
  { href: '/sites', label: 'Injection Sites', icon: MapPin },
  { href: '/inventory', label: 'Fridge Inventory', icon: Package },
  { href: '/stacks', label: 'Popular Stacks', icon: Layers },
  { href: '/notes', label: 'Research Notes', icon: FileText },
  { href: '/side-effects', label: 'Side Effect Log', icon: AlertCircle },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/log', label: 'Dose Log', icon: BookOpen },
  { href: '/reference', label: 'Peptide Bible', icon: Library },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside
      className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-slate-800 border-r border-slate-700 z-50 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700 shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="bg-indigo-500/20 p-1.5 rounded-lg shrink-0">
              <FlaskConical className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="font-bold text-white text-base truncate">
              Peptide<span className="text-indigo-400">Tracker</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="bg-indigo-500/20 p-1.5 rounded-lg">
              <FlaskConical className="w-5 h-5 text-indigo-400" />
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0 ${collapsed ? 'mx-auto mt-1' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-2 pb-4 border-t border-slate-700 pt-3 shrink-0">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>}
        </button>
      </div>
    </aside>
  )
}
