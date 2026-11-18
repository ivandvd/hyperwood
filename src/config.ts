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
    /** How the drop becomes the mark. 'draw': the drop sits in the mark's first lobe and pours out along it,
     *  so the drop draws the mark from one end to the other. 'morph': the kit's morph, where the whole outline
     *  changes at once. `?mark=draw` or `?mark=morph` in the address overrides this, to compare the two. */
    reveal: 'draw' as 'draw' | 'morph',
    /** For 'draw', the drop the mark starts from: the largest circle that fits in its first lobe (centre and
     *  radius in artwork units, measured from the master, a hair inside it: not tuning knobs). */
    start: { centre: [47.9, 122.3] as [number, number], radius: 42.4 },
    /** For 'draw': seconds the drawing takes, and how far behind the front the liquid stands at its full
     *  height (`nose`, in artwork units), which is what lights the front like the tip of a stream.
     *  The liquid runs fastest mid-stream: `wall` is its speed along the outline as a share of that, and
     *  `reach` is how far from the outline (artwork units) it gets up to full speed. Together they round the
     *  front into a finger: a lower `wall` or a longer `reach` makes the tip longer and more pointed. */
    draw: 3.4,
    nose: 30,
    wall: 0.3,
    reach: 15,
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
    /** Seconds on the clock, not on the scroll: the drop finishes filling (`ignite`), then becomes the mark.
     *  `morph` is the length of the kit morph when `reveal` is 'morph' (the kit plays it in 900 ms; here it is
     *  given more time so it reads as liquid). The drawing has its own length, `draw`, above. */
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
     *  height as a share of the mark width, and the volume grows in over the first `by` of the morph
     *  (`byDraw` of the drawing).
     *  Lighting: a key from `key` (x right, y up, z to the viewer) that shades by `shade`, a deeper `rim`,
     *  a `glint` of tightness `shine`, the `cursor` light strength, and a slow `ripple` of the surface. */
    depth: {
      blur: 15,
      profile: 0.6,
      relief: 0.05,
      by: 0.7,
      byDraw: 0.12,
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
  /** The opening (ui/opening.ts, index.html): the cover that is up while the hero gets ready, and when it may come down. */
  opening: {
    /** How the mark fills: three movements that add up, each run by the browser as one animation.
     *  `first` starts with the page's first paint and covers `share` of the mark. index.html starts it, so its
     *  three numbers are written there as well (.op-a and @keyframes op-first): keep the two the same.
     *  `scene` starts when the hero's scene exists. `done` starts when the hero is whole and checked, and closes
     *  whatever is left, so the mark is always full `done.seconds` later, however far the first two have got.
     *  `ease` is a CSS cubic-bezier. `hold`: the full mark is seen this long (seconds) before the cover goes.
     *  The first two start briskly and then creep for a long time: on a fast connection only their brisk part
     *  is seen and the mark is about two thirds full when the hero is ready; on a slow one the mark is still
     *  moving, slowly, seconds later. */
    fill: {
      first: { share: 0.34, seconds: 3.2, ease: [0.12, 0.6, 0.2, 1] as [number, number, number, number] },
      scene: { share: 0.5, seconds: 1.6, ease: [0.3, 0, 0.1, 1] as [number, number, number, number] },
      done: { seconds: 0.42, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
      hold: 0.1,
    },
    /** The landing page's mark fills in one sweep (ui/opening.ts, `finish: 'run'`).
     *  `first`: the movement its own styles start with the first paint, brisk and then creeping for as long as
     *  the page takes to arrive. Its three numbers are written in index.html as well (.op-a and @keyframes
     *  op-first): keep the two the same.
     *  `run`: when the page is whole, the first movement is stopped where it stands and one movement runs on
     *  from there to the full mark. It takes `base` seconds, and `per` more for a whole mark still to fill;
     *  it leaves at the speed the first movement has at that moment and eases out (`ease`: the two numbers of
     *  its curve that do not follow from that speed). On a quick load the mark is about a fifth full when the
     *  page is whole and full a little over half a second later, at an even pace: with these numbers the
     *  fastest moment of the sweep is about one and a half times its average. */
    flow: {
      first: { share: 0.45, seconds: 3.2, ease: [0.1, 0.7, 0.2, 1] as [number, number, number, number] },
      run: { base: 0.3, per: 0.5, ease: [0.3, 0.55] as [number, number] },
    },
    /** The cover stays at least this long (seconds), so the mark is seen to fill and the page does not flash. */
    minShow: 0.9,
    /** Consecutive smooth frames (< 34 ms) of the scene required before the cover comes down, so the hero
     *  never opens on a hitch… */
    stableFrames: 10,
    /** …but never wait longer than this many seconds of drawing for it. */
    stableTimeout: 2.2,
    /** The check starts this long (seconds) after the scene's first frame: the first frames carry uploads. */
    benchAfter: 0.14,
    /** Performance check behind the cover: after `benchRest` frames at rest the scene is held at this story
     *  progress (the open bands, its heaviest moment); `benchSkip` frames are let go, `benchSamples` are timed.
     *  If frames there take `benchSlow` times longer than at rest, the pixel ratio drops by `benchStep` and
     *  the check repeats, at most `benchRounds` times. */
    benchAt: 0.36,
    benchRest: 8,
    benchSkip: 6,
    benchSamples: 12,
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
    /** Brand grade, the last step of the picture: `amount` pulls every pixel onto the brand's own gradient, a
     *  straight mix of Ink and Hyper Neon (how the kit colours its liquid field). 1 = two colours only, nothing
     *  pale or white; 0 = the earlier filmic look. `contrast` bends the mix: above 1 the frame stays mostly Ink
     *  and Neon reads as light. `?brand=0` in the address shows the picture without the grade, to compare. */
    brand: { amount: 1, contrast: 1.45 },
  },

  /* ------------------------------------------------------------------ */
  scroll: {
    /** Length of the pinned scroll in viewport heights. */
    lengthScreens: 9.5,
    /** After the story the scene draws in to a frame of the page: this many more screens of pinned scroll.
     *  On wide screens one further screen follows, while the first frame of the deck slides over it. */
    handoffScreens: 0.6,
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
      // the drop draws the mark on the clock (about 18.2 s to 21.6 s), then the frame rests
      [24.6, 1],
    ] as [number, number][],
  },

  /* ------------------------------------------------------------------ */
  /** The landing page's journey (journey/): the pinned opening, drawn by one shader. */
  journey: {
    /** The drawing buffer's pixel ratio is the screen's, up to this, and never more pixels than `maxPixels`
     *  (a large screen draws at a lower ratio, so a frame costs about the same everywhere). */
    maxDpr: 1.5,
    maxPixels: 3.2e6,
    /** How closely the journey follows the scroll: the time constant of the easing, ms. */
    ease: 80,
    /** Every tone of the picture, between Ink and Hyper Neon. `hot` is the lightest there is: nothing in the
     *  picture is white or pale. */
    palette: { ink: '#0a0a0a', neon: '#ccff00', hot: '#ecff6a', lime: '#9fd600', moss: '#3f5c10', deep: '#131b09' },
    /** The lids, in journey progress and in shares of the screen: when they show, from when to when they
     *  close, when they part again (`part`), how far apart they stand open and shut (half the gap, from the
     *  middle), how much they bow down at the sides, and how soft their edge is. The shader and the words both
     *  read these. */
    lids: { appear: [0.07, 0.11] as [number, number], from: 0.08, to: 0.26, part: [0.265, 0.34] as [number, number], open: 0.78, shut: -0.15, bow: 0.13, bowPower: 1.6, feather: 0.14 },
    /** The mark's body in the hero: how thick it is, as a share of a full round (1 is as deep as each stroke
     *  is wide), and how large the drop is that it comes out of (its radius, as a share of half the mark's
     *  width). */
    body: { full: 0.8, drop: 0.26 },
    /** The hero as a room: the films stand in a box (film/FilmStack.tsx), and the journey's light is their
     *  bulb. The drop that stands in the opening eye rises to where the bulb hangs and draws in to its size:
     *  it is the lamp. The lamp's light then reaches further and further, and the film shows where it
     *  reaches. Leaving, the same backwards: the light draws back to the lamp, the lamp swells into the drop,
     *  and the drop goes to the gate.
     *  `stay`: how much longer the journey is with the room as its hero, as a share of its length with the
     *  mark: all of it goes to the hero's rest, where the three films follow one another as the page is
     *  scrolled. The other beats are carried over so that each keeps its stretch of scrolling
     *  (journey/timing.ts).
     *  `turns`: where in that rest one film gives way to the next (the middle of each change, as a share of
     *  the rest), and `turn`, how long a change takes (the same). A change is the light drawing back to the
     *  lamp, the lamp going over to the next film's bulb, and the light opening the next room.
     *  `open`, `shut`: when the light opens the first room and when it draws back from the last, in journey
     *  progress as the mark's journey counts it (they sit between its beats, and are carried over with them).
     *  `soft`: how soft the front of that light is, as a share of how far it has reached. `ease`: how it
     *  reaches (1 is evenly; more lingers about the lamp first).
     *  `swell`: when the lamp swells into the drop again, as a share of the gathering (beats.gather).
     *  `side`: over how much of half the box's width the film gives way to the page's Ink at either side
     *  (its upper and lower edges melt into the page by the box's own fade).
     *  `light`: the bulb's light as the films have it, measured on the finished films (all three bulbs were
     *  finished to one fall: scripts/film/tint.cjs). How much Neon there is at a distance from the bulb's
     *  middle: `full` times a bell `sigma` wide, plus a faint tail (how strong, how far), never more than 1:
     *  where it comes to 1 it is rounded off over `knee`, so the bulb's full middle has no rim. Distances in
     *  film widths. (Measured: scripts/film/light.ts prints the films' own fall beside this one.) */
    room: {
      stay: 0.375,
      turns: [0.31, 0.69],
      turn: 0.165,
      open: [0.365, 0.45] as [number, number],
      shut: [0.585, 0.645] as [number, number],
      soft: 0.55,
      ease: 1.5,
      swell: [0.12, 0.34] as [number, number],
      side: 0.16,
      light: { full: 1.1, sigma: 0.0335, tail: [0.05, 0.07] as [number, number], knee: 0.1 },
    },
    /** The floor the current runs over, from the gate towards the viewer, and the current's course on it.
     *  `rise`: how far above the gate's foot the eye's level lies, in screen heights (less is a flatter floor).
     *  The course: `straight` out of the gate, then one long bend to the left and back across to the right,
     *  swinging `reach` to the side as measured at the gate (on a narrow screen, per unit of its width to
     *  height); `turn` and `quicken` say how soon the bends come; `sway` is how far they drift in time. It
     *  is walked in `pieces`.
     *  `breadth`: how broad the current is seen on the screen, in gate widths, at points along the course
     *  (0 is the gate's foot, about 0.68 the bottom of the screen): as broad as the gate where it leaves, thin
     *  where it lies far off and flat, broad where it comes towards the viewer. */
    floor: {
      rise: 0.2,
      reach: 0.3,
      reachNarrow: 0.19,
      straight: 0.1,
      turn: 8.61,
      quicken: 1.413,
      sway: 0.07,
      pieces: 36,
      breadth: [
        [0, 1],
        [0.14, 0.5],
        [0.28, 0.48],
        [0.41, 0.85],
        [0.54, 1.2],
        [0.61, 2.15],
        [0.72, 3],
      ] as [number, number][],
    },
    /** The course the current takes: the wave of the reference frame, traced. Out of the gate into a pool
     *  that spreads to the right, away to the left, back across to the right, and round again along the
     *  bottom of the screen towards the viewer. (`floor` above is the first course, with two sweeps; the
     *  page still shows it, drawn as it was, when the address ends in ?wave=old.)
     *  `points`: each is how far right of the gate's middle, how far below its foot, and half the breadth
     *  the current is seen to have there, all in gate half-widths. The points are not on the course: they
     *  pull at it, and the course is the smooth curve between them (a cubic B-spline), so it has no kink
     *  and its breadth never jumps. Keep them few and evenly spread: a point close beside another makes a
     *  tight turn, and a breadth that goes down and up again makes a neck. The course is cut into `pieces`.
     *  On a screen narrower than `fullAt` (width to height) the points close up towards the middle.
     *  `drift`: how far they wander in time.
     *  `seen`: how far from a piece's middle line the current's outline lies, in the piece's own measure.
     *  `soft`: how soft that outline is: a share of half the breadth, but never less nor more than the two
     *  measures after it (screen heights), so the broad sweeps near the eye keep an edge and the dark
     *  between two sweeps stays dark. `glow`: how strong the light just outside the outline is, and how
     *  far it reaches (in edge softnesses). */
    wave: {
      seen: 0.814,
      fullAt: 1.58,
      drift: 0.14,
      pieces: 64,
      soft: [0.16, 0.009, 0.018] as [number, number, number],
      glow: [0.22, 0.9] as [number, number],
      /** About the gate the current is plain Neon, with no band in it, so the gate and the light that
       *  pours out of it are one shape: no band within the first of these distances from the middle of
       *  the gate's foot, the full band beyond the second (gate half-widths). */
      plain: [2.4, 5] as [number, number],
      /** The share of the course, from its beginning, that arrives all together: the gate's bell, the
       *  pool and the turn under the gate. The gate swells into its bell on both sides at once, and the
       *  current then runs on from there. */
      together: 0.28,
      /** Which of the points make the pool beside the gate (first and last): they give way when a note
       *  stands in their place. The points before them are the gate's own part of the course: it begins
       *  high inside the gate, as broad as the gate, and grows broader on its way down, so the gate opens
       *  out into the current like a bell and has no foot once the light pours. (Where the notes beside
       *  the gate come down to its foot, the bell draws in to the gate's breadth.) */
      pool: [4, 6] as [number, number],
      points: [
        [0, -1.96, 0.92],
        [0, -1.42, 1.04],
        [-0.03, -0.89, 1.33],
        [-0.03, -0.33, 1.6],
        [0.89, 0.56, 1.13],
        [3.35, 0.65, 0.68],
        [0.92, 1.24, 0.8],
        [-1.07, 0.59, 1.07],
        [-2.61, 0.44, 0.98],
        [-4.83, 1.3, 0.74],
        [-9.93, 2.07, 0.5],
        [-5.9, 2.34, 0.83],
        [-3.17, 2.96, 1.27],
        [-0.36, 3.6, 1.45],
        [4.03, 4.21, 1.82],
        [10.19, 5.75, 2.55],
        [15.82, 8.24, 3.26],
        [9.48, 10.61, 4.07],
        [0.65, 8.24, 4.92],
        [-6.06, 9.75, 4.62],
        [-12.62, 11.59, 4.44],
      ] as [number, number, number][],
    },
    /** The gate and the river as the guide draws them: one painted picture (its doorway, and the river that
     *  runs out of it). It is laid by the gate's box, takes the screen over from the gate the shader draws,
     *  is revealed from the gate downward and ripples below the gate, so the river runs. The numbers are the
     *  guide's own. The page asks for the picture where the guide keeps it (`url`); if it does not come, the
     *  traced wave above is drawn in its place.
     *  `size`: the picture, in its own pixels. `arch`: its doorway, in picture heights up from the picture's
     *  bottom edge: where the arch's round begins, and how large the round is (its top lies at their sum).
     *  The gate's box (tokens.css) has the same measures, so the gate and the picture's doorway are one.
     *  `mix`: when the picture takes over, at the gate's foot. `out`: further from the foot it takes over
     *  later, by this much of the journey for every gate half-width, and by no more than `out[1]`: so the
     *  light shows under the foot and spreads (0 is the guide's way: all of it at once).
     *  `arrive`: when the river is revealed, from `front[0]` down to
     *  `front[1]` (picture heights, up from its bottom edge), `feather` soft. `copy`: when the closing words
     *  come.
     *  `light`: how the picture's colours are read as the brand's one light. It is the picture's lightness
     *  that is read, in a straight line: nothing below `light[0]`, full Neon from `light[1]` (its pale body
     *  is about 0.79 light, its orange doorway 0.7), and `light[2]` bends the line (1 is straight; more is
     *  a closer glow, less a fuller one). Keep it near straight: the picture's softness is what makes the
     *  pour a body of light and lets it come in as a glow that swells. (A steep reading, a smooth step up
     *  to 0.56, made a flat shape with a hard edge of it: it swallowed the gate and came in all at once.)
     *  `tone`: a second tone where the picture runs cool (the bands along the river's edges): how much
     *  deeper, and between which measures of blue over red it comes in. `crown`: the gate's crown is this
     *  much deeper than its foot and the pour (the guide's doorway is orange above, pale where it pours),
     *  falling evenly between these two heights of the gate (0 its foot, 1 its top).
     *  `rim`: the glow about the gate the shader draws before the picture takes over, made like the
     *  picture's own: how strong at the gate's edge, how far it reaches, and over how much of the gate's
     *  height above its foot it thins out to nothing (both in gate half-widths). */
    picture: {
      url: 'https://assets.uberdesigner.ai/melune/portal-river.webp',
      size: [2752, 1536] as [number, number],
      arch: [0.71, 0.068] as [number, number],
      mix: [0.855, 0.88] as [number, number],
      out: [0.005, 0.02] as [number, number],
      arrive: [0.88, 0.96] as [number, number],
      front: [0.48, -0.2] as [number, number],
      feather: 0.12,
      copy: [0.88, 0.96] as [number, number],
      light: [0.02, 0.68, 1] as [number, number, number],
      crown: [0.14, 0.3, 0.8] as [number, number, number],
      tone: [0.1, 0.12, 0.38] as [number, number, number],
      rim: [0.45, 0.178, 0.6] as [number, number, number],
      /** How much of the picture's breadth, at either side, is drawn out where the ripple would reach past
       *  its edge (a wide screen's bottom corners). */
      margin: 0.03,
    },
    /** When things come and go, in journey progress. The page and the shader both read these.
     *    introOut  the opening words go (the lids, above, have nearly shut)
     *    drop      the drop shows in the opening eye       morph    it spreads into the mark
     *    cool      the mark's light draws back to its edges: the body of black liquid
     *    word      the wordmark and the line under it      header   the header
     *    heroOut   the words go, the body fills with light again
     *    gather    the mark gathers into the gate          stand    the gate stands on its floor
     *    closing   the closing words                       river    the current runs out */
    beats: {
      introOut: [0.215, 0.265] as [number, number],
      drop: [0.275, 0.31] as [number, number],
      morph: [0.305, 0.375] as [number, number],
      cool: [0.375, 0.43] as [number, number],
      word: [0.4, 0.465] as [number, number],
      header: [0.365, 0.44] as [number, number],
      heroOut: [0.585, 0.635] as [number, number],
      gather: [0.635, 0.785] as [number, number],
      stand: [0.775, 0.835] as [number, number],
      closing: [0.825, 0.895] as [number, number],
      river: [0.855, 0.975] as [number, number],
    },
    /** The same without WebGL, where no picture is drawn: the hero comes as the opening words go and stays
     *  until the closing words take over. */
    stillBeats: {
      word: [0.275, 0.34] as [number, number],
      header: [0.275, 0.34] as [number, number],
      heroOut: [0.66, 0.76] as [number, number],
      closing: [0.73, 0.8] as [number, number],
    },
    /** The opening words come into focus this long (ms) after the opening lets the page go, over this long.
     *  (The opening's mark fades in about a third of a second: the words begin under it, so the screen is
     *  never empty between the two.) */
    intro: { delay: 160, focus: 1500 },
    /** The wordmark in the hero: how soft the copy is that makes its glow (px). */
    word: { blur: 9 },
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
