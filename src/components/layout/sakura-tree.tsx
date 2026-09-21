const BARK = '#4a3228'
const BARK_MID = '#5c3d2e'
const BARK_TWIG = '#6b4a38'
const PALETTE = ['#ffb7c5', '#ffc2d4', '#f8a0b5', '#ffd6e0', '#f48fb1', '#ffe4ec'] as const

/** Blossoms stay on hanging limbs. Coordinates are in the 800×1000 viewBox (right = 800). */
const BLOSSOMS: { x: number; y: number; s: number; c: number }[] = [
  { x: 786, y: 18, s: 1.15, c: 0 },
  { x: 768, y: 42, s: 0.95, c: 1 },
  { x: 748, y: 28, s: 1.05, c: 3 },
  { x: 732, y: 58, s: 0.85, c: 2 },
  { x: 710, y: 36, s: 1, c: 4 },
  { x: 698, y: 72, s: 0.8, c: 0 },
  { x: 676, y: 54, s: 0.9, c: 5 },
  { x: 654, y: 88, s: 0.75, c: 1 },
  { x: 632, y: 70, s: 1, c: 2 },
  { x: 608, y: 104, s: 0.85, c: 3 },
  { x: 582, y: 92, s: 0.95, c: 0 },
  { x: 556, y: 126, s: 0.8, c: 4 },
  { x: 528, y: 118, s: 1.05, c: 1 },
  { x: 502, y: 152, s: 0.9, c: 2 },
  { x: 476, y: 140, s: 0.85, c: 5 },
  { x: 452, y: 176, s: 1, c: 0 },
  { x: 428, y: 168, s: 0.75, c: 3 },
  { x: 406, y: 204, s: 0.95, c: 1 },
  { x: 384, y: 198, s: 0.8, c: 4 },
  { x: 362, y: 236, s: 1.05, c: 2 },
  { x: 344, y: 228, s: 0.7, c: 0 },
  { x: 328, y: 268, s: 0.9, c: 5 },
  { x: 312, y: 292, s: 0.8, c: 1 },
  { x: 298, y: 326, s: 0.75, c: 3 },
  { x: 288, y: 358, s: 0.7, c: 2 },
  { x: 720, y: 96, s: 0.85, c: 4 },
  { x: 692, y: 124, s: 0.9, c: 0 },
  { x: 662, y: 148, s: 1, c: 1 },
  { x: 630, y: 176, s: 0.8, c: 5 },
  { x: 598, y: 198, s: 0.95, c: 2 },
  { x: 566, y: 226, s: 0.85, c: 3 },
  { x: 534, y: 252, s: 1, c: 0 },
  { x: 504, y: 278, s: 0.75, c: 4 },
  { x: 476, y: 304, s: 0.9, c: 1 },
  { x: 450, y: 332, s: 0.8, c: 2 },
  { x: 428, y: 360, s: 0.7, c: 5 },
  { x: 408, y: 390, s: 0.75, c: 0 },
  { x: 392, y: 422, s: 0.65, c: 3 },
  { x: 758, y: 140, s: 0.7, c: 1 },
  { x: 742, y: 186, s: 0.8, c: 4 },
  { x: 728, y: 232, s: 0.75, c: 2 },
  { x: 716, y: 286, s: 0.7, c: 0 },
  { x: 706, y: 340, s: 0.65, c: 5 },
  { x: 698, y: 396, s: 0.6, c: 1 },
  { x: 690, y: 454, s: 0.55, c: 3 },
  { x: 780, y: 78, s: 0.7, c: 2 },
  { x: 772, y: 168, s: 0.65, c: 0 },
  { x: 764, y: 248, s: 0.6, c: 4 },
  { x: 548, y: 168, s: 0.7, c: 1 },
  { x: 490, y: 220, s: 0.75, c: 5 },
  { x: 438, y: 274, s: 0.7, c: 2 },
  { x: 394, y: 318, s: 0.65, c: 0 },
  { x: 620, y: 132, s: 0.8, c: 3 },
  { x: 574, y: 164, s: 0.7, c: 4 },
  { x: 640, y: 210, s: 0.65, c: 1 },
  { x: 512, y: 198, s: 0.7, c: 2 },
  { x: 468, y: 248, s: 0.75, c: 0 },
  { x: 352, y: 310, s: 0.65, c: 5 },
  { x: 336, y: 348, s: 0.6, c: 1 },
  { x: 792, y: 52, s: 0.9, c: 3 },
]

function Blossom({ x, y, s, c }: { x: number; y: number; s: number; c: number }) {
  const fill = PALETTE[c % PALETTE.length]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="0"
          cy="-5"
          rx="2.8"
          ry="5.2"
          fill={fill}
          transform={`rotate(${deg})`}
        />
      ))}
      <circle r="1.8" fill="#fff6f8" />
    </g>
  )
}

export function SakuraTree() {
  return (
    <svg
      className="absolute -top-[7%] -right-[4%] h-[122%] w-[min(70vw,900px)]"
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMaxYMin meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Off-screen right: the trunk never enters the frame. Limbs come in at the top-right. */}
      <path
        d="M830-40C790 90 762 250 742 420C730 560 722 720 716 880"
        stroke={BARK}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M820 60C802 190 792 340 786 500C782 640 780 760 778 860"
        stroke={BARK_MID}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M810-8C688 48 558 118 456 198C374 268 326 348 304 438"
        stroke={BARK}
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      <path
        d="M800 34C678 104 536 184 428 274C348 354 308 436 292 518"
        stroke={BARK_MID}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M792 72C698 142 576 214 476 296C404 366 364 438 348 512"
        stroke={BARK_MID}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M800 2C718 32 616 74 524 136C452 188 400 240 358 298"
        stroke={BARK_TWIG}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M760 12C678 62 596 114 516 176C454 220 404 270 372 322"
        stroke={BARK_TWIG}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M700 48C648 100 606 162 584 226"
        stroke={BARK_TWIG}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M608 96C556 148 516 198 494 256"
        stroke={BARK_TWIG}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M522 162C490 204 470 254 458 308"
        stroke={BARK_TWIG}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M430 248C398 292 382 342 374 396"
        stroke={BARK_TWIG}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M478 278C446 322 426 372 418 424"
        stroke={BARK_TWIG}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M338 372C322 416 314 458 310 504"
        stroke={BARK_TWIG}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M748 198C726 262 716 334 710 408"
        stroke={BARK_TWIG}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M640 208C608 258 586 310 574 366"
        stroke={BARK_TWIG}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M560 218C528 270 508 322 496 376"
        stroke={BARK_TWIG}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {BLOSSOMS.map((blossom, i) => (
        <Blossom key={i} {...blossom} />
      ))}
    </svg>
  )
}
