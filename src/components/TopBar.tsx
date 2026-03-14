'use client'

import { usePathname } from 'next/navigation'

const PAGE_META: Record<string, { section: string; title: string }> = {
  '/dashboard': { section: 'INTELLIGENCE', title: 'Dashboard' },
  '/ai-chat': { section: 'INTELLIGENCE', title: 'Peptide AI' },
  '/checker': { section: 'INTELLIGENCE', title: 'Interaction Checker' },
  '/stack-finder': { section: 'INTELLIGENCE', title: 'Stack Finder' },
  '/stack': { section: 'MY PROTOCOL', title: 'My Stack' },
  '/reconstitution': { section: 'MY PROTOCOL', title: 'Reconstitution' },
  '/dosing': { section: 'MY PROTOCOL', title: 'Dosage Calculator' },
  '/cycle': { section: 'MY PROTOCOL', title: 'Cycle Tracker' },
  '/sites': { section: 'MY PROTOCOL', title: 'Injection Sites' },
  '/log': { section: 'TRACKING', title: 'Dose Log' },
  '/reminders': { section: 'TRACKING', title: 'Reminders' },
  '/inventory': { section: 'TRACKING', title: 'Fridge Inventory' },
  '/side-effects': { section: 'TRACKING', title: 'Side Effect Log' },
  '/notes': { section: 'TRACKING', title: 'Research Notes' },
  '/reference': { section: 'REFERENCE', title: 'Peptide Bible' },
  '/stacks': { section: 'REFERENCE', title: 'Popular Stacks' },
  '/regulatory': { section: 'REFERENCE', title: 'Legal & Regulatory' },
  '/vendors': { section: 'REFERENCE', title: 'Top Vendors' },
}

const FONT = "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif"

export default function TopBar() {
  const pathname = usePathname()
  const meta = PAGE_META[pathname] ?? { section: 'CORTEX', title: 'Dashboard' }
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{
      background: '#F5F0E8',
      borderBottom: '0.5px solid rgba(176,170,160,0.30)',
      padding: '16px 24px 14px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B0AAA0', marginBottom: 4 }}>
          {meta.section} / {meta.title.toUpperCase()}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 400, color: '#1A1915', lineHeight: 1, marginBottom: 3 }}>
          {meta.title}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>{today}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
        <div style={{ border: '0.5px solid rgba(176,170,160,0.30)', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontFamily: FONT, color: '#3A3730', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, display: 'inline-block' }} />
          Protocol Active
        </div>
        <div style={{ border: '0.5px solid rgba(176,170,160,0.30)', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontFamily: FONT, color: '#3A3730' }}>
          ⏱ No reminders
        </div>
      </div>
    </div>
  )
}
