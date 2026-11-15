/**
 * Art-direction config.
 * Every number that shapes the look or the choreography lives here.
 * Units: sphere-local. The globe is rendered at sphere.worldScale.
 *
 * Brand tokens (Hyperwood kit): Hyper Neon #CCFF00, Ink #0A0A0A, Paper #F4F5F0, Slate #62685D, Line #D9DCD2.
 */

export const brand = {
  neon: '#ccff00',
  ink: '#0a0a0a',
  paper: '#f4f5f0',
  slate: '#62685d',
  line: '#d9dcd2',
} as const

export const config = {
  /* ------------------------------------------------------------------ */
  sphere: {
    /** Horizontal rings including the two single-piece poles (odd number keeps an equator ring). */
    rings: 9,
    /** Radius of the globe at the centre of the liquid shell (sphere-local units). */
    radius: 13.2,
    /** Reference half-size of one piece (kept from the layout maths: a piece is about 2 × this wide). */
    keyScale: 2,
    /** Arc distance between piece centres along a ring, measured at the piece's inner (pole-side) edge. */
    pitch: 4.64,
    /** Whole globe system is rendered at this world scale. */
    worldScale: 2.3,
    /** World position of the globe centre in the hero. */
    center: [0, 0, 0] as [number, number, number],
    /** Idle rotation around the vertical axis, rad/s. */
    idleRotationSpeed: 0.045,
    /** Vertical bob amplitude (units) and frequency (Hz-ish). */
    bobAmplitude: 0.45,
    bobSpeed: 0.32,
    /** Per-piece micro breathing along the normal. */
    microAmplitude: 0.09,
    /** Seed for every random choice in the layout. */
    seed: 7,
  },

  /* ------------------------------------------------------------------ */
  /** The liquid: every piece is a soft ellipsoid, and neighbours are fused by a smooth union. */
  liquid: {
    /** Smooth-union sharpness in 1 / sphere-local units (higher = crisper joints, lower = more fused). */
    sharpness: 1.6,
    /** Radial half-thickness of the shell and the half-size along the meridian (sphere-local). */
    thickness: 1.75,
    meridian: 3.5,
    /** Half-size along the ring = half the spacing in that ring × this overlap (capped at maxAlong). */
    overlap: 1.5,
    maxAlong: 4.4,
    /** Half-size and half-thickness of the two pole caps. */
    pole: 3.9,
    poleThickness: 1.6,
    /** The resting drop gives way to the pieces across this stretch of the decoding phase: by then
     *  the bands have already parted, so the drop tears open along them and the light pours out. */
    handover: [0.08, 0.44] as [number, number],
    /** Free droplet half-sizes once a piece has left its ring (along ring, radial, meridian). */
    droplet: [2.5, 2.15, 2.5] as [number, number, number],
    /** The kept droplet in the final frame is a little larger and rounder. */
    kept: [3.3, 3.05, 3.3] as [number, number, number],
    /** Slow sloshing of the resting globe: amplitude (units), spatial frequency over the unit sphere, speed. */
    slosh: { amplitude: 0.34, frequency: 1.25, speed: 0.15 },
    /** Bands open as the rings spread: the meridian half-size shrinks by this share at full decoding,
     *  so the grooves deepen at the same moment the core's light starts to pour through them. */
    bandCut: 0.34,
    /** …and is fully cut by this point of the decoding phase. */
    bandCutBy: 0.38,
    /** Free droplets keep wobbling: relative amplitude and speed. */
    wobble: { amplitude: 0.07, speed: 1.7 },
  },

  /* ------------------------------------------------------------------ */
  mouse: {
    /** How far the liquid rises under the cursor (sphere-local units). */
    strength: 3.0,
    /** Angular radius of the rise on the sphere (radians, gaussian sigma). */
    radius: 0.42,
    /** A small light rides with the cursor, just off the surface, so the rise can be seen on black
     *  glass: its strength at full rise, its height above the surface (sphere-local), its colour. */
    light: 2600,
    lightHeight: 4.2,
    lightColor: '#ecffa6',
    /** Spring stiffness / damping of the rise (soft, slightly underdamped = gentle overshoot and settle). */
    stiffness: 26,
    damping: 6.4,
    /** A wider, shallow trough forms around the rise this long after it (s), this deep (share of the rise). */
    neighbourDelay: 0.34,
    trough: 0.16,
    /** Returning to rest is this much slower than reacting. */
    releaseSlowdown: 2.2,
    /** Smoothing of the cursor's hit point on the sphere (s). */
    hitSmoothing: 0.22,
    /** Progress at which mouse interaction has fully faded out. */
    fadeOut: [0.015, 0.12] as [number, number],
  },

  /* ------------------------------------------------------------------ */
  /** Scroll phase boundaries (normalised story progress). */
  phases: {
    activation: [0.0, 0.2] as [number, number],
    decoding: [0.2, 0.45] as [number, number],
    disassembly: [0.45, 0.7] as [number, number],
    reconstruction: [0.7, 0.9] as [number, number],
    final: [0.9, 1.0] as [number, number],
    /** The story above runs over the first `storyEnd` of the scroll; the rest is the resting tail. */
    storyEnd: 0.92,
  },

  choreography: {
    /** Ring spin (rad/s) added on top of idle at full activation / full decoding. */
    activationSpin: 0.35,
    decodingSpin: 1.15,
    disassemblySpin: 0.6,
    /** Extra vertical spacing added between neighbouring rings at full decoding. */
    ringSpread: 2.5,
    /** Max off-axis drift and tilt of rings during decoding (kept below the added ring spacing). */
    ringDrift: 1.2,
    ringTilt: 0.05,
    /** Share of pieces that bud off during decoding and how far they go. */
    detachShare: 0.16,
    detachDistance: 4.2,
    /** Disassembly: every ring keeps its circle and grows by this much radius while it leaves,
     *  climbing (rings above the camera) or sinking (below) along a cone, so rings never cross. */
    exitGrowth: 320,
    /** Cone slope = base + gain·|sin(lat)| (monotonic with height, so ring order is preserved). */
    exitSlopeBase: 0.42,
    exitSlopeGain: 0.55,
    /** Outer rings leave first; each step towards the equator waits this much progress. */
    exitStagger: 0.02,
    /** Duration of each ring's exit inside the disassembly phase (fraction of total progress). */
    exitDuration: 0.2,
    /** Gentle per-piece tumble while leaving (radians). */
    exitTumble: 0.9,
    /** The kept piece sinks from its ring into the hollow centre in this window and hovers there. */
    holdWindow: [0.33, 0.6] as [number, number],
    /** Final placement: start, stagger spread and duration. */
    reconstructStart: 0.665,
    reconstructStagger: 0.07,
    reconstructDuration: 0.16,
    /** Float in the final state. */
    floatAmplitude: 0.26,
    floatDepth: 0.7,
    /** The kept piece wobbles on all three axes with its own amplitude in this range (degrees). */
    floatRotationDeg: [3, 5] as [number, number],
  },

  /* ------------------------------------------------------------------ */
  /** The piece that stays: one droplet, alone in the final frame. */
  phrase: {
    /** Centre of the final composition (sphere-local; ×worldScale in the world). */
    center: [0, 0.6, 4] as [number, number, number],
    /** Slots of the kept pieces in the final composition, in units of `unit` (one entry per kept piece). */
    slots: [[0, 0]] as [number, number][],
    unit: 4.15,
    /** Static depth variation in the final composition. */
    depthJitter: 1.0,
    /** The final camera distance adapts to the viewport so the droplet is this share of its width. */
    keyScreenWidth: 0.085,
    /** Tall screens have little width to share, so there the droplet takes this much of it instead. */
    keyScreenWidthTall: 0.2,
    /** Aspect ratios (width / height) between which the share blends from the wide value to the tall one. */
    tallBlend: [1.05, 0.62] as [number, number],
  },

  /* ------------------------------------------------------------------ */
  /** The ending: the last drop becomes the Hyperwood mark, with the brand kit’s own morph (kit 03.9,
   *  "A drop becomes the mark"). The mark itself stays flat: the exact master, Neon on Ink, nothing added. */
  mark: {
    /** The artwork and the drop the kit morphs it from: the box, the drop centre and radius in artwork units,
     *  and the scale the kit host starts at. These come from the kit morph engine and are not tuning knobs. */
    art: { width: 427.3, height: 191, drop: [225, 106] as [number, number], dropRadius: 62, dropScale: 0.72 },
    /** Final width of the mark as a share of the viewport width, on wide and on tall screens: a sign-off,
     *  not a second hero. */
    share: 0.2,
    shareTall: 0.42,
    /** Its light, before the grade: the same Hyper Neon the scene is lit with, so it tone-maps like the
     *  corona and the aurora instead of sitting on top of them. */
    color: brand.neon,
    gain: 0.86,
    /** The last droplet settles into that drop (still, round, on its slot) over this stretch of the story. */
    settle: [0.72, 0.88] as [number, number],
    /** While the sky darkens the drop gathers neon from its rim inward: from this story progress up to `at`
     *  the scroll fills this share of it, so the eye never loses the drop. The clock fills the rest. */
    gatherFrom: 0.74,
    gather: 0.5,
    /** Story progress that starts the morph, and the progress below which scrolling back undoes it. */
    at: 0.9,
    undoAt: 0.87,
    /** Seconds on the clock, not on the scroll: the drop finishes filling, then morphs on the kit curve.
     *  The kit plays its morph in 900 ms; here it is given more time so it reads as liquid. */
    ignite: 0.8,
    morph: 1.4,
    /** Seconds for the whole way back. */
    undo: 0.9,
    /** A faint pool of the mark own light in the haze behind it: strength, its size around the drop
     *  (in drop diameters) and around the mark (in mark widths and heights). */
    halo: 0.085,
    haloDrop: 5,
    haloMark: [2.1, 3.4] as [number, number],
    /** How much the light inside the resolved mark keeps moving (0 = still). */
    life: 1,
    /** Its liquid volume. A blurred copy of the shape is its height (`blur` in artwork units), so thick
     *  lobes stand proud and the necks lie low; `profile` rounds the rim (lower = rounder), `relief` is the
     *  height as a share of the mark width, and the volume grows in over the first `by` of the morph.
     *  Lighting: a key from `key` (x right, y up, z to the viewer) that shades by `shade`, a deeper `rim`,
     *  a `glint` of tightness `shine`, the `cursor` light strength, and a slow `ripple` of the surface. */
    depth: {
      blur: 15,
      profile: 0.6,
      relief: 0.05,
      by: 0.7,
      key: [-0.5, 0.62, 0.6] as [number, number, number],
      shade: 0.26,
      rim: 0.42,
      glint: 0.65,
      shine: 46,
      cursor: 0.9,
      ripple: 0.035,
    },
    /** Ambient drift once the mark is at rest: this many pixels up and back, this many seconds each way
     *  (the kit allows a few pixels over 4 s on hero surfaces). */
    drift: 5,
    driftSeconds: 4,
  },

  /* ------------------------------------------------------------------ */
  /** H1 animation: a rack-focus pull across the line. */
  titles: {
    focusReveal: {
      duration: 2.2,
      delay: 0.1,
      ease: 'sine',
      easeType: 'inOut',
      direction: 'right' as 'left' | 'right',
      scale: 1.1,
      opacity: 0,
      blur: 0.25, // em
      intensity: 0.7, // depth of field = 0.12 + 0.5 × intensity (share of the line width)
    },
    /** Second part of a two-part title starts this much later (s). */
    secondLineDelay: 0.35,
    /** Body copy, line by line. */
    fadeUp: {
      duration: 0.8,
      delay: 0.1,
      stagger: 0.12,
      ease: 'power3.out',
      distance: 0.6, // em
      opacity: 0,
      blur: 0.1, // em
    },
    /** Body copy starts after its section's H1 has begun focusing (s). */
    bodyDelay: 0.45,
  },

  /** Northern lights over the final section (Sky.tsx), in Hyper Neon. */
  aurora: {
    speed: 1.2,
    /** Lowers the curtains by this many screen pixels (at any viewport size). */
    offsetPx: 150,
    /** Top darkening: begins at this fraction of the frame height (0 bottom → 1 top)… */
    shadeFrom: 0.78,
    /** …and reaches this strength at the top edge. */
    shadeStrength: 0.85,
    low: '#a3cc00',
    high: '#3f5c12',
    edge: '#f1ffb8',
    /** Overall strength (the reference's blue reads darker than neon, so ours is pulled back). */
    strength: 0.55,
  },
  preloader: {
    /** Canvas size (px); keep in sync with --preloader-sphere in tokens.css. */
    sphereSize: 50,
    latBands: 9,
    lonCount: 16,
    rotationSpeed: 0.55, // rad/s
    sphereOutDuration: 0.45,
    revealDuration: 1.5,
    revealEase: 'power3.inOut',
    /** Preloader background, also the colour WebGL paints outside the reveal circle. Keep in sync with CSS. */
    color: brand.ink,
    /** Consecutive smooth frames (< 34 ms) required before the exit starts, so the reveal never hitches. */
    stableFrames: 24,
    /** …but never wait longer than this many seconds of rendering for it. */
    stableTimeout: 4,
    /** Performance check behind the cover: the scene is held at this story progress (the open bands, its
     *  heaviest moment) for a few frames. If frames there take this many times longer than at rest, the
     *  pixel ratio drops by `benchStep` and the check repeats, at most `benchRounds` times. */
    benchAt: 0.36,
    benchSlow: 1.3,
    benchStep: 0.8,
    benchRounds: 3,
  },

  /* ------------------------------------------------------------------ */
  /** Final section: the cursor as a small sphere of light with a smoky trail. */
  cursorLight: {
    color: '#dcff5c',
    /** Point light strength as seen by the liquid, and its range (sphere-local × worldScale). */
    intensity: 600,
    distance: 70,
    /** How far in front of the droplet plane the light floats (sphere-local). */
    depthOffset: 6,
    /** Visual orb size (sphere-local) and how quickly it follows the cursor (1/s). */
    orbSize: 7,
    follow: 7,
    /** Trail: splat radius (screen height units) and strength; smoke colours (dense → thin). */
    trailRadius: 0.044,
    trailStrength: 0.085,
    trailColor: '#86a800',
    trailCore: '#f1ffb8',
    trailIntensity: 1.0,
    /** The kept droplet turns towards the light (max degrees), lifts towards it (local units) within this radius (local). */
    keyTiltDeg: 7,
    keyLift: 0.9,
    keyRadius: 12,
  },

  /* ------------------------------------------------------------------ */
  camera: {
    fov: 32,
    near: 0.5,
    far: 5000,
    hero: { position: [0, -9, 168] as [number, number, number], target: [0, -5, 0] as [number, number, number] },
    decode: { position: [1.5, -7, 150] as [number, number, number], target: [0, -3.5, 0] as [number, number, number] },
    disassembly: { position: [-6, -1, 138] as [number, number, number], target: [0, 2, 12] as [number, number, number], fov: 34.5 },
    /** Final framing is computed from the viewport (see choreography/framing.ts); only the FOV is set here. */
    final: { fov: 31 },
    /** Tall screens (phones held upright). Below `fitAspect` (width / height) the lens widens in proportion,
     *  so the resting globe keeps the share of the viewport width it has at that ratio and is never cropped.
     *  `lift` then aims the camera lower, per unit of widening, so the globe sits above the copy. */
    tall: { fitAspect: 0.92, lift: 14 },
    /** Cursor parallax (units) and its smoothing. */
    parallax: [3.2, 1.8] as [number, number],
    parallaxDamping: 2.2,
    /** Idle drift amplitude. */
    idle: 0.6,
  },

  /* ------------------------------------------------------------------ */
  lighting: {
    exposure: 1.0,
    hemisphere: { sky: '#8f9684', ground: '#040504', intensity: 0.42 },
    key: { color: '#eef5dc', intensity: 2.1, position: [-38, 90, -30] as [number, number, number] },
    fill: { color: '#7c8470', intensity: 0.24, position: [60, 10, 120] as [number, number, number] },
    /** Final state: soft directional light from upper-left front. */
    finalKey: { color: '#f6ffe6', intensity: 2.2, position: [-60, 90, 260] as [number, number, number] },
    /** Inner core light (physically-based; distance is sphere-local × worldScale). */
    core: { color: brand.neon, intensity: 15000, distance: 70, decay: 2 },
    environmentIntensity: 0.6,
    shadowMapSize: 2048,
  },

  /* ------------------------------------------------------------------ */
  /** Palette & air: Ink night, a Hyper Neon breach behind the globe. */
  atmosphere: {
    fogColor: '#1d2118',
    fogDensity: 0.0019,
    /** Final void colour (Ink with a breath of green). */
    voidColor: '#040504',
    voidTop: '#0a0c08',
    skyZenith: '#050605',
    skyGlow: '#ccff00',
    /** The breach behind the globe: weights of its wide, middle and tight lobes, and its strength.
     *  Mostly middle and tight: a corona around the globe, not a lit sky. */
    glowLobes: [0.008, 0.62, 0.38] as [number, number, number],
    /** How tight each lobe is (cosine power): the globe spans about 12°, so 30 fades out by two radii. */
    glowPowers: [3, 42, 140] as [number, number, number],
    glowStrength: 1.05,
    /** Height fog: density, falloff and base height (baked into the shared fog chunk). */
    heightFog: { density: 0.012, falloff: 0.045, base: -62 },
    /** Far haze: distant ranges melt into the atmosphere (view-distance band, world units). */
    farFog: { start: 260, end: 1150, max: 0.93 },
    shaftColor: '#dfff66',
    shaftIntensity: 0.07,
    dustColor: '#8d9479',
    dustCount: 1400,
    rock: { dark: '#050605', light: '#171a14', snow: '#6d7365' },
  },

  /* ------------------------------------------------------------------ */
  /** What the liquid reflects. The cards exist only as reflections; they are not visible in the sky. */
  studio: {
    /** Reflectance at normal incidence (polished dark glass) and the base colour under it. */
    f0: 0.045,
    body: '#020202',
    /** How strongly the breach behind the globe shows up in reflections (the eclipse rim). */
    breachGain: 3.0,
    /** Soft cards: direction they sit in (world), half-size (tangent units), softness, colour, intensity. */
    cards: [
      // The lights sit behind the globe, so their reflections hug its edge: edge-lit glass, as in the
      // brand's liquid artwork. (Lights in front would draw strokes across the face of the globe.)
      // a tall white strip behind and to the left: one thin crescent just inside the left limb
      { dir: [-0.52, 0.1, -0.85], half: [0.045, 0.95], soft: 0.035, color: '#ffffff', intensity: 6.5 },
      // a neon strip behind, low on the right: a second crescent in Hyper Neon
      { dir: [0.5, -0.34, -0.8], half: [0.06, 0.8], soft: 0.06, color: brand.neon, intensity: 4.5 },
      // a very soft pale panel overhead: the top of the globe is never dead black
      { dir: [0, 0.92, 0.4], half: [1.3, 0.6], soft: 0.7, color: '#dfe6cf', intensity: 0.5 },
      // closing section only: a soft key from the upper left front, so the kept droplet reads as a
      // solid bead of glass and not as a ring
      { dir: [-0.5, 0.55, 0.67], half: [0.2, 0.2], soft: 0.42, color: '#f6ffe6', intensity: 2.6, final: true },
    ] as { dir: [number, number, number]; half: [number, number]; soft: number; color: string; intensity: number; final?: boolean }[],
    /** Core light on the liquid: wall albedo for the inner glow (kept low: the liquid stays black
     *  glass, lit by glints and its rim, not by a wash) and highlight sharpness. */
    coreAlbedo: 0.014,
    coreShininess: 70,
    /** The core seen through the dark glass before the globe opens: a soft heart of light that swells
     *  as the scroll begins. Strength at full glow, and its size as a share of the drop's radius. */
    innerGlow: 1.15,
    innerSize: 0.46,
    /** How much of the scene's fog settles on the liquid (1 = as on the valley). Less than the rock
     *  takes, so droplets sinking into the valley stay black instead of turning to pale ghosts. */
    fog: 0.45,
    /** Ambient occlusion strength in the creases between bands. */
    occlusion: 0.75,
  },

  /* ------------------------------------------------------------------ */
  terrain: {
    seed: 11,
    segmentsX: 440,
    segmentsZ: 340,
    width: 1700,
    zNear: 210,
    zFar: -1500,
    floor: -78,
    /** Foreground massifs (two differently placed copies of one generated peak). */
    foreground: [
      { position: [-160, -112, 70], rotationY: 0.6, scale: [0.62, 0.72, 0.62] },
      { position: [215, -115, 70], rotationY: 2.0, scale: [-0.58, 0.66, 0.58] }, // mirrored
    ] as { position: [number, number, number]; rotationY: number; scale: [number, number, number] }[],
  },

  /* ------------------------------------------------------------------ */
  post: {
    bloomIntensity: 0.9,
    bloomThreshold: 0.85,
    bloomSmoothing: 0.25,
    godRays: true,
    grain: 0.036,
    vignette: 0.55,
    /** Split toning (linear RGB): a breath of olive in the shadows, neutral highlights. */
    shadowTint: [0.004, 0.006, 0.0] as [number, number, number],
    highlightTint: [1.0, 1.0, 0.97] as [number, number, number],
  },

  /* ------------------------------------------------------------------ */
  scroll: {
    /** Length of the pinned scroll in viewport heights. */
    lengthScreens: 9.5,
    /** Soft snap: releasing the scroll inside a zone glides to its resting point (s = seconds). */
    magnetDuration: [0.6, 1.4] as [number, number],
    /** GSAP scrub smoothing in seconds. */
    scrub: 1.3,
    restartDuration: 3.2,
  },

  /** `?demo=1` take (scroll/demo.ts): [τ seconds after the hero titles start, scroll progress] stops;
   *  equal progress = a hold; between stops the take glides on one smooth curve. Globe → break-up → the kept droplet. */
  demo: {
    keys: [
      [0, 0],
      [3.0, 0],
      [6.8, 0.184],
      [10.8, 0.414],
      [14.4, 0.644],
      [17.4, 0.833],
      [19.0, 1],
      [23.5, 1],
    ] as [number, number][],
  },

  performance: {
    dpr: [1, 1.75] as [number, number],
    /** The drawing buffer never exceeds this many pixels (the pixel ratio drops to fit), nor falls below `minDpr`. */
    maxPixels: 2.6e6,
    minDpr: 0.6,
    lowDpr: 1,
  },
} as const

export type Config = typeof config
