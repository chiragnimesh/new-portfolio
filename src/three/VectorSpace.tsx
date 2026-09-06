import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { POINTS, TOP_K, clusters, queries } from '../data/resume'

/** Same radial sprite as the hero mesh, rebuilt locally so each canvas owns one. */
function makeGlow() {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Box–Muller, so clusters look sampled rather than scattered on a grid. */
function gauss() {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const VERT = /* glsl */ `
  uniform float uScale;
  attribute float aSize;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = color;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // aSize is in world units; uScale converts to device pixels like three's own
    // sizeAttenuation does, so points hold their size across canvas sizes.
    gl_PointSize = aSize * (uScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform sampler2D uGlow;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float a = texture2D(uGlow, gl_PointCoord).a;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`

type Field = {
  positions: Float32Array
  cluster: Uint8Array
  base: Float32Array
}

/** The indexed corpus: points drawn around each cluster centroid. */
function buildField(): Field {
  const positions = new Float32Array(POINTS * 3)
  const cluster = new Uint8Array(POINTS)
  const base = new Float32Array(POINTS * 3)
  const tints = clusters.map((c) => new THREE.Color(c.tint))

  for (let i = 0; i < POINTS; i++) {
    const ci = i % clusters.length
    const centre = clusters[ci].centre
    const spread = 0.5
    positions[i * 3] = centre[0] + gauss() * spread
    positions[i * 3 + 1] = centre[1] + gauss() * spread
    positions[i * 3 + 2] = centre[2] + gauss() * spread
    cluster[i] = ci
    const t = tints[ci]
    base[i * 3] = t.r
    base[i * 3 + 1] = t.g
    base[i * 3 + 2] = t.b
  }
  return { positions, cluster, base }
}

/* Sizes are world units. On this camera, 0.18 lands at roughly 6 CSS pixels.
   Muted points stay clearly visible — the whole corpus is the context that
   makes the retrieved slice mean something. And hits stay small enough that
   26 of them side by side read as records, not as one additive smear. */
const IDLE = { size: 0.18, alpha: 0.55 }
const HIT = { size: 0.32, alpha: 1 }
const MUTED = { size: 0.14, alpha: 0.34 }

function Corpus({
  active,
  pulse,
  glow,
  still,
}: {
  active: number | null
  pulse: boolean
  glow: THREE.Texture
  still: boolean
}) {
  const field = useMemo(buildField, [])
  const pts = useRef<THREE.Points>(null)
  const marker = useRef<THREE.Sprite>(null)
  const lines = useRef<THREE.LineSegments>(null)
  const frame = useRef<THREE.Group>(null)
  const reveal = useRef(0)
  // Scratch objects for the framing quaternion, so no allocation per frame.
  const aim = useMemo(() => new THREE.Quaternion(), [])
  const qDir = useMemo(() => new THREE.Vector3(), [])
  const camDir = useMemo(() => new THREE.Vector3(), [])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(field.positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(field.base.slice(), 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(POINTS).fill(IDLE.size), 1))
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(POINTS).fill(IDLE.alpha), 1))
    return g
  }, [field])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uGlow: { value: glow }, uScale: { value: 200 } },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      }),
    [glow],
  )

  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TOP_K * 6), 3))
    return g
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
      lineGeometry.dispose()
    }
  }, [geometry, material, lineGeometry])

  // Targets recomputed only when the question changes; frames just chase them.
  const targets = useMemo(() => {
    const size = new Float32Array(POINTS).fill(IDLE.size)
    const alpha = new Float32Array(POINTS).fill(IDLE.alpha)
    const color = field.base.slice()
    const query = new THREE.Vector3()
    let neighbours: number[] = []

    if (active !== null) {
      const q = queries[active]
      const centre = clusters[q.cluster].centre
      // The question lands near its cluster but not on top of it.
      query.set(centre[0] + 0.34, centre[1] + 0.3, centre[2] + 0.34)

      const dist: { i: number; d: number }[] = []
      for (let i = 0; i < POINTS; i++) {
        const dx = field.positions[i * 3] - query.x
        const dy = field.positions[i * 3 + 1] - query.y
        const dz = field.positions[i * 3 + 2] - query.z
        dist.push({ i, d: dx * dx + dy * dy + dz * dz })
      }
      dist.sort((a, b) => a.d - b.d)
      neighbours = dist.slice(0, TOP_K).map((x) => x.i)

      alpha.fill(MUTED.alpha)
      size.fill(MUTED.size)
      const white = new THREE.Color('#FFFFFF')
      for (const i of neighbours) {
        alpha[i] = HIT.alpha
        size[i] = HIT.size
        const c = new THREE.Color(field.base[i * 3], field.base[i * 3 + 1], field.base[i * 3 + 2])
        // Only a nudge toward white: a retrieved worklog should still look like
        // a worklog, so the lit slice keeps its cluster's colour.
        c.lerp(white, 0.18)
        color[i * 3] = c.r
        color[i * 3 + 1] = c.g
        color[i * 3 + 2] = c.b
      }
    }

    return { size, alpha, color, query, neighbours }
  }, [active, field])

  useEffect(() => {
    reveal.current = 0
  }, [active])

  useFrame((state, delta) => {
    material.uniforms.uScale.value = state.size.height * state.viewport.dpr * 0.5
    const step = Math.min(delta, 0.05)
    const k = 1 - Math.pow(0.0008, step)

    const sizeAttr = geometry.getAttribute('aSize') as THREE.BufferAttribute
    const alphaAttr = geometry.getAttribute('aAlpha') as THREE.BufferAttribute
    const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute
    const sizeArr = sizeAttr.array as Float32Array
    const alphaArr = alphaAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    for (let i = 0; i < POINTS; i++) {
      sizeArr[i] += (targets.size[i] - sizeArr[i]) * k
      alphaArr[i] += (targets.alpha[i] - alphaArr[i]) * k
      colArr[i * 3] += (targets.color[i * 3] - colArr[i * 3]) * k
      colArr[i * 3 + 1] += (targets.color[i * 3 + 1] - colArr[i * 3 + 1]) * k
      colArr[i * 3 + 2] += (targets.color[i * 3 + 2] - colArr[i * 3 + 2]) * k
    }
    sizeAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
    colAttr.needsUpdate = true

    // Lines grow out from the question toward each retrieved record.
    reveal.current = Math.min(reveal.current + step * 1.9, 1)
    const e = 1 - Math.pow(1 - reveal.current, 3)
    const lp = lineGeometry.getAttribute('position') as THREE.BufferAttribute
    const la = lp.array as Float32Array
    const q = targets.query

    for (let n = 0; n < TOP_K; n++) {
      const i = targets.neighbours[n]
      const o = n * 6
      if (active === null || i === undefined) {
        la.fill(0, o, o + 6)
        continue
      }
      la[o] = q.x
      la[o + 1] = q.y
      la[o + 2] = q.z
      la[o + 3] = q.x + (field.positions[i * 3] - q.x) * e
      la[o + 4] = q.y + (field.positions[i * 3 + 1] - q.y) * e
      la[o + 5] = q.z + (field.positions[i * 3 + 2] - q.z) * e
    }
    lp.needsUpdate = true

    if (marker.current) {
      marker.current.position.copy(q)
      // Small: 26 additive lines already converge here, so a big glow on top
      // just blows the centre out to white. A typed question is searched in the
      // résumé corpus rather than this one, so it gets the embedded point and
      // no neighbour lines — there is nothing in here that it retrieved.
      const beat = 0.04 * Math.sin(performance.now() / 320)
      const want = active !== null ? 0.4 + beat : pulse ? 0.3 + beat : 0
      marker.current.scale.lerp(new THREE.Vector3(want, want, want), k)
    }

    // Asking a question turns the space until the answer faces you, so the
    // retrieved slice is never stuck in a corner of the panel.
    if (frame.current) {
      if (active === null) {
        aim.identity()
      } else {
        aim.setFromUnitVectors(
          qDir.copy(q).normalize(),
          camDir.copy(state.camera.position).normalize(),
        )
      }
      if (still) frame.current.quaternion.copy(aim)
      else frame.current.quaternion.slerp(aim, Math.min(k, 0.055))
    }
  })

  return (
    <group ref={frame} scale={0.88}>
      <points ref={pts} geometry={geometry} material={material} />
      <lineSegments ref={lines} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#9DB8E8"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      <sprite ref={marker} scale={0}>
        <spriteMaterial
          map={glow}
          color="#DCEBFF"
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  )
}

