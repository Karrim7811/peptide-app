'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Store,
  Star,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'

// ─── Vendor Data (Verified March 2026) ───────────────────────────────────────

type VendorStatus = 'operational' | 'closed' | 'caution' | 'uncertain'

interface Vendor {
  rank: number
  name: string
  website: string
  status: VendorStatus
  statusNote: string
  rating: number
  specialties: string[]
  pricingTier: 'Budget' | 'Mid-range' | 'Premium'
  qualityBadges: string[]
  affiliate: {
    hasProgram: boolean
    commission?: string
    cookieDuration?: string
    notes?: string
    signupUrl?: string
  }
  pros: string[]
  cons: string[]
  summary: string
  verifiedDate: string
}

const VENDORS: Vendor[] = [
  {
    rank: 1,
    name: 'Swiss Chems',
    website: 'swisschems.is',
    status: 'operational',
    statusNote: 'Operational — international shipping available as of March 2026',
    rating: 4.3,
    specialties: ['BPC-157', 'TB-500', 'CJC-1295', 'Ipamorelin', 'Semaglutide', 'Tirzepatide', 'Tesamorelin'],
    pricingTier: 'Mid-range',
    qualityBadges: ['HPLC Tested', 'Mass Spec Verified', 'COAs on Product Pages', 'International Shipping', 'Crypto Payments'],
    affiliate: {
      hasProgram: true,
      commission: '20% per sale',
      cookieDuration: 'Not specified',
      notes: 'Customers get 10% off via affiliate code. No branded PPC/SEO keyword targeting allowed.',
      signupUrl: 'swisschems.is/affiliate-program/',
    },
    pros: ['Highest affiliate commission (20%)', 'HPLC + mass spec testing', 'COAs on every product page', 'Ships internationally', 'Accepts crypto'],
    cons: ['Some batch inconsistency reports', 'Mixed Trustpilot scores', 'One independent test showed <27% purity on a batch'],
    summary: 'One of the most affiliate-friendly vendors with a 20% commission. Ships internationally, rigorous testing documentation, wide catalog including GLP-1 analogs.',
    verifiedDate: 'March 2026',
  },
  {
    rank: 2,
    name: 'Limitless Life Nootropics',
    website: 'limitlesslifenootropics.com',
    status: 'operational',
    statusNote: 'Operational — 200+ affiliate network, active as of March 2026',
    rating: 4.5,
    specialties: ['BPC-157', 'TB-500', 'Selank', 'Semax', 'Epithalon', 'NAD+', 'CJC-1295', 'Ipamorelin'],
    pricingTier: 'Premium',
    qualityBadges: ['3rd-Party COAs', 'Detailed Impurity Profiles', 'Injectable + Nasal Forms', 'US-based'],
    affiliate: {
      hasProgram: true,
      commission: '15% on peptides / 12% on other products',
      cookieDuration: 'Not specified',
      notes: 'PayPal payout. Healthcare-focused network of 200+ affiliates (doctors, nurses, PAs, health coaches).',
      signupUrl: 'limitlesslifenootropics.com/affiliates/',
    },
    pros: ['Detailed COAs with impurity profiles', 'Wide selection including rare peptides', 'Strong healthcare professional network', '15% peptide commission'],
    cons: ['Higher pricing than competitors', 'Reports of delayed fulfillment during high-demand periods', 'Some backorder issues'],
    summary: 'Premium vendor known for rigorous documentation including detailed impurity profiles — more transparent than most. Strong healthcare professional affiliate network.',
    verifiedDate: 'March 2026',
  },
  {
    rank: 3,
    name: 'Pinnacle Peptide Labs',
    website: 'pinnaclepeptidelabs.com',
    status: 'operational',
    statusNote: 'Operational — Miami, FL. US cGMP-certified facility. Clean regulatory record.',
    rating: 4.6,
    specialties: ['BPC-157', 'TB-500', 'Tesamorelin', 'Retatrutide', 'GHK-Cu', 'CJC-1295', 'Ipamorelin'],
    pricingTier: 'Mid-range',
    qualityBadges: ['US cGMP-Certified', '99%+ Purity', 'Independent 3rd-Party Tested', 'US-based', 'Bulk Discounts'],
    affiliate: {
      hasProgram: true,
      commission: '20% on qualifying orders',
      cookieDuration: '60 days',
      notes: 'No medical claims or human use claims in promotions. Strong 60-day cookie window.',
      signupUrl: 'pinnaclepeptidelabs.com/affiliate-program/',
    },
    pros: ['US cGMP-certified manufacturing', '99%+ purity claims with independent verification', 'Best-in-class 60-day cookie', '20% commission', 'Bulk discounts at 5+ and 10+ vials'],
    cons: ['Newer company — less long-term track record', 'Smaller community presence vs. established vendors'],
    summary: 'Fastest-rising vendor with US cGMP-certified manufacturing and industry-best affiliate terms: 20% commission + 60-day cookie. Clean regulatory record as of March 2026.',
    verifiedDate: 'March 2026',
  },
  {
    rank: 4,
    name: 'Biotech Peptides',
    website: 'biotechpeptides.com',
    status: 'operational',
    statusNote: 'Confirmed operational — 4.8/5 on Trustpilot. CAUTION: biotechpeptides.ca is a fraudulent copycat.',
    rating: 4.7,
    specialties: ['BPC-157', 'TB-500', 'Sermorelin', 'CJC-1295', 'Ipamorelin', 'AOD-9604', 'GHK-Cu'],
    pricingTier: 'Mid-range',
    qualityBadges: ['US-Synthesized & Lyophilized', 'COAs Available', 'Same-Day Shipping', 'Fast 1–2 Day Delivery', '80+ Peptides'],
    affiliate: {
      hasProgram: false,
      notes: 'No confirmed public affiliate program found as of March 2026. Contact vendor directly to verify.',
    },
    pros: ['Highest Trustpilot rating (~4.8/5)', 'US-synthesized and lyophilized', 'Same-day shipping on orders before noon', 'Fast 1-2 day delivery', '80+ peptide catalog'],
    cons: ['No confirmed affiliate program', 'WARNING: biotechpeptides.ca is a known fraudulent copycat — only order from .com'],
    summary: 'Top-rated by customers on Trustpilot (~4.8/5). US-synthesized with fast shipping. Wide 80+ peptide catalog. No affiliate program confirmed.',
    verifiedDate: 'March 2026',
  },
  {
    rank: 5,
    name: 'Core Peptides',
    website: 'corepeptides.com',
    status: 'operational',
    statusNote: 'Operational — Orlando, FL. Rated 4.8/5 across review sources.',
    rating: 4.8,
    specialties: ['BPC-157', 'TB-500', 'Ipamorelin', 'GHK-Cu', 'Tesamorelin', 'Retatrutide', 'CJC-1295'],
    pricingTier: 'Mid-range',
    qualityBadges: ['Independent HPLC Testing', 'Mass Spec Verified', 'COAs Available', 'US-Sourced', 'Fast Shipping'],
    affiliate: {
      hasProgram: false,
      notes: 'No public affiliate program confirmed. Contact corepeptides.com directly to inquire.',
    },
    pros: ['Highest community ratings (4.8/5)', 'Independent HPLC + mass spec verification', 'Competitive pricing', 'Trusted by functional medicine practitioners', 'US-sourced'],
    cons: ['No public affiliate program', 'Less prominent marketing presence'],
    summary: 'Community\'s favorite for quality-to-price ratio. 4.8/5 rated with rigorous independent testing and US sourcing. Respected by functional medicine practitioners.',
    verifiedDate: 'March 2026',
  },
  {
    rank: 6,
    name: 'Pure Rawz',
    website: 'purerawz.co',
    status: 'operational',
    statusNote: 'Operational since 2017 — one of the widest format selections available',
    rating: 4.1,
    specialties: ['BPC-157', 'TB-500', 'Ipamorelin', 'Tesamorelin', 'Hexarelin', 'GHK-Cu', 'Melanotan II'],
    pricingTier: 'Budget',
    qualityBadges: ['Batch 3rd-Party Testing', 'HPLC Analysis', 'Multiple Forms Available', 'US-based'],
    affiliate: {
      hasProgram: true,
      commission: '7% base / 15% content creators / 20% top performers',
      cookieDuration: 'Not specified',
      notes: 'Tiered affiliate program. 15% for content-driven affiliates (blogs, email, paid ads). 20% for top performers.',
      signupUrl: 'purerawz.co/affiliate-area/',
    },
    pros: ['Widest product format selection (powder, capsule, injectable, nasal, gummy)', 'Budget pricing', 'Tiered affiliate up to 20%', 'Operating since 2017', 'Batch HPLC testing'],
    cons: ['Mixed quality consistency reports', 'Independent testing rated BPC-157 a "C" grade', 'Some shipping delay reports'],
    summary: 'Best for format variety — available in more forms than any other vendor (powder, nasal, injectable, capsule, gummy). Budget pricing and tiered affiliate up to 20%.',
    verifiedDate: 'March 2026',
  },
  {
    rank: 7,
    name: 'Blue Sky Peptide',
    website: 'blueskypeptide.com',
    status: 'operational',
    statusNote: 'Operational — established US-based vendor since ~2015',
    rating: 4.1,
    specialties: ['BPC-157', 'GHRP-2', 'Melanotan II', 'TB-500', 'Ipamorelin', 'Sermorelin'],
    pricingTier: 'Mid-range',
    qualityBadges: ['American-Made', 'Established 2015', 'Loyalty Rewards (5% back)', 'Frequent Promo Codes'],
    affiliate: {
      hasProgram: false,
      notes: 'No formal affiliate program. Has a customer loyalty program instead — 5% back in points on every purchase.',
    },
    pros: ['Long operating history (est. 2015)', 'American-made peptides', 'Frequent 35-47% off promo codes', 'Loyalty rewards program', 'Positive recent reviews'],
    cons: ['No affiliate program', 'Periods of delayed shipments reported', 'No international shipping'],
    summary: 'Established US vendor since 2015 with consistent quality and frequent discount codes. No affiliate program but has a customer loyalty program (5% back).',
    verifiedDate: 'March 2026',
  },
  {
    rank: 8,
    name: 'Peptides Warehouse',
    website: 'peptide-warehouse.com',
    status: 'operational',
    statusNote: 'Operational — US-based, positive recent reviews (Jan 2026)',
    rating: 4.0,
    specialties: ['BPC-157', 'TB-500', 'Research Peptides'],
    pricingTier: 'Mid-range',
    qualityBadges: ['Independent 3rd-Party Tested', 'COA With Every Order', 'Same-Day Fulfillment', 'Encrypted Checkout'],
    affiliate: {
      hasProgram: true,
      commission: 'Contact for details',
      cookieDuration: 'Not specified',
      notes: 'Affiliate program page exists — details require direct contact. Email vendor to inquire about commission rate.',
      signupUrl: 'peptideswarehouse.com/affiliate-program/',
    },
    pros: ['COA accompanies every order', 'Same-day fulfillment on qualifying orders', 'Encrypted checkout', 'Positive recent reviews (Jan 2026)'],
    cons: ['Limited long-term review history', 'Affiliate commission rate not publicly disclosed'],
    summary: 'Newer vendor with strong recent reviews. Every order includes its COA and same-day fulfillment is available. Affiliate program exists but commission details require direct inquiry.',
    verifiedDate: 'March 2026',
  },
  {
    rank: 9,
    name: 'Paradigm Peptides',
    website: 'paradigmpeptides.com',
    status: 'caution',
    statusNote: 'CAUTION: Received FDA warning letter (Dec 2025) and has active DOJ case (US v. Matthew Kawa, N.D. Indiana).',
    rating: 3.5,
    specialties: ['BPC-157', 'TB-500', 'Sermorelin', 'SARMs', 'Nootropics'],
    pricingTier: 'Mid-range',
    qualityBadges: ['3rd-Party Tested', 'TFA-Free', 'COAs Claimed'],
    affiliate: {
      hasProgram: false,
      notes: 'No confirmed public affiliate program found.',
    },
    pros: ['Operating since 2014 — long track record', 'TFA-free products', 'Third-party testing claimed'],
    cons: ['FDA warning letter received December 2025', 'Active DOJ case (US v. Matthew Kawa)', 'Reports of suspicious billing practices', 'ITC enforcement involvement', 'Quality consistency questioned'],
    summary: 'Long-running vendor now facing serious regulatory scrutiny — FDA warning letter (Dec 2025) and an active DOJ case. Order with caution and verify current status before purchasing.',
    verifiedDate: 'March 2026',
  },
  {
    rank: 10,
    name: 'Peptide Pros',
    website: 'peptidepros.net',
    status: 'uncertain',
    statusNote: 'Status uncertain — verify before ordering. Multiple similarly-named companies exist.',
    rating: 3.6,
    specialties: ['BPC-157', 'TB-500', 'General Research Peptides'],
    pricingTier: 'Budget',
    qualityBadges: ['Purity Testing Mentioned'],
    affiliate: {
      hasProgram: false,
      notes: 'No confirmed affiliate program found.',
    },
    pros: ['Competitive pricing', 'Some positive customer reviews'],
    cons: ['Limited transparent testing documentation', 'Multiple similarly-named sites — verify domain (peptidepros.net)', 'Limited community review history', 'Uncertain operational status'],
    summary: 'Budget-tier vendor with limited transparency. Multiple similarly-named companies exist — verify you are on peptidepros.net. Confirm current status before ordering.',
    verifiedDate: 'March 2026',
  },
]

