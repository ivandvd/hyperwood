/**
 * The phone shots: the mobile app on a phone photographed close and turned, the way the reference shows its own app
 * (trysoar.com: a phone the colour of the ground behind it, so near that it leaves the frame, one part sharp and the
 * rest soft, under grain). Rendered here in the browser, from a model of the phone built to the measures of Apple's
 * front picture of the iPhone 18 Pro (its outline and corners, its screen's opening and corners, its island, where its
 * buttons stand; the picture itself is not used), with the app's own screen (studio.html?scene=screen&app=...)
 * under its glass.
 *
 * The phone is lit only by what it reflects: a dark room of Ink with a few panels of light in it, Neon and a paler
 * Neon, set round the camera as a photographer sets them. Its softness out of focus and its smooth edges come from many
 * renders, each from another point of the lens and another place within the pixel, added up.
 *
 * Open from the dev server, with the screens answered at /shot-screens/<app>.png (the take does that):
 *   /scripts/product/shot.html?shot=trade&w=1600&h=2000&spp=256
 * and any of the shot's numbers (below) given in the address to try another. When it is done, window.__done is true
 * and the canvas holds the picture: the ground and the phone, without grain (the bake adds it).
 */
import * as THREE from 'three'

const q = new URLSearchParams(location.search)
const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d)
const W = num('w', 800)
const H = num('h', 1000)
const SPP = num('spp', 64)

/** The phone, in points (its screen is 402 by 874), read off Apple's front picture at three pixels to the point:
 *  the body 1300 by 2715 pixels with corners a rounded square's (extent 250, exponent 2.15), the screen's opening
 *  47 in from every side with corners of extent 198, the island 281 by 107 at 509, 90 from the body's corner, the
 *  buttons where the outline stands out (left: 558 to 682, 775 to 977, 1032 to 1234 from the top; right: 845 to
 *  1165; nine pixels proud). The thickness is the phone's 8.75 mm. */
const PX = 3
const BW = 1300 / PX
const BH = 2715 / PX
const T = 52.7
const BODY_A = 250 / PX
const SCREEN_A = 198 / PX
const SE = 2.15
const R = 6.7 // the frame's round from its flat side into the glass, and into the back
const FROM_TOP = (px) => BH / 2 - px / PX

/** The shots: how the phone is turned (degrees, in that order: about its width, its height, the screen's normal),
 *  the point of it the camera looks at (points from the phone's middle), from how far, from which side (degrees round
 *  and up), the camera's tilt, its field (degrees, up and down), the lens's opening (points across its radius), the
 *  point that is sharp, the panels of light (towards which side of the phone, across and along it, how far from
 *  what the screen mirrors, and how bright: room() below), and the ground's light (where, how wide, how much Neon). */
const SHOTS = {
  trade: {
    app: 'trade', rx: -40, ry: 20, rz: 22, tx: -40, ty: 110, dist: 980, az: 0, el: 0, roll: 0, fov: 34, ap: 14,
    fx: -60, fy: 220, key: [-1, 0.2, 55, 2.2], rim: [1, 0, 75, 3.5], top: [0, 1, 60, 0.8], side: [0.8, 0.1],
    glow: [0.9, 0.95, 0.55, 0.22], finish: 'silver',
  },
  receipt: {
    app: 'receipt', rx: -30, ry: -44, rz: -18, tx: 40, ty: 170, dist: 820, az: 0, el: 0, roll: 0, fov: 34, ap: 16,
    fx: 80, fy: 260, key: [1, 0.2, 55, 2.2], rim: [-1, 0, 75, 3.0], top: [0, 1, 60, 0.8], side: [0.8, 0.1],
    glow: [0.1, 0.05, 0.55, 0.16], finish: 'silver',
  },
  close: {
    app: 'close', rx: -14, ry: 26, rz: -8, tx: 10, ty: 170, dist: 1080, az: 0, el: 0, roll: 0, fov: 34, ap: 16,
    fx: 0, fy: 280, key: [-1, 0.3, 55, 2.0], rim: [1, 0.2, 70, 3.5], top: [0, 1, 60, 0.8], side: [0.8, 0.1],
    glow: [0.95, 1.0, 0.6, 0.22], finish: 'silver',
  },
}
const base = SHOTS[q.get('shot') || 'trade']
const S = { ...base }
for (const k of Object.keys(base)) {
  if (!q.has(k)) continue
  const v = q.get(k)
  S[k] = Array.isArray(base[k]) ? v.split(',').map(Number) : typeof base[k] === 'number' ? Number(v) : v
}

