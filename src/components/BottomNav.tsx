'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Shield, Layers, Bell, BookOpen, Calculator } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/checker', label: 'Checker', icon: Shield },
  { href: '/stack', label: 'Stack', icon: Layers },
  { href: '/dosing', label: 'Dosing', icon: Calculator },
  { href: '/stacks', label: 'Stacks', icon: Layers },
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
