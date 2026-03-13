'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  Calendar,
} from 'lucide-react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { DoseLog, StackItem } from '@/types'

const EMPTY_FORM = {
  stack_item_id: '',
  taken_at: '',
  dose: '',
  notes: '',
}

function formatGroupDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d, yyyy')
}

function getLocalDatetimeDefault(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - offset * 60000)
  return localDate.toISOString().slice(0, 16)
}

export default function LogPage() {
  const [logs, setLogs] = useState<DoseLog[]>([])
  const [stackItems, setStackItems] = useState<StackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM, taken_at: getLocalDatetimeDefault() })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [logsRes, stackRes] = await Promise.all([
      supabase
        .from('dose_logs')
        .select('*, stack_item:stack_items(*)')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .limit(100),
      supabase
        .from('stack_items')
        .select('*')
        .eq('user_id', user.id)
        .order('name'),
    ])

    setLogs(logsRes.data ?? [])
    setStackItems(stackRes.data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!form.stack_item_id) {
      setFormError('Please select a stack item.')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('dose_logs').insert({
      user_id: user.id,
      stack_item_id: form.stack_item_id,
      taken_at: form.taken_at ? new Date(form.taken_at).toISOString() : new Date().toISOString(),
      dose: form.dose.trim(),
      notes: form.notes.trim(),
    })

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    setForm({ ...EMPTY_FORM, taken_at: getLocalDatetimeDefault() })
    setShowForm(false)
    setSaving(false)
    fetchData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this log entry?')) return
    setDeletingId(id)
    await supabase.from('dose_logs').delete().eq('id', id)
    setDeletingId(null)
    fetchData()
  }

  // Group logs by date
  const grouped: Record<string, DoseLog[]> = {}
  logs.forEach((log) => {
    const dateKey = format(parseISO(log.taken_at), 'yyyy-MM-dd')
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(log)
  })

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1915] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#1A8A9E]" />
            Dose Log
          </h1>
          <p className="text-[#B0AAA0] mt-1">Track every dose you take.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormError('')
            if (!showForm) {
              setForm({ ...EMPTY_FORM, taken_at: getLocalDatetimeDefault() })
            }
          }}
          className="flex items-center gap-2 bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915] font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {showForm ? null : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Log Dose'}
        </button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="bg-white border border-[#1A8A9E]/30 rounded-xl p-6">
          <h2 className="text-base font-semibold text-[#1A1915] mb-5">Log a Dose</h2>
          <form onSubmit={handleLog} className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3A3730] mb-2">
                  Compound <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.stack_item_id}
                    onChange={(e) => {
                      const item = stackItems.find((i) => i.id === e.target.value)
                      setForm({
                        ...form,
                        stack_item_id: e.target.value,
                        dose: item?.dose ?? '',
                      })
                    }}
                    className="appearance-none pr-8"
                    required
                  >
                    <option value="">Select compound...</option>
                    {stackItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.active ? '' : '(inactive)'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0AAA0] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3A3730] mb-2">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={form.taken_at}
                  onChange={(e) => setForm({ ...form, taken_at: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Dose <span className="text-[#B0AAA0]">(optional)</span>
              </label>
              <input
                type="text"
                value={form.dose}
                onChange={(e) => setForm({ ...form, dose: e.target.value })}
                placeholder="e.g. 250mcg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">
                Notes <span className="text-[#B0AAA0]">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes about this dose..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#1A8A9E] hover:bg-[#1A8A9E] disabled:opacity-50 text-[#1A1915] font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Log Dose
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormError('')
                }}
                className="text-[#B0AAA0] hover:text-[#1A1915] px-4 py-2.5 rounded-lg hover:bg-[#F2F0ED] transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-[#E8E5E0] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#1A1915]">{logs.length}</p>
            <p className="text-xs text-[#B0AAA0] mt-1">Total Logs</p>
          </div>
          <div className="bg-white border border-[#E8E5E0] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#1A1915]">
              {logs.filter((l) => isToday(parseISO(l.taken_at))).length}
            </p>
            <p className="text-xs text-[#B0AAA0] mt-1">Today</p>
          </div>
          <div className="bg-white border border-[#E8E5E0] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#1A1915]">{sortedDates.length}</p>
            <p className="text-xs text-[#B0AAA0] mt-1">Days Tracked</p>
          </div>
        </div>
      )}

      {/* Log List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#1A8A9E] animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-[#B0AAA0] mx-auto mb-3" />
          <p className="text-[#B0AAA0] mb-2">No doses logged yet</p>
          <p className="text-[#B0AAA0] text-sm">
            Start tracking by clicking &ldquo;Log Dose&rdquo; above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-4 h-4 text-[#1A8A9E]" />
                <h3 className="text-sm font-semibold text-[#3A3730]">
                  {formatGroupDate(dateKey + 'T00:00:00')}
                </h3>
                <div className="flex-1 h-px bg-[#F2F0ED]" />
                <span className="text-xs text-[#B0AAA0]">
                  {grouped[dateKey].length} {grouped[dateKey].length === 1 ? 'dose' : 'doses'}
                </span>
              </div>

              {/* Log entries */}
              <div className="space-y-2">
                {grouped[dateKey].map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    onDelete={handleDelete}
                    deleting={deletingId === log.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LogRow({
  log,
  onDelete,
  deleting,
}: {
  log: DoseLog
  onDelete: (id: string) => void
  deleting: boolean
}) {
  return (
    <div className="bg-white border border-[#E8E5E0] rounded-xl px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[#1A1915] font-medium text-sm">
            {log.stack_item?.name ?? 'Unknown'}
          </span>
          {log.dose && (
            <span className="text-xs bg-[#1A8A9E]/12 text-[#1A8A9E] px-2 py-0.5 rounded-full border border-[#1A8A9E]/30">
              {log.dose}
            </span>
          )}
          <span className="text-xs text-[#B0AAA0]">
            {format(parseISO(log.taken_at), 'h:mm a')}
          </span>
        </div>
        {log.notes && (
          <p className="text-xs text-[#B0AAA0] mt-1 truncate">{log.notes}</p>
        )}
      </div>

      <button
        onClick={() => onDelete(log.id)}
        disabled={deleting}
        className="p-1.5 text-[#B0AAA0] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
        title="Delete log"
      >
        {deleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
