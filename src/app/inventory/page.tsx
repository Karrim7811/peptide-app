'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  X,
  Package,
  AlertTriangle,
  Refrigerator,
  Loader2,
  Trash2,
  ChevronDown,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string
  user_id: string
  name: string
  vial_size_mg: number
  quantity_remaining: number
  unit: string
  expiry_date: string | null
  notes: string | null
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

import { ALL_PEPTIDES as PEPTIDE_NAMES } from '@/lib/peptides'

const EMPTY_FORM = {
  name: '',
  vial_size_mg: '',
  quantity_remaining: '',
  unit: 'mg',
  expiry_date: '',
  notes: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExpiryColor(expiryDate: string | null): string {
  if (!expiryDate) return 'text-[#B0AAA0]'
  const now = Date.now()
  const exp = new Date(expiryDate).getTime()
  const diffDays = (exp - now) / 86_400_000
  if (diffDays < 0) return 'text-red-400'
  if (diffDays < 30) return 'text-red-400'
  if (diffDays < 90) return 'text-amber-400'
  return 'text-emerald-400'
}

function getExpiryLabel(expiryDate: string | null): string {
  if (!expiryDate) return 'No expiry set'
  const now = Date.now()
  const exp = new Date(expiryDate).getTime()
  const diffDays = Math.round((exp - now) / 86_400_000)
  const formatted = new Date(expiryDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (diffDays < 0) return `Expired ${formatted}`
  if (diffDays === 0) return `Expires today (${formatted})`
  if (diffDays === 1) return `Expires tomorrow (${formatted})`
  return `Expires ${formatted} (${diffDays}d)`
}

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  const diffDays = (new Date(expiryDate).getTime() - Date.now()) / 86_400_000
  return diffDays < 90
}

function isLowStock(item: InventoryItem): boolean {
  if (!item.vial_size_mg) return false
  return item.quantity_remaining < item.vial_size_mg * 0.2
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameRef = useRef<HTMLDivElement>(null)

  // Per-card state: which card has the "Use Dose" form open
  const [doseCardId, setDoseCardId] = useState<string | null>(null)
  const [doseAmount, setDoseAmount] = useState('')
  const [doseSaving, setDoseSaving] = useState(false)
  const [doseError, setDoseError] = useState('')

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // ── Close autocomplete on outside click ────────────────────────────────────

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (nameRef.current && !nameRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false })

    setItems(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ── Summary stats ───────────────────────────────────────────────────────────

  const expiringSoonCount = items.filter((i) => isExpiringSoon(i.expiry_date)).length
  const lowStockCount = items.filter((i) => isLowStock(i)).length

  // ── Autocomplete ────────────────────────────────────────────────────────────

  function handleNameChange(value: string) {
    setForm((f) => ({ ...f, name: value, quantity_remaining: f.quantity_remaining }))
    if (value.trim().length > 0) {
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
    setForm((f) => ({ ...f, name }))
    setShowSuggestions(false)
  }

  // ── Add vial ────────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Name is required.')
      return
    }
    if (!form.vial_size_mg || Number(form.vial_size_mg) <= 0) {
      setFormError('Vial size must be a positive number.')
      return
    }

    setSaving(true)
    setFormError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setFormError('Not authenticated.')
      setSaving(false)
      return
    }

    const vialSize = Number(form.vial_size_mg)
    const qtyRem =
      form.quantity_remaining.trim() !== '' ? Number(form.quantity_remaining) : vialSize

    const { error } = await supabase.from('inventory').insert({
      user_id: user.id,
      name: form.name.trim(),
      vial_size_mg: vialSize,
      quantity_remaining: qtyRem,
      unit: form.unit,
      expiry_date: form.expiry_date || null,
      notes: form.notes.trim() || null,
    })

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    setForm(EMPTY_FORM)
    setShowAddForm(false)
    setSaving(false)
    fetchItems()
  }

  // ── Use dose ────────────────────────────────────────────────────────────────

  function openDoseForm(id: string) {
    setDoseCardId(id)
    setDoseAmount('')
    setDoseError('')
  }

  function closeDoseForm() {
    setDoseCardId(null)
    setDoseAmount('')
    setDoseError('')
  }

  async function handleUseDose(item: InventoryItem) {
    const amt = Number(doseAmount)
    if (!doseAmount || isNaN(amt) || amt <= 0) {
      setDoseError('Enter a valid positive amount.')
      return
    }
    if (amt > item.quantity_remaining) {
      setDoseError('Amount exceeds quantity remaining.')
      return
    }

    setDoseSaving(true)
    setDoseError('')

    const newQty = Math.max(0, item.quantity_remaining - amt)
    const { error } = await supabase
      .from('inventory')
      .update({ quantity_remaining: newQty })
      .eq('id', item.id)

    setDoseSaving(false)

    if (error) {
      setDoseError(error.message)
      return
    }

    closeDoseForm()
    fetchItems()
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('inventory').delete().eq('id', id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    fetchItems()
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-[#B0AAA0] hover:text-[#1A1915] hover:bg-[#F2F0ED] rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1915] flex items-center gap-2">
              <Refrigerator className="w-6 h-6 text-[#1A8A9E]" />
              Fridge Inventory
            </h1>
            <p className="text-[#B0AAA0] mt-1">Track your peptide vials and stock levels.</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setFormError('')
          }}
          className="flex items-center gap-2 bg-[#1A8A9E] hover:bg-[#1A8A9E] text-[#1A1915] font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add Vial'}
        </button>
      </div>

      {/* ── Summary Banner ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#E8E5E0] rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-[#1A1915]">{items.length}</p>
            <p className="text-xs text-[#B0AAA0] mt-0.5">vials in fridge</p>
          </div>
          <div className="bg-white border border-[#E8E5E0] rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${expiringSoonCount > 0 ? 'text-amber-400' : 'text-[#1A1915]'}`}>
              {expiringSoonCount}
            </p>
            <p className="text-xs text-[#B0AAA0] mt-0.5">expiring soon</p>
          </div>
          <div className="bg-white border border-[#E8E5E0] rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-400' : 'text-[#1A1915]'}`}>
              {lowStockCount}
            </p>
            <p className="text-xs text-[#B0AAA0] mt-0.5">low stock</p>
          </div>
        </div>
      )}

      {/* ── Add Vial Form ── */}
      {showAddForm && (
        <div className="bg-white border border-[#1A8A9E]/30 rounded-xl p-6">
          <h2 className="text-base font-semibold text-[#1A1915] mb-5">Add New Vial</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name with autocomplete */}
              <div ref={nameRef} className="relative">
                <label className="block text-sm font-medium text-[#3A3730] mb-2">
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
                  autoComplete="off"
                  required
                  className="w-full bg-[#FAFAF8] border border-[#D0CCC6] text-[#1A1915] rounded-lg px-3 py-2.5 text-sm placeholder-[#B0AAA0] focus:outline-none focus:ring-1 focus:ring-[#1A8A9E] focus:border-[#1A8A9E]"
                />
                {showSuggestions && (
                  <ul className="absolute z-50 mt-1 w-full bg-white border border-[#D0CCC6] rounded-lg shadow-xl max-h-52 overflow-y-auto">
                    {suggestions.map((s) => (
                      <li
                        key={s}
                        onMouseDown={() => selectSuggestion(s)}
                        className="px-4 py-2.5 text-sm text-[#3A3730] hover:bg-[#1A8A9E]/40 cursor-pointer transition-colors"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-[#3A3730] mb-2">Unit</label>
                <div className="relative">
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full appearance-none bg-[#FAFAF8] border border-[#D0CCC6] text-[#1A1915] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A8A9E] focus:border-[#1A8A9E] pr-8"
                  >
                    <option value="mg">mg</option>
                    <option value="mcg">mcg</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0AAA0] pointer-events-none" />
                </div>
              </div>

              {/* Vial size */}
              <div>
                <label className="block text-sm font-medium text-[#3A3730] mb-2">
                  Vial Size ({form.unit}) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.vial_size_mg}
                  onChange={(e) => setForm((f) => ({ ...f, vial_size_mg: e.target.value }))}
                  placeholder="e.g. 5"
                  required
                  className="w-full bg-[#FAFAF8] border border-[#D0CCC6] text-[#1A1915] rounded-lg px-3 py-2.5 text-sm placeholder-[#B0AAA0] focus:outline-none focus:ring-1 focus:ring-[#1A8A9E] focus:border-[#1A8A9E]"
                />
              </div>

              {/* Quantity remaining */}
              <div>
                <label className="block text-sm font-medium text-[#3A3730] mb-2">
                  Quantity Remaining ({form.unit}){' '}
                  <span className="text-[#B0AAA0]">(defaults to vial size)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity_remaining}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity_remaining: e.target.value }))
                  }
                  placeholder={form.vial_size_mg || 'same as vial size'}
                  className="w-full bg-[#FAFAF8] border border-[#D0CCC6] text-[#1A1915] rounded-lg px-3 py-2.5 text-sm placeholder-[#B0AAA0] focus:outline-none focus:ring-1 focus:ring-[#1A8A9E] focus:border-[#1A8A9E]"
                />
              </div>

              {/* Expiry date */}
              <div>
                <label className="block text-sm font-medium text-[#3A3730] mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                  className="w-full bg-[#FAFAF8] border border-[#D0CCC6] text-[#1A1915] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A8A9E] focus:border-[#1A8A9E]"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[#3A3730] mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Batch number, storage notes…"
                rows={2}
                className="w-full bg-[#FAFAF8] border border-[#D0CCC6] text-[#1A1915] rounded-lg px-3 py-2.5 text-sm placeholder-[#B0AAA0] focus:outline-none focus:ring-1 focus:ring-[#1A8A9E] focus:border-[#1A8A9E] resize-none"
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
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Vial
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setForm(EMPTY_FORM)
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

      {/* ── Inventory Cards ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#1A8A9E] animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-12 text-center">
          <Refrigerator className="w-12 h-12 text-[#B0AAA0] mx-auto mb-3" />
          <p className="text-[#B0AAA0] mb-2">Your fridge is empty</p>
          <p className="text-[#B0AAA0] text-sm">Add your first vial using the button above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const pct = item.vial_size_mg > 0
              ? Math.min(100, (item.quantity_remaining / item.vial_size_mg) * 100)
              : 0
            const low = isLowStock(item)
            const expiryColor = getExpiryColor(item.expiry_date)
            const isDoseOpen = doseCardId === item.id
            const isConfirmDelete = confirmDeleteId === item.id

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-xl p-5 transition-all ${
                  low ? 'border-red-500/40' : 'border-[#E8E5E0]'
                }`}
              >
                {/* Card top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-[#FAFAF8]/60 p-2 rounded-lg shrink-0">
                      <Package className="w-5 h-5 text-[#1A8A9E]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[#1A1915] font-semibold text-base leading-tight">
                          {item.name}
                        </span>
                        {low && (
                          <span className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#B0AAA0] mt-0.5">
                        {item.quantity_remaining.toFixed(1)} {item.unit} remaining of{' '}
                        {item.vial_size_mg} {item.unit} vial
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => (isDoseOpen ? closeDoseForm() : openDoseForm(item.id))}
                      className="text-xs font-medium bg-[#1A8A9E]/12 hover:bg-[#1A8A9E]/40 border border-[#1A8A9E]/30 text-[#1A8A9E] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Use Dose
                    </button>
                    {isConfirmDelete ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-xs font-medium bg-red-600 hover:bg-red-500 text-[#1A1915] px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1.5 text-[#B0AAA0] hover:text-[#1A1915] hover:bg-[#F2F0ED] rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="p-1.5 text-[#B0AAA0] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete vial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="h-2 bg-[#F2F0ED] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct < 20
                          ? 'bg-red-500'
                          : pct < 50
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#B0AAA0] mt-1 text-right">
                    {pct.toFixed(0)}% remaining
                  </p>
                </div>

                {/* Expiry + notes */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className={expiryColor}>{getExpiryLabel(item.expiry_date)}</span>
                  {item.notes && (
                    <span className="text-[#B0AAA0] truncate max-w-xs">{item.notes}</span>
                  )}
                </div>

                {/* Use Dose inline form */}
                {isDoseOpen && (
                  <div className="mt-4 pt-4 border-t border-[#E8E5E0]">
                    <p className="text-sm font-medium text-[#1A1915] mb-3">
                      Use Dose — {item.name}
                    </p>
                    {doseError && (
                      <p className="text-xs text-red-400 mb-2">{doseError}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-[180px]">
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={doseAmount}
                          onChange={(e) => setDoseAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-full bg-[#FAFAF8] border border-[#D0CCC6] text-[#1A1915] rounded-lg px-3 py-2 text-sm placeholder-[#B0AAA0] focus:outline-none focus:ring-1 focus:ring-[#1A8A9E] focus:border-[#1A8A9E] pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B0AAA0] pointer-events-none">
                          {item.unit}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUseDose(item)}
                        disabled={doseSaving}
                        className="flex items-center gap-1.5 bg-[#1A8A9E] hover:bg-[#1A8A9E] disabled:opacity-50 text-[#1A1915] font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        {doseSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Deduct
                      </button>
                      <button
                        onClick={closeDoseForm}
                        className="p-2 text-[#B0AAA0] hover:text-[#1A1915] hover:bg-[#F2F0ED] rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#B0AAA0] mt-2">
                      Max: {item.quantity_remaining.toFixed(2)} {item.unit} remaining
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
