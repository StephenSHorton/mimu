import type { Keyframe, Layer } from '@/types/meme'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function defaultKeyframe(partial?: Partial<Keyframe>): Keyframe {
  return {
    time: 0,
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    opacity: 1,
    ...partial,
  }
}

/** Inclusive start, exclusive end — matches GIF frame ranges. */
export function rangeOpacity(layer: Layer, time: number): number {
  if (time < layer.inTime || time >= layer.outTime) return 0
  return 1
}

/**
 * Hold the latest keyframe at or before `time`. No lerp — export writes one
 * pose per source GIF frame, so preview must snap the same way.
 */
export function sampleLayer(layer: Layer, time: number): Keyframe {
  const frames = [...layer.keyframes].sort((a, b) => a.time - b.time)
  const t = clamp(time, 0, 1)
  const visible = rangeOpacity(layer, t)
  if (frames.length === 0) {
    return defaultKeyframe({ opacity: visible })
  }

  let chosen = frames[0]
  for (const frame of frames) {
    if (frame.time <= t + 1e-9) chosen = frame
    else break
  }

  return { ...chosen, time: t, opacity: chosen.opacity * visible }
}

export function upsertKeyframe(layer: Layer, next: Keyframe): Layer {
  const frames = [...layer.keyframes]
  const near = frames.findIndex((frame) => Math.abs(frame.time - next.time) <= 1e-6)
  if (near >= 0) {
    frames[near] = { ...frames[near], ...next, time: next.time }
  } else {
    frames.push(next)
  }
  frames.sort((a, b) => a.time - b.time)
  return { ...layer, keyframes: frames }
}

export function removeKeyframeAt(layer: Layer, time: number): Layer {
  const frames = layer.keyframes.filter((frame) => Math.abs(frame.time - time) > 1e-6)
  if (frames.length === 0) {
    return { ...layer, keyframes: [defaultKeyframe({ ...sampleLayer(layer, time), time: 0 })] }
  }
  return { ...layer, keyframes: frames }
}
