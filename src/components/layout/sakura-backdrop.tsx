import { SakuraTree } from '@/components/layout/sakura-tree'

const PETALS = [
  { left: 58, delay: 0, duration: 9.2, size: 9, drift: -90 },
  { left: 64, delay: 1.1, duration: 10.4, size: 11, drift: -70 },
  { left: 71, delay: 0.4, duration: 8.6, size: 8, drift: -110 },
  { left: 78, delay: 2.2, duration: 11, size: 12, drift: -60 },
  { left: 84, delay: 0.8, duration: 9.8, size: 10, drift: -130 },
  { left: 91, delay: 3.1, duration: 10.8, size: 7, drift: -50 },
  { left: 96, delay: 1.6, duration: 8.4, size: 9, drift: -100 },
  { left: 62, delay: 4.2, duration: 11.6, size: 8, drift: -80 },
  { left: 69, delay: 2.8, duration: 9, size: 11, drift: -120 },
  { left: 75, delay: 5, duration: 10.2, size: 9, drift: -40 },
  { left: 82, delay: 3.6, duration: 8.8, size: 10, drift: -95 },
  { left: 88, delay: 0.2, duration: 12, size: 8, drift: -75 },
  { left: 93, delay: 4.7, duration: 9.4, size: 12, drift: -115 },
  { left: 60, delay: 6.1, duration: 10.6, size: 7, drift: -55 },
  { left: 67, delay: 5.4, duration: 8.2, size: 10, drift: -140 },
  { left: 73, delay: 1.9, duration: 11.2, size: 9, drift: -85 },
  { left: 80, delay: 6.8, duration: 9.6, size: 8, drift: -65 },
  { left: 86, delay: 2.5, duration: 10, size: 11, drift: -105 },
  { left: 94, delay: 7.2, duration: 8.7, size: 7, drift: -45 },
  { left: 55, delay: 3.9, duration: 11.4, size: 9, drift: -125 },
  { left: 77, delay: 7.6, duration: 9.1, size: 10, drift: -70 },
  { left: 89, delay: 5.8, duration: 10.9, size: 8, drift: -90 },
]

export function SakuraBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <SakuraTree />
      {PETALS.map((petal, i) => (
        <span
          key={i}
          className="mimu-sakura-petal"
          style={{
            left: `${petal.left}%`,
            width: petal.size,
            height: petal.size * 1.25,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
            ['--mimu-petal-drift' as string]: `${petal.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
