import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import gifenc from 'gifenc'

const { GIFEncoder, applyPalette, quantize } = gifenc
const outDir = join(dirname(fileURLToPath(import.meta.url)), '../public/demo')
mkdirSync(outDir, { recursive: true })

const size = 280
const frames = 18

function rgbaFrame(paint) {
  const data = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x, y)
      const i = (y * size + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = a
    }
  }
  return data
}

const gif = GIFEncoder()
let palette
for (let f = 0; f < frames; f += 1) {
  const t = f / frames
  const rgba = rgbaFrame((x, y) => {
    const petalY = ((y + t * size * 1.6) % (size + 30)) - 15
    const wave = Math.sin(x / 36 + t * Math.PI * 2) * 14
    const dx = x - (70 + ((x * 2) % 160) + wave)
    const dy = y - petalY
    if (dx * dx + dy * dy < 70) return [232, 93, 117, 255]
    return [255, 214, 231, 255]
  })
  palette ??= quantize(rgba, 64)
  gif.writeFrame(applyPalette(rgba, palette), size, size, { palette, delay: 110, repeat: 0 })
}
gif.finish()
writeFileSync(join(outDir, 'mimu-demo.gif'), gif.bytes())
console.log('Wrote public/demo/mimu-demo.gif')
