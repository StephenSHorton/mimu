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
    ease: partial.ease ?? 'smooth',
    inTime: partial.inTime ?? 0.12,
    outTime: partial.outTime ?? 1,
    keyframes: partial.keyframes,
  }
}

export function createProject(media: MediaItem, durationMs: number): MemeProject {
  return {
    media,
    durationMs,
    layers: [
      baseLayer({
        text: 'YOUR TEXT',
        fontSize: 0.1,
        keyframes: [defaultKeyframe({ time: 0.12, y: 0.78 })],
      }),
    ],
  }
}

export function createTextLayer(text = 'YOUR TEXT'): Layer {
  return baseLayer({
    text,
    keyframes: [defaultKeyframe({ time: 0.12, y: 0.72 })],
  })
}

export function createEmojiLayer(emoji: string): Layer {
  return baseLayer({
    kind: 'emoji',
    text: emoji,
    fontFamily: '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
    fontSize: 0.16,
    strokeWidth: 0,
    inTime: 0.08,
    keyframes: [
      defaultKeyframe({ time: 0.08, scale: 0.4, opacity: 0, y: 0.45 }),
      defaultKeyframe({ time: 0.22, scale: 1, opacity: 1, y: 0.45 }),
    ],
  })
}

export function applyMotion(layer: Layer, preset: MotionPreset): Layer {
  const current = sampleLayer(layer, Math.max(layer.inTime, 0.5))
  const x = current.x
  const y = current.y
  const start = layer.inTime

  const hold: Keyframe[] = [defaultKeyframe({ time: start, x, y })]
  const fadeIn: Keyframe[] = [
    defaultKeyframe({ time: start, x, y, opacity: 0, scale: 0.94 }),
    defaultKeyframe({ time: Math.min(1, start + 0.18), x, y, opacity: 1, scale: 1 }),
  ]
  const slideUp: Keyframe[] = [
    defaultKeyframe({ time: start, x, y: Math.min(1, y + 0.14), opacity: 0 }),
    defaultKeyframe({ time: Math.min(1, start + 0.2), x, y, opacity: 1 }),
  ]
  const slideDown: Keyframe[] = [
    defaultKeyframe({ time: start, x, y: Math.max(0, y - 0.14), opacity: 0 }),
    defaultKeyframe({ time: Math.min(1, start + 0.2), x, y, opacity: 1 }),
  ]
  const pop: Keyframe[] = [
    defaultKeyframe({ time: start, x, y, scale: 0.2, opacity: 0 }),
    defaultKeyframe({ time: Math.min(1, start + 0.12), x, y, scale: 1.1, opacity: 1 }),
    defaultKeyframe({ time: Math.min(1, start + 0.22), x, y, scale: 1, opacity: 1 }),
  ]
  const drift: Keyframe[] = [
    defaultKeyframe({ time: start, x: clamp01(x - 0.08), y, opacity: 1 }),
    defaultKeyframe({ time: layer.outTime, x: clamp01(x + 0.08), y: clamp01(y - 0.04), opacity: 1 }),
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

  return { ...layer, keyframes }
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
