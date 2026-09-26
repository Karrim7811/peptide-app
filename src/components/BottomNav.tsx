'use client'

// ── UNUSED since 2026-09-26 ──────────────────────────────────────────────
// No layout renders this any more: every page that did moved to LibraryChrome
// (the site's one menu, Bench · Library · Shop — src/lib/nav.ts), and the
// redirect-stub routes dropped their never-visible chrome. The file is kept,
// not deleted (C:\dev\CLAUDE.md: nothing is deleted outright), with its links
// corrected so it is not wrong if someone mounts it again.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Shield, Layers, BookOpen, Calculator,
  FlaskRound, MapPin, RotateCcw, Library, Scale, Store,
} from 'lucide-react'

// Bench · Library · Shop first, then the tools with a URL of their own. The
// redirect stubs, /ai-chat and /stack-finder (both bounce to /upgrade) are gone.
const navLinks = [
  { href: '/dashboard', label: 'Bench', icon: LayoutDashboard },
  { href: '/reference', label: 'Library', icon: Library },
  { href: '/shop', label: 'Shop', icon: Store },
  { href: '/checker', label: 'Checker', icon: Shield },
  { href: '/bloodwork', label: 'Bloodwork', icon: FlaskRound },
  { href: '/mirror?ledger=1', label: 'Log', icon: BookOpen },
  { href: '/mirror?tab=cycle', label: 'Cycles', icon: RotateCcw },
  { href: '/mirror?tab=rotation', label: 'Sites', icon: MapPin },
  { href: '/dosing', label: 'Dosing', icon: Calculator },
  { href: '/stacks', label: 'Popular', icon: Layers },
  { href: '/regulatory', label: 'Legal', icon: Scale },
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