// ---------------------------------------------------------------------------------------------------------------
// The shapes

/** A rounded rectangle whose corners are rounded squares (|x|^n + |y|^n = 1), w by h, corner extent a: points round
 *  it anticlockwise from the right side's top, each with its outward normal. */
function outline(w, h, a, n, steps = 48) {
  const out = []
  for (let k = 0; k < 4; k++) {
    const sx = k === 0 || k === 3 ? 1 : -1
    const sy = k < 2 ? 1 : -1
    const cx = sx * (w / 2 - a)
    const cy = sy * (h / 2 - a)
    for (let i = 0; i <= steps; i++) {
      const phi = ((k + i / steps) * Math.PI) / 2
      const c = Math.cos(phi)
      const s = Math.sin(phi)
      const px = Math.sign(c) * Math.pow(Math.abs(c), 2 / n)
      const py = Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
      let nx = Math.sign(px) * Math.pow(Math.abs(px), n - 1)
      let ny = Math.sign(py) * Math.pow(Math.abs(py), n - 1)
      const l = Math.hypot(nx, ny) || 1
      nx /= l
      ny /= l
      out.push({ x: cx + a * px, y: cy + a * py, nx, ny })
    }
  }
  return out
}

/** Adds triangles so that each faces the way its vertices' normals say. */
function facing(P, N, tris) {
  const idx = []
  const v = (i) => new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])
  const n = (i) => new THREE.Vector3(N[i * 3], N[i * 3 + 1], N[i * 3 + 2])
  for (const [a, b, c] of tris) {
    const g = v(b).sub(v(a)).cross(v(c).sub(v(a)))
    const m = n(a).add(n(b)).add(n(c))
    if (g.dot(m) < 0) idx.push(a, c, b)
    else idx.push(a, b, c)
  }
  return idx
}

function geometry(P, N, idx, UV) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3))
  if (UV) g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2))
  g.setIndex(idx)
  return g
}

/** A surface swept round a closed outline: each outline point carries the profile (offset along its normal `d`,
 *  height `w`, and the normal's two parts), and `map` puts (u, v, w) into the phone's space. */
function sweep(points, profile, map) {
  const P = []
  const N = []
  for (const p of points)
    for (const f of profile) {
      P.push(...map(p.x + p.nx * f.d, p.y + p.ny * f.d, f.w, false))
      N.push(...map(p.nx * f.nd, p.ny * f.nd, f.nw, true))
    }
  const m = profile.length
  const tris = []
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    for (let k = 0; k < m - 1; k++) {
      const a = i * m + k
      const b = j * m + k
      tris.push([a, b, b + 1], [a, b + 1, a + 1])
    }
  }
  return geometry(P, N, facing(P, N, tris))
}

/** A flat face filling an outline (offset `d` along its normals), at height w, facing `side` (+1 or -1) along w;
 *  `uv` gives each point its place in a texture. */
function cap(points, d, w, side, map, uv) {
  const contour = points.map((p) => new THREE.Vector2(p.x + p.nx * d, p.y + p.ny * d))
  const faces = THREE.ShapeUtils.triangulateShape(contour, [])
  const P = []
  const N = []
  const UV = []
  for (const c of contour) {
    P.push(...map(c.x, c.y, w, false))
    N.push(...map(0, 0, side, true))
    if (uv) UV.push(...uv(c.x, c.y))
  }
  return geometry(P, N, facing(P, N, faces), uv ? UV : undefined)
}

