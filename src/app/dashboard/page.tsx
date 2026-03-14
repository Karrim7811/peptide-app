import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Layers, Bell, BookOpen, Shield, ChevronRight, Clock, FlaskConical } from 'lucide-react'
import type { StackItem, Reminder, DoseLog } from '@/types'
import MarketPulse from './MarketPulse'

const FONT = "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif"
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayDow = new Date().getDay()

  const { data: stackItems } = await supabase
    .from('stack_items').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false })

  const { data: allReminders } = await supabase
    .from('reminders').select('*, stack_item:stack_items(*)').eq('user_id', user.id).eq('active', true)

  const { data: recentLogs } = await supabase
    .from('dose_logs').select('*, stack_item:stack_items(*)').eq('user_id', user.id).order('taken_at', { ascending: false }).limit(7)

  const activeStack: StackItem[] = stackItems ?? []
  const todayReminders = ((allReminders ?? []) as Reminder[]).filter(r => r.days_of_week.includes(todayDow))
  const logs: DoseLog[] = recentLogs ?? []

  const card = {
    background: '#F2F0ED',
    border: '0.5px solid rgba(176,170,160,0.30)',
    borderRadius: 10,
  }

  const cardHeader = {
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.11em',
    textTransform: 'uppercase' as const,
    color: '#3A3730',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* STAT CARDS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {/* Active Stack */}
        <Link href="/stack" style={{ ...card, borderTop: '2px solid #1A8A9E', padding: '18px 20px', textDecoration: 'none', display: 'block', position: 'relative' }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B0AAA0', fontWeight: 500, marginBottom: 6 }}>Active Stack</div>
          <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 300, color: '#1A1915', lineHeight: 1, marginBottom: 4 }}>{activeStack.length}</div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>compounds tracked</div>
          <ChevronRight style={{ position: 'absolute', top: 16, right: 14, width: 14, height: 14, color: '#B0AAA0' }} />
        </Link>
        {/* Reminders Today */}
        <Link href="/reminders" style={{ ...card, padding: '18px 20px', textDecoration: 'none', display: 'block', position: 'relative' }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B0AAA0', fontWeight: 500, marginBottom: 6 }}>Reminders Today</div>
          <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 300, color: '#1A1915', lineHeight: 1, marginBottom: 4 }}>{todayReminders.length}</div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>{todayReminders.length === 0 ? 'no pending doses' : 'scheduled today'}</div>
          <ChevronRight style={{ position: 'absolute', top: 16, right: 14, width: 14, height: 14, color: '#B0AAA0' }} />
        </Link>
        {/* Logs This Week */}
        <Link href="/log" style={{ ...card, padding: '18px 20px', textDecoration: 'none', display: 'block', position: 'relative' }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B0AAA0', fontWeight: 500, marginBottom: 6 }}>Logs This Week</div>
          <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 300, color: '#1A1915', lineHeight: 1, marginBottom: 4 }}>{logs.length}</div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>{logs.length === 0 ? 'start logging today' : 'doses recorded'}</div>
          <ChevronRight style={{ position: 'absolute', top: 16, right: 14, width: 14, height: 14, color: '#B0AAA0' }} />
        </Link>
        {/* AI Analysis */}
        <Link href="/checker" style={{ ...card, borderTop: '2px solid #1A8A9E', padding: '18px 20px', textDecoration: 'none', display: 'block', position: 'relative' }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B0AAA0', fontWeight: 500, marginBottom: 6 }}>AI Analysis</div>
          <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 300, color: '#1A8A9E', lineHeight: 1, marginBottom: 4 }}>AI</div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>Check Interactions</div>
          <div style={{ position: 'absolute', top: 14, right: 12, background: 'rgba(26,138,158,0.11)', border: '0.5px solid rgba(26,138,158,0.3)', borderRadius: 6, padding: '2px 7px', fontSize: 9, fontFamily: FONT, color: '#1A8A9E', fontWeight: 500, letterSpacing: '0.05em' }}>AI</div>
        </Link>
      </div>

      {/* WIDGET ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {/* Reminders widget */}
        <div style={{ ...card, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1A8A9E', flexShrink: 0 }} />
              <span style={{ ...cardHeader }}>Reminders</span>
            </div>
            <Link href="/reminders" style={{ fontFamily: FONT, fontSize: 11, color: '#1A8A9E', textDecoration: 'none' }}>View all</Link>
          </div>
          {todayReminders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Clock style={{ width: 24, height: 24, color: 'rgba(176,170,160,0.25)', margin: '0 auto 8px' }} />
              <div style={{ fontFamily: FONT, fontSize: 12, color: '#B0AAA0', marginBottom: 6 }}>No reminders today</div>
              <Link href="/reminders" style={{ fontFamily: FONT, fontSize: 11, color: '#1A8A9E', textDecoration: 'none' }}>Add a reminder</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {todayReminders.map((r: Reminder) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '3px solid #1A8A9E', paddingLeft: 10, paddingTop: 4, paddingBottom: 4 }}>
                  <div>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1A1915' }}>{r.stack_item?.name ?? 'Unknown'}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>{r.time}</div>
                  </div>
                  <Link href="/log" style={{ fontFamily: FONT, fontSize: 10, color: '#1A8A9E', background: 'rgba(26,138,158,0.11)', padding: '3px 10px', borderRadius: 6, textDecoration: 'none' }}>Log</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Stack widget */}
        <div style={{ ...card, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1A8A9E', flexShrink: 0 }} />
              <span style={{ ...cardHeader }}>Active Stack</span>
              <span style={{ background: '#1A8A9E', color: '#FAFAF8', fontSize: 9, fontFamily: FONT, fontWeight: 500, padding: '1px 7px', borderRadius: 10 }}>{activeStack.length}</span>
            </div>
            <Link href="/stack" style={{ fontFamily: FONT, fontSize: 11, color: '#1A8A9E', textDecoration: 'none' }}>Manage</Link>
          </div>
          {activeStack.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <FlaskConical style={{ width: 24, height: 24, color: 'rgba(176,170,160,0.25)', margin: '0 auto 8px' }} />
              <div style={{ fontFamily: FONT, fontSize: 12, color: '#B0AAA0', marginBottom: 6 }}>No items in your stack</div>
              <Link href="/stack" style={{ fontFamily: FONT, fontSize: 11, color: '#1A8A9E', textDecoration: 'none' }}>Add your first item</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeStack.slice(0, 4).map((item: StackItem) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '3px solid #1A8A9E', paddingLeft: 10, paddingTop: 4, paddingBottom: 4 }}>
                  <div>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1A1915' }}>{item.name}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>{item.dose} {item.unit} · active</div>
                  </div>
                  <span style={{ background: 'rgba(26,138,158,0.11)', color: '#1A8A9E', fontSize: 9, fontFamily: FONT, fontWeight: 500, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PEPTIDE</span>
                </div>
              ))}
              {activeStack.length > 4 && (
                <Link href="/stack" style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0', textDecoration: 'none', paddingLeft: 13, paddingTop: 2 }}>+{activeStack.length - 4} more</Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Logs widget */}
        <div style={{ ...card, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1A8A9E', flexShrink: 0 }} />
              <span style={{ ...cardHeader }}>Recent Logs</span>
            </div>
            <Link href="/log" style={{ fontFamily: FONT, fontSize: 11, color: '#1A8A9E', textDecoration: 'none' }}>View all</Link>
          </div>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <BookOpen style={{ width: 24, height: 24, color: 'rgba(176,170,160,0.25)', margin: '0 auto 8px' }} />
              <div style={{ fontFamily: FONT, fontSize: 12, color: '#B0AAA0', marginBottom: 6 }}>No doses logged yet</div>
              <Link href="/log" style={{ fontFamily: FONT, fontSize: 11, color: '#1A8A9E', textDecoration: 'none' }}>Log your first dose</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.slice(0, 4).map((log: DoseLog) => (
                <div key={log.id} style={{ borderLeft: '3px solid #1A8A9E', paddingLeft: 10, paddingTop: 4, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1A1915' }}>{log.stack_item?.name ?? 'Unknown'}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>{format(new Date(log.taken_at), 'MMM d')}</div>
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: '#B0AAA0' }}>{log.dose || 'No dose'} · {format(new Date(log.taken_at), 'h:mm a')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { href: '/checker', label: 'Check Interaction', sub: 'Run AI analysis', icon: Shield },
          { href: '/log', label: 'Log a Dose', sub: 'Record administration', icon: BookOpen },
          { href: '/stack', label: 'Update Stack', sub: 'Edit compounds', icon: Layers },
        ].map(({ href, label, sub, icon: Icon }) => (
          <Link key={href} href={href} style={{ ...card, padding: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.15s' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(176,170,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 15, height: 15, color: '#3A3730' }} />
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#3A3730', marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: FONT, fontSize: 10, color: '#B0AAA0' }}>{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* MARKET PULSE */}
      <MarketPulse />
    </div>
  )
}
