import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Layers, BookOpen, Shield, ChevronRight, Clock, FlaskConical,
  Sparkles, ArrowUpRight,
} from 'lucide-react'
import type { StackItem, Reminder, DoseLog } from '@/types'
import Vial from '@/components/Vial'
import AppShell from '@/components/app/AppShell'
import { vialDisplayName } from '@/lib/peptide-display'

// Greeting bands shift with the local hour. Keeps the dashboard from feeling
// static across the day without faking personalization we don't have.
function greetingFor(hour: number): string {
  if (hour < 5) return 'Late night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

const TYPE_BADGE: Record<string, string> = {
  peptide:    'bg-app-accent-dim text-app-accent',
  supplement: 'bg-app-emerald-dim text-app-emerald',
  medication: 'bg-app-violet-dim text-app-violet',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayDow = new Date().getDay()

  const [stackRes, remindersRes, logsRes] = await Promise.all([
    supabase.from('stack_items').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }),
    supabase.from('reminders').select('*, stack_item:stack_items(*)').eq('user_id', user.id).eq('active', true),
    supabase.from('dose_logs').select('*, stack_item:stack_items(*)').eq('user_id', user.id).order('taken_at', { ascending: false }).limit(8),
  ])

  const activeStack: StackItem[] = stackRes.data ?? []
  const todayReminders = ((remindersRes.data ?? []) as Reminder[])
    .filter(r => r.days_of_week.includes(todayDow))
    .sort((a, b) => a.time.localeCompare(b.time))
  const logs: DoseLog[] = logsRes.data ?? []

  const now = new Date()
  const greeting = greetingFor(now.getHours())
  const firstName = (user.email?.split('@')[0] ?? 'researcher').replace(/[._-]/g, ' ')

  // Today's logged stack_item_ids — used to mark timeline entries done.
  const loggedToday = new Set(
    logs.filter(l => new Date(l.taken_at).toDateString() === now.toDateString())
      .map(l => l.stack_item_id)
  )

  return (
    <AppShell>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">
          {greeting}, <span className="text-app-accent">{firstName}</span>
        </h1>
        <p className="mt-1 text-[15px] text-app-text-mute">
          {format(now, "EEEE, MMMM d")} · {activeStack.length} active in your stack
        </p>
      </header>

      {/* ── Inline stat chips ──────────────────────────────────────── */}
      <div className="mb-7 flex flex-wrap gap-1.5">
        <StatChip label="Active stack" value={activeStack.length} dotClass="bg-app-accent" />
        <StatChip label="Today" value={todayReminders.length} dotClass="bg-app-emerald" suffix="scheduled" />
        <StatChip label="Logged" value={logs.length} dotClass="bg-app-violet" suffix="recent" />
      </div>

      {/* ── Today's Protocol (timeline) ─────────────────────────────── */}
      <section className="relative mb-6 overflow-hidden rounded-[20px] bg-app-surface p-7
        before:absolute before:inset-x-0 before:top-0 before:h-px
        before:bg-gradient-to-r before:from-transparent before:via-app-accent-mid before:to-transparent">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[16px] font-semibold">
            <Clock className="h-[18px] w-[18px] text-app-accent" />
            Today&rsquo;s Protocol
          </div>
          <div className="text-[13px] text-app-text-sec">
            <span className="font-mono tabular-nums">
              {loggedToday.size}/{todayReminders.length}
            </span>{' '}
            complete
          </div>
        </div>

        {todayReminders.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-6 w-6" />}
            title="Nothing scheduled for today"
            cta={{ href: '/reminders', label: 'Set up a reminder →' }}
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {todayReminders.map((r) => {
              const done = loggedToday.has(r.stack_item_id)
              const type = r.stack_item?.type ?? 'peptide'
              return (
                <li
                  key={r.id}
                  className="group flex cursor-pointer items-center gap-4 rounded-[14px] px-4 py-3.5 transition-colors hover:bg-app-bg"
                >
                  <span className="w-[60px] flex-shrink-0 font-mono text-[13px] font-medium tabular-nums text-app-text-mute">
                    {r.time.slice(0, 5)}
                  </span>
                  <span
                    className={[
                      'flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-app-bg',
                      done
                        ? 'bg-app-emerald shadow-[0_0_8px_rgba(52,211,153,0.35)]'
                        : 'border-2 border-app-text-mute bg-transparent',
                    ].join(' ')}
                  >
                    {done ? '✓' : ''}
                  </span>
                  <div className="flex-1">
                    <div className={`text-[14px] font-medium ${done ? 'text-app-text-mute line-through' : 'text-app-text'}`}>
                      {r.stack_item?.name ?? 'Unknown'}
                    </div>
                    {r.dose && (
                      <div className="text-[12px] text-app-text-mute">
                        <span className="font-mono tabular-nums">{r.dose}</span>
                      </div>
                    )}
                  </div>
                  <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-medium ${TYPE_BADGE[type] ?? TYPE_BADGE.peptide}`}>
                    {type}
                  </span>
                  {done ? (
                    <span className="rounded-lg bg-app-emerald-dim px-3.5 py-1.5 text-[12px] font-semibold text-app-emerald">
                      Done
                    </span>
                  ) : (
                    <Link
                      href="/log"
                      className="rounded-lg bg-app-accent px-3.5 py-1.5 text-[12px] font-semibold text-app-bg transition hover:brightness-110"
                    >
                      Log
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Two-up: Stack rack + Recent logs ───────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        {/* Vial rack */}
        <Link
          href="/stack"
          className="group relative overflow-hidden rounded-[18px] bg-app-surface p-6 transition hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-app-accent-dim">
                <Layers className="h-[19px] w-[19px] text-app-accent" />
              </span>
              <div>
                <div className="text-[14px] font-semibold">Active Stack</div>
                <div className="text-[12px] text-app-text-mute">
                  <span className="font-mono tabular-nums">{activeStack.length}</span> compounds
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-app-text-mute transition group-hover:translate-x-0.5 group-hover:text-app-text-sec" />
          </div>
          {activeStack.length === 0 ? (
            <EmptyState
              icon={<FlaskConical className="h-6 w-6" />}
              title="Nothing in your stack yet"
              cta={{ href: '/stack', label: 'Add your first compound →' }}
            />
          ) : (
            <div className="flex flex-wrap items-end gap-3.5 gap-y-4 pt-2">
              {activeStack.slice(0, 6).map((item) => (
                <div key={item.id} className="flex w-16 flex-col items-center gap-1">
                  <Vial name={item.name} dose={item.dose} unit={item.unit} size={1.1} />
                  <div className="max-w-[64px] truncate text-center text-[10px] text-app-text-sec">
                    {vialDisplayName(item.name)}
                  </div>
                </div>
              ))}
              {activeStack.length > 6 && (
                <div className="flex h-[97px] w-16 items-center justify-center rounded-lg border border-dashed border-app-border text-[12px] text-app-text-mute">
                  +{activeStack.length - 6}
                </div>
              )}
            </div>
          )}
        </Link>

        {/* Recent logs */}
        <div className="rounded-[18px] bg-app-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <BookOpen className="h-4 w-4 text-app-text-mute" />
              Recent activity
            </div>
            <Link href="/log" className="text-[12px] text-app-text-mute transition hover:text-app-accent">
              View all
            </Link>
          </div>
          {logs.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="No doses logged yet"
              cta={{ href: '/log', label: 'Log your first dose →' }}
            />
          ) : (
            <ul className="flex flex-col">
              {logs.slice(0, 5).map((log) => {
                const type = log.stack_item?.type ?? 'peptide'
                return (
                  <li
                    key={log.id}
                    className="flex items-center gap-3 border-b border-app-border-sub py-3 last:border-b-0"
                  >
                    <span
                      className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                        type === 'medication'
                          ? 'bg-app-violet'
                          : type === 'supplement'
                          ? 'bg-app-emerald'
                          : 'bg-app-accent'
                      }`}
                    />
                    <div className="flex-1 text-[13px] text-app-text-sec">
                      <span className="font-medium text-app-text">{log.stack_item?.name ?? 'Unknown'}</span>
                      {log.dose && (
                        <span className="text-app-text-mute">
                          {' '}
                          · <span className="font-mono tabular-nums">{log.dose}</span>
                        </span>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-app-text-mute">
                      {format(new Date(log.taken_at), 'MMM d, h:mm a')}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── AI quick ask (replaces three split quick-action tiles) ──── */}
      <Link
        href="/ai-chat"
        className="group flex items-center gap-2 rounded-[16px] border border-app-border-sub bg-app-surface p-1 transition hover:border-app-accent"
      >
        <span className="ml-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-app-accent-dim">
          <Sparkles className="h-[18px] w-[18px] text-app-accent" />
        </span>
        <span className="flex-1 py-2 text-[14px] text-app-text-mute">
          Ask Cortex anything about your stack…
        </span>
        <span className="mr-2 flex items-center gap-1 rounded-lg bg-app-elevated px-2.5 py-1 text-[11px] text-app-text-sec">
          <kbd className="font-app">⌘</kbd>
          <kbd className="font-app">K</kbd>
        </span>
        <span className="mr-2 flex h-9 w-9 items-center justify-center rounded-[10px] bg-app-accent transition group-hover:brightness-110">
          <ArrowUpRight className="h-4 w-4 text-app-bg" />
        </span>
      </Link>

      {/* ── Secondary quick actions (compact row) ───────────────────── */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { href: '/checker', label: 'Interaction check', sub: 'Pair any two compounds', icon: Shield },
          { href: '/log',     label: 'Log a dose',        sub: 'Record administration',  icon: BookOpen },
          { href: '/stack',   label: 'Edit stack',        sub: 'Add or remove',          icon: Layers },
        ].map(({ href, label, sub, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-[14px] bg-app-surface p-3.5 transition hover:bg-app-elevated"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-app-elevated transition group-hover:bg-app-accent-dim">
              <Icon className="h-4 w-4 text-app-text-sec group-hover:text-app-accent" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-app-text">{label}</div>
              <div className="truncate text-[11px] text-app-text-mute">{sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}

// ─── Small bits ────────────────────────────────────────────────────────

function StatChip({
  label, value, dotClass, suffix,
}: { label: string; value: number; dotClass: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[12px] bg-app-surface px-4 py-2 text-[13px] text-app-text-sec">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="font-mono text-[17px] font-bold tabular-nums text-app-text">{value}</span>
      <span>{label}</span>
      {suffix && <span className="text-app-text-mute">· {suffix}</span>}
    </div>
  )
}

function EmptyState({
  icon, title, cta,
}: { icon: React.ReactNode; title: string; cta: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="text-app-text-mute opacity-60">{icon}</span>
      <div className="text-[13px] text-app-text-mute">{title}</div>
      <Link href={cta.href} className="text-[12px] text-app-accent transition hover:brightness-125">
        {cta.label}
      </Link>
    </div>
  )
}
