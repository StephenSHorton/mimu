import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Upload } from 'lucide-react'
import { AdSlot } from '@/components/layout/ad-slot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEMO_MEDIA, mediaFromFile } from '@/lib/media'
import { saveMedia } from '@/lib/session'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function openFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Use a GIF, PNG, JPEG, or WebP.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const item = mediaFromFile(file)
      saveMedia(item)
      await navigate({ to: '/editor', search: { m: item.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open that file.')
    } finally {
      setBusy(false)
    }
  }

  async function openDemo() {
    setError(null)
    setBusy(true)
    try {
      saveMedia(DEMO_MEDIA)
      await navigate({ to: '/editor', search: { m: 'demo' } })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <section className="max-w-xl">
        <p className="text-xs tracking-[0.28em] text-primary uppercase">ミーム · Mimu</p>
        <h1 className="font-heading mt-2 text-4xl leading-tight sm:text-5xl">
          Add text to your GIF. Time it to the frames.
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Upload a GIF (or a still), drop captions and emoji on a timeline, export the animated
          file. Free. No account. No paywall. Nothing is fetched from Giphy or anywhere else —
          only the file you choose.
        </p>
      </section>

      <label
        htmlFor="upload"
        className={cn(
          'mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition',
          dragOver
            ? 'border-primary bg-primary/10'
            : 'border-primary/30 bg-card/80 hover:border-primary/50 hover:bg-primary/5',
        )}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          void openFile(event.dataTransfer.files[0])
        }}
      >
        <Upload className="mb-3 size-8 text-primary" />
        <p className="font-medium">Drop a GIF here, or browse</p>
        <p className="mt-1 text-sm text-muted-foreground">GIF, PNG, JPEG, or WebP. Edited on your device.</p>
        <Input
          id="upload"
          type="file"
          accept="image/gif,image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => void openFile(event.target.files?.[0])}
        />
      </label>

      <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" onClick={() => void openDemo()} disabled={busy}>
          Try a 2-second Mimu demo
        </Button>
        <Label htmlFor="upload" className="text-sm text-muted-foreground">
          {busy ? 'Opening editor…' : 'The demo is an original loop we made — not a search catalog.'}
        </Label>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <AdSlot className="mt-10" />
    </div>
  )
}
