import { sampleLayer } from '@/lib/interpolation'
import type { Keyframe, Layer, MemeProject } from '@/types/meme'

export type LayerBox = {
  layer: Layer
  sample: Keyframe
  x: number
  y: number
  width: number
  height: number
}

function linesOf(text: string): string[] {
  const lines = text.split('\n').map((line) => line.trimEnd())
  return lines.length ? lines : ['']
}

function fontPx(layer: Layer, sample: Keyframe, canvasWidth: number): number {
  return Math.max(8, layer.fontSize * canvasWidth * sample.scale)
}

function measure(ctx: CanvasRenderingContext2D, layer: Layer, sample: Keyframe, canvasWidth: number) {
  const size = fontPx(layer, sample, canvasWidth)
  ctx.font = `700 ${size}px ${layer.fontFamily}`
  const lines = linesOf(layer.text)
  let width = 0
  for (const line of lines) {
    width = Math.max(width, ctx.measureText(line || ' ').width)
  }
  const lineHeight = size * 1.15
  return { width, height: lineHeight * lines.length, lineHeight, size, lines }
}

export function layerBox(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  time: number,
  canvasWidth: number,
  canvasHeight: number,
): LayerBox {
  const sample = sampleLayer(layer, time)
  const metrics = measure(ctx, layer, sample, canvasWidth)
  const cx = sample.x * canvasWidth
  const cy = sample.y * canvasHeight
  const x =
    layer.align === 'left' ? cx : layer.align === 'right' ? cx - metrics.width : cx - metrics.width / 2
  const y = cy - metrics.height / 2
  return { layer, sample, x, y, width: metrics.width, height: metrics.height }
}

export function hitTestLayer(
  ctx: CanvasRenderingContext2D,
  project: MemeProject,
  time: number,
  px: number,
  py: number,
): string | null {
  for (let i = project.layers.length - 1; i >= 0; i -= 1) {
    const box = layerBox(ctx, project.layers[i], time, ctx.canvas.width, ctx.canvas.height)
    if (box.sample.opacity <= 0.01) continue
    const pad = 10
    if (
      px >= box.x - pad &&
      px <= box.x + box.width + pad &&
      py >= box.y - pad &&
      py <= box.y + box.height + pad
    ) {
      return box.layer.id
    }
  }
  return null
}

function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  time: number,
  canvasWidth: number,
  canvasHeight: number,
  selected: boolean,
) {
  const sample = sampleLayer(layer, time)
  if (sample.opacity <= 0.01) return
  const metrics = measure(ctx, layer, sample, canvasWidth)
  const cx = sample.x * canvasWidth
  const cy = sample.y * canvasHeight

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((sample.rotation * Math.PI) / 180)
  ctx.globalAlpha = sample.opacity
  ctx.textAlign = layer.align
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${metrics.size}px ${layer.fontFamily}`
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2

  const startY = -((metrics.lines.length - 1) * metrics.lineHeight) / 2
  metrics.lines.forEach((line, index) => {
    const y = startY + index * metrics.lineHeight
    if (layer.strokeWidth > 0 && layer.kind === 'text') {
      ctx.lineWidth = metrics.size * layer.strokeWidth
      ctx.strokeStyle = layer.strokeColor
      ctx.strokeText(line, 0, y)
    }
    ctx.fillStyle = layer.kind === 'emoji' ? '#000' : layer.color
    ctx.fillText(line, 0, y)
  })

  if (selected) {
    const x =
      layer.align === 'left'
        ? -4
        : layer.align === 'right'
          ? -metrics.width - 4
          : -metrics.width / 2 - 4
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#e11d74'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])
    ctx.strokeRect(x, -metrics.height / 2 - 4, metrics.width + 8, metrics.height + 8)
  }

  ctx.restore()
}

export function drawMeme(
  ctx: CanvasRenderingContext2D,
  media: CanvasImageSource,
  project: MemeProject,
  time: number,
  options?: { selectedId?: string | null; showGuides?: boolean },
) {
  const { width, height } = ctx.canvas
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(media, 0, 0, width, height)
  for (const layer of project.layers) {
    drawLayer(ctx, layer, time, width, height, options?.selectedId === layer.id && Boolean(options.showGuides))
  }
}
