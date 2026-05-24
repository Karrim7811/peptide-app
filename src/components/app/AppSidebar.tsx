'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, MessageSquare, Shield, Sparkles,
  Layers, FlaskRound, Calculator, RotateCcw, MapPin,
  BookOpen, Bell, Package, AlertCircle, FileText,
  Library, Scale, Store, LogOut, FlaskConical,
  type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PRODUCT_GLYPH, PRODUCT_NAME } from '@/lib/brand'

type NavLink = { href: string; label: string; icon: LucideIcon }
type NavSection = { label: string; links: NavLink[] }

// Section order chosen for daily-use frequency: Today (dashboard, log, reminders)
// at the top, then Reference and Tools deeper. Tracker entries that double as
// inputs (sites, cycle, side-effects) live under Track; pure browsing surfaces
// (bible, popular stacks, vendors, regulatory) live under Reference.
const SECTIONS: NavSection[] = [
  {
    label: 'Today',
    links: [
      { href: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard },
      { href: '/log',         label: 'Dose Log',      icon: FileText },
      { href: '/reminders',   label: 'Reminders',     icon: Bell },
      { href: '/inventory',   label: 'Inventory',     icon: Package },
    ],
  },
  {
    label: 'Protocol',
    links: [
      { href: '/stack',          label: 'My Stack',       icon: Layers },
      { href: '/reconstitution', label: 'Reconstitution', icon: Calculator },
      { href: '/cycle',          label: 'Cycles',         icon: RotateCcw },
      { href: '/sites',          label: 'Injection Sites',icon: MapPin },
      { href: '/side-effects',   label: 'Side Effects',   icon: AlertCircle },
      { href: '/notes',          label: 'Notes',          icon: BookOpen },
    ],
  },
  {
    label: 'Intelligence',
    links: [
      { href: '/ai-chat',      label: 'Cortex AI',          icon: MessageSquare },
      { href: '/checker',      label: 'Interaction Checker',icon: Shield },
      { href: '/stack-finder', label: 'Stack Finder',       icon: Sparkles },
    ],
  },
  {
    label: 'Reference',
    links: [
      { href: '/reference',  label: 'Peptide Bible',  icon: Library },
      { href: '/stacks',     label: 'Popular Stacks', icon: FlaskConical },
      { href: '/dosing',     label: 'Dosing',         icon: FlaskRound },
      { href: '/vendors',    label: 'Vendors',        icon: Store },
      { href: '/regulatory', label: 'Regulatory',     icon: Scale },
    ],
  },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col gap-2 border-r border-app-border-sub bg-app-bg px-4 py-7">
      {/* Logo */}
      <Link href="/dashboard" className="mb-5 flex items-center gap-2.5 px-3 py-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-app-accent-mid">
          <span className="text-[12px] font-bold tracking-wider text-app-accent">
            {PRODUCT_GLYPH}
          </span>
        </div>
        <span className="bg-gradient-to-br from-app-text to-app-text-sec bg-clip-text text-[18px] font-bold tracking-tight text-transparent">
          {PRODUCT_NAME}
        </span>
      </Link>

      {/* Sections */}
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mt-2">
            <div className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-app-text-mute">
              {section.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/')
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      'group flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14px] font-normal transition-colors',
                      active
                        ? 'bg-app-accent-dim text-app-accent'
                        : 'text-app-text-sec hover:bg-app-elevated hover:text-app-text',
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'h-[18px] w-[18px] flex-shrink-0 transition-opacity',
                        active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
                      ].join(' ')}
                    />
                    <span className="truncate">{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-app-border-sub pt-3">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] text-app-text-sec transition-colors hover:bg-app-elevated hover:text-app-text disabled:opacity-50"
        >
          <LogOut className="h-[16px] w-[16px] opacity-70" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
