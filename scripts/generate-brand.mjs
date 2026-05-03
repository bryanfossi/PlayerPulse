// Generates all brand PNG exports from the SVG source files in /public/brand/.
// Run with: node scripts/generate-brand.mjs

import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const brandDir = path.resolve(__dirname, '..', 'public', 'brand')
mkdirSync(brandDir, { recursive: true })

function svg(name) {
  return readFileSync(path.join(brandDir, `${name}.svg`))
}

const exports = [
  // Full horizontal logo
  { src: 'logo-full',         out: 'logo-full@1x',         w: 400,  h: 96  },
  { src: 'logo-full',         out: 'logo-full@2x',         w: 800,  h: 192 },

  // Stacked logo
  { src: 'logo-stacked',      out: 'logo-stacked@1x',      w: 300,  h: 300 },
  { src: 'logo-stacked',      out: 'logo-stacked@2x',      w: 600,  h: 600 },

  // Icon only
  { src: 'logo-icon',         out: 'logo-icon@1x',         w: 96,   h: 96  },
  { src: 'logo-icon',         out: 'logo-icon@2x',         w: 192,  h: 192 },

  // Reversed (light bg)
  { src: 'logo-full-reversed', out: 'logo-full-reversed@1x', w: 400, h: 96  },
  { src: 'logo-full-reversed', out: 'logo-full-reversed@2x', w: 800, h: 192 },
]

console.log('\nGenerating brand PNGs…\n')

for (const { src, out, w, h } of exports) {
  const svgBuf = svg(src)
  const outPath = path.join(brandDir, `${out}.png`)
  await sharp(svgBuf, { density: Math.round((w / 400) * 144) })
    .resize(w, h, { fit: 'fill' })
    .png()
    .toFile(outPath)
  console.log(`  ✓ ${out}.png  (${w}×${h})`)
}

console.log('\nAll brand assets written to /public/brand/\n')