function Rig({
  active,
  pulse,
  still,
  canHover,
}: {
  active: number | null
  pulse: boolean
  still: boolean
  canHover: boolean
}) {
  const glow = useMemo(makeGlow, [])
  useEffect(() => () => glow.dispose(), [glow])

  return (
    <>
      <Corpus active={active} pulse={pulse} glow={glow} still={still} />
      {/* Left off touch on purpose: OrbitControls claims touch-action on the
          canvas, so a thumb dragged up here would rotate the space instead of
          scrolling the page. The questions drive the view there instead. */}
      {canHover && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          // The idle space turns on its own; once a question is asked it holds
          // still so the retrieved neighbourhood stays where you can read it.
          autoRotate={!still && active === null}
          autoRotateSpeed={0.42}
          minPolarAngle={0.6}
          maxPolarAngle={2.5}
        />
      )}
    </>
  )
}

export function VectorSpace({
  active,
  pulse = false,
  still = false,
  canHover = true,
}: {
  active: number | null
  /** A question was asked of the résumé, not of this corpus: show it embedded. */
  pulse?: boolean
  still?: boolean
  canHover?: boolean
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [3.0, 1.4, 5.1], fov: 46 }}
    >
      <Rig active={active} pulse={pulse} still={still} canHover={canHover} />
    </Canvas>
  )
}
