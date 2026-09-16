import { createId } from '@/lib/ids'
import { publicUrl } from '@/lib/public-url'
import type { MediaItem } from '@/types/meme'

export const DEMO_MEDIA: MediaItem = {
  id: 'demo',
  title: 'Mimu demo loop',
  url: publicUrl('demo/mimu-demo.gif'),
  width: 360,
  height: 360,
  kind: 'gif',
  source: 'demo',
}

export function mediaFromFile(file: File): MediaItem {
  const url = URL.createObjectURL(file)
  const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')
  return {
    id: createId('upload'),
    title: file.name.replace(/\.[^.]+$/, '') || 'Uploaded GIF',
    url,
    width: 800,
    height: 800,
    kind: isGif ? 'gif' : 'image',
    source: 'upload',
  }
}

export async function readImageSize(url: string): Promise<{ width: number; height: number }> {
  const image = new Image()
  image.decoding = 'async'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('That file could not be opened.'))
    image.src = url
  })
  return { width: image.naturalWidth || 800, height: image.naturalHeight || 800 }
}
