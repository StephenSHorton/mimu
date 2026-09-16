import { decompressFrames, parseGIF } from 'gifuct-js'

export type DecodedGifFrame = {
  delayMs: number
  canvas: HTMLCanvasElement
}

export type DecodedGif = {
  width: number
  height: number
  durationMs: number
  frames: DecodedGifFrame[]
}

export function decodeGif(buffer: ArrayBuffer): DecodedGif {
  const parsed = parseGIF(buffer)
  const raw = decompressFrames(parsed, true)
  const width = parsed.lsd.width
  const height = parsed.lsd.height
  const frames: DecodedGifFrame[] = []

  const full = document.createElement('canvas')
  full.width = width
  full.height = height
  const ctx = full.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')

  const patch = document.createElement('canvas')
  const patchCtx = patch.getContext('2d')
  if (!patchCtx) throw new Error('Canvas is not available')

  let saved: ImageData | null = null

  for (const frame of raw) {
    const { left, top, width: fw, height: fh } = frame.dims
    if (frame.disposalType === 3) {
      saved = ctx.getImageData(0, 0, width, height)
    }

    patch.width = fw
    patch.height = fh
    const image = patchCtx.createImageData(fw, fh)
    image.data.set(frame.patch)
    patchCtx.putImageData(image, 0, 0)
    ctx.drawImage(patch, left, top)

    const snap = document.createElement('canvas')
    snap.width = width
    snap.height = height
    const snapCtx = snap.getContext('2d')
    if (!snapCtx) throw new Error('Canvas is not available')
    snapCtx.drawImage(full, 0, 0)
    frames.push({
      delayMs: Math.max(20, frame.delay || 100),
      canvas: snap,
    })

    if (frame.disposalType === 2) {
      ctx.clearRect(left, top, fw, fh)
    } else if (frame.disposalType === 3 && saved) {
      ctx.putImageData(saved, 0, 0)
      saved = null
    }
  }

  const durationMs = frames.reduce((sum, frame) => sum + frame.delayMs, 0) || 1000
  return { width, height, durationMs, frames }
}

export function frameIndexAt(gif: DecodedGif, timeMs: number): number {
  if (gif.frames.length === 0) return 0
  const wrapped = ((timeMs % gif.durationMs) + gif.durationMs) % gif.durationMs
  let acc = 0
  for (let i = 0; i < gif.frames.length; i += 1) {
    acc += gif.frames[i].delayMs
    if (wrapped < acc) return i
  }
  return gif.frames.length - 1
}

export function timeAtFrame(gif: DecodedGif, index: number): number {
  if (!gif.durationMs) return 0
  const clamped = Math.min(Math.max(index, 0), Math.max(0, gif.frames.length - 1))
  let acc = 0
  for (let i = 0; i < clamped; i += 1) acc += gif.frames[i].delayMs
  return acc / gif.durationMs
}

export function snapTimeToFrame(gif: DecodedGif, time: number): number {
  return timeAtFrame(gif, frameIndexAt(gif, time * gif.durationMs))
}

export function stepFrame(gif: DecodedGif, time: number, delta: number): number {
  const next = frameIndexAt(gif, time * gif.durationMs) + delta
  const max = gif.frames.length - 1
  if (next < 0) return timeAtFrame(gif, max)
  if (next > max) return timeAtFrame(gif, 0)
  return timeAtFrame(gif, next)
}

export function gifFrameAt(gif: DecodedGif, timeMs: number): HTMLCanvasElement {
  if (gif.frames.length === 0) {
    const empty = document.createElement('canvas')
    empty.width = gif.width
    empty.height = gif.height
    return empty
  }
  const wrapped = ((timeMs % gif.durationMs) + gif.durationMs) % gif.durationMs
  let acc = 0
  for (const frame of gif.frames) {
    acc += frame.delayMs
    if (wrapped < acc) return frame.canvas
  }
  return gif.frames[gif.frames.length - 1].canvas
}
