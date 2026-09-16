import type { Keyframe, Layer } from '@/types/meme'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
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

export function rangeOpacity(layer: Layer, time: number): number {
  if (time < layer.inTime || time > layer.outTime) return 0
  return 1
}

export function sampleLayer(layer: Layer, time: number): Keyframe {
  const frames = [...layer.keyframes].sort((a, b) => a.time - b.time)
  const t = clamp(time, 0, 1)
  const visible = rangeOpacity(layer, t)
  if (frames.length === 0) {
    return defaultKeyframe({ opacity: visible })
  }
  if (t <= frames[0].time) return { ...frames[0], opacity: frames[0].opacity * visible }
  const last = frames[frames.length - 1]
  if (t >= last.time) return { ...last, opacity: last.opacity * visible }

  let start = frames[0]
  let end = last
  for (let i = 0; i < frames.length - 1; i += 1) {
    if (t >= frames[i].time && t <= frames[i + 1].time) {
      start = frames[i]
      end = frames[i + 1]
      break
    }
  }

  const span = end.time - start.time || 1
  const raw = (t - start.time) / span
  const eased = layer.ease === 'smooth' ? smoothstep(raw) : raw

  return {
    time: t,
    x: lerp(start.x, end.x, eased),
    y: lerp(start.y, end.y, eased),
    scale: lerp(start.scale, end.scale, eased),
    rotation: lerp(start.rotation, end.rotation, eased),
    opacity: lerp(start.opacity, end.opacity, eased) * rangeOpacity(layer, t),
  }
}

export function upsertKeyframe(layer: Layer, next: Keyframe, snap = 0.02): Layer {
  const frames = [...layer.keyframes]
  const near = frames.findIndex((frame) => Math.abs(frame.time - next.time) <= snap)
  if (near >= 0) {
    frames[near] = { ...frames[near], ...next, time: frames[near].time }
  } else {
    frames.push(next)
  }
  frames.sort((a, b) => a.time - b.time)
  return { ...layer, keyframes: frames }
}

export function removeKeyframeAt(layer: Layer, time: number, snap = 0.02): Layer {
  const frames = layer.keyframes.filter((frame) => Math.abs(frame.time - time) > snap)
  if (frames.length === 0) {
    return { ...layer, keyframes: [defaultKeyframe({ ...sampleLayer(layer, time), time: 0 })] }
  }
  return { ...layer, keyframes: frames }
}
