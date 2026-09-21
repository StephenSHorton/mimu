import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { downloadBlob, exportGif, exportPng, slugTitle } from '@/lib/export-meme'
import { gifFrameAt, type DecodedGif } from '@/lib/gif-decode'
import type { MemeProject } from '@/types/meme'

type ExportDialogProps = {
  project: MemeProject
  time: number
  still: HTMLImageElement | null
  gif: DecodedGif | null
}

export function ExportDialog({ project, time, still, gif }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<'png' | 'gif' | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function savePng() {
    const media = gif ? gifFrameAt(gif, time * project.durationMs) : still
    if (!media) return
    setBusy('png')
    setError(null)
    try {
      const blob = await exportPng(media, project, time, gif)
      downloadBlob(blob, `${slugTitle(project.media.title)}.png`)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNG export failed')
    } finally {
      setBusy(null)
    }
  }

  async function saveGif() {
    const media = gif ?? still
    if (!media) return
    setBusy('gif')
    setProgress(0)
    setError(null)
    try {
      const blob = await exportGif(media, project, setProgress)
      downloadBlob(blob, `${slugTitle(project.media.title)}.gif`)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GIF export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Export</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download the timed GIF</DialogTitle>
          <DialogDescription>
            Captions are burned into your file on this device. Nothing is uploaded.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">GIF</span> — every source frame, with text timed to it.
          </p>
          <p>
            <span className="font-medium">PNG</span> — a snapshot of the current frame.
          </p>
          {busy === 'gif' ? (
            <p className="text-muted-foreground">Encoding… {Math.round(progress * 100)}%</p>
          ) : null}
          {error ? <p className="text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void savePng()} disabled={Boolean(busy)}>
            {busy === 'png' ? 'Saving…' : 'This frame (PNG)'}
          </Button>
          <Button type="button" onClick={() => void saveGif()} disabled={Boolean(busy)}>
            {busy === 'gif' ? 'Encoding…' : 'Download GIF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
