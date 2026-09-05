# Prompt for Claude Code — integrate the design build

Audited `AI-adaptive website reinvention.zip` (`design_handoff_peptide_cortex_site/`,
2026-09-05) against the repo on 2026-09-05.

The design work is good. The README already says the right things — recreate in
Next.js, don't ship the HTML, the TS files are source of truth. Three things need
correcting, one of them serious.

---

```
Integrate the design handoff in design_handoff_peptide_cortex_site/ into this
Next.js 14 app. Recreate the screens as App Router pages using the existing
src/lib modules and server actions. Do not ship the prototype HTML.

Screens in the handoff: Home, Auth, App (the signed-in bench shell), Shop,
Product, Cart, Checkout, Zelle, Order, Legal.


═══ 1. THE ONE THING THAT MUST NOT HAPPEN ═══

DO NOT COPY, IMPORT, OR PORT vials.js. It is stale and it reintroduces a leak
that was closed yesterday.

  It carries all 27 Janoshik reportCode values.
  Its slugs still embed those codes: '102107-RT_30_D14D7EHWHFH9'.
  App.dc.html and Home.dc.html import it, and .slug is read 12 times.

  The repo's src/lib/catalog.ts now has ZERO reportCode fields and slugs like
  '102107-RT_30'. The codes live server-side only, in
  src/lib/vial-reports.server.ts, and must never reach a client bundle — a
  published code resolves to a page naming the manufacturer.

  Read batch data from src/lib/catalog.ts (VIALS) and src/lib/shop/catalogue.ts.
  Never from the prototype's .js copies.

  The same applies to library.js and catalog.js — they are prototype-only
  snapshots. src/lib/catalog.ts and src/lib/peptide-knowledge.ts are the source
  of truth, and shop-data.js mirrors docs/shop-sample-payload.json which is
  itself generated from src/lib/shop/catalogue.ts.

  src/lib/vial-reports.test.ts already fails if a code re-enters the catalog.
  After integrating, also confirm nothing reached the bundle:

      npm run build
      grep -rlE "D14D7EHWHFH9|XAKRSW4WN85N|VJUDHK6MDGT3" .next/static
      # must return nothing


═══ 2. SAY PEPTIDES, NOT COMPOUNDS ═══

The prototype's user-facing copy says "compound" in several places, including the
Home hero and "The shop · seven compounds". Change every user-visible instance to
"peptide". The code calls them compounds internally; that is a naming artefact
and should not surface.

  Three of the 124 genuinely are NOT peptides — NAD+ (a dinucleotide coenzyme),
  Vitamin B12 (a corrinoid), L-Carnitine (an amino-acid derivative). Each should
  say so on its own page rather than the whole library being renamed around
  them.

  Also fix "No vials of this compound on file." A vial is a container; those
  records are tested batches. "No tested batches on file."


═══ 3. WHAT NOT TO TOUCH ═══

These are built, tested and working. Wire the UI to them; do not reimplement.

  src/lib/shop/          catalogue, pricing, types
  src/lib/shop/orders/   status machine, totals, references, age gate, admin guard
  src/lib/shop/payments/ provider interface, Zelle, BTCPay, signature verification
  src/app/shop/actions.ts        createOrder
  src/app/admin/orders/          the admin queue and its server actions
  src/app/api/shop/btcpay-webhook/
  supabase/shop_*.sql

  AND ABSOLUTELY NOT: src/lib/stripe.ts or src/app/api/stripe/*. That is the
  subscription business on a separate account and this work must not touch it.

  Checkout calls createOrder(lines, ship, shippingMethodId, providerId). It
  returns { orderId, paymentReference, intent }. intent.redirectUrl means send
  the buyer there (BTCPay); intent.instructions means render them in the page
  (Zelle). See docs/BACKEND-CONTRACT.md §13.


═══ 4. THINGS TO VERIFY AS YOU BUILD ═══

The prototype got these right — keep them right:

  - No sort or rank by price per mg anywhere.
  - KLOW has no per-mg figure; its component table stands in for one.
  - No "verify" link, badge or QR in the shop.
  - THE MATH's output stays third-person. No "your dose", no imperatives.

Check these, which I could not fully confirm from the prototype:

  - Order.dc.html must cover SEVEN states: awaiting payment (Zelle), payment
    confirming (crypto), paid/preparing, shipped with tracking, delivered,
    expired, cancelled/refunded. I found six; confirm "paid, preparing" and
    "refunded" exist and add them if not.
  - "Awaiting payment" must not read as an error — no red, no warning icon, no
    spinner. It is the normal Zelle state and clears when payment is matched by
    hand.
  - Pending products must show their expected month AND "This product ships with
    no published assay until then."


═══ 5. OUT OF SCOPE FOR THIS PASS ═══

The handoff explicitly does not cover the interaction checker, bloodwork, AI
chat, the protocol planner, the dosing reference or the vial scanner. Leave the
existing implementations alone — do not delete or restyle them to match.

  InteractionCheck and BloodworkOverlay are live inside the dashboard today. If
  the new bench shell replaces the old dashboard, those must still be reachable
  or the app loses its most valuable features. Verify they still open after the
  shell changes.


═══ 6. DONE MEANS ═══

  npm test          all passing (203 at last count)
  npx tsc --noEmit  clean
  npm run build     succeeds
  grep for report codes in .next/static returns nothing

Commit in small steps, one screen at a time, so a regression is bisectable.
```

---

## Also worth knowing

The `[ $ TBC ]` shipping placeholders in the prototype are correct — those prices
are genuinely unset and `orderTotals` throws until they are. Do not invent them
to make checkout run.

The intelligence layer — interaction checker, bloodwork, protocol planner, dosing
reference, vial scanner — has no design yet. That is the larger half of the
product and needs its own pass.
