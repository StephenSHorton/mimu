import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type SakuraHandle = {
  dispose: () => void
}

type FlowerSpawn = {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  scale: number
  color: THREE.Color
}

type Faller = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  spin: number
  tilt: number
  phase: number
  scale: number
}

/** Local space: (0,0) is the top-right corner. +X is off-screen right, -Y is down.
 *  Wood may occupy the right third. Nothing is allowed left of this. */
const LEFTMOST = -0.72

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeLimb(
  a: THREE.Vector3,
  b: THREE.Vector3,
  radiusA: number,
  radiusB: number,
): THREE.BufferGeometry {
  const dir = b.clone().sub(a)
  const length = dir.length()
  const geometry = new THREE.CylinderGeometry(
    Math.max(0.004, radiusB),
    Math.max(0.005, radiusA),
    length,
    7,
    1,
    false,
  )
  geometry.translate(0, length / 2, 0)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  )
  geometry.applyQuaternion(quaternion)
  geometry.translate(a.x, a.y, a.z)
  return geometry
}

function createPetalGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.bezierCurveTo(0.14, 0.06, 0.2, 0.26, 0.04, 0.4)
  shape.bezierCurveTo(0.012, 0.47, -0.012, 0.47, -0.04, 0.4)
  shape.bezierCurveTo(-0.2, 0.26, -0.14, 0.06, 0, 0)
  const geometry = new THREE.ShapeGeometry(shape, 6)
  geometry.translate(0, -0.02, 0)
  return geometry
}

function createFlowerGeometry() {
  const petal = createPetalGeometry()
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 5; i += 1) {
    const next = petal.clone()
    next.rotateZ((i * Math.PI * 2) / 5)
    parts.push(next)
  }
  petal.dispose()
  const merged = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  if (!merged) throw new Error('Could not build a sakura blossom')
  merged.computeVertexNormals()
  return merged
}

function clampPoint(p: THREE.Vector3) {
  p.x = Math.max(LEFTMOST, p.x)
  return p
}

function addPolyline(
  points: THREE.Vector3[],
  radius: number,
  limbs: THREE.BufferGeometry[],
  flowers: FlowerSpawn[],
  rand: () => number,
  bloom = true,
) {
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = clampPoint(points[i].clone())
    const b = clampPoint(points[i + 1].clone())
    const t0 = i / Math.max(1, points.length - 1)
    const t1 = (i + 1) / Math.max(1, points.length - 1)
    limbs.push(makeLimb(a, b, radius * (1 - t0 * 0.35), radius * (1 - t1 * 0.4)))
    if (bloom) {
      const count = 3 + Math.floor(rand() * 4)
      for (let k = 0; k < count; k += 1) {
        flowers.push(spawnFlower(a, b, b.clone().sub(a).normalize(), rand))
      }
    }
  }
}

function hangTwigs(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  radius: number,
  depth: number,
  rand: () => number,
  limbs: THREE.BufferGeometry[],
  flowers: FlowerSpawn[],
) {
  if (depth > 2 || radius < 0.004 || origin.x < LEFTMOST + 0.05) return
  const dir = direction.clone().normalize()
  dir.y = -Math.abs(dir.y) - 0.45
  // Hang down. Drift left only while still on the right third.
  dir.x = origin.x < -0.42 ? Math.max(0, dir.x) * 0.15 : Math.min(-0.05, dir.x)
  dir.normalize()
  const end = clampPoint(origin.clone().add(dir.multiplyScalar(length)))
  if (end.x < LEFTMOST) return
  limbs.push(makeLimb(origin, end, radius, radius * 0.55))
  const buds = 3 + Math.floor(rand() * 4)
  for (let k = 0; k < buds; k += 1) {
    flowers.push(spawnFlower(origin, end, dir, rand, 0.08))
  }
  if (depth < 2) {
    hangTwigs(
      end,
      dir.clone().add(new THREE.Vector3(-0.08 - rand() * 0.12, -0.55, rand() - 0.5)).normalize(),
      length * 0.58,
      radius * 0.55,
      depth + 1,
      rand,
      limbs,
      flowers,
    )
  }
}

function spawnFlower(
  a: THREE.Vector3,
  b: THREE.Vector3,
  dir: THREE.Vector3,
  rand: () => number,
  scatter = 0.06,
): FlowerSpawn {
  const position = clampPoint(
    a
      .clone()
      .lerp(b, rand())
      .add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(scatter)),
  )
  const normal = dir
    .clone()
    .add(new THREE.Vector3(rand() - 0.5, rand() * 0.8, rand() - 0.5))
    .normalize()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  quaternion.multiply(
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rand() * Math.PI * 2),
  )
  const palette = [0xffb7c5, 0xffc2d4, 0xffd6e0, 0xf48fb1, 0xff9eb5, 0xffe4ec]
  return {
    position,
    quaternion,
    scale: 0.028 + rand() * 0.034,
    color: new THREE.Color(palette[Math.floor(rand() * palette.length)]),
  }
}

