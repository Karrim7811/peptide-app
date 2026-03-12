'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  X,
  ChevronDown,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Reminder, StackItem } from '@/types'

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

const EMPTY_FORM = {
  stack_item_id: '',
  time: '08:00',
  days_of_week: [] as number[],
  dose: '',
  active: true,
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [stackItems, setStackItems] = useState<StackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [remindersRes, stackRes] = await Promise.all([
      supabase
        .from('reminders')
        .select('*, stack_item:stack_items(*)')
        .eq('user_id', user.id)
        .order('time', { ascending: true }),
      supabase
        .from('stack_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('name'),
    ])

    setReminders(remindersRes.data ?? [])
    setStackItems(stackRes.data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day],
    }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!form.stack_item_id) {
      setFormError('Please select a stack item.')
      return
    }
    if (form.days_of_week.length === 0) {
      setFormError('Please select at least one day.')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('reminders').insert({
      user_id: user.id,
      stack_item_id: form.stack_item_id,
      time: form.time,
      days_of_week: form.days_of_week,
      dose: form.dose.trim(),
      active: true,
    })

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
    fetchData()
  }

  async function handleToggle(reminder: Reminder) {
    setTogglingId(reminder.id)
    await supabase
      .from('reminders')
      .update({ active: !reminder.active })
      .eq('id', reminder.id)
    setTogglingId(null)
    fetchData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reminder?')) return
    setDeletingId(id)
    await supabase.from('reminders').delete().eq('id', id)
    setDeletingId(null)
    fetchData()
  }

  // Group reminders by stack item
  const grouped: Record<string, Reminder[]> = {}
  reminders.forEach((r) => {
    const key = r.stack_item?.name ?? r.stack_item_id
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(r)
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            Dosing Reminders
          </h1>
          <p className="text-slate-400 mt-1">
            Set reminders for each compound in your stack.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormError('')
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Reminder'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-slate-800 border border-indigo-500/30 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">New Reminder</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {formError}
              </div>
            )}

            {stackItems.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg px-4 py-3 text-sm">
                No active stack items found. Add items to your stack first.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Stack Item <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.stack_item_id}
                        onChange={(e) => setForm({ ...form, stack_item_id: e.target.value })}
                        className="appearance-none pr-8"
                        required
                      >
                        <option value="">Select an item...</option>
                        {stackItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Time <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dose Override <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.dose}
                    onChange={(e) => setForm({ ...form, dose: e.target.value })}
                    placeholder="Leave blank to use default dose from stack"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Days of Week <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          form.days_of_week.includes(day.value)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          days_of_week:
                            form.days_of_week.length === 7
                              ? []
                              : [0, 1, 2, 3, 4, 5, 6],
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {form.days_of_week.length === 7 ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Reminder
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setForm(EMPTY_FORM)
                    }}
                    className="text-slate-400 hover:text-white px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No reminders set</p>
          <p className="text-slate-500 text-sm">
            Add reminders to keep track of your dosing schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([itemName, itemReminders]) => (
            <div key={itemName} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/80">
                <h3 className="font-semibold text-white text-sm">{itemName}</h3>
              </div>
              <div className="divide-y divide-slate-700/50">
                {itemReminders.map((reminder) => (
                  <ReminderRow
                    key={reminder.id}
                    reminder={reminder}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    toggling={togglingId === reminder.id}
                    deleting={deletingId === reminder.id}
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

function ReminderRow({
  reminder,
  onToggle,
  onDelete,
  toggling,
  deleting,
}: {
  reminder: Reminder
  onToggle: (r: Reminder) => void
  onDelete: (id: string) => void
  toggling: boolean
  deleting: boolean
}) {
  // Format 24h time to 12h
  const [h, m] = reminder.time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const timeStr = `${h12}:${String(m).padStart(2, '0')} ${ampm}`

  return (
    <div className={`px-5 py-4 flex items-center gap-4 ${!reminder.active ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-white font-medium text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            {timeStr}
          </span>
          {reminder.dose && (
            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
              {reminder.dose}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((day) => (
            <span
              key={day.value}
              className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                reminder.days_of_week.includes(day.value)
                  ? 'bg-indigo-600/30 text-indigo-300'
                  : 'text-slate-600'
              }`}
            >
              {day.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle */}
        <button
          onClick={() => onToggle(reminder)}
          disabled={toggling}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
            reminder.active ? 'bg-indigo-600' : 'bg-slate-600'
          } ${toggling ? 'opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
              reminder.active ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(reminder.id)}
          disabled={deleting}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
