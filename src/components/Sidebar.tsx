'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, MessageSquare, Shield, Sparkles,
  Layers, FlaskRound, Calculator, RotateCcw, MapPin,
  BookOpen, Bell, Package, AlertCircle, FileText,
  Library, Scale, Store, LogOut, Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const FONT = "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif"

const ICON_RAIL = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/ai-chat', icon: MessageSquare, label: 'Peptide AI' },
  { href: '/checker', icon: Shield, label: 'Interaction Checker' },
  { href: '/stack-finder', icon: Sparkles, label: 'Stack Finder' },
  null,
  { href: '/stack', icon: Layers, label: 'My Stack' },
  { href: '/dosing', icon: Calculator, label: 'Dosing Reference' },
  { href: '/cycle', icon: RotateCcw, label: 'Cycle Tracker' },
  { href: '/sites', icon: MapPin, label: 'Injection Sites' },
] as const

const NAV_SECTIONS = [
  {
    label: 'Intelligence',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/ai-chat', label: 'Peptide AI' },
      { href: '/checker', label: 'Interaction Checker' },
      { href: '/stack-finder', label: 'Stack Finder' },
    ],
  },
  {
    label: 'My Protocol',
    links: [
      { href: '/stack', label: 'My Stack' },
      { href: '/reconstitution', label: 'Reconstitution' },
      { href: '/dosing', label: 'Dosing Reference' },
      { href: '/cycle', label: 'Cycle Tracker' },
      { href: '/sites', label: 'Injection Sites' },
    ],
  },
  {
    label: 'Tracking',
    links: [
      { href: '/log', label: 'Dose Log' },
      { href: '/reminders', label: 'Reminders' },
      { href: '/inventory', label: 'Fridge Inventory' },
      { href: '/side-effects', label: 'Side Effect Log' },
      { href: '/notes', label: 'Research Notes' },
    ],
  },
  {
    label: 'Reference',
    links: [
      { href: '/reference', label: 'Peptide Bible' },
      { href: '/stacks', label: 'Popular Stacks' },
      { href: '/regulatory', label: 'Legal & Regulatory' },
      { href: '/vendors', label: 'Top Vendors' },
    ],
  },
]

export default function Sidebar() {
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
    <div className="hidden md:flex fixed left-0 top-0 h-screen z-50">
      {/* ICON RAIL — 56px, cortex-black */}
      <div style={{ width: 56, background: '#1A1915', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, border: '1px solid #1A8A9E', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A8A9E', fontFamily: FONT, fontSize: 12, fontWeight: 500, letterSpacing: '0.03em' }}>
            Cx
          </div>
        </Link>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1A8A9E', marginBottom: 18 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', paddingLeft: 10, paddingRight: 10 }}>
          {ICON_RAIL.map((item, i) => {
            if (!item) return <div key={`div-${i}`} style={{ width: 24, height: 1, background: 'rgba(176,170,160,0.2)', margin: '4px auto' }} />
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} title={item.label} style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(26,138,158,0.15)' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}>
                <Icon style={{ width: 15, height: 15, color: active ? '#1A8A9E' : 'rgba(176,170,160,0.5)' }} />
              </Link>
            )
          })}
        </div>

        <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #1A8A9E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A8A9E', fontFamily: FONT, fontSize: 10, fontWeight: 500, marginTop: 12 }}>
          KR
        </div>
      </div>

      {/* NAV PANEL — 200px, sidebar-bg */}
      <div style={{ width: 200, background: '#E8E2DA', borderRight: '0.5px solid rgba(176,170,160,0.30)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
        {/* Brand block */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '0.5px solid rgba(176,170,160,0.30)', flexShrink: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 8, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B0AAA0', marginBottom: 2 }}>Peptide</div>
          <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 300, letterSpacing: '0.12em', color: '#1A1915', lineHeight: 1, marginBottom: 3 }}>
            CORTE<span style={{ color: '#1A8A9E' }}>X</span>
          </div>
          <div style={{ fontFamily: FONT, fontSize: 8, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#B0AAA0' }}>Intelligence Engine</div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: FONT, fontSize: 8, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#B0AAA0', padding: '0 10px', marginBottom: 3 }}>
                {section.label}
              </div>
              {section.links.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 7, textDecoration: 'none', fontSize: 12, fontFamily: FONT, fontWeight: active ? 500 : 400, color: active ? '#1A1915' : '#3A3730', background: active ? 'rgba(26,138,158,0.11)' : 'none', marginBottom: 1, transition: 'background 0.15s' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: active ? '#1A8A9E' : 'transparent', flexShrink: 0 }} />
                    {label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 8px', borderTop: '0.5px solid rgba(176,170,160,0.30)', flexShrink: 0 }}>
          <a href="/pricing" style={{ display: 'block', width: '100%', padding: '9px', borderRadius: 7, background: '#1A8A9E', color: '#FAFAF8', fontFamily: FONT, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textAlign: 'center', textDecoration: 'none', marginBottom: 6 }}>
            Upgrade to Pro
          </a>
          <button onClick={handleSignOut} disabled={signingOut} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 7, fontFamily: FONT, fontSize: 12, color: '#B0AAA0' }}>
            <LogOut style={{ width: 13, height: 13 }} />
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  )
}
