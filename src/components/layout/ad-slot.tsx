import { cn } from '@/lib/utils'

export function AdSlot({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'rounded-xl border border-dashed border-primary/35 bg-[linear-gradient(180deg,oklch(0.97_0.02_350/0.92),oklch(0.94_0.03_350/0.9))] px-4 py-3 text-center backdrop-blur-sm',
        className,
      )}
      aria-label="Advertisement placeholder"
    >
      <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
        広告 · Ad
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">Reserved for a future sponsor</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Mimu stays free. This slot never locks captions or export.
      </p>
    </aside>
  )
}
