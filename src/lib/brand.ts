// Single source of truth for product naming.
// If/when "Peptide Cortex" is renamed (e.g. to "Staq"), change it here.
// Anywhere in the app shell that needs to render the wordmark must import
// from this file rather than hard-coding the string.

export const PRODUCT_NAME = 'Peptide Cortex'

// Compact form used inside dense UI (sidebar collapsed state, etc.).
export const PRODUCT_SHORT = 'Cortex'

// Two-character glyph used in the sidebar logo tile (e.g. "Cx", "St").
export const PRODUCT_GLYPH = 'Cx'

// Lowercase, no-space slug for OG titles, share links, support email subjects.
export const PRODUCT_SLUG = 'peptide-cortex'
