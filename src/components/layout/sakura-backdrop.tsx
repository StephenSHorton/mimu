import { useEffect, useRef } from 'react'

export function SakuraBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let handle: { dispose: () => void } | undefined
    let cancelled = false

    void import('@/lib/sakura-scene')
      .then(({ mountSakura }) => {
        if (cancelled || !canvasRef.current) return
        try {
          handle = mountSakura(canvasRef.current, { reducedMotion })
        } catch {
          handle = undefined
        }
      })
      .catch(() => {
        handle = undefined
      })

    return () => {
      cancelled = true
      handle?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-svh w-full"
      aria-hidden
    />
  )
}
