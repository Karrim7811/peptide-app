// Peptide Cortex — RUO vial label generator
//
// Emits print-ready SVG artwork at true physical scale (1 SVG unit = 1 mm) for
// 2–3 mL lyophilised peptide vials, one label per entry in `peptides.json`.
// Each label's DataMatrix encodes that batch's Janoshik test report URL.
//
//   npm install && npm run build
//
// Skins: `dark` is the V4 lab identity, `light` the in-app parchment one.
// Set SKIN below, or pass one on the command line: `node generate-labels.mjs light`.
//
// The LOT / MFG / EXP block is deliberately isolated inside a marked overprint
// zone: the shell is printed once per compound, the batch data is overprinted
// per run on a thermal transfer printer. Nothing outside that zone changes
// between batches.

import bwipjs from 'bwip-js/node'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = dirname(fileURLToPath(import.meta.url))
const SKIN = process.argv[2] || 'dark'

/* ── Physical spec ──────────────────────────────────────────────────────────
   50 mm wrap (measured circumference, Ø ≈ 15.9 mm) + 3 mm overlap flap
   = 53 mm artwork, 26 mm tall. 1 mm bleed is added on export, not here.

   Height went 20 → 26 mm when the type scale grew and the reconstitution block
   was added. With the wrap fixed at 50 mm, area can only come from height.
   ►► This needs ≥26 mm of straight body below the shoulder. Check a real vial
   before committing to a print run. If it overhangs, drop TYPE one step and
   set H back to 24. */
const W = 53
const H = 26
const FLAP = 3

const BAND_Y = 20.6 // warning band top edge
const RULE_2 = 37.9 // identity | code divider

/* Type scale, in mm. Everything moved up roughly one and a half steps from the
   20 mm label; the compound name gained the most (3.4 → ~5.2 mm) because the
   identity block widened from 22 to 33 mm when LOT/MFG/EXP went inline. */
const TYPE = {
  wordmark: 2.05,
  compoundMax: 5.4,
  spec: 2.0,
  batch: 1.3,
  fieldLabel: 1.32,
  shelfLife: 1.4,
  caption: 1.3,
  warning: 2.0,
}

/* ── 2D code ────────────────────────────────────────────────────────────────
   DataMatrix ECC200, 10 mm square, encoding the batch's Janoshik report URL.

   Sizing is the binding constraint, so it is worth recording why:

   The payload drops the `https://` scheme. With it, a 57-character URL needs a
   32×32 grid, which at 10 mm is a 0.313 mm X-dimension — under the ~0.375 mm
   floor for a phone camera. Without it the payload is 49 characters and fits a
   26×26 grid: 0.385 mm, which reads. iOS Camera and Google Lens both linkify a
   bare `janoshik.com/…`, and the URL redirects to verify.janoshik.com anyway.

   DataMatrix rather than QR even though the audience is consumers with phones:
   QR mandates a 4-module quiet zone against DataMatrix's 1, costing ~3 mm of
   footprint. On a label with only 15.4 mm above the warning band that margin
   decides it. QR at a comparable X-dimension does not fit.

   Size is 12.5 mm rather than 10 mm because these slugs are not uniform: 7 of
   the 23 are long enough to force a 32×32 grid instead of 24×24 or 26×26. At
   10 mm those would be 0.313 mm — unscannable. 12.5 mm puts the worst case at
   0.391 mm and the best at 0.521 mm, so every label clears the floor with one
   code size and one print setup.

   The cost is footprint: 12.5 mm plus quiet zone fills the full height above
   the warning band, so the handling caption moved to the identity face. It
   also spans ~27% of the vial circumference, which is the practical ceiling —
   curving a 2D code further starts costing read rates on a Ø14.75 mm body.

   A shorter payload would relax all of this. See README for the redirect
   option, which would drop every symbol to 24×24 or below. */
const CODE_MM = 12.5
const CODE_X = 38.6
const CODE_Y = 1.5
const XDIM_FLOOR = 0.375 // ~phone-camera minimum for DataMatrix