// ─── Closed/Defunct Vendors ───────────────────────────────────────────────────

const CLOSED_VENDORS = [
  {
    name: 'Peptide Sciences',
    closedDate: 'March 6, 2026',
    notes: 'Voluntarily shut down following FDA enforcement pressure, the Amino Asylum raid, and 50+ FDA warning letters to the industry. Was considered the gold standard vendor. Do NOT order — website is defunct and impostor sites exist.',
    wasGoldStandard: true,
  },
  {
    name: 'Amino Asylum',
    closedDate: 'June 2025 (raided)',
    notes: 'FDA raided the warehouse June 2025. Website went offline. A relaunch was announced but unconfirmed as of March 2026. Previously one of the largest catalogs with an active influencer program.',
    wasGoldStandard: false,
  },
  {
    name: 'Science.bio',
    closedDate: 'January 27, 2026',
    notes: 'Permanently closed January 27, 2026. Previously relaunched after a 2022 closure; now permanently shut. Was popular for SARMs and research peptides.',
    wasGoldStandard: false,
  },
]

// ─── Industry Alert ───────────────────────────────────────────────────────────

const INDUSTRY_ALERT = {
  title: 'Major Industry Shift — March 2026',
  points: [
    'Amino Asylum warehouse raided by FDA (June 2025)',
    '50+ FDA warning letters issued to peptide vendors (September 2025)',
    'Peptide Sciences voluntarily closed (March 6, 2026)',
    'Science.bio permanently closed (January 27, 2026)',
    'RFK Jr. announced Feb 27, 2026: ~14 of 19 Category 2 restricted peptides may return to Category 1 (compounding pharmacy access with prescription)',
  ],
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-[#B0AAA0]'
          }`}
        />
      ))}
      <span className="text-sm font-semibold text-[#1A1915] ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

const STATUS_BADGE: Record<VendorStatus, { label: string; color: string; icon: React.ReactNode }> = {
  operational: {
    label: 'Operational',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  closed: {
    label: 'Closed',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  caution: {
    label: 'Caution',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  uncertain: {
    label: 'Verify First',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
}

const PRICE_COLORS: Record<string, string> = {
  Budget: 'text-emerald-400',
  'Mid-range': 'text-amber-400',
  Premium: 'text-[#1A8A9E]',
}

export default function VendorsPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState<number | null>(null)
  const operationalCount = VENDORS.filter((v) => v.status === 'operational').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-[#E8E5E0] text-[#B0AAA0] hover:text-[#1A1915] hover:border-[#D0CCC6] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1915] leading-tight">Top 10 Peptide Vendors</h1>
            <p className="text-[#B0AAA0] text-sm">Best-reviewed research peptide stores online · Verified March 2026</p>
          </div>
        </div>
      </div>

      {/* Industry Alert */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm mb-2">{INDUSTRY_ALERT.title}</p>
            <ul className="space-y-1">
              {INDUSTRY_ALERT.points.map((point, i) => (
                <li key={i} className="text-xs text-[#B0AAA0] flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 shrink-0">·</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[#B0AAA0] text-xs leading-relaxed">
          <span className="text-amber-300 font-semibold">For Research Use Only.</span> All vendors listed sell
          peptides labeled "for research purposes only." This is not an endorsement for human consumption.
          Verify vendor status independently before purchasing — the peptide vendor landscape is changing rapidly in 2026.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{operationalCount}</p>
          <p className="text-xs text-[#B0AAA0] mt-1">Operational</p>
        </div>
        <div className="bg-white border border-[#E8E5E0] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{CLOSED_VENDORS.length}</p>
          <p className="text-xs text-[#B0AAA0] mt-1">Confirmed Closed</p>
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="space-y-4">
        {VENDORS.map((vendor) => {
          const isExpanded = expanded === vendor.rank
          const statusCfg = STATUS_BADGE[vendor.status]
          return (
            <div
              key={vendor.rank}
              className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
                vendor.status === 'caution' ? 'border-orange-500/30' :
                vendor.status === 'uncertain' ? 'border-amber-500/30' :
                'border-[#E8E5E0] hover:border-[#D0CCC6]'
              }`}
            >
              {/* Main row */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Rank badge */}
                  <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] border border-[#E8E5E0] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#1A8A9E]">#{vendor.rank}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-[#1A1915]">{vendor.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <StarRating rating={vendor.rating} />
                      <span className={`text-xs font-semibold ${PRICE_COLORS[vendor.pricingTier]}`}>
                        {vendor.pricingTier}
                      </span>
                      <a
                        href={`https://${vendor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#B0AAA0] hover:text-[#1A8A9E] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {vendor.website}
                      </a>
                    </div>

                    <p className="text-sm text-[#B0AAA0] mb-3">{vendor.summary}</p>

                    {/* Quality badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {vendor.qualityBadges.map((badge) => (
                        <span key={badge} className="flex items-center gap-1 px-2 py-0.5 bg-[#F2F0ED] text-[#3A3730] text-xs rounded-lg">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          {badge}
                        </span>
                      ))}
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5">
                      {vendor.specialties.slice(0, 5).map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-[#FAFAF8] text-[#B0AAA0] text-xs rounded-md border border-[#E8E5E0]">
                          {s}
                        </span>
                      ))}
                      {vendor.specialties.length > 5 && (
                        <span className="px-2 py-0.5 text-[#B0AAA0] text-xs">+{vendor.specialties.length - 5} more</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpanded(isExpanded ? null : vendor.rank)}
                    className="flex items-center gap-1 text-xs text-[#1A8A9E] hover:text-[#1A8A9E] transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-[#E8E5E0] bg-[#FAFAF8]/30 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pros */}
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Pros
                      </p>
                      <ul className="space-y-1">
                        {vendor.pros.map((pro) => (
                          <li key={pro} className="text-sm text-[#3A3730] flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Cons */}
                    <div>
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Cons
                      </p>
                      <ul className="space-y-1">
                        {vendor.cons.map((con) => (
                          <li key={con} className={`text-sm flex items-start gap-2 ${con.startsWith('WARNING') ? 'text-red-300 font-medium' : 'text-[#3A3730]'}`}>
                            <span className="text-red-500 mt-0.5 shrink-0">−</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <p className="text-xs text-[#B0AAA0] flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Status verified: {vendor.verifiedDate} · {vendor.statusNote}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Closed Vendors Warning Section */}
      <div className="bg-white border border-red-500/20 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-red-500/20 bg-red-500/5">
          <XCircle className="w-4 h-4 text-red-400" />
          <h2 className="text-base font-semibold text-[#1A1915]">Closed / Defunct Vendors</h2>
          <span className="text-xs text-red-400 ml-auto">Do not order from these</span>
        </div>
        <div className="divide-y divide-slate-700/50">
          {CLOSED_VENDORS.map((v) => (
            <div key={v.name} className="px-6 py-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#1A1915] flex items-center gap-2 flex-wrap">
                    {v.name}
                    {v.wasGoldStandard && (
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Former Gold Standard</span>
                    )}
                    <span className="text-xs text-red-400">Closed {v.closedDate}</span>
                  </p>
                  <p className="text-xs text-[#B0AAA0] mt-0.5">{v.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-xs text-[#B0AAA0]">
          Rankings based on community reviews, quality testing, affiliate program terms, and operational history.
          Verify all vendor status independently. Last researched: March 2026.
        </p>
      </div>
    </div>
  )
}
