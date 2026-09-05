// Rasterise every generated label SVG to PNG at print resolution.
//
//   node export-png.mjs            # dark skin, 1200 dpi
//   node export-png.mjs light      # light skin, 1200 dpi
//   node export-png.mjs dark 2400  # higher, if a printer insists
//
// Rendering goes through headless Chrome rather than sharp/librsvg on purpose:
// the artwork calls for Cormorant Garamond and Jost as webfonts, and librsvg
// will not fetch them — it silently substitutes a fallback and the label looks
// subtly wrong. Chrome loads the real faces from Google Fonts, which is what
// every visual check in this project was done against.
//
// 1200 dpi is the default because it is already at or above what label presses
// image at (most run 600–1200). Higher numbers grow the file without adding
// anything a press can reproduce.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = dirname(fileURLToPath(import.meta.url))
const SKIN = process.argv[2] || 'dark'
const DPI = Number(process.argv[3] || 1200)

const MM_W = 53
const MM_H = 26
const PX_W = Math.round((MM_W / 25.4) * DPI)
const PX_H = Math.round((MM_H / 25.4) * DPI)

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p))

if (!CHROME) {
  console.error('Could not find Chrome. Rendering needs it for the webfonts — see the note at the top of this file.')
  process.exit(1)
}

const srcDir = join(OUT, `labels-${SKIN}`)
const dstDir = join(OUT, `png-${SKIN}-${DPI}dpi`)
const tmpDir = join(OUT, '.png-tmp')
mkdirSync(dstDir, { recursive: true })
mkdirSync(tmpDir, { recursive: true })

const files = readdirSync(srcDir).filter((f) => f.endsWith('.svg'))
console.log(`${files.length} labels · ${SKIN} · ${DPI} dpi · ${PX_W}×${PX_H} px each`)

let done = 0
for (const f of files) {
  const svg = readFileSync(join(srcDir, f), 'utf8')
    // strip the fixed mm dimensions so the SVG scales to the viewport
    .replace(/width="[\d.]+mm"\s+height="[\d.]+mm"/, 'width="100%" height="100%"')

  const html = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@200;300;400;500&display=block" rel="stylesheet">
<style>html,body{margin:0;padding:0;overflow:hidden}
svg{display:block;width:${PX_W}px;height:${PX_H}px}</style>
${svg}`

  const tmp = join(tmpDir, f.replace(/\.svg$/, '.html'))
  writeFileSync(tmp, html, 'utf8')

  execFileSync(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${PX_W},${PX_H}`,
      // display:block on a webfont means Chrome waits rather than painting a
      // fallback first; the budget gives that fetch room to finish
      '--virtual-time-budget=8000',
      `--screenshot=${join(dstDir, f.replace(/\.svg$/, '.png'))}`,
      `file:///${tmp.replace(/\\/g, '/')}`,
    ],
    { stdio: 'pipe' }
  )
  done++
  process.stdout.write(`\r  rendered ${done}/${files.length}`)
}

/* Chrome writes no pHYs chunk, so the PNG carries no physical size and every
   print tool falls back to 72 dpi — which would set this 53 mm label at 883 mm.
   Stamping the real density is the difference between 'print at 100%' working
   and someone having to scale by eye. Written by hand because the only other
   way is another image dependency for four numbers. */
function stampDpi(file, dpi) {
  const buf = readFileSync(file)
  if (buf.includes(Buffer.from('pHYs'))) return
  const ppm = Math.round(dpi / 0.0254) // pixels per metre
  const data = Buffer.alloc(9)
  data.writeUInt32BE(ppm, 0)
  data.writeUInt32BE(ppm, 4)
  data.writeUInt8(1, 8) // unit: metres
  const type = Buffer.from('pHYs')
  const chunk = Buffer.concat([
    Buffer.alloc(4), type, data, Buffer.alloc(4),
  ])
  chunk.writeUInt32BE(data.length, 0)
  chunk.writeUInt32BE(crc32(Buffer.concat([type, data])) >>> 0, chunk.length - 4)
  // pHYs must precede IDAT; the IHDR chunk is always the first, 25 bytes in.
  const at = 8 + 25
  writeFileSync(file, Buffer.concat([buf.subarray(0, at), chunk, buf.subarray(at)]))
}

let CRC_TABLE = null
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      CRC_TABLE[n] = c
    }
  }
  let c = -1
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return c ^ -1
}

for (const f of readdirSync(dstDir)) stampDpi(join(dstDir, f), DPI)

rmSync(tmpDir, { recursive: true, force: true })

const total = readdirSync(dstDir).reduce((n, f) => n + statSync(join(dstDir, f)).size, 0)
console.log(`\n→ ${dstDir}`)
console.log(`  ${done} PNGs, ${(total / 1024 / 1024).toFixed(1)} MB total`)
