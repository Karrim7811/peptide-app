'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Shield, Layers, Bell, BookOpen, Calculator,
  FlaskRound, MapPin, Package, FileText, AlertCircle, MessageSquare, RotateCcw, Library, Sparkles, Scale, Store,
} from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/stack', label: 'My Stack', icon: Layers },
  { href: '/checker', label: 'Checker', icon: Shield },
  { href: '/stack-finder', label: 'Stacks', icon: Sparkles },
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
  { href: '/reference', label: 'Bible', icon: Library },
  { href: '/regulatory', label: 'Legal', icon: Scale },
  { href: '/vendors', label: 'Vendors', icon: Store },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{ background: '#1A1915', borderTop: '1px solid #2A2720' }}
    >
      <div className="flex items-center h-16 px-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg shrink-0"
              style={{
                textDecoration: 'none',
                color: active ? '#1A8A9E' : '#555',
                minWidth: 48,
              }}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span style={{
                fontSize: 9,
                fontFamily: 'Jost, sans-serif',
                fontWeight: active ? 400 : 300,
                letterSpacing: '0.02em',
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
