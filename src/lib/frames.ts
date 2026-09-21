import {
  frameIndexAt,
  snapTimeToFrame,
  timeAtFrame,
  type DecodedGif,
} from '@/lib/gif-decode'
import type { Keyframe, Layer } from '@/types/meme'

/** Still exports use 12 fps, matching exportGif. */
export const STILL_EXPORT_FPS = 12

export function stillFrameCount(durationMs: number): number {
  return Math.max(4, Math.round((durationMs / 1000) * STILL_EXPORT_FPS))
}

export function stillTimeAtFrame(durationMs: number, index: number): number {
  const count = stillFrameCount(durationMs)
  const clamped = Math.min(count - 1, Math.max(0, index))
  return clamped / count
}

export function stillFrameAtTime(durationMs: number, time: number): number {
  const count = stillFrameCount(durationMs)
  if (time >= 1) return count - 1
  return Math.min(count - 1, Math.max(0, Math.floor(time * count)))
}

/** Playhead / sample time at the start of the discrete source frame. */
export function discreteTime(
  time: number,
  durationMs: number,
  gif: DecodedGif | null,
): number {
  const t = Math.min(1, Math.max(0, time))
  if (gif) return snapTimeToFrame(gif, t)
  return stillTimeAtFrame(durationMs, stillFrameAtTime(durationMs, t))
}

export function discreteFrameIndex(
  time: number,
  durationMs: number,
  gif: DecodedGif | null,
): number {
  if (gif) return frameIndexAt(gif, time * gif.durationMs)
  return stillFrameAtTime(durationMs, time)
}

export function discreteFrameCount(durationMs: number, gif: DecodedGif | null): number {
  return gif?.frames.length ?? stillFrameCount(durationMs)
}

export function laterFrame(
  fromTime: number,
  steps: number,
  durationMs: number,
  gif: DecodedGif | null,
): number {
  if (gif) {
    const index = frameIndexAt(gif, fromTime * gif.durationMs)
    return timeAtFrame(gif, Math.min(gif.frames.length - 1, index + steps))
  }
  const index = stillFrameAtTime(durationMs, fromTime)
  return stillTimeAtFrame(durationMs, index + steps)
}

export function snapKeyframeTime(
  time: number,
  durationMs: number,
  gif: DecodedGif | null,
): number {
  return discreteTime(time, durationMs, gif)
}

export function quantizeLayerToFrames(
  layer: Layer,
  durationMs: number,
  gif: DecodedGif | null,
): Layer {
  const inTime = discreteTime(layer.inTime, durationMs, gif)
  const outTime = layer.outTime >= 1 - 1e-9 ? 1 : discreteTime(layer.outTime, durationMs, gif)
  const used = new Set<number>()
  const keyframes: Keyframe[] = []
  for (const frame of [...layer.keyframes].sort((a, b) => a.time - b.time)) {
    let time = discreteTime(frame.time, durationMs, gif)
    let index = discreteFrameIndex(time, durationMs, gif)
    while (used.has(index) && index < discreteFrameCount(durationMs, gif) - 1) {
      index += 1
      time = gif ? timeAtFrame(gif, index) : stillTimeAtFrame(durationMs, index)
    }
    used.add(index)
    keyframes.push({ ...frame, time })
  }
  return { ...layer, inTime, outTime: Math.max(outTime, inTime), keyframes }
}
