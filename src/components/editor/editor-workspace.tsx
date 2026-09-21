import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { AdSlot } from '@/components/layout/ad-slot'
import { ExportDialog } from '@/components/editor/export-dialog'
import { LayerInspector } from '@/components/editor/layer-inspector'
import { MemeStage } from '@/components/editor/meme-stage'
import { Timeline } from '@/components/editor/timeline'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { discreteTime, stillFrameAtTime, stillFrameCount, stillTimeAtFrame } from '@/lib/frames'
import { stepFrame, type DecodedGif } from '@/lib/gif-decode'
import { DEMO_MEDIA } from '@/lib/media'
import { loadOwnedMedia, prepareEditorSource } from '@/lib/media-bytes'
import { createProject } from '@/lib/project'
import { readMedia } from '@/lib/session'
import type { MediaItem, MemeProject } from '@/types/meme'

type EditorWorkspaceProps = {
  mediaId?: string
}

type LoadState =
  | { status: 'empty' }
  | { status: 'loading'; title: string }
  | { status: 'error'; message: string }
  | { status: 'ready' }

export function EditorWorkspace({ mediaId }: EditorWorkspaceProps) {
  const seed = useMemo(() => resolveMedia(mediaId), [mediaId])
  const [load, setLoad] = useState<LoadState>({
    status: seed ? 'loading' : 'empty',
    title: seed?.title ?? '',
  })
  const [project, setProject] = useState<MemeProject | null>(null)
  const [still, setStill] = useState<HTMLImageElement | null>(null)
  const [gif, setGif] = useState<DecodedGif | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!seed) {
      setLoad({ status: 'empty' })
      return
    }

    let cancelled = false
    setLoad({ status: 'loading', title: seed.title })
    setPlaying(true)
    setTime(0)

    void (async () => {
      try {
        await document.fonts.ready.catch(() => undefined)
        const loaded = await loadOwnedMedia(seed)
        const source = await prepareEditorSource(loaded)
        if (cancelled) return
        const durationMs = source.gif?.durationMs || 2500
        const next = createProject(
          {
            ...seed,
            kind: loaded.kind,
            width: source.width,
            height: source.height,
          },
          durationMs,
          source.gif,
        )
        setProject(next)
        setStill(source.still)
        setGif(source.gif)
        setSelectedId(next.layers[0]?.id ?? null)
        setLoad({ status: 'ready' })
      } catch (err) {
        if (cancelled) return
        setProject(null)
        setStill(null)
        setGif(null)
        setLoad({
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not open that file.',
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [seed])

  const timeRef = useRef(time)
  useEffect(() => {
    timeRef.current = time
  }, [time])

  useEffect(() => {
    if (!playing || !project) return
    let frame = 0
    let last = performance.now()
    let clockMs = timeRef.current * project.durationMs
    const tick = (now: number) => {
      const delta = Math.min(64, now - last)
      last = now
      clockMs = (clockMs + delta) % project.durationMs
      if (clockMs < 0) clockMs += project.durationMs
      setTime(discreteTime(clockMs / project.durationMs, project.durationMs, gif))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gif, playing, project])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        setPlaying((value) => !value)
      }
      if ((event.code === 'ArrowRight' || event.code === 'ArrowLeft') && project) {
        event.preventDefault()
        setPlaying(false)
        const delta = event.code === 'ArrowRight' ? 1 : -1
        setTime((value) => {
          if (gif) return stepFrame(gif, value, delta)
          const count = stillFrameCount(project.durationMs)
          const index = stillFrameAtTime(project.durationMs, value)
          return stillTimeAtFrame(project.durationMs, (index + delta + count) % count)
        })
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedId && project) {
        const layers = project.layers.filter((layer) => layer.id !== selectedId)
        setProject({ ...project, layers })
        setSelectedId(layers[layers.length - 1]?.id ?? null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gif, project, selectedId])

  if (load.status === 'empty') {
    return (
      <EditorMessage
        title="Upload a GIF first"
        body="Mimu only edits files you upload (or the tiny original demo). There is no GIF search."
      />
    )
  }

  if (load.status === 'loading') {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="min-h-72 flex-1 rounded-xl" />
        <p className="text-sm text-muted-foreground">Opening “{load.title}”…</p>
      </div>
    )
  }

  if (load.status === 'error') {
    return <EditorMessage title="Couldn’t open that file" body={load.message} />
  }

  if (!project) return null

  const inspector = (
    <LayerInspector
      project={project}
      gif={gif}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onChange={setProject}
    />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-primary/10 bg-background/80 px-3 py-2 backdrop-blur-md sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{project.media.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {gif
              ? `${gif.frames.length} frames · ${(project.durationMs / 1000).toFixed(1)}s`
              : 'Still image — text can still move across a short timeline'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal />
                Layers
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] overflow-y-auto sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Layers</SheetTitle>
                <SheetDescription>Text, emoji, and when they appear on the GIF.</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">{inspector}</div>
            </SheetContent>
          </Sheet>
          <ExportDialog project={project} time={time} still={still} gif={gif} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <MemeStage
          project={project}
          time={time}
          selectedId={selectedId}
          still={still}
          gif={gif}
          onSelect={setSelectedId}
          onChange={setProject}
        />
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-primary/10 bg-background/75 p-4 backdrop-blur-md lg:block">
          {inspector}
          <AdSlot className="mt-6" />
        </aside>
      </div>

      <Timeline
        project={project}
        gif={gif}
        time={time}
        playing={playing}
        selectedId={selectedId}
        onTime={setTime}
        onPlaying={setPlaying}
        onSelect={setSelectedId}
        onChange={setProject}
      />
      <div className="px-3 py-3 lg:hidden">
        <AdSlot />
      </div>
    </div>
  )
}

function resolveMedia(mediaId?: string): MediaItem | null {
  const stored = readMedia()
  if (stored && (!mediaId || stored.id === mediaId)) return stored
  if (mediaId === 'demo') return DEMO_MEDIA
  return stored
}

function EditorMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-heading text-2xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to upload</Link>
      </Button>
    </div>
  )
}
