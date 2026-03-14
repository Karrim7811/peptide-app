import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Layers,
  Bell,
  BookOpen,
  Shield,
  ChevronRight,
  Clock,
  FlaskConical,
} from 'lucide-react'
import type { StackItem, Reminder, DoseLog } from '@/types'
import MarketPulse from './MarketPulse'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TYPE_COLORS: Record<string, string> = {
  peptide: 'bg-[#1A8A9E]/12 text-[#1A8A9E]',
  medication: 'bg-blue-500/20 text-blue-300',
  supplement: 'bg-emerald-500/20 text-emerald-300',
}

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Today's day of week (0=Sun)
  const todayDow = new Date().getDay()

  // Fetch active stack items
  const { data: stackItems } = await supabase
    .from('stack_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Fetch all reminders and filter by today
  const { data: allReminders } = await supabase
    .from('reminders')
    .select('*, stack_item:stack_items(*)')
    .eq('user_id', user.id)
    .eq('active', true)

  const todayReminders = (allReminders ?? []).filter((r: Reminder) =>
    r.days_of_week.includes(todayDow)
  )

  // Sort by time
  todayReminders.sort((a: Reminder, b: Reminder) => a.time.localeCompare(b.time))

  // Fetch recent dose logs
  const { data: recentLogs } = await supabase
    .from('dose_logs')
    .select('*, stack_item:stack_items(*)')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(7)

  const activeStack: StackItem[] = stackItems ?? []
  const logs: DoseLog[] = recentLogs ?? []

  return (
    <div className="space-y-6">
      {/* CORTEX Hero Banner */}
      <div className="rounded-2xl overflow-hidden">
        {/* Subtitle */}
        <div style={{ background: '#E8E5E0', padding: '22px 32px 18px', textAlign: 'center' }}>
          <p style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 10,
            fontWeight: 400,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#8A8378',
          }}>
            AI-Powered Peptide Intelligence Engine
          </p>
        </div>
        {/* Letter Grid */}
        <div className="grid grid-cols-6">
          {([
            { letter: 'C', label: 'COGNITIVE\nCORE' },
            { letter: 'O', label: 'OPTIMIZATION\nENGINE' },
            { letter: 'R', label: 'REASONING\nLAYER' },
            { letter: 'T', label: 'TRACKING\nINTELLIGENCE' },
            { letter: 'E', label: 'EVIDENCE-\nBASED' },
            { letter: 'X', label: 'EXECUTION\nENGINE', teal: true },
          ] as { letter: string; label: string; teal?: boolean }[]).map(({ letter, label, teal }, i) => (
            <div
              key={letter}
              className="flex flex-col items-center py-5"
              style={{
                background: teal ? '#1A8A9E' : '#E8E5E0',
                borderRight: !teal && i < 4 ? '1px solid #D0CCC6' : 'none',
              }}
            >
              <span style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontWeight: 300,
                fontSize: 'clamp(24px, 3.5vw, 48px)',
                color: teal ? '#FAFAF8' : '#1A8A9E',
                lineHeight: 1,
              }}>
                {letter}
              </span>
              <span style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 8,
                fontWeight: 400,
                letterSpacing: '0.15em',
                color: teal ? 'rgba(250,250,248,0.65)' : '#8A8378',
                textAlign: 'center',
                marginTop: 10,
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1915]">Dashboard</h1>
        <p className="text-[#B0AAA0] mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers className="w-5 h-5 text-[#1A8A9E]" />}
          label="Active Items"
          value={activeStack.length}
          href="/stack"
        />
        <StatCard
          icon={<Bell className="w-5 h-5 text-[#1A8A9E]" />}
          label="Today's Reminders"
          value={todayReminders.length}
          href="/reminders"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-[#1A8A9E]" />}
          label="Logs This Week"
          value={logs.length}
          href="/log"
        />
        <StatCard
          icon={<Shield className="w-5 h-5 text-[#1A8A9E]" />}
          label="Check Interactions"
          value="AI"
          href="/checker"
          isLink
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Reminders */}
        <div className="lg:col-span-1 bg-white border border-[#E8E5E0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1915] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1A8A9E]" />
              Today&apos;s Reminders
            </h2>
            <Link href="/reminders" className="text-xs text-[#1A8A9E] hover:text-[#1A8A9E]">
              View all
            </Link>
          </div>

          {todayReminders.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-[#B0AAA0] mx-auto mb-2" />
              <p className="text-[#B0AAA0] text-sm">No reminders for today</p>
              <Link href="/reminders" className="text-[#1A8A9E] text-xs hover:underline mt-1 inline-block">
                Add a reminder
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayReminders.map((reminder: Reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between bg-[#F2F0ED] rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A1915]">
                      {reminder.stack_item?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-[#B0AAA0]">
                      {reminder.time} &bull; {reminder.dose || reminder.stack_item?.dose || 'No dose set'}
                    </p>
                  </div>
                  <Link
                    href="/log"
                    className="text-xs bg-[#1A8A9E]/15 hover:bg-[#1A8A9E]/30 text-[#1A8A9E] px-2 py-1 rounded transition-colors"
                  >
                    Log
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Stack */}
        <div className="lg:col-span-1 bg-white border border-[#E8E5E0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1915] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1A8A9E]" />
              My Active Stack
              <span className="bg-[#F2F0ED] text-[#3A3730] text-xs px-2 py-0.5 rounded-full">
                {activeStack.length}
              </span>
            </h2>
            <Link href="/stack" className="text-xs text-[#1A8A9E] hover:text-[#1A8A9E]">
              Manage
            </Link>
          </div>

          {activeStack.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical className="w-8 h-8 text-[#B0AAA0] mx-auto mb-2" />
              <p className="text-[#B0AAA0] text-sm">No items in your stack</p>
              <Link href="/stack" className="text-[#1A8A9E] text-xs hover:underline mt-1 inline-block">
                Add your first item
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activeStack.slice(0, 5).map((item: StackItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-[#F2F0ED] rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A1915]">{item.name}</p>
                    <p className="text-xs text-[#B0AAA0]">
                      {item.dose} {item.unit}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      TYPE_COLORS[item.type] ?? 'bg-[#F2F0ED] text-[#3A3730]'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
              ))}
              {activeStack.length > 5 && (
                <Link
                  href="/stack"
                  className="flex items-center justify-center gap-1 text-xs text-[#B0AAA0] hover:text-[#1A8A9E] pt-1"
                >
                  +{activeStack.length - 5} more <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Logs */}
        <div className="lg:col-span-1 bg-white border border-[#E8E5E0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1915] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1A8A9E]" />
              Recent Logs
            </h2>
            <Link href="/log" className="text-xs text-[#1A8A9E] hover:text-[#1A8A9E]">
              View all
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-[#B0AAA0] mx-auto mb-2" />
              <p className="text-[#B0AAA0] text-sm">No doses logged yet</p>
              <Link href="/log" className="text-[#1A8A9E] text-xs hover:underline mt-1 inline-block">
                Log your first dose
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 5).map((log: DoseLog) => (
                <div
                  key={log.id}
                  className="bg-[#F2F0ED] rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#1A1915]">
                      {log.stack_item?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-[#B0AAA0]">
                      {format(new Date(log.taken_at), 'MMM d')}
                    </p>
                  </div>
                  <p className="text-xs text-[#B0AAA0] mt-0.5">
                    {log.dose || 'No dose recorded'} &bull; {format(new Date(log.taken_at), 'h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-[#E8E5E0] rounded-xl p-6">
        <h2 className="font-semibold text-[#1A1915] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/checker"
            className="flex items-center gap-2 bg-[#1A8A9E]/12 hover:bg-[#1A8A9E]/15 border border-[#1A8A9E]/30 text-[#1A8A9E] px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Shield className="w-4 h-4" />
            Check Interaction
          </Link>
          <Link
            href="/log"
            className="flex items-center gap-2 bg-[#F2F0ED] hover:bg-[#E8E5E0] text-[#3A3730] px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Log a Dose
          </Link>
          <Link
            href="/stack"
            className="flex items-center gap-2 bg-[#F2F0ED] hover:bg-[#E8E5E0] text-[#3A3730] px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Layers className="w-4 h-4" />
            Update Stack
          </Link>
          <Link
            href="/reminders"
            className="flex items-center gap-2 bg-[#F2F0ED] hover:bg-[#E8E5E0] text-[#3A3730] px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Bell className="w-4 h-4" />
            Add Reminder
          </Link>
        </div>
      </div>

      {/* Market Pulse */}
      <MarketPulse />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
  isLink,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  href: string
  isLink?: boolean
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-[#E8E5E0] rounded-xl p-5 hover:border-[#1A8A9E]/50 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        {icon}
        <ChevronRight className="w-4 h-4 text-[#B0AAA0] group-hover:text-[#1A8A9E] transition-colors" />
      </div>
      <p className={`font-bold ${isLink ? 'text-lg text-[#1A8A9E]' : 'text-2xl text-[#1A1915]'}`}>
        {value}
      </p>
      <p className="text-xs text-[#B0AAA0] mt-1">{label}</p>
    </Link>
  )
}
