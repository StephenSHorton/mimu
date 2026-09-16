import { useEffect, useRef } from 'react'
import { gifFrameAt, type DecodedGif } from '@/lib/gif-decode'
import { clamp, sampleLayer, upsertKeyframe } from '@/lib/interpolation'
import { drawMeme, hitTestLayer } from '@/lib/render'
import { updateLayer } from '@/lib/project'
import type { MemeProject } from '@/types/meme'

type MemeStageProps = {
  project: MemeProject
  time: number
  selectedId: string | null
  still: HTMLImageElement | null
  gif: DecodedGif | null
  onSelect: (id: string | null) => void
  onChange: (project: MemeProject) => void
}

export function MemeStage({
  project,
  time,
  selectedId,
  still,
  gif,
  onSelect,
  onChange,
}: MemeStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ id: string; grabbing: boolean } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.width = project.media.width
    canvas.height = project.media.height
    const timeMs = time * project.durationMs
    const media = gif ? gifFrameAt(gif, timeMs) : still
    if (!media) return
    drawMeme(ctx, media, project, time, { selectedId, showGuides: true })
  }, [gif, project, selectedId, still, time])

  function pointOnCanvas(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = pointOnCanvas(event)
    if (!canvas || !ctx || !point) return
    const hit = hitTestLayer(ctx, project, time, point.x, point.y)
    onSelect(hit)
    if (!hit) return
    dragRef.current = { id: hit, grabbing: true }
    canvas.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    const canvas = canvasRef.current
    const point = pointOnCanvas(event)
    if (!drag?.grabbing || !canvas || !point) return
    const x = clamp(point.x / canvas.width, 0, 1)
    const y = clamp(point.y / canvas.height, 0, 1)
    onChange(
      updateLayer(project, drag.id, (layer) => {
        const current = sampleLayer(layer, time)
        return upsertKeyframe(layer, { ...current, time, x, y })
      }),
    )
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    dragRef.current = null
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-4">
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full cursor-grab rounded-lg bg-black/80 shadow-[0_16px_40px_-20px_oklch(0.4_0.08_350/0.45)] active:cursor-grabbing"
        style={{ aspectRatio: `${project.media.width} / ${project.media.height}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  )
}
