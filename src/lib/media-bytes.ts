import { decodeGif, type DecodedGif } from '@/lib/gif-decode'
import { readImageSize } from '@/lib/media'
import type { MediaItem, MediaKind } from '@/types/meme'

export type LoadedMedia = {
  item: MediaItem
  blob: Blob
  buffer: ArrayBuffer
  objectUrl: string
  kind: MediaKind
  width: number
  height: number
}

const cache = new Map<string, LoadedMedia>()

function isGifBytes(blob: Blob, buffer: ArrayBuffer): boolean {
  if (blob.type === 'image/gif') return true
  if (buffer.byteLength < 6) return false
  const header = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 6)))
  return header === 'GIF87a' || header === 'GIF89a'
}

/** Load an upload or the original Mimu demo — never a third-party media URL. */
export async function loadOwnedMedia(item: MediaItem): Promise<LoadedMedia> {
  if (item.source !== 'upload' && item.source !== 'demo') {
    throw new Error('Only uploads and the Mimu demo can be edited.')
  }

  const cached = cache.get(item.id)
  if (cached) return cached

  const res = await fetch(item.url)
  if (!res.ok) throw new Error('Could not read that file. Try uploading it again.')
  const blob = await res.blob()
  if (blob.size === 0) throw new Error('That file was empty.')

  const buffer = await blob.arrayBuffer()
  const objectUrl = item.url.startsWith('blob:') ? item.url : URL.createObjectURL(blob)
  const kind: MediaKind = isGifBytes(blob, buffer) ? 'gif' : 'image'
  const size = await readImageSize(objectUrl)

  const loaded: LoadedMedia = {
    item,
    blob,
    buffer,
    objectUrl,
    kind,
    width: size.width || item.width,
    height: size.height || item.height,
  }
  cache.set(item.id, loaded)
  return loaded
}

export async function prepareEditorSource(loaded: LoadedMedia): Promise<{
  still: HTMLImageElement | null
  gif: DecodedGif | null
  width: number
  height: number
}> {
  if (loaded.kind === 'gif') {
    const gif = decodeGif(loaded.buffer)
    return {
      still: null,
      gif,
      width: gif.width || loaded.width,
      height: gif.height || loaded.height,
    }
  }

  const still = new Image()
  still.decoding = 'async'
  await new Promise<void>((resolve, reject) => {
    still.onload = () => resolve()
    still.onerror = () => reject(new Error('That image could not be decoded.'))
    still.src = loaded.objectUrl
  })
  return {
    still,
    gif: null,
    width: still.naturalWidth || loaded.width,
    height: still.naturalHeight || loaded.height,
  }
}
