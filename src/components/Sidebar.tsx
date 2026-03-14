'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
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
  ChevronDown,
  Library,
  Zap,
  Scale,
  Store,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_GROUPS = [
  {
    label: 'Intelligence',
    color: '#1A8A9E',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/ai-chat', label: 'Peptide AI', icon: MessageSquare },
      { href: '/checker', label: 'Interaction Checker', icon: Shield },
      { href: '/stack-finder', label: 'Stack Finder', icon: Sparkles },
    ],
  },
  {
    label: 'My Protocol',
    color: '#B0AAA0',
    links: [
      { href: '/stack', label: 'My Stack', icon: Layers },
      { href: '/reconstitution', label: 'Reconstitution', icon: FlaskRound },
      { href: '/dosing', label: 'Dosage Calculator', icon: Calculator },
      { href: '/cycle', label: 'Cycle Tracker', icon: RotateCcw },
      { href: '/sites', label: 'Injection Sites', icon: MapPin },
    ],
  },
  {
    label: 'Tracking',
    color: '#B0AAA0',
    links: [
      { href: '/log', label: 'Dose Log', icon: BookOpen },
      { href: '/reminders', label: 'Reminders', icon: Bell },
      { href: '/inventory', label: 'Fridge Inventory', icon: Package },
      { href: '/side-effects', label: 'Side Effect Log', icon: AlertCircle },
      { href: '/notes', label: 'Research Notes', icon: FileText },
    ],
  },
  {
    label: 'Reference',
    color: '#B0AAA0',
    links: [
      { href: '/reference', label: 'Peptide Bible', icon: Library },
      { href: '/stacks', label: 'Popular Stacks', icon: Layers },
      { href: '/regulatory', label: 'Legal & Regulatory', icon: Scale },
      { href: '/vendors', label: 'Top Vendors', icon: Store },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Intelligence: true,
    'My Protocol': true,
    Tracking: false,
    Reference: false,
  })

  function toggleGroup(label: string) {
    if (collapsed) return
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-50 transition-all duration-300"
      style={{
        width: collapsed ? 60 : 240,
        background: '#E8E5E0',
        borderRight: '1px solid #D0CCC6',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center shrink-0"
        style={{
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '18px 0' : '18px 20px',
          borderBottom: '1px solid #D0CCC6',
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Link href="/dashboard" style={{ textDecoration: 'none', lineHeight: 1 }}>
            <div style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 9,
              fontWeight: 300,
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: '#A09488',
              marginBottom: 3,
            }}>
              Peptide
            </div>
            <div style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 300,
              fontSize: 28,
              letterSpacing: '0.12em',
              color: '#C4B8A8',
              lineHeight: 1,
            }}>
              CORTE<span style={{ color: '#1A8A9E' }}>X</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 300,
              fontSize: 22,
              letterSpacing: '0.08em',
              color: '#C4B8A8',
            }}>
              C<span style={{ color: '#1A8A9E' }}>X</span>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A09488' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#5A4E42')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#A09488')}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.label] !== false
          return (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full"
                  style={{
                    padding: '5px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                    <span style={{
                      fontFamily: 'Jost, sans-serif',
                      fontSize: 9,
                      fontWeight: 400,
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      color: '#A09488',
                    }}>
                      {group.label}
                    </span>
                  </div>
                  <ChevronDown
                    className="w-3 h-3"
                    style={{
                      color: '#A09488',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
              )}

              {(isOpen || collapsed) && (
                <div className="pb-1">
                  {group.links.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                      <Link
                        key={href}
                        href={href}
                        title={collapsed ? label : undefined}
                        className="flex items-center mx-2 rounded-lg transition-colors"
                        style={{
                          gap: collapsed ? 0 : 10,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          padding: collapsed ? '9px 0' : '7px 12px',
                          marginBottom: 1,
                          background: active ? 'rgba(26,138,158,0.12)' : 'none',
                          borderLeft: active && !collapsed ? '2px solid #1A8A9E' : '2px solid transparent',
                          textDecoration: 'none',
                        }}
                      >
                        <Icon
                          className="w-4 h-4 shrink-0"
                          style={{ color: active ? '#1A8A9E' : '#A09488' }}
                        />
                        {!collapsed && (
                          <span style={{
                            fontFamily: 'Jost, sans-serif',
                            fontSize: 13,
                            fontWeight: active ? 400 : 300,
                            color: active ? '#5A4E42' : '#8A7E72',
                            letterSpacing: '0.01em',
                          }}>
                            {label}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div
        className="shrink-0 flex flex-col gap-1"
        style={{
          borderTop: '1px solid #D0CCC6',
          padding: collapsed ? '12px 0' : '12px 8px',
        }}
      >
        {!collapsed ? (
          <a
            href="/pricing"
            className="flex items-center gap-2 rounded-lg mb-1 transition-colors"
            style={{
              padding: '8px 12px',
              background: 'rgba(26,138,158,0.1)',
              border: '1px solid rgba(26,138,158,0.25)',
              textDecoration: 'none',
            }}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: '#1A8A9E' }} />
            <span style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 12,
              fontWeight: 400,
              color: '#1A8A9E',
              letterSpacing: '0.05em',
            }}>
              Upgrade to Pro
            </span>
          </a>
        ) : (
          <a href="/pricing" title="Upgrade to Pro" className="flex justify-center py-2 mb-1">
            <Zap className="w-4 h-4" style={{ color: '#1A8A9E' }} />
          </a>
        )}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? 'Sign Out' : undefined}
          className="flex items-center rounded-lg transition-colors w-full"
          style={{
            gap: 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '9px 0' : '8px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" style={{ color: '#A09488' }} />
          {!collapsed && (
            <span style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 13,
              fontWeight: 300,
              color: '#A09488',
            }}>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
