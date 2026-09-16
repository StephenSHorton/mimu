export type MediaKind = 'image' | 'gif'
export type MediaSource = 'upload' | 'demo'
export type LayerKind = 'text' | 'emoji'
export type LayerEase = 'linear' | 'smooth'
export type TextAlign = 'left' | 'center' | 'right'

export type MediaItem = {
  id: string
  title: string
  url: string
  width: number
  height: number
  kind: MediaKind
  source: MediaSource
}

export type Keyframe = {
  time: number
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
}

export type Layer = {
  id: string
  kind: LayerKind
  text: string
  fontFamily: string
  fontSize: number
  color: string
  strokeColor: string
  strokeWidth: number
  align: TextAlign
  ease: LayerEase
  inTime: number
  outTime: number
  keyframes: Keyframe[]
}

export type MemeProject = {
  media: MediaItem
  durationMs: number
  layers: Layer[]
}

export type MotionPreset = 'hold' | 'fade-in' | 'slide-up' | 'slide-down' | 'pop' | 'drift'
