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
    Math.max(0.006, radiusB),
    Math.max(0.008, radiusA),
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

function grow(
  start: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  radius: number,
  depth: number,
  maxDepth: number,
  rand: () => number,
  limbs: THREE.BufferGeometry[],
  flowers: FlowerSpawn[],
) {
  const segments = depth === 0 ? 5 : depth < 3 ? 4 : 3
  let point = start.clone()
  let dir = direction.clone().normalize()

  for (let i = 0; i < segments; i += 1) {
    dir
      .add(
        new THREE.Vector3(
          (rand() - 0.28) * 0.38,
          0.07 + (rand() - 0.42) * 0.14,
          (rand() - 0.5) * 0.3,
        ),
      )
      .normalize()
    const next = point.clone().add(dir.clone().multiplyScalar(length / segments))
    const t0 = i / segments
    const t1 = (i + 1) / segments
    limbs.push(makeLimb(point, next, radius * (1 - t0 * 0.2), radius * (1 - t1 * 0.22)))

    if (depth >= 2 && (depth >= 3 || i >= segments - 2)) {
      const count = depth >= 4 ? 4 + Math.floor(rand() * 5) : 2 + Math.floor(rand() * 3)
      for (let k = 0; k < count; k += 1) {
        flowers.push(spawnFlower(point, next, dir, rand))
      }
    }
    point = next
  }

  if (depth >= maxDepth || radius < 0.02) {
    const tips = 6 + Math.floor(rand() * 7)
    for (let k = 0; k < tips; k += 1) {
      flowers.push(spawnFlower(point, point.clone().add(dir), dir, rand, 0.22))
    }
    return
  }

  const childCount = depth === 0 ? 4 : depth === 1 ? 3 : 2 + (rand() > 0.5 ? 1 : 0)
  for (let c = 0; c < childCount; c += 1) {
    const axis = new THREE.Vector3(rand() - 0.5, rand() * 0.45, rand() - 0.5).normalize()
    const childDir = dir.clone().applyAxisAngle(axis, 0.32 + rand() * 0.62)
    childDir.y = Math.abs(childDir.y) * 0.5 + 0.28
    childDir.x += 0.22
    childDir.normalize()
    grow(
      point,
      childDir,
      length * (0.56 + rand() * 0.24),
      radius * (0.46 + rand() * 0.16),
      depth + 1,
      maxDepth,
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
  scatter = 0.14,
): FlowerSpawn {
  const position = a
    .clone()
    .lerp(b, rand())
    .add(new THREE.Vector3(rand() - 0.5, rand() - 0.15, rand() - 0.5).multiplyScalar(scatter))
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
    scale: 0.042 + rand() * 0.055,
    color: new THREE.Color(palette[Math.floor(rand() * palette.length)]),
  }
}

function canopyBounds(flowers: FlowerSpawn[]) {
  const box = new THREE.Box3()
  for (const flower of flowers) box.expandByPoint(flower.position)
  return box
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
  scene.fog = new THREE.FogExp2(0xffeef4, 0.032)

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40)
  camera.position.set(1.55, 1.35, 7.1)
  camera.lookAt(0.15, 2.05, 0)

  scene.add(new THREE.AmbientLight(0xffe6ef, 0.72))
  const hemi = new THREE.HemisphereLight(0xffd6e8, 0x6b4a38, 0.85)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff1e4, 1.15)
  key.position.set(4.2, 6.4, 3.4)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xffb3c9, 0.55)
  rim.position.set(-3.2, 2.2, -4)
  scene.add(rim)
  const glow = new THREE.PointLight(0xff9eb5, 1.4, 12, 1.6)
  glow.position.set(-0.6, 3.4, 0.8)
  scene.add(glow)

  const compact = window.innerWidth < 800
  const rand = mulberry32(20260921)
  const limbs: THREE.BufferGeometry[] = []
  const flowers: FlowerSpawn[] = []
  const maxDepth = compact ? 4 : 5

  grow(
    new THREE.Vector3(-3.55, -2.15, 0.15),
    new THREE.Vector3(0.28, 1, -0.04),
    compact ? 2.15 : 2.55,
    0.17,
    0,
    maxDepth,
    rand,
    limbs,
    flowers,
  )
  grow(
    new THREE.Vector3(-3.2, -0.15, 0.05),
    new THREE.Vector3(0.92, 0.28, 0.12),
    compact ? 2.4 : 3.15,
    0.055,
    2,
    maxDepth,
    rand,
    limbs,
    flowers,
  )
  grow(
    new THREE.Vector3(-2.4, 0.85, -0.2),
    new THREE.Vector3(0.72, 0.55, -0.35),
    compact ? 1.8 : 2.4,
    0.04,
    2,
    maxDepth,
    rand,
    limbs,
    flowers,
  )

  const barkGeometry = mergeGeometries(limbs)
  for (const limb of limbs) limb.dispose()
  const tree = new THREE.Group()
  if (barkGeometry) {
    const bark = new THREE.Mesh(
      barkGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x4a3228,
        roughness: 0.92,
        metalness: 0.02,
      }),
    )
    tree.add(bark)
  }

  const blossomCount = Math.min(flowers.length, compact ? 1100 : 2200)
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

  const bounds = canopyBounds(flowers.slice(0, blossomCount))
  const fallCount = options.reducedMotion ? 0 : compact ? 90 : 170
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
    petal.x = bounds.min.x + rand() * Math.max(0.4, bounds.max.x - bounds.min.x + 1.8)
    petal.y = first ? bounds.min.y + rand() * 4.2 : bounds.max.y + rand() * 0.8
    petal.z = bounds.min.z + rand() * Math.max(0.3, bounds.max.z - bounds.min.z)
    petal.vx = 0.12 + rand() * 0.22
    petal.vy = -(0.18 + rand() * 0.2)
    petal.vz = (rand() - 0.5) * 0.12
    petal.spin = rand() * Math.PI * 2
    petal.tilt = rand() * Math.PI
    petal.phase = rand() * Math.PI * 2
    petal.scale = 0.08 + rand() * 0.07
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
  scene.add(falling)

  const setSize = () => {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
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
        dummy.position.x += Math.sin(t * 0.7 + i * 0.17) * 0.012
        dummy.position.y += Math.sin(t * 0.9 + i * 0.11) * 0.01
        dummy.quaternion.copy(flower.quaternion)
        dummy.rotateZ(Math.sin(t * 1.1 + i) * 0.08)
        dummy.scale.setScalar(flower.scale)
        dummy.updateMatrix()
        blossoms.setMatrixAt(i, dummy.matrix)
      }
      blossoms.instanceMatrix.needsUpdate = true

      for (let i = 0; i < fallers.length; i += 1) {
        const petal = fallers[i]
        petal.x += (petal.vx + Math.sin(now * 0.001 + petal.phase) * 0.18) * dt
        petal.y += petal.vy * dt
        petal.z += petal.vz * dt
        petal.spin += dt * 1.4
        petal.tilt += dt * 0.9
        if (petal.y < -2.4 || petal.x > 6.5) resetFaller(petal)
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
