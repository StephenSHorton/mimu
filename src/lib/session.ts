import type { MediaItem } from '@/types/meme'

const KEY = 'mimu:media'

export function saveMedia(item: MediaItem): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(item))
  } catch {
    // Private mode — editor can still take a demo id from the URL.
  }
}

export function readMedia(): MediaItem | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MediaItem
    if (!parsed?.id || !parsed.url) return null
    if (parsed.source !== 'upload' && parsed.source !== 'demo') return null
    return parsed
  } catch {
    return null
  }
}
