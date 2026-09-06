import { Canvas, useFrame, useThree, type DomEvent, type RootState } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { MarkKey } from '../data/marks'
import { meshEdges, meshNodes } from '../data/resume'
import { labelTexture, markTexture } from './markTexture'

const TINT = {
  gateway: '#9BF5EA',
  service: '#38E0D0',
  store: '#7FA6FF',
  ai: '#FFB454',
} as const

const SIZE = { gateway: 0.17, service: 0.155, store: 0.125, ai: 0.21 } as const

/** How far the technology mark spans, as a multiple of the node radius. */
const MARK = { gateway: 3.4, service: 2.9, store: 3.1, ai: 3.1 } as const

const HALO = { gateway: 7, service: 6.2, store: 5.2, ai: 5.4 } as const

/** Ember is the brightest hue in the palette, so the AI node needs the least
 *  halo to still read as the warmest thing on the mesh. Any more and it stops
 *  being a node and becomes a small sun competing with the headline. */
const HALO_OPACITY = { gateway: 0.36, service: 0.46, store: 0.34, ai: 0.38 } as const

/** The gateway earns a bigger cage — it is a structure, not another service.
 *  The rest are sized to hold their mark with a little room to spare. */
const CAGE = { gateway: 4.6, service: 2.7, store: 2.8, ai: 2.9 } as const

const CAGE_OPACITY = { gateway: 0.3, service: 0.17, store: 0.15, ai: 0.2 } as const

