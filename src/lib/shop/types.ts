// Shop catalogue types.
//
// Deliberately absent: any field for a Janoshik report code. Codes live in
// src/lib/vial-reports.server.ts and must never enter a shape the storefront
// reads — a published code resolves to a page naming the manufacturer. See
// decision D3 in docs/superpowers/specs/2026-09-04-peptide-shop-design.md.

/**
 * Never null. `pending` is a dated promise, `none` never lists. A missing assay
 * is a state the page renders, not an absent number it can quietly treat as zero.
 */
export type AssayState = 'assayed' | 'pending' | 'none'

/**
 * A single compound is assayed for purity. A blend is assayed by composition —
 * the lab reports milligrams of each component, and there is no one percentage
 * to quote. KLOW is why this discriminant exists.
 */
export type AssayType = 'purity' | 'composition'

export interface Component {
  name: string
  mg: number
}

export interface ShopProduct {
  slug: string
  name: string
  /** Into COMPOUNDS. Null for a blend or a non-peptide — KLOW and NAD+. */
  compoundId: string | null
  sizeValue: number
  sizeUnit: 'mg' | 'IU'
  priceCents: number
  /** Component compound ids, for a blend. Absent on a single compound. */
  blendOf?: string[]
  active: boolean
  sortOrder: number
}

export interface ShopLot {
  productSlug: string
  /** Null where the batch is real but no code has been recorded for it yet. */
  lotCode: string | null
  assayState: AssayState
  assayType: AssayType
  /** Percent. Set when assayType is 'purity' and assayState is 'assayed'. */
  purityPct: number | null
  /** Measured components. Set when assayType is 'composition'. */
  components?: Component[]
  /** What the label claims. */
  labelMg: number
  /**
   * What the lab actually found — the sum of the components for a composition
   * assay, the measured content of the single compound for a purity one. Read
   * against labelMg it is the overfill, which has run +13% to +26% across every
   * report seen so far and which nobody else in this market publishes.
   *
   * Null only where the report was never read.
   */
  measuredTotalMg: number | null
  /** YYYY-MM. Required when assayState is 'pending'. */
  assayExpectedAt: string | null
  /**
   * YYYY-MM the analysis was conducted. Distinct from mfg — it is the lab's
   * date, not the factory's — and it is what turns the lot history from a list
   * of numbers into a dated record.
   */
  assayedAt: string | null
  mfg: string | null
  exp: string | null
  shelfLife: string | null
  isCurrent: boolean
}