/** A flat ring between two offsets of an outline, at height w. */
function ring(points, d0, d1, w, side, map) {
  const P = []
  const N = []
  for (const p of points)
    for (const d of [d0, d1]) {
      P.push(...map(p.x + p.nx * d, p.y + p.ny * d, w, false))
      N.push(...map(0, 0, side, true))
    }
  const tris = []
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    tris.push([i * 2, j * 2, j * 2 + 1], [i * 2, j * 2 + 1, i * 2 + 1])
  }
  return geometry(P, N, facing(P, N, tris))
}

/** The frame's profile: round from the back into the flat side, flat, round into the front. */
function frameProfile(r, t, segments = 12) {
  const out = []
  for (let i = 0; i <= segments; i++) {
    const a = -Math.PI / 2 + (i / segments) * (Math.PI / 2)
    out.push({ d: -r + r * Math.cos(a), w: -(t / 2 - r) + r * Math.sin(a), nd: Math.cos(a), nw: Math.sin(a) })
  }
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * (Math.PI / 2)
    out.push({ d: -r + r * Math.cos(a), w: t / 2 - r + r * Math.sin(a), nd: Math.cos(a), nw: Math.sin(a) })
  }
  return out
}

/** A button's profile: straight out of the side, then round over onto its face. */
function buttonProfile(proud, r, segments = 8) {
  const out = [{ d: 0, w: -1.5, nd: 1, nw: 0 }]
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * (Math.PI / 2)
    out.push({ d: -r + r * Math.cos(a), w: proud - r + r * Math.sin(a), nd: Math.cos(a), nw: Math.sin(a) })
  }
  return out
}

const same = (u, v, w) => [u, v, w]

// ---------------------------------------------------------------------------------------------------------------
// The materials

const linear = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace)
const FINISH = {
  // Apple's silver: aluminium, blasted, a little warm
  silver: { color: linear(0.9, 0.9, 0.88), roughness: 0.2, back: linear(0.72, 0.72, 0.7) },
  // a dark finish, for a phone the colour of the ground
  ink: { color: linear(0.05, 0.05, 0.05), roughness: 0.28, back: linear(0.02, 0.02, 0.02) },
}

async function frontTexture(app, renderer) {
  const img = new Image()
  img.src = '/shot-screens/' + app + '.png'
  await img.decode()
  const k = img.naturalWidth / 402 // pixels to the point in the screen's picture
  const c = document.createElement('canvas')
  c.width = Math.round(BW * k)
  c.height = Math.round(BH * k)
  const g = c.getContext('2d')
  // the glass's black, and the screen through its opening
  g.fillStyle = '#030303'
  g.fillRect(0, 0, c.width, c.height)
  g.save()
  // (the opening stands in the middle of the body, 47 pixels of the front picture in from every side)
  g.translate(c.width / 2, c.height / 2)
  const opening = outline(402 * k, 874 * k, SCREEN_A * k, SE, 64)
  g.beginPath()
  opening.forEach((p, i) => (i ? g.lineTo(p.x, -p.y) : g.moveTo(p.x, -p.y)))
  g.closePath()
  g.clip()
  g.drawImage(img, (-402 * k) / 2, (-874 * k) / 2, 402 * k, 874 * k)
  g.restore()
  // the island
  const ix = (509 / PX) * k
  const iy = (90 / PX) * k
  const iw = (281 / PX) * k
  const ih = (107 / PX) * k
  g.fillStyle = '#000'
  g.beginPath()
  g.roundRect(ix, iy, iw, ih, ih / 2)
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = renderer.capabilities.getMaxAnisotropy()
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.generateMipmaps = true
  return t
}