/** Radial falloff sprite. One canvas texture, shared by every glow in the scene. */
function makeGlow() {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.13)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** All edges as one LineSegments, brighter at the endpoints than mid-span. */
function Edges() {
  const geometry = useMemo(() => {
    const pos: number[] = []
    const col: number[] = []
    const lit = new THREE.Color('#33507F')
    const mid = new THREE.Color('#1B2440')

    for (const [a, b] of meshEdges) {
      const A = new THREE.Vector3(...meshNodes[a].pos)
      const B = new THREE.Vector3(...meshNodes[b].pos)
      // Split each edge in two so the middle can be dimmer than the ends.
      const M = A.clone().lerp(B, 0.5)
      pos.push(A.x, A.y, A.z, M.x, M.y, M.z)
      pos.push(M.x, M.y, M.z, B.x, B.y, B.z)
      col.push(lit.r, lit.g, lit.b, mid.r, mid.g, mid.b)
      col.push(mid.r, mid.g, mid.b, lit.r, lit.g, lit.b)
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    return g
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.85} />
    </lineSegments>
  )
}

const WHITE = new THREE.Color('#ffffff')

/** One moving part of the flow: halo, wireframe cage, and the mark of the
 *  technology it runs on. Pointing at it brightens the node and names it. */
function Node({
  node,
  glow,
  glyph,
  label,
  lit,
  onEnter,
  onLeave,
  still,
  canHover,
}: {
  node: (typeof meshNodes)[number]
  glow: THREE.Texture
  glyph: THREE.Texture
  label: THREE.Texture
  lit: boolean
  onEnter: (id: string) => void
  onLeave: (id: string) => void
  still: boolean
  canHover: boolean
}) {
  const tint = TINT[node.kind]
  const r = SIZE[node.kind]
  const halo = useRef<THREE.Sprite>(null)
  const cage = useRef<THREE.Mesh>(null)
  const bloom = useRef<THREE.Sprite>(null)
  const mark = useRef<THREE.Sprite>(null)
  const plate = useRef<THREE.Sprite>(null)
  const seed = useMemo(() => Math.random() * Math.PI * 2, [])
  const on = useRef(0)
  const invalidate = useThree((s) => s.invalidate)

  // The mark sits well above its own tint so it reads against the halo behind
  // it; pointing at the node takes it the rest of the way to white.
  const rest = useMemo(() => new THREE.Color(tint).lerp(WHITE, 0.38), [tint])
  const scratch = useMemo(() => new THREE.Color(), [])

  // A frozen canvas only draws on request, so ask for frames while easing.
  useEffect(() => {
    if (still) invalidate()
  }, [lit, still, invalidate])

  useFrame(({ clock }, delta) => {
    const want = lit ? 1 : 0
    on.current += (want - on.current) * Math.min(1, delta * 9)
    const e = on.current
    const t = still ? 0 : clock.elapsedTime

    if (halo.current) {
      // Each node breathes on its own offset, so the mesh never pulses in unison.
      const breathe = still ? 1 : 1 + 0.09 * Math.sin(t * 1.1 + seed)
      halo.current.scale.setScalar(r * HALO[node.kind] * breathe * (1 + 0.2 * e))
      const material = halo.current.material as THREE.SpriteMaterial
      material.opacity = HALO_OPACITY[node.kind] * (1 + 0.85 * e)
    }

    if (cage.current) {
      cage.current.scale.setScalar(CAGE[node.kind] * (1 + 0.15 * e))
      cage.current.rotation.y += delta * 0.9 * e
      const material = cage.current.material as THREE.MeshBasicMaterial
      material.opacity = CAGE_OPACITY[node.kind] * (1 + 1.8 * e)
    }

    if (bloom.current) {
      bloom.current.scale.setScalar(r * MARK[node.kind] * (1.4 + 0.15 * e))
      const material = bloom.current.material as THREE.SpriteMaterial
      material.opacity = 0.5 + 0.4 * e
    }

    if (mark.current) {
      mark.current.scale.setScalar(r * MARK[node.kind] * (1 + 0.26 * e))
      const material = mark.current.material as THREE.SpriteMaterial
      material.color.copy(scratch.copy(rest).lerp(WHITE, e))
    }

    if (plate.current) {
      plate.current.visible = e > 0.01
      const canvas = label.image as HTMLCanvasElement
      const height = 0.5
      plate.current.scale.set(height * (canvas.width / canvas.height), height, 1)
      const material = plate.current.material as THREE.SpriteMaterial
      material.opacity = e
    }

    if (still && Math.abs(want - on.current) > 0.002) invalidate()
  })

  return (
    <group position={node.pos}>
      <sprite ref={halo} renderOrder={0}>
        <spriteMaterial
          map={glow}
          color={tint}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={HALO_OPACITY[node.kind]}
        />
      </sprite>
      <mesh ref={cage} scale={CAGE[node.kind]} renderOrder={1}>
        <icosahedronGeometry args={[r, 0]} />
        <meshBasicMaterial color={tint} wireframe transparent opacity={CAGE_OPACITY[node.kind]} />
      </mesh>
      {/* The mark's own silhouette, blown up and added back underneath, so the
          logo sits in a glow of its node's colour instead of on flat black. */}
      <sprite ref={bloom} scale={r * MARK[node.kind] * 1.4} renderOrder={2}>
        <spriteMaterial
          map={glyph}
          color={tint}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      <sprite ref={mark} scale={r * MARK[node.kind]} renderOrder={3}>
        {/* Marks name things, so they are exempt from the fog and the tone
            curve that give the rest of the mesh its depth. */}
        <spriteMaterial
          map={glyph}
          color={rest}
          transparent
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      <sprite
        ref={plate}
        visible={false}
        position={[0, -(r * MARK[node.kind] * 0.5 + 0.3), 0]}
        renderOrder={4}
      >
        <spriteMaterial
          map={label}
          transparent
          opacity={0}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      {/* Invisible but raycastable: a forgiving target around a small mark. */}
      {canHover && (
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation()
            onEnter(node.id)
          }}
          onPointerOut={() => onLeave(node.id)}
        >
          <sphereGeometry args={[Math.max(r * MARK[node.kind] * 0.62, 0.34), 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

const PER_EDGE = 2

/** Requests in flight. One draw call for every packet on the mesh. */
function Traffic({ glow }: { glow: THREE.Texture }) {
  const points = useRef<THREE.Points>(null)

  const { geometry, lanes } = useMemo(() => {
    const aiNodes = new Set([10, 11])
    const lanes: { a: THREE.Vector3; b: THREE.Vector3; t: number; speed: number }[] = []
    const col: number[] = []
    const signal = new THREE.Color('#7CF5E8')
    const ember = new THREE.Color('#FFC978')

    meshEdges.forEach(([a, b]) => {
      const isAi = aiNodes.has(a) || aiNodes.has(b)
      for (let i = 0; i < PER_EDGE; i++) {
        lanes.push({
          a: new THREE.Vector3(...meshNodes[a].pos),
          b: new THREE.Vector3(...meshNodes[b].pos),
          t: (i / PER_EDGE + Math.random() * 0.4) % 1,
          speed: 0.1 + Math.random() * 0.18,
        })
        const c = isAi ? ember : signal
        col.push(c.r, c.g, c.b)
      }
    })

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(lanes.length * 3), 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    return { geometry: g, lanes }
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const step = Math.min(delta, 0.05)

    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i]
      lane.t = (lane.t + lane.speed * step) % 1
      // Ease so packets slow as they arrive, the way a call settles.
      const e = lane.t < 0.5 ? 2 * lane.t * lane.t : 1 - Math.pow(-2 * lane.t + 2, 2) / 2
      arr[i * 3] = lane.a.x + (lane.b.x - lane.a.x) * e
      arr[i * 3 + 1] = lane.a.y + (lane.b.y - lane.a.y) * e
      arr[i * 3 + 2] = lane.a.z + (lane.b.z - lane.a.z) * e
    }
    attr.needsUpdate = true
    if (points.current) points.current.geometry = geometry
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        map={glow}
        size={0.42}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Far-field dust. Gives the mesh something to sit in front of. */
function Depth({ glow }: { glow: THREE.Texture }) {
  const geometry = useMemo(() => {
    const n = 220
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16
      pos[i * 3 + 2] = -6 - Math.random() * 16
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        map={glow}
        color="#4A5F8F"
        size={0.5}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Centre of the node cloud. Rotating about this rather than the origin keeps
 *  the mesh in frame once it is scaled down to fit a narrow viewport. */
const CENTROID: [number, number, number] = [-1.34, -0.43, -0.24]
const ORIGIN: [number, number, number] = [0, 0, 0]

/** How much of the cloud's half-width has to be on screen at narrow widths.
 *  Short of its full 3.9 reach, so the two outermost nodes bleed off the edges:
 *  scaled to hold everything, a mark is too small to recognise, and a logo you
 *  cannot read costs more than two nodes you cannot see. */
const REACH = 2.9

/**
 * A wide viewport crops the mesh on purpose — it fills the right of the hero.
 * A narrow portrait one shows so little width that the same crop reads as two
 * stray wireframe cages, so below 768px the cloud is scaled to fit its centre.
 */
function useFit() {
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const camera = useThree((s) => s.camera)

  return useMemo(() => {
    if (width >= 768) return { scale: 1, offset: ORIGIN }
    const cam = camera as THREE.PerspectiveCamera
    const halfV = Math.tan((cam.fov * Math.PI) / 360) * cam.position.z
    const halfH = halfV * (width / height)
    return { scale: Math.min(1, halfH / REACH), offset: CENTROID }
  }, [width, height, camera])
}

function Scene({
  still,
  canHover,
  hovered,
  onEnter,
  onLeave,
}: {
  still: boolean
  canHover: boolean
  hovered: string | null
  onEnter: (id: string) => void
  onLeave: (id: string) => void
}) {
  const group = useRef<THREE.Group>(null)
  const glow = useMemo(makeGlow, [])
  const pointer = useThree((s) => s.pointer)
  const invalidate = useThree((s) => s.invalidate)
  const born = useRef(0)
  const fit = useFit()

  // One texture per distinct technology, and one readout per node.
  const glyphs = useMemo(() => {
    const cache = {} as Record<MarkKey, THREE.Texture>
    for (const node of meshNodes) {
      cache[node.mark] ??= markTexture(node.mark, 256, invalidate)
    }
    return cache
  }, [invalidate])

  const labels = useMemo(() => {
    const cache: Record<string, THREE.Texture> = {}
    for (const node of meshNodes) {
      cache[node.id] = labelTexture(node.label, node.id, invalidate)
    }
    return cache
  }, [invalidate])

  useEffect(() => () => glow.dispose(), [glow])
  useEffect(() => {
    const all = [...Object.values(glyphs), ...Object.values(labels)]
    return () => all.forEach((t) => t.dispose())
  }, [glyphs, labels])

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return

    if (still) {
      g.rotation.set(-0.12, 0.5, 0)
      g.scale.setScalar(fit.scale)
      return
    }

    born.current = Math.min(born.current + delta, 1.6)
    // Settle into place once, then follow the pointer for good.
    const ease = 1 - Math.pow(1 - Math.min(born.current / 1.6, 1), 4)
    g.scale.setScalar(fit.scale * (0.82 + 0.18 * ease))

    const targetY = pointer.x * 0.42
    const targetX = -pointer.y * 0.26
    // Reading a node steadies the mesh, so the label does not slide away.
    const follow = hovered ? 0.014 : 0.045
    const drift = hovered ? 0 : delta * 0.035
    g.rotation.y += (targetY - g.rotation.y) * follow + drift
    g.rotation.x += (targetX - g.rotation.x) * follow
  })

  return (
    <>
      <fog attach="fog" args={['#0a0e1a', 9, 24]} />
      <Depth glow={glow} />
      <group ref={group}>
        <group position={fit.offset}>
          <Edges />
          {meshNodes.map((n) => (
            <Node
              key={n.id}
              node={n}
              glow={glow}
              glyph={glyphs[n.mark]}
              label={labels[n.id]}
              lit={hovered === n.id}
              onEnter={onEnter}
              onLeave={onLeave}
              still={still}
              canHover={canHover}
            />
          ))}
          {!still && <Traffic glow={glow} />}
        </group>
      </group>
    </>
  )
}

/**
 * Pointer position from the client rect of the canvas itself. r3f's own
 * `eventPrefix="client"` divides clientX by the canvas width and ignores where
 * the canvas actually sits, which is only correct at the top of the document —
 * this hero is at the top, but it does not stay under the pointer once the page
 * scrolls, and a raycast that drifts with scroll is worse than none.
 */
function computeFromRect(event: DomEvent, state: RootState) {
  const rect = state.gl.domElement.getBoundingClientRect()
  state.pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  )
  state.raycaster.setFromCamera(state.pointer, state.camera)
}

export function ServiceMesh({
  still = false,
  canHover = true,
  eventSource,
  onHover,
}: {
  still?: boolean
  canHover?: boolean
  /** The hero itself. The canvas is painted behind the words, so the words are
   *  what the pointer actually lands on: events have to be read from there. */
  eventSource?: HTMLElement | null
  onHover?: (node: (typeof meshNodes)[number] | null) => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  // Mirrored in a ref so a pointer-out can tell whether it is the node still
  // being read, or one the pointer already left.
  const current = useRef<string | null>(null)

  const set = (id: string | null) => {
    if (current.current === id) return
    current.current = id
    setHovered(id)
    onHover?.(id === null ? null : (meshNodes.find((n) => n.id === id) ?? null))
  }

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.4, 9.2], fov: 42 }}
      frameloop={still ? 'demand' : 'always'}
      eventSource={(canHover && eventSource) || undefined}
      onCreated={(state) => {
        if (canHover && eventSource) state.setEvents({ compute: computeFromRect })
      }}
      // Nothing is ever clicked on the canvas itself: on touch a hover state
      // cannot happen, and on a mouse the events arrive from the hero instead.
      style={{ pointerEvents: 'none' }}
    >
      <Scene
        still={still}
        canHover={canHover}
        hovered={hovered}
        onEnter={set}
        onLeave={(id) => {
          if (current.current === id) set(null)
        }}
      />
    </Canvas>
  )
}
