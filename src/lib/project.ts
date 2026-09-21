import type { DecodedGif } from '@/lib/gif-decode'
import { laterFrame, quantizeLayerToFrames } from '@/lib/frames'
import { createId } from '@/lib/ids'
import { defaultKeyframe, sampleLayer } from '@/lib/interpolation'
import type { Keyframe, Layer, MediaItem, MemeProject, MotionPreset } from '@/types/meme'

export const FONT_CHOICES = [
  { value: '"Zen Maru Gothic", sans-serif', label: 'Zen Maru Gothic' },
  { value: '"Shippori Mincho", serif', label: 'Shippori Mincho' },
  { value: 'Anton, Impact, sans-serif', label: 'Anton' },
] as const

export const EMOJIS = [
  '😂',
  '😭',
  '💀',
  '🔥',
  '✨',
  '🌸',
  '😳',
  '😎',
  '👀',
  '💔',
  '❤️',
  '🤡',
  '🫠',
  '🫡',
  '😤',
  '🫶',
  '🐱',
  '🐸',
  '🍵',
  '💣',
]

function baseLayer(partial: Partial<Layer> & Pick<Layer, 'text' | 'keyframes'>): Layer {
  return {
    id: createId('layer'),
    kind: partial.kind ?? 'text',
    text: partial.text,
    fontFamily: partial.fontFamily ?? FONT_CHOICES[0].value,
    fontSize: partial.fontSize ?? 0.08,
    color: partial.color ?? '#ffffff',
    strokeColor: partial.strokeColor ?? '#1a0b12',
    strokeWidth: partial.strokeWidth ?? 0.07,
    align: partial.align ?? 'center',
    inTime: partial.inTime ?? 0.12,
    outTime: partial.outTime ?? 1,
    keyframes: partial.keyframes,
  }
}

export function createProject(
  media: MediaItem,
  durationMs: number,
  gif: DecodedGif | null = null,
): MemeProject {
  const layer = quantizeLayerToFrames(
    baseLayer({
      text: 'YOUR TEXT',
      fontSize: 0.1,
      keyframes: [defaultKeyframe({ time: 0.12, y: 0.78 })],
    }),
    durationMs,
    gif,
  )
  return { media, durationMs, layers: [layer] }
}

export function createTextLayer(
  text = 'YOUR TEXT',
  durationMs = 2500,
  gif: DecodedGif | null = null,
): Layer {
  return quantizeLayerToFrames(
    baseLayer({
      text,
      keyframes: [defaultKeyframe({ time: 0.12, y: 0.72 })],
    }),
    durationMs,
    gif,
  )
}

export function createEmojiLayer(
  emoji: string,
  durationMs = 2500,
  gif: DecodedGif | null = null,
): Layer {
  const start = 0.08
  return quantizeLayerToFrames(
    baseLayer({
      kind: 'emoji',
      text: emoji,
      fontFamily: '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
      fontSize: 0.16,
      strokeWidth: 0,
      inTime: start,
      keyframes: [
        defaultKeyframe({ time: start, scale: 0.4, opacity: 0, y: 0.45 }),
        defaultKeyframe({ time: start + 0.14, scale: 1, opacity: 1, y: 0.45 }),
      ],
    }),
    durationMs,
    gif,
  )
}

export function applyMotion(
  layer: Layer,
  preset: MotionPreset,
  durationMs: number,
  gif: DecodedGif | null,
): Layer {
  const current = sampleLayer(layer, Math.max(layer.inTime, 0.5))
  const x = current.x
  const y = current.y
  const start = layer.inTime
  const two = laterFrame(start, 2, durationMs, gif)
  const three = laterFrame(start, 3, durationMs, gif)
  const four = laterFrame(start, 4, durationMs, gif)

  const hold: Keyframe[] = [defaultKeyframe({ time: start, x, y })]
  const fadeIn: Keyframe[] = [
    defaultKeyframe({ time: start, x, y, opacity: 0, scale: 0.94 }),
    defaultKeyframe({ time: two, x, y, opacity: 1, scale: 1 }),
  ]
  const slideUp: Keyframe[] = [
    defaultKeyframe({ time: start, x, y: Math.min(1, y + 0.14), opacity: 0 }),
    defaultKeyframe({ time: three, x, y, opacity: 1 }),
  ]
  const slideDown: Keyframe[] = [
    defaultKeyframe({ time: start, x, y: Math.max(0, y - 0.14), opacity: 0 }),
    defaultKeyframe({ time: three, x, y, opacity: 1 }),
  ]
  const pop: Keyframe[] = [
    defaultKeyframe({ time: start, x, y, scale: 0.2, opacity: 0 }),
    defaultKeyframe({ time: two, x, y, scale: 1.1, opacity: 1 }),
    defaultKeyframe({ time: four, x, y, scale: 1, opacity: 1 }),
  ]
  const drift: Keyframe[] = [
    defaultKeyframe({ time: start, x: clamp01(x - 0.08), y, opacity: 1 }),
    defaultKeyframe({
      time: layer.outTime >= 1 ? laterFrame(start, Math.max(3, discreteSpan(durationMs, gif) - 1), durationMs, gif) : layer.outTime,
      x: clamp01(x + 0.08),
      y: clamp01(y - 0.04),
      opacity: 1,
    }),
  ]

  const keyframes =
    preset === 'fade-in'
      ? fadeIn
      : preset === 'slide-up'
        ? slideUp
        : preset === 'slide-down'
          ? slideDown
          : preset === 'pop'
            ? pop
            : preset === 'drift'
              ? drift
              : hold

  return quantizeLayerToFrames({ ...layer, keyframes }, durationMs, gif)
}

function discreteSpan(durationMs: number, gif: DecodedGif | null): number {
  return gif?.frames.length ?? Math.max(4, Math.round((durationMs / 1000) * 12))
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function updateLayer(
  project: MemeProject,
  layerId: string,
  updater: (layer: Layer) => Layer,
): MemeProject {
  return {
    ...project,
    layers: project.layers.map((layer) => (layer.id === layerId ? updater(layer) : layer)),
  }
}

export function layerLabel(layer: Layer): string {
  const text = layer.text.trim()
  if (!text) return layer.kind === 'emoji' ? 'Emoji' : 'Text'
  return text.length > 22 ? `${text.slice(0, 22)}…` : text
}