export function mountSakura(
  canvas: HTMLCanvasElement,
  options: { reducedMotion: boolean },
): SakuraHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0xffeef4, 0.02)

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40)
  camera.position.set(0, 0, 8)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xffe6ef, 0.72))
  scene.add(new THREE.HemisphereLight(0xffd6e8, 0x6b4a38, 0.85))
  const key = new THREE.DirectionalLight(0xfff1e4, 1.15)
  key.position.set(4, 3, 4)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xffb3c9, 0.5)
  rim.position.set(-2, 1, -3)
  scene.add(rim)
  const glow = new THREE.PointLight(0xff9eb5, 1.2, 10, 1.6)
  glow.position.set(2.4, 1.6, 1)
  scene.add(glow)

  const compact = window.innerWidth < 800
  const rand = mulberry32(20260921)
  const limbs: THREE.BufferGeometry[] = []
  const flowers: FlowerSpawn[] = []

  // Off-screen right / top-right → hang down. No bottom-left trunk.
  const hangs: { radius: number; points: [number, number, number][] }[] = [
    {
      radius: 0.062,
      points: [
        [0.48, 0.32, 0.05],
        [0.28, 0.08, 0.04],
        [0.12, -0.22, 0.03],
        [0.02, -0.52, 0.02],
        [-0.06, -0.86, 0.01],
        [-0.12, -1.22, 0],
        [-0.14, -1.48, -0.01],
      ],
    },
    {
      radius: 0.028,
      points: [
        [0.36, 0.22, -0.06],
        [0.14, -0.06, -0.05],
        [-0.08, -0.36, -0.04],
        [-0.28, -0.68, -0.03],
        [-0.46, -0.98, -0.02],
        [-0.56, -1.26, -0.02],
      ],
    },
    {
      radius: 0.02,
      points: [
        [0.24, 0.16, 0.07],
        [0.02, -0.14, 0.06],
        [-0.22, -0.44, 0.05],
        [-0.44, -0.76, 0.04],
        [-0.62, -1.08, 0.03],
        [-0.7, -1.34, 0.02],
      ],
    },
    {
      radius: 0.016,
      points: [
        [0.18, 0.08, -0.08],
        [-0.04, -0.2, -0.07],
        [-0.26, -0.5, -0.06],
        [-0.44, -0.82, -0.05],
        [-0.58, -1.12, -0.04],
      ],
    },
    {
      radius: 0.014,
      points: [
        [0.42, 0.1, 0.02],
        [0.34, -0.22, 0.01],
        [0.28, -0.58, 0],
        [0.24, -0.96, -0.01],
        [0.22, -1.28, -0.02],
      ],
    },
  ]

  for (const hang of hangs) {
    const pts = hang.points.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    addPolyline(pts, hang.radius, limbs, flowers, rand, true)
    const tip = pts[pts.length - 1]
    const along = tip.clone().sub(pts[0]).normalize()
    hangTwigs(
      tip,
      along.add(new THREE.Vector3(-0.15, -0.4, 0)).normalize(),
      compact ? 0.22 : 0.32,
      hang.radius * 0.4,
      0,
      rand,
      limbs,
      flowers,
    )
  }

  const barkGeometry = mergeGeometries(limbs)
  for (const limb of limbs) limb.dispose()
  const tree = new THREE.Group()
  if (barkGeometry) {
    tree.add(
      new THREE.Mesh(
        barkGeometry,
        new THREE.MeshStandardMaterial({
          color: 0x4a3228,
          roughness: 0.92,
          metalness: 0.02,
        }),
      ),
    )
  }

  const blossomCount = Math.min(flowers.length, compact ? 900 : 1800)
  const flowerGeometry = createFlowerGeometry()
  const flowerMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.48,
    metalness: 0,
    sheen: 0.7,
    sheenColor: new THREE.Color(0xffe0ea),
    sheenRoughness: 0.38,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  })
  const blossoms = new THREE.InstancedMesh(flowerGeometry, flowerMaterial, blossomCount)
  blossoms.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < blossomCount; i += 1) {
    const flower = flowers[i]
    dummy.position.copy(flower.position)
    dummy.quaternion.copy(flower.quaternion)
    dummy.scale.setScalar(flower.scale)
    dummy.updateMatrix()
    blossoms.setMatrixAt(i, dummy.matrix)
    blossoms.setColorAt(i, flower.color)
  }
  blossoms.instanceMatrix.needsUpdate = true
  blossoms.instanceColor!.needsUpdate = true
  tree.add(blossoms)
  scene.add(tree)

  const fallCount = options.reducedMotion ? 0 : compact ? 80 : 150
  const petalGeometry = createPetalGeometry()
  const petalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffc2d4,
    roughness: 0.42,
    sheen: 0.8,
    sheenColor: new THREE.Color(0xffe8ee),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  })
  const falling = new THREE.InstancedMesh(petalGeometry, petalMaterial, Math.max(1, fallCount))
  falling.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  const fallers: Faller[] = []
  const resetFaller = (petal: Faller, first = false) => {
    petal.x = 0.55 + rand() * 0.55
    petal.y = first ? -0.2 - rand() * 1.4 : 0.15 + rand() * 0.2
    petal.z = (rand() - 0.5) * 0.3
    petal.vx = -(0.04 + rand() * 0.08)
    petal.vy = -(0.16 + rand() * 0.18)
    petal.vz = (rand() - 0.5) * 0.08
    petal.spin = rand() * Math.PI * 2
    petal.tilt = rand() * Math.PI
    petal.phase = rand() * Math.PI * 2
    petal.scale = 0.035 + rand() * 0.03
  }
  for (let i = 0; i < fallCount; i += 1) {
    const petal: Faller = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      spin: 0,
      tilt: 0,
      phase: 0,
      scale: 0.1,
    }
    resetFaller(petal, true)
    fallers.push(petal)
  }
  const petalGroup = new THREE.Group()
  petalGroup.add(falling)
  scene.add(petalGroup)

  const setSize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
    renderer.setSize(width, height, false)
    const aspect = width / Math.max(1, height)
    camera.aspect = aspect
    camera.position.set(0, 0, 8)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    const dist = camera.position.z
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist
    const halfW = halfH * aspect
    const scale = Math.min(halfW * 1.05, halfH * 1.22)
    // Local origin sits on the top-right corner — trunk never enters from the left.
    tree.position.set(halfW * 0.995, halfH * 1.03, 0)
    tree.scale.setScalar(scale)
    petalGroup.position.copy(tree.position)
    petalGroup.scale.setScalar(scale)
  }
  setSize()

  let frame = 0
  let last = performance.now()
  const basePositions = flowers.slice(0, blossomCount).map((flower) => flower.position.clone())

  const renderFrame = (now: number, animate: boolean) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (animate) {
      const t = now * 0.001
      for (let i = 0; i < blossomCount; i += 1) {
        const flower = flowers[i]
        dummy.position.copy(basePositions[i])
        dummy.position.x += Math.sin(t * 0.7 + i * 0.17) * 0.006
        dummy.position.y += Math.sin(t * 0.9 + i * 0.11) * 0.005
        dummy.quaternion.copy(flower.quaternion)
        dummy.rotateZ(Math.sin(t * 1.1 + i) * 0.08)
        dummy.scale.setScalar(flower.scale)
        dummy.updateMatrix()
        blossoms.setMatrixAt(i, dummy.matrix)
      }
      blossoms.instanceMatrix.needsUpdate = true

      for (let i = 0; i < fallers.length; i += 1) {
        const petal = fallers[i]
        petal.x += (petal.vx + Math.sin(now * 0.001 + petal.phase) * 0.08) * dt
        petal.y += petal.vy * dt
        petal.z += petal.vz * dt
        petal.spin += dt * 1.4
        petal.tilt += dt * 0.9
        if (petal.y < -1.6 || petal.x < -1.2) resetFaller(petal)
        dummy.position.set(petal.x, petal.y, petal.z)
        dummy.rotation.set(petal.tilt, petal.spin, petal.phase)
        dummy.scale.setScalar(petal.scale)
        dummy.updateMatrix()
        falling.setMatrixAt(i, dummy.matrix)
      }
      if (fallers.length) falling.instanceMatrix.needsUpdate = true
    }
    renderer.render(scene, camera)
  }

  renderFrame(performance.now(), false)

  const onResize = () => {
    setSize()
    renderer.render(scene, camera)
  }
  window.addEventListener('resize', onResize)

  const loop = (now: number) => {
    if (!document.hidden) renderFrame(now, true)
    frame = requestAnimationFrame(loop)
  }
  if (!options.reducedMotion) frame = requestAnimationFrame(loop)

  return {
    dispose: () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      flowerGeometry.dispose()
      petalGeometry.dispose()
      barkGeometry?.dispose()
      flowerMaterial.dispose()
      petalMaterial.dispose()
      blossoms.dispose()
      falling.dispose()
      renderer.dispose()
    },
  }
}
