'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, MessageSquare, Shield, Sparkles,
  Layers, FlaskRound, Calculator, RotateCcw, MapPin,
  BookOpen, Bell, Package, AlertCircle, FileText,
  Library, Scale, Store, LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_SECTIONS = [
  {
    label: 'Intelligence',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/ai-chat', label: 'Peptide AI', icon: MessageSquare },
      { href: '/checker', label: 'Interaction Checker', icon: Shield },
      { href: '/stack-finder', label: 'Stack Finder', icon: Sparkles },
    ],
  },
  {
    label: 'My Protocol',
    links: [
      { href: '/stack', label: 'My Stack', icon: Layers },
      { href: '/reconstitution', label: 'Reconstitution', icon: FlaskRound },
      { href: '/dosing', label: 'Dosing Reference', icon: Calculator },
      { href: '/cycle', label: 'Cycle Tracker', icon: RotateCcw },
      { href: '/sites', label: 'Injection Sites', icon: MapPin },
    ],
  },
  {
    label: 'Tracking',
    links: [
      { href: '/log', label: 'Dose Log', icon: BookOpen },
      { href: '/reminders', label: 'Reminders', icon: Bell },
      { href: '/inventory', label: 'Fridge Inventory', icon: Package },
      { href: '/side-effects', label: 'Side Effects', icon: AlertCircle },
      { href: '/notes', label: 'Research Notes', icon: FileText },
    ],
  },
  {
    label: 'Reference',
    links: [
      { href: '/reference', label: 'Peptide Bible', icon: Library },
      { href: '/stacks', label: 'Popular Stacks', icon: Layers },
      { href: '/regulatory', label: 'Legal & Regulatory', icon: Scale },
      { href: '/vendors', label: 'Top Vendors', icon: Store },
    ],
  },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Get current page title
  const currentPage = NAV_SECTIONS
    .flatMap(s => s.links)
    .find(l => pathname === l.href || pathname.startsWith(l.href + '/'))

  return (
    <>
      {/* Mobile Header Bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(245, 240, 232, 0.85)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '0.5px solid rgba(176, 170, 160, 0.3)',
        }}
      >
        <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            padding: '0 16px',
          }}>
            <button
              onClick={() => setOpen(!open)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                marginLeft: -8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {open
                ? <X style={{ width: 22, height: 22, color: '#1A1915' }} />
                : <Menu style={{ width: 22, height: 22, color: '#1A1915' }} />
              }
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: '#1A1915',
              }}>
                {currentPage?.label || 'Peptide Cortex'}
              </div>
            </div>

            {/* Placeholder for right side balance */}
            <div style={{ width: 38 }} />
          </div>
        </div>
      </header>

      {/* Backdrop overlay */}
      <div
        className="md:hidden"
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Slide-out Drawer */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '85vw',
          maxWidth: 320,
          zIndex: 51,
          background: '#F5F0E8',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: open ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
        }}
      >
        {/* Drawer Header */}
        <div style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 20px',
          borderBottom: '0.5px solid rgba(176, 170, 160, 0.3)',
        }}>
          <div style={{
            fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#B0AAA0',
            marginBottom: 4,
          }}>
            Peptide
          </div>
          <div style={{
            fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
            fontSize: 28,
            fontWeight: 300,
            letterSpacing: '0.1em',
            color: '#1A1915',
            lineHeight: 1,
            marginBottom: 4,
          }}>
            CORTE<span style={{ color: '#1A8A9E' }}>X</span>
          </div>
          <div style={{
            fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#B0AAA0',
          }}>
            Intelligence Engine
          </div>
        </div>

        {/* Nav Sections */}
        <div style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#B0AAA0',
                padding: '0 12px',
                marginBottom: 6,
              }}>
                {section.label}
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {section.links.map(({ href, label, icon: Icon }, idx) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  const isLast = idx === section.links.length - 1
                  return (
                    <Link
                      key={href}
                      href={href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '13px 14px',
                        textDecoration: 'none',
                        fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
                        fontSize: 15,
                        fontWeight: active ? 600 : 400,
                        color: active ? '#1A8A9E' : '#1A1915',
                        background: active ? 'rgba(26, 138, 158, 0.08)' : 'transparent',
                        borderBottom: isLast ? 'none' : '0.5px solid rgba(176, 170, 160, 0.2)',
                        transition: 'background 0.15s',
                      }}
                    >
                      <Icon style={{
                        width: 20,
                        height: 20,
                        color: active ? '#1A8A9E' : '#8A8580',
                        flexShrink: 0,
                      }} />
                      <span style={{ flex: 1 }}>{label}</span>
                      <ChevronRight style={{
                        width: 16,
                        height: 16,
                        color: '#C8C4BE',
                        flexShrink: 0,
                      }} />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div style={{
          padding: '12px 12px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          borderTop: '0.5px solid rgba(176, 170, 160, 0.3)',
        }}>
          <Link
            href="/pricing"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: '#1A8A9E',
              color: '#FAFAF8',
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textAlign: 'center',
              textDecoration: 'none',
              marginBottom: 8,
            }}
          >
            Upgrade to Pro
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.5)',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 12,
              fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
              fontSize: 14,
              color: '#B0AAA0',
            }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </nav>
    </>
  )
}
