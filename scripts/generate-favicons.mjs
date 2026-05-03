// Generates all favicon assets from /public/favicon.svg using sharp.
// Run with: node scripts/generate-favicons.mjs

import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

const svgBuffer = readFileSync(path.join(publicDir, 'favicon.svg'))

const sizes = [
  { name: 'favicon-16x16.png',          size: 16  },
  { name: 'favicon-32x32.png',          size: 32  },
  { name: 'apple-touch-icon.png',        size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

console.log('\nGenerating favicon PNGs…')
for (const { name, size } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, name))
  console.log(`  ✓ ${name}  (${size}×${size})`)
}

// Build favicon.ico — embed 16×16 and 32×32 PNGs directly.
// Modern ICO format supports embedded PNG; supported since Windows Vista.
console.log('\nBuilding favicon.ico…')
const ico16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer()
const ico32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer()

function buildIco(images) {
  const count = images.length
  const HEADER  = 6
  const DIR_ENTRY = 16

  const header = Buffer.alloc(HEADER)
  header.writeUInt16LE(0,     0) // reserved
  header.writeUInt16LE(1,     2) // image type: 1 = ICO
  header.writeUInt16LE(count, 4)

  const dirEntries = []
  let dataOffset = HEADER + count * DIR_ENTRY

  for (const { data, w, h } of images) {
    const entry = Buffer.alloc(DIR_ENTRY)
    entry.writeUInt8(w >= 256 ? 0 : w,  0) // width  (0 = 256)
    entry.writeUInt8(h >= 256 ? 0 : h,  1) // height (0 = 256)
    entry.writeUInt8(0, 2) // color count (0 = no palette)
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1,           4) // color planes
    entry.writeUInt16LE(32,          6) // bits per pixel
    entry.writeUInt32LE(data.length, 8) // image data size
    entry.writeUInt32LE(dataOffset, 12) // offset to image data
    dirEntries.push(entry)
    dataOffset += data.length
  }

  return Buffer.concat([header, ...dirEntries, ...images.map(i => i.data)])
}

const icoBuffer = buildIco([
  { data: ico16, w: 16, h: 16 },
  { data: ico32, w: 32, h: 32 },
])
writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer)
console.log('  ✓ favicon.ico  (16×16 + 32×32)')

console.log('\nDone — all favicon files written to /public\n')
