export function Petals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PETALS.map((petal) => (
        <span
          key={petal.id}
          className="petal"
          style={{
            left: petal.left,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            fontSize: petal.size,
            opacity: petal.opacity,
          }}
        >
          ❀
        </span>
      ))}
    </div>
  )
}

const PETALS = [
  { id: 1, left: '6%', delay: '0s', duration: '14s', size: '18px', opacity: 0.45 },
  { id: 2, left: '18%', delay: '2s', duration: '16s', size: '12px', opacity: 0.3 },
  { id: 3, left: '31%', delay: '5s', duration: '13s', size: '16px', opacity: 0.4 },
  { id: 4, left: '47%', delay: '1s', duration: '18s', size: '14px', opacity: 0.28 },
  { id: 5, left: '62%', delay: '3.5s', duration: '15s', size: '20px', opacity: 0.35 },
  { id: 6, left: '74%', delay: '6s', duration: '17s', size: '11px', opacity: 0.32 },
  { id: 7, left: '86%', delay: '0.8s', duration: '14s', size: '15px', opacity: 0.38 },
  { id: 8, left: '93%', delay: '4s', duration: '19s', size: '13px', opacity: 0.25 },
]
