# The prototype data modules are deliberately not in this folder

The V3 handoff zip (`V3AI-adaptive website reinvention.zip`, 2026-09-05) ships
seven `.js` files alongside these screens:

    library.js  vials.js  catalog.js  shop-data.js  tools-data.js  cart.js  support.js

None of them is committed here, and that is on purpose. Two reasons.

**They are stale snapshots of live data.** `library.js` and `catalog.js` are
frozen copies of `src/lib/peptide-knowledge.ts` and `src/lib/catalog.ts`;
`shop-data.js` mirrors `docs/shop-sample-payload.json`, which is itself generated
from `src/lib/shop/catalogue.ts`. Committing them creates a second source of
truth that nobody updates and somebody eventually reads.

**One of them has a history of leaking the supply chain.** The first revision of
`vials.js` carried all 27 third-party assay report codes, and its slugs embedded
them (`102107-RT_30_<code>`). Each code resolves to a public page naming the
manufacturer. Those codes were removed from the repo on 2026-09-04 and now live
server-side only, in `src/lib/vial-reports.server.ts`. The V3 revision of
`vials.js` is clean — checked before this folder was committed — but a
prototype data file is not where that guarantee should have to live.

**Read data from the TypeScript instead:**

| For | Read |
|---|---|
| Compounds, categories, grades, vials | `src/lib/catalog.ts` |
| Long-form peptide reference | `src/lib/peptide-knowledge.ts` |
| Shop products, lots, assay history | `src/lib/shop/catalogue.ts` |
| Prices, trial, CTA copy | `src/lib/pricing.ts` |
| Dose classification and counts | `src/lib/dosing.ts` |
| Order shapes and status machine | `src/lib/shop/orders/` |

The `.dc.html` screens will not run standalone in a browser without those data
modules. That is an acceptable trade: they are a **design reference to read**,
not a prototype to execute, and their inline styles — which are the actual
deliverable — are all present. The zip on the Desktop remains if a running copy
is ever needed.

`support.js` is the prototype's own runtime and is ignorable regardless.

## Which zip this came from

Three revisions exist on the OneDrive Desktop. `V3` is the newest and the only
one carrying `Tools.dc.html`, the five intelligence-layer screens:

    AI-adaptive website reinvention.zip      2026-09-05 00:14   10 screens
    v2AI-adaptive website reinvention.zip    2026-09-05 10:13   10 screens
    V3AI-adaptive website reinvention.zip    2026-09-05 15:09   11 screens  ← this one