/* Points at OUR domain and OUR lot number, not the testing lab's report.
   Changed 2026-09-05. The previous payload was `janoshik.com/tests/<slug>`,
   which resolves to a public page naming the client, the manufacturer and a
   supplier-prefixed batch — so every printed vial handed its buyer the supply
   chain. A label is the one surface a website redaction cannot reach.

   It is also shorter: 29 characters against 49, which is the "redirect option"
   the sizing note above anticipates. Fewer modules at the same 12.5 mm means a
   larger X-dimension and a better read rate on a curved Ø14.75 mm body. */
function codeUrl(lot) {
  return `peptidecortex.com/v/${lot}`
}

function dataMatrix(lot, fg, bg) {
  const m = bwipjs.raw({ bcid: 'datamatrix', text: codeUrl(lot) })[0]
  const n = m.pixx
  const mod = CODE_MM / n
  const quiet = mod // DataMatrix needs exactly 1 module of quiet zone
  let out =
    `<rect x="${(CODE_X - quiet).toFixed(3)}" y="${(CODE_Y - quiet).toFixed(3)}" ` +
    `width="${(CODE_MM + quiet * 2).toFixed(3)}" height="${(CODE_MM + quiet * 2).toFixed(3)}" fill="${bg}"/>`
  // pixs is row-major, origin top-left, 1 = dark
  for (let r = 0; r < m.pixy; r++) {
    for (let c = 0; c < n; c++) {
      if (m.pixs[r * n + c]) {
        // +0.008 overdraw closes hairline seams between modules in the RIP
        out +=
          `<rect x="${(CODE_X + c * mod).toFixed(3)}" y="${(CODE_Y + r * mod).toFixed(3)}" ` +
          `width="${(mod + 0.008).toFixed(3)}" height="${(mod + 0.008).toFixed(3)}" fill="${fg}"/>`
      }
    }
  }
  return { svg: out, grid: n, xdim: mod }
}

/* ── Type ───────────────────────────────────────────────────────────────────
   Both faces come from the live site (peptidecortex.com), which ships exactly
   two — there is no monospace anywhere in the brand:

     --serif: 'Cormorant Garamond', Georgia, serif   → display / wordmark
     --sans:  'Jost', sans-serif                     → small functional caps

   The site's own split is followed: serif for the wordmark and compound name
   (its numerals are serif throughout — .hero-stat-num, .pricing-price), Jost
   uppercase for every small utility line, matching the 10–11 px / 0.3em
   treatment on .nav-link and .btn-*.

   One deliberate departure: the site sets Cormorant at 300. It is a
   high-contrast Garamond and its hairlines drop out under thermal transfer
   below roughly 3 mm, so weight is 400 on the compound name and 500 on the
   1.6 mm wordmark. Tracking is preserved so the mark still reads as the brand. */
const SERIF = "'Cormorant Garamond',Georgia,serif"
const SANS = "'Jost','Century Gothic',sans-serif"
// Site rule: every purity, mg, lot code and date is monospaced (build brief,
// CROSS-CUTTING). The label follows it — these are the numbers a buyer checks.
const MONO = "'JetBrains Mono',ui-monospace,monospace"

// Mean advance per glyph, in em, for caps + figures. Used to shrink long
// compound names to fit rather than letting them run into the next zone.
const ADV_SERIF = 0.5

