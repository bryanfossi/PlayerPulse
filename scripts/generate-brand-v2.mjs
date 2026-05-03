import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pub = join(root, 'public')
const brand = join(pub, 'brand')

async function svgToPng(svgPath, outPath, width, height) {
  const svg = readFileSync(svgPath)
  await sharp(svg, { density: 300 })
    .resize(width, height, { fit: 'fill' })
    .png()
    .toFile(outPath)
  console.log(`✓  ${outPath.replace(root, '')}`)
}

// ICO builder — embeds one or two PNGs as ICO images (modern ICO with embedded PNG)
function buildIco(pngBuffers) {
  const count = pngBuffers.length
  const headerSize = 6
  const dirEntrySize = 16
  const headerBytes = headerSize + dirEntrySize * count

  // Calculate offsets
  let dataOffset = headerBytes
  const offsets = pngBuffers.map((buf) => {
    const o = dataOffset
    dataOffset += buf.length
    return o
  })

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)     // reserved
  header.writeUInt16LE(1, 2)     // type: ICO
  header.writeUInt16LE(count, 4) // number of images

  const dirs = pngBuffers.map((buf, i) => {
    const entry = Buffer.alloc(16)
    const size = i === 0 ? 16 : 32 // 16px then 32px
    entry.writeUInt8(size === 256 ? 0 : size, 0)  // width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1)  // height
    entry.writeUInt8(0, 2)          // color palette count
    entry.writeUInt8(0, 3)          // reserved
    entry.writeUInt16LE(1, 4)       // color planes
    entry.writeUInt16LE(32, 6)      // bits per pixel
    entry.writeUInt32LE(buf.length, 8)
    entry.writeUInt32LE(offsets[i], 12)
    return entry
  })

  return Buffer.concat([header, ...dirs, ...pngBuffers])
}

async function run() {
  console.log('\n── Favicon files ──────────────────────────────────')

  const faviconSvg = join(pub, 'favicon.svg')

  // Generate favicon PNGs
  const sizes = [
    { size: 16,  file: 'favicon-16x16.png' },
    { size: 32,  file: 'favicon-32x32.png' },
    { size: 180, file: 'apple-touch-icon.png' },
    { size: 192, file: 'android-chrome-192x192.png' },
    { size: 512, file: 'android-chrome-512x512.png' },
  ]

  for (const { size, file } of sizes) {
    await svgToPng(faviconSvg, join(pub, file), size, size)
  }

  // Build favicon.ico (16 + 32 combined)
  const png16 = await sharp(readFileSync(faviconSvg), { density: 300 })
    .resize(16, 16, { fit: 'fill' }).png().toBuffer()
  const png32 = await sharp(readFileSync(faviconSvg), { density: 300 })
    .resize(32, 32, { fit: 'fill' }).png().toBuffer()
  const icoBuffer = buildIco([png16, png32])
  writeFileSync(join(pub, 'favicon.ico'), icoBuffer)
  console.log(`✓  /favicon.ico (16+32 combined)`)

  console.log('\n── Brand logo files ────────────────────────────────')

  const exports = [
    { svg: 'logo-full.svg',       out: 'logo-full@1x.png',       w: 400, h: 96  },
    { svg: 'logo-full.svg',       out: 'logo-full@2x.png',       w: 800, h: 192 },
    { svg: 'logo-stacked.svg',    out: 'logo-stacked@1x.png',    w: 300, h: 280 },
    { svg: 'logo-stacked.svg',    out: 'logo-stacked@2x.png',    w: 600, h: 560 },
    { svg: 'logo-icon.svg',       out: 'logo-icon@1x.png',       w: 96,  h: 96  },
    { svg: 'logo-icon.svg',       out: 'logo-icon@2x.png',       w: 192, h: 192 },
    { svg: 'logo-full-light.svg', out: 'logo-full-light@1x.png', w: 400, h: 96  },
    { svg: 'logo-full-light.svg', out: 'logo-full-light@2x.png', w: 800, h: 192 },
  ]

  for (const { svg, out, w, h } of exports) {
    await svgToPng(join(brand, svg), join(brand, out), w, h)
  }

  console.log('\n✅  All brand assets generated.\n')
}

run().catch((err) => { console.error(err); process.exit(1) })
