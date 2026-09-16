import { applyPalette, GIFEncoder, quantize } from 'gifenc'
import { type DecodedGif } from '@/lib/gif-decode'
import { drawMeme } from '@/lib/render'
import type { MemeProject } from '@/types/meme'

function fitSize(width: number, height: number, maxEdge: number) {
  const edge = Math.max(width, height)
  if (edge <= maxEdge) return { width, height }
  const scale = maxEdge / edge
  return {
    width: Math.max(2, Math.round(width * scale)),
    height: Math.max(2, Math.round(height * scale)),
  }
}

export async function exportPng(
  media: CanvasImageSource,
  project: MemeProject,
  time: number,
): Promise<Blob> {
  const size = fitSize(project.media.width, project.media.height, 1080)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  drawMeme(ctx, media, project, time)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG export failed')
  return blob
}

export async function exportGif(
  source: CanvasImageSource | DecodedGif,
  project: MemeProject,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const size = fitSize(project.media.width, project.media.height, 480)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas is not available')

  const gif = GIFEncoder()
  let palette: number[][] | undefined

  if (isDecodedGif(source)) {
    let elapsed = 0
    for (let i = 0; i < source.frames.length; i += 1) {
      const frame = source.frames[i]
      const time = source.durationMs ? elapsed / source.durationMs : 0
      drawMeme(ctx, frame.canvas, project, time)
      const rgba = ctx.getImageData(0, 0, size.width, size.height).data
      palette ??= quantize(rgba, 256)
      gif.writeFrame(applyPalette(rgba, palette), size.width, size.height, {
        palette,
        delay: frame.delayMs,
        repeat: 0,
      })
      elapsed += frame.delayMs
      onProgress?.((i + 1) / source.frames.length)
      if (i % 3 === 2) await new Promise((resolve) => setTimeout(resolve, 0))
    }
  } else {
    const fps = 12
    const delay = Math.round(1000 / fps)
    const frameCount = Math.max(4, Math.round((project.durationMs / 1000) * fps))
    for (let i = 0; i < frameCount; i += 1) {
      const time = frameCount === 1 ? 0 : i / (frameCount - 1)
      drawMeme(ctx, source, project, time)
      const rgba = ctx.getImageData(0, 0, size.width, size.height).data
      palette ??= quantize(rgba, 256)
      gif.writeFrame(applyPalette(rgba, palette), size.width, size.height, {
        palette,
        delay,
        repeat: 0,
      })
      onProgress?.((i + 1) / frameCount)
      if (i % 3 === 2) await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  gif.finish()
  return new Blob([gif.bytes() as BlobPart], { type: 'image/gif' })
}

function isDecodedGif(value: CanvasImageSource | DecodedGif): value is DecodedGif {
  return typeof value === 'object' && value !== null && 'frames' in value && 'durationMs' in value
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function slugTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'mimu'
}
