import { Pause, Play, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { frameIndexAt, snapTimeToFrame, type DecodedGif } from '@/lib/gif-decode'
import { sampleLayer, upsertKeyframe } from '@/lib/interpolation'
import { layerLabel, updateLayer } from '@/lib/project'
import { cn } from '@/lib/utils'
import type { Layer, MemeProject } from '@/types/meme'

type TimelineProps = {
  project: MemeProject
  gif: DecodedGif | null
  time: number
  playing: boolean
  selectedId: string | null
  onTime: (time: number) => void
  onPlaying: (playing: boolean) => void
  onSelect: (id: string) => void
  onChange: (project: MemeProject) => void
}

export function Timeline({
  project,
  gif,
  time,
  playing,
  selectedId,
  onTime,
  onPlaying,
  onSelect,
  onChange,
}: TimelineProps) {
  const frameCount = gif?.frames.length ?? 1
  const frameIndex = gif ? frameIndexAt(gif, time * project.durationMs) : 0
  const seconds = (time * project.durationMs) / 1000

  function seekFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const raw = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    onTime(gif ? snapTimeToFrame(gif, raw) : raw)
    onPlaying(false)
  }

  function addKeyframe(layer: Layer) {
    const sample = sampleLayer(layer, time)
    onChange(
      updateLayer(project, layer.id, (current) =>
        upsertKeyframe(current, { ...sample, time, opacity: 1 }),
      ),
    )
  }

  return (
    <section className="border-t border-primary/15 bg-card/90 px-3 py-3 sm:px-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          onClick={() => onPlaying(!playing)}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? 'Pause' : 'Play'}
        </Button>
        <p className="font-mono text-xs text-muted-foreground">
          Frame {frameIndex + 1} / {frameCount} · {seconds.toFixed(2)}s
        </p>
      </div>

      <div className="space-y-1.5">
        {project.layers.map((layer) => (
          <div key={layer.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(layer.id)}
              className={cn(
                'w-28 shrink-0 truncate text-left text-xs sm:w-36',
                selectedId === layer.id ? 'font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              {layerLabel(layer)}
            </button>
            <div
              className="relative h-8 flex-1 cursor-pointer rounded-md bg-primary/8 ring-1 ring-primary/15"
              onPointerDown={seekFromEvent}
            >
              <span
                className="absolute inset-y-1 rounded-sm bg-primary/25"
                style={{
                  left: `${layer.inTime * 100}%`,
                  width: `${Math.max(2, (layer.outTime - layer.inTime) * 100)}%`,
                }}
              />
              {layer.keyframes.map((frame) => (
                <button
                  key={`${layer.id}-${frame.time}`}
                  type="button"
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-sm ring-2 ring-background"
                  style={{ left: `${frame.time * 100}%` }}
                  aria-label={`Keyframe at frame ${gif ? frameIndexAt(gif, frame.time * project.durationMs) + 1 : 1}`}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    onSelect(layer.id)
                    onTime(gif ? snapTimeToFrame(gif, frame.time) : frame.time)
                    onPlaying(false)
                  }}
                />
              ))}
              {selectedId === layer.id ? (
                <span
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary"
                  style={{ left: `${time * 100}%` }}
                />
              ) : null}
            </div>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="Add keyframe at this frame"
              onClick={() => addKeyframe(layer)}
            >
              <Plus />
            </Button>
          </div>
        ))}
      </div>

      <div
        className="relative mt-2 h-6 cursor-pointer overflow-hidden rounded-md bg-muted"
        onPointerDown={seekFromEvent}
      >
        {gif
          ? gif.frames.map((_, index) => (
              <span
                key={index}
                className="absolute inset-y-0 w-px bg-foreground/15"
                style={{ left: `${(index / frameCount) * 100}%` }}
              />
            ))
          : null}
        <span className="absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${time * 100}%` }} />
      </div>
    </section>
  )
}
