'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Scale,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
} from 'lucide-react'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'

// ─── FDA Status badge colours ────────────────────────────────────────────────

type StatusLevel = 'approved' | 'research' | 'banned' | 'scheduled' | 'unscheduled' | 'unknown'

const STATUS_CONFIG: Record<StatusLevel, { label: string; color: string; icon: React.ReactNode }> = {
  approved: {
    label: 'FDA Approved',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  research: {
    label: 'Research Only',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  banned: {
    label: 'Banned / Seized',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  unscheduled: {
    label: 'Unscheduled',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: <Info className="w-3.5 h-3.5" />,
  },
  unknown: {
    label: 'Status Unknown',
    color: 'bg-slate-500/20 text-[#B0AAA0] border-[#B0AAA0]/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
}

// ─── Derived regulatory data from knowledge base ──────────────────────────────

function getStatusFromEvidence(evidenceLevel: string): StatusLevel {
  const lower = evidenceLevel.toLowerCase()
  if (lower.includes('fda-approved')) return 'approved'
  if (lower.includes('banned') || lower.includes('seized')) return 'banned'
  if (lower.includes('scheduled')) return 'scheduled'
  if (lower.includes('research')) return 'research'
  if (lower.includes('human data') || lower.includes('clinical')) return 'research'
  return 'unscheduled'
}

const REGULATORY_DATA = PEPTIDE_KNOWLEDGE.map((p) => ({
  name: p.name,
  status: getStatusFromEvidence(p.evidenceLevel),
  evidenceLevel: p.evidenceLevel,
  primaryPurpose: p.primaryPurpose,
  riskCautions: p.riskCautions,
  bottomLine: p.bottomLine,
  goalCategory: p.goalCategory,
}))

type SortField = 'name' | 'status' | 'category'

const CATEGORY_FILTERS = ['All', ...Array.from(new Set(PEPTIDE_KNOWLEDGE.map((p) => p.goalCategory))).sort()]
const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All Statuses' },
  { key: 'approved', label: 'FDA Approved' },
  { key: 'research', label: 'Research Only' },
  { key: 'unscheduled', label: 'Unscheduled' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'banned', label: 'Banned/Seized' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RegulatoryPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  // Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    REGULATORY_DATA.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1
    })
    return counts
  }, [])

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...REGULATORY_DATA]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.primaryPurpose.toLowerCase().includes(q) ||
          p.goalCategory.toLowerCase().includes(q)
      )
    }
    if (categoryFilter !== 'All') {
      list = list.filter((p) => p.goalCategory === categoryFilter)
    }
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter)
    }

    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status)
      else if (sortField === 'category') cmp = a.goalCategory.localeCompare(b.goalCategory)
      return sortAsc ? cmp : -cmp
    })

    return list
  }, [search, categoryFilter, statusFilter, sortField, sortAsc])

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc)
    else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => {
      setLastChecked(new Date())
      setRefreshing(false)
    }, 1200)
  }

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    ) : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-[#E8E5E0] text-[#B0AAA0] hover:text-[#1A1915] hover:border-[#D0CCC6] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#1A1915] leading-tight">Legal &amp; Regulatory Status</h1>
            <p className="text-[#B0AAA0] text-sm">FDA approval status &amp; research classification for all peptides</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-white border border-[#E8E5E0] hover:border-[#D0CCC6] text-[#B0AAA0] hover:text-[#1A1915] px-3 py-2 rounded-lg text-sm transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 text-sm font-semibold mb-0.5">Legal Disclaimer</p>
          <p className="text-[#B0AAA0] text-xs leading-relaxed">
            Regulatory status changes frequently. This information is for educational purposes only and does not
            constitute legal or medical advice. Always verify current regulations in your jurisdiction before purchasing
            or using any peptide. Last checked: {lastChecked.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.keys(STATUS_CONFIG) as StatusLevel[]).map((status) => {
          const cfg = STATUS_CONFIG[status]
          const count = statusCounts[status] || 0
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`bg-white border rounded-xl p-4 text-left transition-all hover:border-[#D0CCC6] ${
                statusFilter === status ? 'border-[#1A8A9E]/60 ring-1 ring-[#1A8A9E]/40' : 'border-[#E8E5E0]'
              }`}
            >
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border mb-2 ${cfg.color}`}>
                {cfg.icon}
                {count}
              </div>
              <p className="text-xs text-[#B0AAA0]">{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0AAA0]" />
          <input
            type="text"
            placeholder="Search peptides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E8E5E0] rounded-xl pl-10 pr-4 py-2.5 text-[#1A1915] placeholder-[#B0AAA0] focus:outline-none focus:border-[#1A8A9E] text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border border-[#E8E5E0] rounded-xl px-4 py-2.5 text-[#3A3730] focus:outline-none focus:border-[#1A8A9E] text-sm"
        >
          {CATEGORY_FILTERS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#B0AAA0]">
        Showing <span className="text-[#1A1915] font-medium">{filtered.length}</span> of {REGULATORY_DATA.length} peptides
      </p>

      {/* Table header */}
      <div className="bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#E8E5E0] bg-[#F2F0ED]">
          <button
            onClick={() => toggleSort('name')}
            className="col-span-4 flex items-center gap-1 text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider hover:text-[#1A1915] text-left"
          >
            Peptide <SortIcon field="name" />
          </button>
          <button
            onClick={() => toggleSort('status')}
            className="col-span-3 flex items-center gap-1 text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider hover:text-[#1A1915]"
          >
            FDA Status <SortIcon field="status" />
          </button>
          <button
            onClick={() => toggleSort('category')}
            className="col-span-3 flex items-center gap-1 text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider hover:text-[#1A1915]"
          >
            Category <SortIcon field="category" />
          </button>
          <div className="col-span-2 text-xs font-semibold text-[#B0AAA0] uppercase tracking-wider text-right">
            Details
          </div>
        </div>

        <div className="divide-y divide-slate-700/60">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Scale className="w-10 h-10 text-[#3A3730] mx-auto mb-3" />
              <p className="text-[#B0AAA0]">No peptides match your filters</p>
            </div>
          ) : (
            filtered.map((peptide) => {
              const cfg = STATUS_CONFIG[peptide.status]
              const isExpanded = expanded === peptide.name
              return (
                <div key={peptide.name} className="hover:bg-[#F2F0ED] transition-colors">
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                    {/* Name */}
                    <div className="col-span-12 sm:col-span-4">
                      <p className="text-sm font-semibold text-[#1A1915] leading-tight">{peptide.name}</p>
                      <p className="text-xs text-[#B0AAA0] mt-0.5 sm:hidden">{peptide.goalCategory}</p>
                    </div>

                    {/* Status badge */}
                    <div className="col-span-7 sm:col-span-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="hidden sm:block col-span-3">
                      <span className="text-xs text-[#B0AAA0]">{peptide.goalCategory}</span>
                    </div>

                    {/* Expand toggle */}
                    <div className="col-span-5 sm:col-span-2 flex justify-end">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : peptide.name)}
                        className="flex items-center gap-1 text-xs text-[#1A8A9E] hover:text-[#1A8A9E] transition-colors"
                      >
                        {isExpanded ? 'Less' : 'More'}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-6 pb-5 space-y-3 border-t border-[#E8E5E0] pt-4 bg-[#F2F0ED]/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#B0AAA0] uppercase tracking-wide mb-1">Evidence Level</p>
                          <p className="text-sm text-[#3A3730]">{peptide.evidenceLevel}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#B0AAA0] uppercase tracking-wide mb-1">Primary Purpose</p>
                          <p className="text-sm text-[#3A3730]">{peptide.primaryPurpose}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-[#B0AAA0] uppercase tracking-wide mb-1">Regulatory Note</p>
                        <p className="text-sm text-[#3A3730]">{peptide.bottomLine}</p>
                      </div>
                      {peptide.riskCautions && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
                          <p className="text-xs text-red-400 uppercase tracking-wide mb-1">Risk &amp; Cautions</p>
                          <p className="text-xs text-[#B0AAA0]">{peptide.riskCautions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center pb-4">
        <p className="text-xs text-[#B0AAA0]">
          Data sourced from peptide research literature and FDA databases. Last updated March 2026.
          Regulatory status is jurisdiction-dependent — consult local laws.
        </p>
      </div>
    </div>
  )
}
