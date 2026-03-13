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
  peptide: 'bg-indigo-500/20 text-indigo-300',
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers className="w-5 h-5 text-indigo-400" />}
          label="Active Items"
          value={activeStack.length}
          href="/stack"
        />
        <StatCard
          icon={<Bell className="w-5 h-5 text-indigo-400" />}
          label="Today's Reminders"
          value={todayReminders.length}
          href="/reminders"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-indigo-400" />}
          label="Logs This Week"
          value={logs.length}
          href="/log"
        />
        <StatCard
          icon={<Shield className="w-5 h-5 text-indigo-400" />}
          label="Check Interactions"
          value="AI"
          href="/checker"
          isLink
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Reminders */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              Today&apos;s Reminders
            </h2>
            <Link href="/reminders" className="text-xs text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          </div>

          {todayReminders.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No reminders for today</p>
              <Link href="/reminders" className="text-indigo-400 text-xs hover:underline mt-1 inline-block">
                Add a reminder
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayReminders.map((reminder: Reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {reminder.stack_item?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {reminder.time} &bull; {reminder.dose || reminder.stack_item?.dose || 'No dose set'}
                    </p>
                  </div>
                  <Link
                    href="/log"
                    className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 px-2 py-1 rounded transition-colors"
                  >
                    Log
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Stack */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              My Active Stack
              <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                {activeStack.length}
              </span>
            </h2>
            <Link href="/stack" className="text-xs text-indigo-400 hover:text-indigo-300">
              Manage
            </Link>
          </div>

          {activeStack.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No items in your stack</p>
              <Link href="/stack" className="text-indigo-400 text-xs hover:underline mt-1 inline-block">
                Add your first item
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activeStack.slice(0, 5).map((item: StackItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.dose} {item.unit}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      TYPE_COLORS[item.type] ?? 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
              ))}
              {activeStack.length > 5 && (
                <Link
                  href="/stack"
                  className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-indigo-400 pt-1"
                >
                  +{activeStack.length - 5} more <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Logs */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Recent Logs
            </h2>
            <Link href="/log" className="text-xs text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No doses logged yet</p>
              <Link href="/log" className="text-indigo-400 text-xs hover:underline mt-1 inline-block">
                Log your first dose
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 5).map((log: DoseLog) => (
                <div
                  key={log.id}
                  className="bg-slate-900/50 rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">
                      {log.stack_item?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(log.taken_at), 'MMM d')}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {log.dose || 'No dose recorded'} &bull; {format(new Date(log.taken_at), 'h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/checker"
            className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Shield className="w-4 h-4" />
            Check Interaction
          </Link>
          <Link
            href="/log"
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Log a Dose
          </Link>
          <Link
            href="/stack"
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Layers className="w-4 h-4" />
            Update Stack
          </Link>
          <Link
            href="/reminders"
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors"
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
      className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/50 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        {icon}
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
      </div>
      <p className={`font-bold ${isLink ? 'text-lg text-indigo-400' : 'text-2xl text-white'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </Link>
  )
}
