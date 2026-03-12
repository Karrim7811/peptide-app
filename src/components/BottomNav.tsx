'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Shield, Layers, Bell, BookOpen, Calculator,
  FlaskRound, MapPin, Package, FileText, AlertCircle, MessageSquare, RotateCcw,
} from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/stack', label: 'My Stack', icon: Layers },
  { href: '/checker', label: 'Checker', icon: Shield },
  { href: '/ai-chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/dosing', label: 'Dosing', icon: Calculator },
  { href: '/reconstitution', label: 'Recon', icon: FlaskRound },
  { href: '/cycle', label: 'Cycles', icon: RotateCcw },
  { href: '/sites', label: 'Sites', icon: MapPin },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/stacks', label: 'Popular', icon: Layers },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/side-effects', label: 'Side FX', icon: AlertCircle },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/log', label: 'Log', icon: BookOpen },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-800 border-t border-slate-700 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-1 overflow-x-auto scrollbar-none">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors shrink-0 ${
                active ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-medium truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