function phone(front, finish) {
  const F = FINISH[finish] ?? FINISH.silver
  const metal = new THREE.MeshPhysicalMaterial({ color: F.color, metalness: 1, roughness: F.roughness })
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x000000, metalness: 0, roughness: 0.04, ior: 1.52,
    emissive: 0xffffff, emissiveMap: front, emissiveIntensity: 1,
  })
  const seam = new THREE.MeshPhysicalMaterial({ color: linear(0.012, 0.012, 0.012), metalness: 0, roughness: 0.45 })
  const backMat = new THREE.MeshPhysicalMaterial({ color: F.back, metalness: 0.6, roughness: 0.55 })
  const sapphire = new THREE.MeshPhysicalMaterial({ color: linear(0.01, 0.01, 0.012), metalness: 0, roughness: 0.06, clearcoat: 1 })

  const group = new THREE.Group()
  const body = outline(BW, BH, BODY_A, SE, 64)
  group.add(new THREE.Mesh(sweep(body, frameProfile(R, T), same), metal))
  // the glass, a hair inside the frame's round, with a dark seam between them
  const uv = (x, y) => [x / BW + 0.5, y / BH + 0.5]
  group.add(new THREE.Mesh(ring(body, -R, -R - 1.4, T / 2 - 0.15, 1, same), seam))
  group.add(new THREE.Mesh(cap(body, -R - 1.4, T / 2, 1, same, uv), glass))
  group.add(new THREE.Mesh(cap(body, -R, -T / 2, -1, same), backMat))

  // the buttons: a long round-ended shape on the side, standing out of it and rounded over
  const button = (side, top, bottom, proud = 3, tall = 15, mat = metal) => {
    const L = (bottom - top) / PX
    const yc = FROM_TOP((top + bottom) / 2)
    const shape = outline(L, tall, tall / 2, 2, 24).map((p) => ({ ...p, x: p.x + yc }))
    const map = side < 0
      ? (u, v, w, dir) => (dir ? [-w, u, v] : [-BW / 2 - w, u, v])
      : (u, v, w, dir) => (dir ? [w, u, v] : [BW / 2 + w, u, v])
    const g = new THREE.Group()
    g.add(new THREE.Mesh(sweep(shape, buttonProfile(proud, Math.min(1.6, proud * 0.6)), map), mat))
    g.add(new THREE.Mesh(cap(shape, -Math.min(1.6, proud * 0.6), proud, 1, map), mat))
    return g
  }
  group.add(button(-1, 558, 682))
  group.add(button(-1, 775, 977))
  group.add(button(-1, 1032, 1234))
  group.add(button(1, 845, 1165))
  // the camera control: a sapphire face in a ring, lower on the right, hardly standing out
  group.add(button(1, 1560, 1840, 0.6, 17, metal))
  group.add(button(1, 1572, 1828, 0.75, 13, sapphire))
  return group
}

// ---------------------------------------------------------------------------------------------------------------
// The room the phone reflects: Ink, a little Neon on the side the ground is lit from, and panels of light

const INK = linear(0.003, 0.003, 0.003)
const NEON = linear(0.604, 1.0, 0.0)
const PALE = linear(0.94, 1.0, 0.86)

/** The panels stand where the screen does not mirror them: each is set off from the direction the screen's glass
 *  mirrors into the camera, by its angle (degrees), towards one of the phone's sides (across and along it), so that
 *  it lights the round of the frame on that side and leaves the screen clear. */
