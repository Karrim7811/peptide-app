// Round-trip check: rasterise each generated label at print resolution and
// decode its DataMatrix, confirming it resolves to the right report URL.
import { readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
import { readBarcodes, prepareZXingModule } from 'zxing-wasm/reader'

const wasmBinary = readFileSync('node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')
await prepareZXingModule({ overrides: { wasmBinary }, fireImmediately: true })

const items = JSON.parse(readFileSync('peptides.json', 'utf8'))
const DPI = 600 // realistic thermal-transfer / digital label resolution
let pass = 0, fail = []

for (const d of items) {
  const svg = readFileSync(`labels-dark/${d.slug}.svg`)
  const png = await sharp(Buffer.from(svg), { density: DPI }).png().toBuffer()
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const res = await readBarcodes(
    { data: new Uint8ClampedArray(data), width: info.width, height: info.height },
    { formats: ['DataMatrix'], tryHarder: true }
  )
  const got = res[0]?.text
  const want = `janoshik.com/tests/${d.slug}`
  if (got === want) pass++
  else fail.push(`${d.compound} ${d.qty}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`)
}

console.log(`decoded ${pass}/${items.length} at ${DPI} dpi`)
fail.forEach(f => console.log('  FAIL ' + f))
