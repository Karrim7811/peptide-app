// Print imposition — a full sheet of labels, ready to send to a press.
//
//   node make-sheet.mjs paper JA-102107 JA-70681      # alternating columns
//   node make-sheet.mjs paper JA-102107               # one lot, whole sheet
//
// Emits a vector PDF at true physical size. PDF rather than PNG because the
// artwork is vector to begin with and a 1200 dpi A4 raster is ~100 MB for no
// gain — a press rips the vector at whatever resolution it actually runs.
//
// The grid matches the layout already in use in the Liene app (aog.liene):
// 2 across, 7 down, 14 to a page. That file is a PerillaDoc archive whose
// payload is proprietary binary, so it can be read but not written — this
// produces the same imposition by a route we control.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = dirname(fileURLToPath(import.meta.url))
const SKIN = process.argv[2] || 'paper'
const LOTS = process.argv.slice(3)

if (LOTS.length === 0) {
  console.error('usage: node make-sheet.mjs <skin> <lot> [lot...]')
  process.exit(1)
}

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p))

if (!CHROME) {
  console.error('Chrome not found — needed to rasterise the sheet')
  process.exit(1)
}

/* A4, because the Liene sheet's content area (~106 x 182 mm) fits it with room
   for the printer's unprintable margin. 14 labels: 2 x 7.

   The 4 mm gutter is a guess at what the existing sheet uses — the thumbnail
   suggests roughly that. Check one printed sheet against the die before
   committing to a run; if the stock is pre-cut this must match the die exactly,
   and if it is not, any gutter that leaves scissor room will do. */
const PAGE_W = 210
const PAGE_H = 297
const LABEL_W = 53
const LABEL_H = 26
const COLS = 2
const ROWS = 7
const GUTTER_X = 4
const GUTTER_Y = 4

const gridW = COLS * LABEL_W + (COLS - 1) * GUTTER_X
const gridH = ROWS * LABEL_H + (ROWS - 1) * GUTTER_Y
const originX = (PAGE_W - gridW) / 2
const originY = (PAGE_H - gridH) / 2

const svgFor = (lot) => {
  const file = join(OUT, `labels-${SKIN}`, `${lot}.svg`)
  if (!existsSync(file)) {
    console.error(`no artwork for ${lot} — run generate-labels.mjs ${SKIN} first`)
    process.exit(1)
  }
  // Strip the XML declaration if present so it can be inlined in HTML.
  return readFileSync(file, 'utf8').replace(/^<\?xml[^>]*\?>\s*/, '')
}

const art = LOTS.map(svgFor)

let cells = ''
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c
    // Cycle through the lots given, so two lots alternate by column and one
    // lot fills the page.
    const svg = art[i % art.length]
    const x = originX + c * (LABEL_W + GUTTER_X)
    const y = originY + r * (LABEL_H + GUTTER_Y)
    cells += `<div class="cell" style="left:${x}mm;top:${y}mm">${svg}</div>\n`
  }
}

const html = `<!doctype html><meta charset="utf-8">
<style>
  @page { size: ${PAGE_W}mm ${PAGE_H}mm; margin: 0 }
  html,body { margin:0; padding:0; background:#fff }
  .cell { position:absolute; width:${LABEL_W}mm; height:${LABEL_H}mm }
  .cell svg { width:100%; height:100%; display:block }
  /* Hairline crop marks at the corners of each label. Removed by the trim, and
     the only way to line a hand-cut sheet up without measuring. */
  .cell::after {
    content:''; position:absolute; inset:-0.6mm;
    border:0.08mm dashed rgba(0,0,0,.35); pointer-events:none;
  }
</style>
${cells}`

const tmp = join(OUT, '.sheet.html')
const pdf = join(OUT, `sheet-${SKIN}-${LOTS.join('-')}.pdf`)
writeFileSync(tmp, html, 'utf8')

execFileSync(
  CHROME,
  [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdf}`,
    `file:///${tmp.replace(/\\/g, '/')}`,
  ],
  { stdio: 'ignore' },
)

rmSync(tmp, { force: true })
console.log(`→ ${pdf}`)
console.log(`  ${COLS} x ${ROWS} = ${COLS * ROWS} labels · ${LABEL_W} x ${LABEL_H} mm each`)
console.log(`  lots: ${LOTS.join(', ')}${LOTS.length > 1 ? ' (alternating by column)' : ''}`)
console.log(`  A4, ${GUTTER_X} mm gutters — verify against your die before a full run`)
