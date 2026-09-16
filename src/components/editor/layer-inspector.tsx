import { Smile, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { frameIndexAt, timeAtFrame, type DecodedGif } from '@/lib/gif-decode'
import {
  applyMotion,
  createEmojiLayer,
  createTextLayer,
  EMOJIS,
  FONT_CHOICES,
  layerLabel,
} from '@/lib/project'
import type { Layer, MemeProject, MotionPreset } from '@/types/meme'

type LayerInspectorProps = {
  project: MemeProject
  gif: DecodedGif | null
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (project: MemeProject) => void
}

const MOTIONS: { id: MotionPreset; label: string }[] = [
  { id: 'hold', label: 'Hold' },
  { id: 'fade-in', label: 'Fade in' },
  { id: 'slide-up', label: 'Slide up' },
  { id: 'slide-down', label: 'Slide down' },
  { id: 'pop', label: 'Pop' },
  { id: 'drift', label: 'Drift' },
]

export function LayerInspector({
  project,
  gif,
  selectedId,
  onSelect,
  onChange,
}: LayerInspectorProps) {
  const selected = project.layers.find((layer) => layer.id === selectedId) ?? null
  const frameCount = gif?.frames.length ?? 24

  function patch(partial: Partial<Layer>) {
    if (!selected) return
    onChange({
      ...project,
      layers: project.layers.map((layer) =>
        layer.id === selected.id ? { ...layer, ...partial } : layer,
      ),
    })
  }

  function addText() {
    const layer = createTextLayer()
    onChange({ ...project, layers: [...project.layers, layer] })
    onSelect(layer.id)
  }

  function addEmoji(emoji: string) {
    const layer = createEmojiLayer(emoji)
    onChange({ ...project, layers: [...project.layers, layer] })
    onSelect(layer.id)
  }

  function removeSelected() {
    if (!selected) return
    const layers = project.layers.filter((layer) => layer.id !== selected.id)
    onChange({ ...project, layers })
    onSelect(layers[layers.length - 1]?.id ?? null)
  }

  function timeToFrame(time: number) {
    if (!gif) return Math.round(time * (frameCount - 1)) + 1
    return frameIndexAt(gif, time * project.durationMs) + 1
  }

  function frameToTime(frameNumber: number) {
    if (!gif) return (frameNumber - 1) / Math.max(1, frameCount - 1)
    return timeAtFrame(gif, frameNumber - 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addText}>
          <Type />
          Add text
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              <Smile />
              Add emoji
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="grid grid-cols-5 gap-1">
              {EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-lg"
                  onClick={() => addEmoji(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1">
        {project.layers.map((layer) => (
          <button
            key={layer.id}
            type="button"
            onClick={() => onSelect(layer.id)}
            className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${
              selectedId === layer.id ? 'bg-primary/10 text-foreground' : 'hover:bg-muted'
            }`}
          >
            <span className="truncate">{layerLabel(layer)}</span>
            <span className="text-[11px] text-muted-foreground">
              f{timeToFrame(layer.inTime)}–{timeToFrame(layer.outTime)}
            </span>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="layer-text">{selected.kind === 'emoji' ? 'Emoji' : 'Text'}</Label>
            <Textarea
              id="layer-text"
              value={selected.text}
              rows={selected.kind === 'emoji' ? 1 : 3}
              onChange={(event) => patch({ text: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Show from frame {timeToFrame(selected.inTime)}</Label>
            <Slider
              min={1}
              max={frameCount}
              step={1}
              value={[timeToFrame(selected.inTime)]}
              onValueChange={(value) => {
                const inTime = frameToTime(value[0] ?? 1)
                patch({ inTime, outTime: Math.max(selected.outTime, inTime) })
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hide after frame {timeToFrame(selected.outTime)}</Label>
            <Slider
              min={1}
              max={frameCount}
              step={1}
              value={[timeToFrame(selected.outTime)]}
              onValueChange={(value) => {
                const outTime = frameToTime(value[0] ?? frameCount)
                patch({ outTime, inTime: Math.min(selected.inTime, outTime) })
              }}
            />
          </div>

          {selected.kind === 'text' ? (
            <>
              <div className="space-y-1.5">
                <Label>Font</Label>
                <Select
                  value={selected.fontFamily}
                  onValueChange={(value) => patch({ fontFamily: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_CHOICES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fill">Fill</Label>
                  <Input
                    id="fill"
                    type="color"
                    value={selected.color}
                    onChange={(event) => patch({ color: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stroke">Stroke</Label>
                  <Input
                    id="stroke"
                    type="color"
                    value={selected.strokeColor}
                    onChange={(event) => patch({ strokeColor: event.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Stroke width</Label>
                <Slider
                  min={0}
                  max={0.18}
                  step={0.01}
                  value={[selected.strokeWidth]}
                  onValueChange={(value) => patch({ strokeWidth: value[0] ?? 0 })}
                />
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label>Size</Label>
            <Slider
              min={0.04}
              max={0.28}
              step={0.01}
              value={[selected.fontSize]}
              onValueChange={(value) => patch({ fontSize: value[0] ?? 0.08 })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Motion while visible</Label>
            <div className="flex flex-wrap gap-1.5">
              {MOTIONS.map((motion) => (
                <Button
                  key={motion.id}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    onChange({
                      ...project,
                      layers: project.layers.map((layer) =>
                        layer.id === selected.id ? applyMotion(layer, motion.id) : layer,
                      ),
                    })
                  }
                >
                  {motion.label}
                </Button>
              ))}
            </div>
          </div>

          <Button type="button" variant="destructive" size="sm" onClick={removeSelected}>
            Delete layer
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add text or emoji, then set the frames it should appear on. Drag on the GIF to move it at
          the current frame.
        </p>
      )}
    </div>
  )
}
