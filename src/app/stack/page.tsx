'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Layers,
  Plus,
  Trash2,
  Power,
  Loader2,
  FlaskConical,
  Pill,
  Leaf,
  X,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { StackItem } from '@/types'

import { ALL_PEPTIDES as PEPTIDE_NAMES } from '@/lib/peptides'

const TYPE_CONFIG = {
  peptide: {
    label: 'Peptide',
    icon: FlaskConical,
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  medication: {
    label: 'Medication',
    icon: Pill,
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  supplement: {
    label: 'Supplement',
    icon: Leaf,
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
}

const EMPTY_FORM = {
  name: '',
  type: 'peptide' as StackItem['type'],
  dose: '',
  unit: 'mcg',
  notes: '',
}

export default function StackPage() {
  const router = useRouter()
  const [items, setItems] = useState<StackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (nameRef.current && !nameRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNameChange(value: string) {
    setForm({ ...form, name: value })
    if (value.trim().length > 0 && form.type === 'peptide') {
      const filtered = PEPTIDE_NAMES.filter((p) =>
        p.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  function selectSuggestion(name: string) {
    setForm({ ...form, name })
    setShowSuggestions(false)
  }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('stack_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setItems(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Name is required.')
      return
    }
    setSaving(true)
    setFormError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('stack_items').insert({
      user_id: user.id,
      name: form.name.trim(),
      type: form.type,
      dose: form.dose.trim(),
      unit: form.unit,
      notes: form.notes.trim(),
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
    fetchItems()
  }

  async function handleToggle(item: StackItem) {
    setTogglingId(item.id)
    await supabase
      .from('stack_items')
      .update({ active: !item.active })
      .eq('id', item.id)
    setTogglingId(null)
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item? This will also remove associated reminders and logs.')) return
    setDeletingId(id)
    await supabase.from('stack_items').delete().eq('id', id)
    setDeletingId(null)
    fetchItems()
  }

  const activeItems = items.filter((i) => i.active)
  const inactiveItems = items.filter((i) => !i.active)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-400" />
              My Stack
            </h1>
            <p className="text-slate-400 mt-1">Manage your peptides, medications, and supplements.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormError('')
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-slate-800 border border-indigo-500/30 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">Add New Item</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div ref={nameRef} className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => {
                    if (form.name.trim().length > 0 && suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  placeholder="e.g. BPC-157"
                  required
                  autoComplete="off"
                />
                {showSuggestions && (
                  <ul className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                    {suggestions.map((s) => (
                      <li
                        key={s}
                        onMouseDown={() => selectSuggestion(s)}
                        className="px-4 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/40 cursor-pointer transition-colors"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as StackItem['type'] })}
                    className="appearance-none pr-8"
                  >
                    <option value="peptide">Peptide</option>
                    <option value="medication">Medication</option>
                    <option value="supplement">Supplement</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Dose</label>
                <input
                  type="text"
                  value={form.dose}
                  onChange={(e) => setForm({ ...form, dose: e.target.value })}
                  placeholder="e.g. 250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                <div className="relative">
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="appearance-none pr-8"
                  >
                    <option value="mcg">mcg</option>
                    <option value="mg">mg</option>
                    <option value="mL">mL</option>
                    <option value="IU">IU</option>
                    <option value="nmol">nmol</option>
                    <option value="units">units</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes about this item..."
                rows={2}
                className="resize-none"
              />
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
                    Add to Stack
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                  setFormError('')
                }}
                className="text-slate-400 hover:text-white px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">Your stack is empty</p>
          <p className="text-slate-500 text-sm">Add your first peptide, medication, or supplement above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Items */}
          {activeItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Active ({activeItems.length})
              </h2>
              <div className="space-y-3">
                {activeItems.map((item) => (
                  <StackCard
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    toggling={togglingId === item.id}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Items */}
          {inactiveItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Inactive ({inactiveItems.length})
              </h2>
              <div className="space-y-3 opacity-60">
                {inactiveItems.map((item) => (
                  <StackCard
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    toggling={togglingId === item.id}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StackCard({
  item,
  onToggle,
  onDelete,
  toggling,
  deleting,
}: {
  item: StackItem
  onToggle: (item: StackItem) => void
  onDelete: (id: string) => void
  toggling: boolean
  deleting: boolean
}) {
  const typeCfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.peptide
  const Icon = typeCfg.icon

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-4">
      <div className="bg-slate-900/50 p-2 rounded-lg mt-0.5">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-white font-medium">{item.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${typeCfg.color}`}>
            {typeCfg.label}
          </span>
          {!item.active && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
              Inactive
            </span>
          )}
        </div>
        {(item.dose || item.unit) && (
          <p className="text-sm text-slate-400">
            {item.dose} {item.unit}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-slate-500 mt-1 truncate">{item.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle */}
        <button
          onClick={() => onToggle(item)}
          disabled={toggling}
          title={item.active ? 'Deactivate' : 'Activate'}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            item.active ? 'bg-indigo-600' : 'bg-slate-600'
          } ${toggling ? 'opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
              item.active ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          title="Delete"
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