function room(camera, target, handset) {
  const s = new THREE.Scene()
  const fwd = new THREE.Vector3().subVectors(target, camera.position).normalize()
  const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize()
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize()
  const back = fwd.clone().negate()
  const toward = (a, b, c) => right.clone().multiplyScalar(a).add(up.clone().multiplyScalar(b)).add(back.clone().multiplyScalar(c)).normalize()
  const lit = toward(S.glow[0] * 2 - 1, 1 - S.glow[1] * 2, -0.6)
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(handset.quaternion)
  const across = new THREE.Vector3(1, 0, 0).applyQuaternion(handset.quaternion)
  const along = new THREE.Vector3(0, 1, 0).applyQuaternion(handset.quaternion)
  const mirrored = fwd.clone().reflect(normal)
  const offMirror = ([a, b, angle]) => {
    const side = across.clone().multiplyScalar(a).addScaledVector(along, b)
    side.addScaledVector(mirrored, -side.dot(mirrored)).normalize()
    const t = (angle * Math.PI) / 180
    return mirrored.clone().multiplyScalar(Math.cos(t)).addScaledVector(side, Math.sin(t)).normalize()
  }
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(6000, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { ink: { value: INK }, neon: { value: NEON }, lit: { value: lit }, much: { value: S.glow[3] } },
      vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 ink; uniform vec3 neon; uniform vec3 lit; uniform float much; varying vec3 vDir;
        void main() { float k = pow(max(dot(normalize(vDir), lit), 0.0), 3.0) * much * 0.18; gl_FragColor = vec4(mix(ink, neon * 0.6, k), 1.0); }`,
    }),
  )
  s.add(sphere)
  // (a panel can fade along its height, its top towards `up`: from `fade[0]` of its light at the foot to `fade[1]`)
  const panel = (dir, w, h, color, power, up, fade) => {
    const g = new THREE.PlaneGeometry(w, h, 1, 24)
    if (fade) {
      const pos = g.attributes.position
      const c = []
      for (let i = 0; i < pos.count; i++) {
        const k = fade[0] + (fade[1] - fade[0]) * (pos.getY(i) / h + 0.5)
        c.push(k, k, k)
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3))
    }
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(power), side: THREE.DoubleSide, vertexColors: !!fade }))
    m.position.copy(dir.clone().multiplyScalar(2400))
    if (up) m.up.copy(up)
    m.lookAt(0, 0, 0)
    s.add(m)
  }
  panel(offMirror(S.key), 1700, 1700, PALE, S.key[3])
  panel(offMirror(S.rim), 420, 3600, NEON, S.rim[3])
  panel(offMirror(S.top), 3600, 360, PALE, S.top[3])
  // the flat side the camera sees, given a long soft light that fades towards the phone's foot, so the metal shows
  const face = across.clone().multiplyScalar(across.dot(fwd) < 0 ? 1 : -1)
  panel(fwd.clone().reflect(face), 2200, 3400, PALE, S.side[0], along, [S.side[1], 1])
  return s
}

// ---------------------------------------------------------------------------------------------------------------
// The render

const canvas = document.getElementById('c')
canvas.style.width = W + 'px'
canvas.style.height = H + 'px'
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(W, H, false)

const deg = Math.PI / 180
const scene = new THREE.Scene()
const front = await frontTexture(S.app, renderer)
const handset = phone(front, S.finish)
handset.rotation.set(S.rx * deg, S.ry * deg, S.rz * deg, 'XYZ')
scene.add(handset)
scene.updateMatrixWorld(true)

const target = new THREE.Vector3(S.tx, S.ty, 0).applyMatrix4(handset.matrixWorld)
const focusAt = new THREE.Vector3(S.fx, S.fy, T / 2).applyMatrix4(handset.matrixWorld)
const camera = new THREE.PerspectiveCamera(S.fov, W / H, 20, 20000)
camera.position.set(
  target.x + S.dist * Math.cos(S.el * deg) * Math.sin(S.az * deg),
  target.y + S.dist * Math.sin(S.el * deg),
  target.z + S.dist * Math.cos(S.el * deg) * Math.cos(S.az * deg),
)
camera.up.set(Math.sin(S.roll * deg), Math.cos(S.roll * deg), 0)
camera.lookAt(target)
camera.updateMatrixWorld(true)

const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(room(camera, target, handset), 0, 1, 20000).texture
scene.background = null

// the distance along the view to the sharp point
const fwd = new THREE.Vector3()
camera.getWorldDirection(fwd)
const focus = focusAt.clone().sub(camera.position).dot(fwd)

const exact = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false }
const one = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: true, ...exact })
let sumA = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, depthBuffer: false, ...exact })
let sumB = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, depthBuffer: false, ...exact })
const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
const quad = (material) => {
  const s = new THREE.Scene()
  s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))
  return s
}
const vertex = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
const addMat = new THREE.ShaderMaterial({
  uniforms: { a: { value: null }, b: { value: null } },
  vertexShader: vertex,
  fragmentShader: 'uniform sampler2D a; uniform sampler2D b; varying vec2 vUv; void main() { gl_FragColor = texture2D(a, vUv) + texture2D(b, vUv); }',
  depthTest: false,
  depthWrite: false,
})
const addScene = quad(addMat)

const halton = (i, b) => {
  let f = 1
  let r = 0
  while (i > 0) {
    f /= b
    r += f * (i % b)
    i = Math.floor(i / b)
  }
  return r
}
const disk = (u, v) => {
  // a square onto a disk, keeping areas (Shirley and Chiu)
  const a = 2 * u - 1
  const b = 2 * v - 1
  if (a === 0 && b === 0) return [0, 0]
  let r, phi
  if (Math.abs(a) > Math.abs(b)) {
    r = a
    phi = (Math.PI / 4) * (b / a)
  } else {
    r = b
    phi = Math.PI / 2 - (Math.PI / 4) * (a / b)
  }
  return [r * Math.cos(phi), r * Math.sin(phi)]
}

const eye = camera.position.clone()
const turn = camera.quaternion.clone()
const near = camera.near
const top0 = near * Math.tan((S.fov * deg) / 2)
const right0 = top0 * (W / H)
const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(turn)
const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(turn)

renderer.setClearColor(0x000000, 0)
renderer.setRenderTarget(sumA)
renderer.clear()
for (let i = 0; i < SPP; i++) {
  const [lx, ly] = disk(halton(i + 1, 2), halton(i + 1, 3)).map((x) => x * S.ap)
  const jx = halton(i + 1, 5) - 0.5
  const jy = halton(i + 1, 7) - 0.5
  camera.position.copy(eye).addScaledVector(camRight, lx).addScaledVector(camUp, ly)
  camera.quaternion.copy(turn)
  camera.updateMatrixWorld(true)
  const sx = (-lx * near) / focus + (jx * 2 * right0) / W
  const sy = (-ly * near) / focus + (jy * 2 * top0) / H
  camera.projectionMatrix.makePerspective(-right0 + sx, right0 + sx, top0 + sy, -top0 + sy, near, camera.far)
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  renderer.setRenderTarget(one)
  renderer.clear()
  renderer.render(scene, camera)
  addMat.uniforms.a.value = sumA.texture
  addMat.uniforms.b.value = one.texture
  renderer.setRenderTarget(sumB)
  renderer.render(addScene, flat)
  ;[sumA, sumB] = [sumB, sumA]
  if (i % 16 === 15) await new Promise((r) => requestAnimationFrame(r))
}

// The ground, and the picture: the phone over the ground (the sum is the phone's light times its cover), the
// highlights eased into white above 0.9, then into the screen's colours.
const outMat = new THREE.ShaderMaterial({
  uniforms: {
    sum: { value: sumA.texture }, n: { value: SPP }, ink: { value: INK }, neon: { value: NEON },
    glow: { value: new THREE.Vector4(...S.glow) }, aspect: { value: W / H },
  },
  vertexShader: vertex,
  fragmentShader: `uniform sampler2D sum; uniform float n; uniform vec3 ink; uniform vec3 neon; uniform vec4 glow; uniform float aspect;
    varying vec2 vUv;
    vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
    vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    vec3 ease(vec3 c) { vec3 k = vec3(0.9); return mix(c, k + (1.0 - k) * (1.0 - exp(-(c - k) / (1.0 - k))), step(k, c)); }
    void main() {
      vec4 s = texture2D(sum, vUv) / n;
      // the ground: Ink, mixed towards Neon (as the brand mixes them, in its own colours) round one place
      vec2 d = (vUv - vec2(glow.x, 1.0 - glow.y)) * vec2(aspect, 1.0);
      float g = exp(-dot(d, d) / (glow.z * glow.z)) * glow.w;
      vec3 inkS = vec3(10.0 / 255.0);
      vec3 neonS = vec3(204.0 / 255.0, 1.0, 0.0);
      vec3 ground = toLinear(mix(inkS, neonS, g));
      vec3 c = s.rgb + ground * (1.0 - s.a);
      gl_FragColor = vec4(toSrgb(ease(max(c, 0.0))), 1.0);
    }`,
  depthTest: false,
  depthWrite: false,
})
renderer.setRenderTarget(null)
renderer.render(quad(outMat), flat)
window.__done = true