const SKINS = {
  /* Matches the 2026-09-05 site design (design_handoff_peptide_cortex_site).
     Paper ground, ink rules, teal reserved for the brand mark and the kicker —
     the site uses accent sparingly and structure is drawn with 1px rules. */
  paper: {
    base: '#E6E9EB', // paper
    rule: '#1A1D1F', // ink; the site's structural hairline is solid, not tinted
    ruleOpacity: 1,
    brandDot: '#1A8A9E',
    brandText: '#1A1D1F',
    // Ink, not teal. On the site teal is a kicker/accent colour and headings are
    // ink — a teal compound name would be the one element off-language.
    compound: '#1A1D1F',
    spec: '#3B4045', // ink-2
    // ink-3 (#7E878E) is the site value but goes illegible at 1.05 mm on paper,
    // so field labels step up one stop, same compromise the other skins make.
    fieldLabel: '#3B4045',
    fieldValue: '#1A1D1F',
    zoneStroke: '#1A1D1F',
    zoneOpacity: 0.45,
    codeBg: '#FAFAF8',
    codeFg: '#1A1D1F',
    meta: '#3B4045',
    // The site's footer treatment: ink band, paper text. Replaces the amber.
    warnBg: '#1A1D1F',
    warnFg: '#FAFAF8',
    writeOn: '#FAFAF8',
    writeRule: '#7E878E',
  },
  dark: {
    base: '#050505',
    rule: '#00E5FF',
    ruleOpacity: 0.35,
    brandDot: '#00E5FF',
    brandText: '#FFFFFF',
    compound: '#00E5FF',
    spec: '#B8C5D6',
    // field labels sit at 1.05 mm — the palette's faintest greys go illegible
    // at that size, so both skins step them up one stop from the web values
    fieldLabel: '#8A97AC',
    fieldValue: '#FFFFFF',
    zoneStroke: '#00E5FF',
    zoneOpacity: 0.3,
    codeBg: '#FFFFFF',
    codeFg: '#050505',
    meta: '#8A97AC',
    warnBg: '#F7B731',
    warnFg: '#050505',
    writeOn: '#F2F0ED', // --off; the one inverted patch, so a pen shows up
    writeRule: '#B0AAA0',
  },
  light: {
    base: '#FAFAF8', // --white
    rule: '#B0AAA0', // --mid
    ruleOpacity: 0.7,
    brandDot: '#1A8A9E', // --accent
    brandText: '#1A1915', // --black
    compound: '#1A8A9E',
    spec: '#3A3730', // --dark
    fieldLabel: '#3A3730', // --mid is too weak at 1.05 mm on near-white
    fieldValue: '#1A1915',
    zoneStroke: '#1A8A9E',
    zoneOpacity: 0.45,
    codeBg: '#FAFAF8',
    codeFg: '#1A1915',
    meta: '#3A3730',
    warnBg: '#1A1915',
    warnFg: '#FAFAF8',
    writeOn: '#FFFFFF', // already light, so the panel is a ruled box instead
    writeRule: '#B0AAA0',
  },
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* Empty MFG/EXP drop out entirely rather than printing a dangling "MFG" with
   nothing after it. A field with no value is worse than an absent field. */
export function batchLine(d) {
  return [`LOT ${d.lot}`, d.mfg && `MFG ${d.mfg}`, d.exp && `EXP ${d.exp}`].filter(Boolean).join('   ')
}

// Largest size at or below `max` that keeps `str` inside `maxW` mm.
function fitSize(str, maxW, max, adv, track) {
  return Math.min(max, maxW / (str.length * (adv + track)))
}

/* One compound-name size is computed across the whole set and used on every
   label, rather than letting each name grow to fill its zone. Per-label fitting
   set MOTS-c at 5.4 mm next to Tesamorelin at 3.7 mm, which reads as a
   typographic accident when the vials sit side by side. A product line should
   share one size; the longest name in the set sets it. */
export function commonNameSize(items) {
  return Math.min(...items.map((d) => fitSize(d.compound, 34.4, TYPE.compoundMax, ADV_SERIF, 0.03)))
}

export function label(skinName, d, cmpSize) {
  const s = SKINS[skinName]
  const t = (x, y, str, { size = 1.05, fill = s.meta, font = SANS, weight = 400, track = 0.06, len } = {}) =>
    `<text x="${x}" y="${y}" font-family="${font}" font-size="${size.toFixed(3)}" font-weight="${weight}" ` +
    `letter-spacing="${(track * size).toFixed(3)}" fill="${fill}"` +
    // lnum: Cormorant defaults to old-style figures, which set the 5 and 7 of a
    // name like BPC-157 below the baseline — pretty, but a misreading risk on a
    // compound identifier. tnum: keeps stacked LOT / MFG / EXP digits aligned.
    ` font-feature-settings="'lnum' 1,'tnum' 1"` +
    ` style="font-variant-numeric:lining-nums tabular-nums"` +
    (len ? ` textLength="${len}" lengthAdjust="spacing"` : '') +
    `>${esc(str)}</text>`

  const cmpTrack = 0.03

  // Purity is printed only when the linked report actually stated one. The two
  // blend reports (KLOW, GLOW) spend all three Results rows on analytes and
  // print no Purity row at all, so those labels carry a composition descriptor
  // instead — never an inferred number.
  const specLine = d.purity
    ? `${d.qty}  ·  ${d.purity} HPLC`
    : d.blend
      ? `${d.qty}  ·  ${d.blend}`
      : d.qty

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <title>Peptide Cortex RUO vial label — ${esc(d.compound)} ${esc(d.qty)} (${skinName})</title>
  <rect width="${W}" height="${H}" fill="${s.base}"/>


  <g stroke="${s.rule}" stroke-width="0.12" opacity="${s.ruleOpacity}">
    <line x1="35.6" y1="1.6" x2="35.6" y2="19.4"/>
  </g>

  <!-- ── identity block ────────────────────────────────────────────── -->
  <circle cx="${FLAP + 0.15}" cy="2.15" r="0.62" fill="${s.brandDot}"/>
  ${t(FLAP + 1.9, 2.75, 'PEPTIDE CORTEX', { size: TYPE.wordmark, fill: s.brandText, font: SERIF, weight: 500, track: 0.16 })}
  ${t(FLAP - 0.4, 8.0, d.compound, { size: cmpSize, fill: s.compound, font: SERIF, weight: 400, track: cmpTrack })}

  ${t(FLAP - 0.4, 10.9, specLine, { size: d.blend ? TYPE.spec * 0.875 : TYPE.spec, fill: s.spec, track: 0.08, font: MONO })}

  <!-- ── batch data (thermal overprint zone) ───────────────────────────
       Separated by wide spaces rather than the "·" used elsewhere. At this
       size the mid-dot version overruns the 32.6 mm column; dropping three
       glyphs buys back the width without shrinking the type or growing the
       label a second time. -->
  <rect x="2.6" y="11.5" width="31.6" height="2.3" fill="none"
        stroke="${s.zoneStroke}" stroke-width="0.1" stroke-dasharray="0.5 0.5" opacity="${s.zoneOpacity}"/>
  ${t(FLAP, 13.25, batchLine(d), { size: TYPE.batch, fill: s.fieldValue, track: 0.02, font: MONO })}

  <!-- ── reconstitution block ──────────────────────────────────────────
       A square panel in the right column, where the DataMatrix used to sit.
       14 x 14.2 mm — the code was 12.5 mm, so this is the largest square the
       column will take, and it gives two comfortable lines of handwriting
       rather than one cramped one. A fine-tip pen at a fridge, not a form.

       The label splits across two lines because 'DATE OF RECONSTITUTION' does
       not set in 14 mm at a legible size.

       The panel is a light patch on purpose: a date inked onto the dark stock
       would be invisible. On the dark skin it is the one element that inverts,
       which also marks it as the field to complete. -->
  ${t(36.6, 3.3, 'DATE OF', { size: TYPE.fieldLabel, fill: s.fieldLabel, track: 0.09 })}
  ${t(36.6, 4.7, 'RECONSTITUTION', { size: TYPE.fieldLabel, fill: s.fieldLabel, track: 0.09 })}
  <rect x="36.6" y="5.2" width="14.0" height="14.2" rx="0"
        fill="${s.writeOn}" stroke="${s.writeRule}" stroke-width="0.14"/>
  ${t(42.6, 13.4, '/', { size: 3.4, fill: s.writeRule, track: 0 })}

  <!-- handling notes take the left column under the batch zone -->
  ${t(FLAP - 0.4, 16.4, d.shelfLife, { size: TYPE.shelfLife, fill: s.compound, track: 0.04 })}
  ${t(FLAP - 0.4, 19.0, 'STORE AT −20 °C', { size: TYPE.caption, fill: s.meta, track: 0.02 })}
  <!-- ── warning band ──────────────────────────────────────────────────
       Runs the full width so it stays legible whatever rotation the vial is
       picked up at, and sits outside every variable zone so it can never be
       overprinted away. -->
  <rect x="0" y="${BAND_Y}" width="${W}" height="${H - BAND_Y}" fill="${s.warnBg}"/>
  ${t(3, BAND_Y + 3.7, 'RESEARCH USE ONLY · NOT FOR HUMAN CONSUMPTION', {
    size: TYPE.warning,
    fill: s.warnFg,
    weight: 500, // 500 is the heaviest Jost weight the brand loads
    track: 0,
    len: 47,
  })}
</svg>
`
}

/* ── Build ──────────────────────────────────────────────────────────────── */
const items = JSON.parse(readFileSync(join(OUT, 'peptides.json'), 'utf8'))
const dir = join(OUT, `labels-${SKIN}`)
mkdirSync(dir, { recursive: true })

/* Estimated set width, in mm, for a Jost caps/figures run. Used only to catch
   a line overrunning its column at build time — the type scale has changed
   several times and an overrun is silent in SVG, it just runs under the next
   element. Deliberately pessimistic so it errs toward flagging. */
const ADV_SANS = 0.62
const widthOf = (str, size, track) => str.length * (ADV_SANS + track) * size

const LEFT_COL = 34.4 // x 3.4 → 37.8
const RIGHT_COL = 13.3 // x 38.2 → 51.5

function checkFit(d, cmpSize) {
  const spec = d.purity ? `${d.qty}  ·  ${d.purity} HPLC` : d.blend ? `${d.qty}  ·  ${d.blend}` : d.qty
  return [
    ['compound', d.compound.length * (ADV_SERIF + 0.03) * cmpSize, LEFT_COL],
    ['spec', widthOf(spec, d.blend ? TYPE.spec * 0.875 : TYPE.spec, 0.08), LEFT_COL],
    ['batch', widthOf(batchLine(d), TYPE.batch, 0.02), LEFT_COL],
    ['reconLabel', widthOf('DATE OF RECONSTITUTION', TYPE.fieldLabel, 0.09), LEFT_COL],
    ['shelfLife', widthOf(d.shelfLife, TYPE.shelfLife, 0.04), LEFT_COL],
    ['caption', widthOf('STORE AT −20 °C', TYPE.caption, 0.02), RIGHT_COL],
  ]
    .filter(([, w, max]) => w > max)
    .map(([name, w, max]) => `${d.compound} ${d.qty} · ${name} ≈${w.toFixed(1)}mm > ${max}mm`)
}

const cmpSize = commonNameSize(items)
const overflows = items.flatMap((d) => checkFit(d, cmpSize))
if (overflows.length) {
  console.warn(`\n!! ${overflows.length} line(s) overrun their column:`)
  overflows.forEach((o) => console.warn('   ' + o))
  console.warn('   Reduce the relevant TYPE step or shorten the string.\n')
}

const built = items.map((d) => {
  const svg = label(SKIN, d, cmpSize)
  // Named by LOT, not slug: slugs still embed the lab report code.
  const file = `${d.lot}.svg`
  writeFileSync(join(dir, file), svg, 'utf8')
  const c = dataMatrix(d.lot, '#000', '#fff')
  return { ...d, file, svg, grid: c.grid, xdim: c.xdim }
})

writeFileSync(join(OUT, `sheet-${SKIN}.html`), sheet(built), 'utf8')
console.log(`${built.length} labels → ${dir}`)
console.log(`contact sheet → ${join(OUT, `sheet-${SKIN}.html`)}`)
const worst = built.reduce((a, b) => (a.xdim < b.xdim ? a : b))
console.log(`smallest X-dimension: ${worst.xdim.toFixed(3)} mm (${worst.grid}×${worst.grid}, ${worst.compound})`)

/* ── Contact sheet ──────────────────────────────────────────────────────── */
function sheet(rows) {
  const missing = rows.filter((r) => !r.purity).length
  const tooFine = rows.filter((r) => r.xdim < XDIM_FLOOR)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Peptide Cortex — vial labels (${SKIN})</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@200;300;400;500&display=swap" rel="stylesheet">
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;padding:44px 32px 80px;background:#141416;color:#e8e6e3;
       font:15px/1.65 'Jost','Century Gothic',system-ui,sans-serif}
  .wrap{max-width:1240px;margin:0 auto}
  h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:300;
     letter-spacing:.16em;text-transform:uppercase;color:#00E5FF;margin:0 0 6px}
  .lede{color:#8A97AC;max-width:70ch;margin:0 0 14px;font-size:14px}
  .warn{color:#F7B731;font-size:13px;margin:0 0 8px}
  .ok{color:#5ac47d;font-size:13px;margin:0 0 8px}
  .list{margin-top:30px}
  .list{display:flex;flex-direction:column;gap:14px}
  .item{display:flex;align-items:center;gap:22px;background:#1c1c1f;
        border:1px solid #2c2c31;border-radius:8px;padding:14px 18px}
  .item .art{flex:0 0 auto}
  .item svg{display:block;width:${W * 1.5}mm;height:${H * 1.5}mm;box-shadow:0 2px 12px rgba(0,0,0,.5)}
  .meta{font-size:12.5px;color:#8A97AC;min-width:0}
  .meta b{color:#e8e6e3;font-weight:400}
  .meta a{color:#00E5FF;text-decoration:none;word-break:break-all}
  .nop{color:#F7B731}
  @media print{
    body{background:#fff;padding:0}
    .wrap{max-width:none}
    h1,.lede,.warn,.meta{display:none}
    .item{border:0;background:none;padding:0;page-break-inside:avoid}
    .item svg{width:${W}mm;height:${H}mm;box-shadow:none}
    .list{gap:4mm}
  }
</style></head><body><div class="wrap">
<h1>Peptide Cortex · Vial Labels</h1>
<p class="lede">${rows.length} labels, ${SKIN} skin, shown at 1.5×. Each DataMatrix encodes that
batch's Janoshik report URL. Print styles drop everything but the artwork at true ${W} × ${H} mm.</p>
<p class="warn">${
    missing
      ? `${missing} label${missing > 1 ? 's have' : ' has'} no purity figure — the report value was not captured, so no number is printed. Fill it in <code>peptides.json</code> and rebuild.`
      : 'All labels carry a purity figure transcribed from their linked report.'
  }</p>
<p class="${tooFine.length ? 'warn' : 'ok'}">${
    tooFine.length
      ? `${tooFine.length} code${tooFine.length > 1 ? 's are' : ' is'} below the ${XDIM_FLOOR} mm X-dimension floor and may not scan: ` +
        tooFine.map((r) => `${esc(r.compound)} ${esc(r.qty)} (${r.xdim.toFixed(3)} mm)`).join(', ')
      : `All ${rows.length} codes clear the ${XDIM_FLOOR} mm X-dimension floor.`
  }</p>
<div class="list">
${rows
  .map(
    (r) => `  <div class="item">
    <div class="art">${r.svg.replace(/^[\s\S]*?<svg/, '<svg')}</div>
    <div class="meta">
      <b>${esc(r.compound)} ${esc(r.qty)}</b> · lot ${esc(r.lot)}<br>
      purity ${r.purity ? esc(r.purity) : '<span class="nop">not captured</span>'} ·
      ${r.grid}×${r.grid} grid · X-dim ${r.xdim.toFixed(3)} mm<br>
      <a href="https://${codeUrl(r.lot)}">${esc(codeUrl(r.lot))}</a>
    </div>
  </div>`
  )
  .join('\n')}
</div>
</div></body></html>`
}
