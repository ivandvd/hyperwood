/**
 * Programs, made ahead of the picture and beside the page.
 *
 * A material's program is compiled by the graphics driver the first time it is drawn, and drawing waits for
 * it: the page stops, and so does everything else on the screen, the opening included (a tenth of a second
 * for the larger ones on a first visit). Where the driver can compile beside the page, the programs are asked
 * for here before they are needed, and nothing is drawn until the driver says they are done.
 *
 * Two things decide which program three.js makes for a material, and both have to be as they will be when it
 * is really drawn, or the work is done twice:
 *  - where it is drawn. The composer draws the scene into a linear buffer, and its own passes into buffers
 *    too, all but the last; a program for the screen is a different one. So programs are asked for with a
 *    buffer of that kind in place (`into`);
 *  - which lights are on. The story switches two lights on and off (the core, the cursor light), and there is
 *    a program for every set: for what the lights fall on (the mountains), and for anything whose first frame
 *    comes while one of them is on (the core's own glow). Those are asked for once per set (`everySet`).
 */
import * as THREE from 'three'
import { Pass, RenderPass, type EffectComposer } from 'postprocessing'
import { milestone } from '../utils/milestone'

/** The post chain, once it is mounted (PostFX.tsx). */
export const post = { composer: null as EffectComposer | null }

/** Lights the story switches on and off: each registers itself while it is mounted. */
const switched = new Set<THREE.Light>()
export function switchedLight(light: THREE.Light) {
  switched.add(light)
  return () => {
    switched.delete(light)
  }
}

/** Small scenes that are drawn into buffers of their own beside the main one (the cursor's trail, the liquid's
 *  tiles): each declares itself while it is mounted. No camera means the main one. */
const beside = new Set<{ scene: THREE.Scene; camera: THREE.Camera | null }>()
export function alsoDrawn(scene: THREE.Scene, camera: THREE.Camera | null = null) {
  const entry = { scene, camera }
  beside.add(entry)
  return () => {
    beside.delete(entry)
  }
}

/** Things whose first frame comes while a switched light is on: each declares itself while it is mounted. */
const late = new Set<THREE.Object3D>()
export function firstDrawnLit(object: THREE.Object3D) {
  late.add(object)
  return () => {
    late.delete(object)
  }
}

let linear: THREE.WebGLRenderTarget | null = null
/** Runs `fn` with the renderer aimed where the programs will be used: the screen, or a linear buffer. */
function into(gl: THREE.WebGLRenderer, screen: boolean, fn: () => void) {
  const before = gl.getRenderTarget()
  linear ??= new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false })
  gl.setRenderTarget(screen ? null : linear)
  try {
    fn()
  } finally {
    gl.setRenderTarget(before)
  }
}

/** Every pass the composer runs, with the passes its effects keep inside them (bloom, god rays, SMAA). */
function passesOf(composer: EffectComposer) {
  const found = new Set<Pass>()
  const add = (value: unknown) => {
    if (!(value instanceof Pass) || found.has(value) || !value.enabled) return
    found.add(value)
    for (const inner of Object.values(value)) add(inner)
    const effects = (value as unknown as { effects?: unknown }).effects
    if (Array.isArray(effects)) for (const effect of effects) if (effect && typeof effect === 'object') for (const inner of Object.values(effect)) add(inner)
  }
  composer.passes.forEach(add)
  return [...found]
}

/** One triangle over the whole screen, with the attributes the passes' own triangle has. */
function screenTriangle() {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2))
  return geometry
}
const flat = { scene: new THREE.Scene(), camera: new THREE.OrthographicCamera(), mesh: null as THREE.Mesh | null }
/** The composer's own programs: each pass fills the screen with one material (a few keep two and switch). */
function compilePasses(gl: THREE.WebGLRenderer, composer: EffectComposer) {
  for (const pass of passesOf(composer)) {
    // a render pass draws the scene, which is asked for by itself
    if (pass instanceof RenderPass) continue
    const materials = new Set<THREE.Material>()
    for (const value of [pass.fullscreenMaterial, ...Object.values(pass)]) if (value && (value as THREE.Material).isMaterial) materials.add(value as THREE.Material)
    if (!materials.size) continue
    into(gl, pass.renderToScreen, () => {
      for (const material of materials) {
        if (!flat.mesh) {
          flat.mesh = new THREE.Mesh(screenTriangle(), material)
          flat.mesh.frustumCulled = false
          flat.scene.add(flat.mesh)
        }
        flat.mesh.material = material
        gl.compile(flat.scene, flat.camera)
      }
    })
  }
}

/** Asks for the programs of `object` once for every set of switched lights. */
function everySet(gl: THREE.WebGLRenderer, object: THREE.Object3D, scene: THREE.Scene, camera: THREE.Camera) {
  const lights = [...switched]
  const was = lights.map((l) => l.visible)
  into(gl, false, () => {
    for (let set = 0; set < 1 << lights.length; set++) {
      lights.forEach((l, i) => (l.visible = (set & (1 << i)) !== 0))
      gl.compile(object, camera, scene)
    }
  })
  lights.forEach((l, i) => (l.visible = was[i]))
}

/** Resolves when the driver has finished every program it has been given (or has taken too long to say). */
function settled(gl: THREE.WebGLRenderer, patience = 4000) {
  return new Promise<void>((resolve) => {
    const since = performance.now()
    const ask = () => {
      const programs = (gl.info.programs ?? []) as unknown as { isReady?: () => boolean }[]
      if (performance.now() - since > patience || programs.every((p) => !p.isReady || p.isReady())) resolve()
      else window.setTimeout(ask, 16)
    }
    ask()
  })
}

/** Before the first frame: the scene as it stands and the post chain, compiled beside the page. */
export async function warmUp(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  // Not at once. The scene is only whole a moment after its canvas exists: its fog is attached and the post
  // chain is mounted (it waits for the core's mesh) in the turns that follow, and a program made before the
  // fog is there is not the program the picture uses.
  const since = performance.now()
  do await new Promise((r) => window.setTimeout(r, 16))
  while (!post.composer && performance.now() - since < 1200)
  milestone('programs-asked')
  into(gl, false, () => {
    gl.compile(scene, camera)
    for (const b of beside) gl.compile(b.scene, b.camera ?? camera)
  })
  for (const object of late) everySet(gl, object, scene, camera)
  if (post.composer) compilePasses(gl, post.composer)
  await settled(gl)
  milestone('programs-there')
}

/** Something lit by the scene's lights, about to be shown (the mountains): its programs for every set of
 *  switched lights, compiled beside the page. Resolves when it can be drawn without a wait. */
export async function warmLit(gl: THREE.WebGLRenderer, object: THREE.Object3D, scene: THREE.Scene, camera: THREE.Camera) {
  everySet(gl, object, scene, camera)
  await settled(gl)
  milestone('mountain-there')
}
