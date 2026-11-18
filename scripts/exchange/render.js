/**
 * The exchange: a building of our own, rendered in the browser by a small path tracer (no picture from anywhere
 * else). A temple front of fluted columns under a plain pediment, on a podium with a flight of steps, before a
 * wet cobbled street, at night. Its doorway is round-headed and has the page's gate's measures (1.603 times as
 * tall as it is wide), so the journey's gate can become it.
 *
 * The render is not the picture the page shows: it is the parts the page puts together while it is scrolled
 * (journey/shader.ts). Each part is the scene lit by one light only, so the page can bring each in on its own:
 *   base    the scene under a faint moon and sky, as if no door were open
 *   door    the scene lit by the open doorway alone (the doorway's light at one), with the wet street's
 *           reflections of it and of what it lights
 *   river   the scene lit by the river of light alone (the river at one), which the page pours in later
 * and, for each point, where it lies: its place along the river and across it (so the page can draw the river
 * and pour it in from the door), and how far it is from the doorway (so the door's light can reach out).
 *
 * Open it from the dev server: /scripts/exchange/render.html?w=1280&h=800&spp=16&mode=preview
 *   mode=preview  everything put together as the page would at the end, to look at
 *   mode=light    the three lights, one to a channel (base, door, river), encoded (see `encode` below)
 *   mode=space    the river's place: along it (0 at the doorway, 1 at its end) and how far from its middle
 *                 line (in half breadths, 0 to 4), one to a channel
 *   mode=aux      the surface under the river, the distance from the doorway, and what each point is
 * When it is done, `window.__done` is true and the canvas holds the result at its own pixels.
 */

const q = new URLSearchParams(location.search)
const num = (key, fallback) => (q.has(key) ? Number(q.get(key)) : fallback)
const W = num('w', 1280)
const H = num('h', 800)
const SPP = num('spp', 16)
const MODE = q.get('mode') || 'preview'
const TILE = num('tile', 96)
const DEBUG = q.get('debug') || ''

/** The scene, in metres: x across, y up, z towards the viewer. The porch floor is y = 0. */
const C = {
  cols: num('cols', 6),
  // the axes of the two middle columns stand this far apart (the doorway is between them), the others this far
  mid: num('mid', 5.6),
  axis: num('axis', 2.5),
  colH: 9.4,
  colR: 0.64,
  // the doorway: round-headed, as wide as this, 1.603 times as tall (the page's gate)
  doorW: num('door', 3.6),
  // the cella wall's face, behind the columns, and its thickness
  wallZ: -3.8,
  wallT: 1.2,
  // the flight of steps down from the porch to the street
  steps: 9,
  rise: 0.17,
  run: 0.42,
  porch: 1.4,
  // the camera: its height over the street, how far out, its half field of view (as a tangent, up and down),
  // and how far its frame is shifted up (in half-heights), so the verticals stay upright
  eye: num('eye', 4.5),
  dist: num('dist', 40),
  tan: num('tan', 0.49),
  shift: num('shift', -0.306),
  // the moon: where it is, and how strong; the sky
  moon: [-0.45, 0.75, 0.5],
}
C.doorH = 1.603 * C.doorW
C.doorR = C.doorW / 2
C.doorC = C.doorH - C.doorR
C.streetY = -C.rise * C.steps
C.halfW = (C.mid / 2 + C.axis * (C.cols / 2 - 1)) + 1.25
C.stepsHalf = C.halfW - 1.7

/** The river, in plan (x, z): out of the doorway, over the porch, straight down the steps, then over the
 *  street away to the left, back across to the right and on towards the viewer. Its half breadth at each point. */
const COURSE = [
  [0, C.wallZ - 0.2, 1.75],
  [0, C.porch, 1.8],
  [0, C.porch + C.run * C.steps, 1.85],
  [-1.6, C.porch + C.run * C.steps + 2.6, 1.85],
  [-6.2, 12, 1.85],
  [-6.6, 15.4, 1.8],
  [-2.4, 18.4, 1.75],
  [2.4, 21.8, 1.7],
  [2.8, 26.2, 1.65],
  [1.2, 30.6, 1.6],
  [0.4, 36, 1.55],
]
const RN = 64
const river = (() => {
  // a smooth curve through the points (Catmull-Rom), then points evenly along its length
  const dense = []
  for (let i = 0; i < COURSE.length - 1; i++) {
    const p0 = COURSE[Math.max(i - 1, 0)], p1 = COURSE[i], p2 = COURSE[i + 1], p3 = COURSE[Math.min(i + 2, COURSE.length - 1)]
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t
      dense.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)))
    }
  }
  dense.push(COURSE[COURSE.length - 1])
  const along = [0]
  for (let i = 1; i < dense.length; i++) along.push(along[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]))
  const length = along[along.length - 1]
  const out = []
  for (let k = 0; k < RN; k++) {
    const want = (length * k) / (RN - 1)
    let i = 1
    while (i < along.length - 1 && along[i] < want) i++
    const f = (want - along[i - 1]) / Math.max(along[i] - along[i - 1], 1e-9)
    out.push([0, 1, 2].map((j) => dense[i - 1][j] + (dense[i][j] - dense[i - 1][j]) * f))
  }
  return { points: out, length }
})()

const f = (v) => (Number.isInteger(v) ? v.toFixed(1) : String(v))

const TRACE_SRC = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform vec2 res;
uniform int sampleIndex;
uniform sampler2D prev0;
uniform sampler2D prev1;
uniform sampler2D prev2;
uniform vec4 course[${RN}];
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
layout(location = 2) out vec4 o2;

#define PI 3.14159265
const float COL_H = ${f(C.colH)};
const float COL_R = ${f(C.colR)};
const float HALF_W = ${f(C.halfW)};
const float STEPS_HALF = ${f(C.stepsHalf)};
const float WALL_Z = ${f(C.wallZ)};
const float WALL_T = ${f(C.wallT)};
const float DOOR_R = ${f(C.doorR)};
const float DOOR_C = ${f(C.doorC)};
const float RISE = ${f(C.rise)};
const float RUN = ${f(C.run)};
const float NSTEPS = ${f(C.steps)};
const float PORCH = ${f(C.porch)};
const float STREET_Y = ${f(C.streetY)};
const float MID = ${f(C.mid / 2)};
const float AXIS = ${f(C.axis)};
const float NCOL = ${f(C.cols / 2)};
const float RIVER_LEN = ${f(river.length)};
const vec3 EYE = vec3(0., ${f(C.streetY + C.eye)}, ${f(C.dist)});
const float TAN = ${f(C.tan)};
const float SHIFT = ${f(C.shift)};
const vec3 MOON = normalize(vec3(${C.moon.map(f).join(', ')}));
// the doorway's light: a plane in the doorway, just inside the wall's face, facing the street
const float EMIT_Z = WALL_Z - .03;

// ---------------------------------------------------------------- random numbers
uint seed;
uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float rnd() { seed = pcg(seed); return float(seed) / 4294967296.; }
vec3 sphere() { float z = rnd() * 2. - 1.; float a = rnd() * 2. * PI; float r = sqrt(max(1. - z * z, 0.)); return vec3(r * cos(a), r * sin(a), z); }

// ---------------------------------------------------------------- noise
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) { vec2 i = floor(p), u = fract(p); u = u * u * (3. - 2. * u); return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= .5; } return s; }

// the street's setts: rows across the street, the stones of each row shifted along and each a little different.
// How far a point is inside its stone's edge (metres), how far from the stone's middle (0 to 1), and which stone
vec3 cobble(vec2 p) {
  float row = floor(p.y / .17);
  float sx = p.x / .27 + hash12(vec2(row, 3.7)) * 7.;
  float col = floor(sx);
  vec2 local = vec2(fract(sx) - .5, fract(p.y / .17) - .5) * vec2(.27, .17);
  float id = hash12(vec2(col, row));
  // (each stone a touch smaller than its place, by a different amount, so the joints vary)
  vec2 hs = vec2(.135, .085) - .006 - .01 * vec2(hash12(vec2(col, row + 9.)), hash12(vec2(col + 5., row)));
  vec2 e = hs - abs(local);
  return vec3(min(e.x, e.y), length(local / hs), id);
}
// the street's wet hollows, where the water lies flat; and the ground before the steps, wet all over, where the
// doorway's light falls first and the river runs (so the light's pool on it begins at the steps' foot, with no
// dry patch in it)
float puddle(vec2 p) {
  float hollows = smoothstep(.58, .7, fbm(p * .2 + vec2(3.1, 7.7)));
  float apron = (1. - smoothstep(3., 7.5, abs(p.x))) * smoothstep(PORCH + RUN * (NSTEPS - 1.), PORCH + RUN * NSTEPS, p.y)
    * (1. - smoothstep(10., 18., p.y));
  return max(hollows, apron);
}
float streetH(vec2 p) {
  vec3 c = cobble(p);
  float stone = smoothstep(-.002, .01, c.x);
  float dome = clamp(c.y, 0., 1.);
  // (the stones only a little domed, so the doorway's reflection lies on the wet street as one soft light, not as a
  // spark on every stone)
  float h = stone * (.004 + .0018 * (1. - dome * dome) + (c.z - .5) * .001) - (1. - stone) * .005;
  return mix(h, .007, puddle(p));
}

// ---------------------------------------------------------------- shapes
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
// the doorway's opening in the wall's plane (x across, y up from the porch floor)
float archD(vec2 q) { return q.y < DOOR_C ? abs(q.x) - DOOR_R : length(q - vec2(0., DOOR_C)) - DOOR_R; }
// an isosceles triangle, its base on y = 0 from -w to w, its apex at (0, h)
float sdTri(vec2 p, float w, float h) { p.x = abs(p.x); vec2 n = normalize(vec2(h, w)); return max(dot(p - vec2(w, 0.), n), -p.y); }
// a band of the entablature: from y0 to y1 over the columns' tops, from the building's back to its face at z = front,
// and halfX either side of the middle
float slab(vec3 p, float y0, float y1, float front, float halfX) {
  return sdBox(p - vec3(0., COL_H + (y0 + y1) * .5, (front - 7.95) * .5), vec3(halfX, (y1 - y0) * .5, (front + 7.95) * .5));
}

float column(vec3 q) {
  // the plinth and the moulding over it
  float d = sdBox(q - vec3(0., .14, 0.), vec3(.84, .14, .84));
  d = min(d, sdTorus(q - vec3(0., .37, 0.), vec2(.71, .1)));
  d = min(d, max(length(q.xz) - .69, abs(q.y - .5) - .06));
  // the shaft: tapering, with a slight swell (entasis), and twenty flutes
  float y0 = .52, y1 = COL_H - .62;
  float t = clamp((q.y - y0) / (y1 - y0), 0., 1.);
  float R = COL_R * (1. - .15 * t) + COL_R * .022 * sin(PI * t);
  float rad = length(q.xz);
  float fl = abs(fract(atan(q.z, q.x) / (2. * PI) * 20.) - .5) * 2.;
  float groove = .042 * sqrt(max(1. - fl * fl, 0.)) * smoothstep(0., .08, t) * smoothstep(1., .94, t);
  float shaft = max((rad - (R - groove)) * .8, abs(q.y - (y0 + y1) * .5) - (y1 - y0) * .5);
  d = min(d, shaft);
  // the capital: a ring flaring out (the echinus) and the square slab over it (the abacus)
  float k = clamp((q.y - y1) / .3, 0., 1.);
  float echinus = max(rad - mix(R * .9, COL_R * 1.26, k * k), abs(q.y - (y1 + .15)) - .15);
  d = min(d, echinus * .85);
  d = min(d, sdBox(q - vec3(0., COL_H - .16, 0.), vec3(.9, .16, .9)));
  return d;
}

// the scene: distance, and what was hit (1 stone, 2 steps and podium, 3 street, 4 the wall's windows, 6 the doorway's light)
vec2 map(vec3 p) {
  // the street
  float street = p.y - STREET_Y;
  if (street < .1) street = (p.y - STREET_Y - streetH(p.xz)) * .55;
  vec2 best = vec2(street, 3.);
  // everything else stands within this box: further off, a ray may come as near as the box, and no nearer
  float bounds = sdBox(p - vec3(0., 5.5, -1.5), vec3(HALF_W + 1., 13.5, 9.5));
  if (bounds > 1.) return vec2(min(best.x, bounds), best.y);

  // the podium, with the porch floor on it, and the steps down from its front
  float podium = sdBox(p - vec3(0., STREET_Y * .5, (PORCH - 9.) * .5), vec3(HALF_W + .3, -STREET_Y * .5, (PORCH + 9.) * .5));
  float kf = clamp(floor((p.z - PORCH) / RUN) + 1., 1., NSTEPS);
  float steps = 1e9;
  for (int j = -1; j <= 1; j++) {
    float k = clamp(kf + float(j), 1., NSTEPS);
    float top = -RISE * k, front = PORCH + RUN * k;
    steps = min(steps, sdBox(p - vec3(0., (top + STREET_Y - .4) * .5, (front - 6.) * .5), vec3(STEPS_HALF, (top - STREET_Y + .4) * .5, (front + 6.) * .5)));
  }
  // the blocks either side of the flight
  float cheeks = sdBox(vec3(abs(p.x), p.y, p.z) - vec3(STEPS_HALF + (HALF_W + .3 - STEPS_HALF) * .5, (STREET_Y + .32) * .5, (PORCH + RUN * NSTEPS + .25 - 6.) * .5),
    vec3((HALF_W + .3 - STEPS_HALF) * .5, (.32 - STREET_Y) * .5, (PORCH + RUN * NSTEPS + .25 + 6.) * .5));
  float base = min(min(podium, steps), cheeks);
  if (base < best.x) best = vec2(base, 2.);

  // the columns (the nearest one on this side)
  float px = abs(p.x);
  float ci = clamp(floor((px - MID) / AXIS + .5), 0., NCOL - 1.);
  float cx = MID + ci * AXIS;
  float col = column(vec3(px - cx, p.y, p.z));

  // the cella wall behind the columns, with the doorway through it, its frame, and tall windows
  float wall = sdBox(p - vec3(0., COL_H * .5, WALL_Z - WALL_T * .5), vec3(HALF_W - .5, COL_H * .5, WALL_T * .5));
  float hole = max(archD(p.xy), abs(p.z - (WALL_Z - WALL_T * .5)) - WALL_T * .5 - .1);
  wall = max(wall, -hole);
  float band = abs(archD(p.xy) - .23) - .23;
  float frame = max(max(band, abs(p.z - (WALL_Z + .08)) - .08), -p.y);
  // (the keystone at the arch's crown)
  frame = min(frame, sdBox(p - vec3(0., DOOR_C + DOOR_R + .3, WALL_Z + .1), vec3(.3, .38, .1)));
  float win = 1e9;
  for (float i = 0.; i < NCOL - 1.; i++) {
    float wx = MID + (i + .5) * AXIS;
    win = min(win, sdBox(vec3(px - wx, p.y - 4.4, p.z - WALL_Z), vec3(.62, 2.6, .28)));
  }
  float windows = max(wall, -win);
  float glass = max(win, -(p.z - (WALL_Z - .26)));
  // (the antae: the wall's ends, standing forward as pilasters)
  float antae = sdBox(vec3(px, p.y, p.z) - vec3(HALF_W - .95, COL_H * .5, WALL_Z + .25), vec3(.55, COL_H * .5, .5));

  // The entablature over the columns: the architrave in three bands, each standing a little further out (the
  // lowest is the porch's coffered ceiling underneath), a plain frieze, then the cornice: a row of dentils, the
  // corona standing well out over them (its underside a line of shadow) and a thin moulding on top. Over that the
  // pediment: its raking cornice one depth all along, so it runs whole down into the corners, and the tympanum
  // set back within it to the frieze's face. (Worked out only near it: further off, the box it all stands in.)
  float roof = sdBox(p - vec3(0., COL_H + 2.15, -3.125), vec3(HALF_W + .4, 2.2, 4.85));
  if (roof < .25) {
    float ent = slab(p, 0., .28, .9, HALF_W);
    vec3 cq = vec3(mod(p.x + .55, 1.1) - .55, p.y - (COL_H + .09), mod(p.z + .55, 1.1) - .55);
    float coffers = max(sdBox(cq, vec3(.42, .1, .42)), max(abs(p.x) - (HALF_W - 1.4), max(p.z + 1., WALL_Z + .25 - p.z)));
    ent = max(ent, -coffers);
    ent = min(ent, slab(p, .28, .58, .96, HALF_W));
    ent = min(ent, slab(p, .58, .82, 1.02, HALF_W));
    ent = min(ent, slab(p, .82, .9, 1.1, HALF_W + .04));
    ent = min(ent, slab(p, .9, 1.62, .98, HALF_W - .04));
    ent = min(ent, slab(p, 1.62, 1.7, 1.08, HALF_W + .06));
    ent = min(ent, slab(p, 1.7, 1.9, 1.1, HALF_W + .1));
    vec3 dq = vec3(mod(p.x + .13, .26) - .13, p.y - (COL_H + 1.8), p.z - 1.17);
    ent = min(ent, max(sdBox(dq, vec3(.07, .1, .07)), abs(p.x) - (HALF_W + .1)));
    ent = min(ent, slab(p, 1.9, 1.95, 1.3, HALF_W + .2));
    ent = min(ent, slab(p, 1.95, 2.25, 1.7, HALF_W + .32));
    ent = min(ent, slab(p, 2.25, 2.35, 1.64, HALF_W + .28));
    vec2 tp = vec2(p.x, p.y - (COL_H + 2.25));
    float hw = HALF_W + .32, ph = .22 * hw;
    float ped = max(sdTri(tp, hw, ph), abs(p.z + 3.125) - 4.825);
    // (the tympanum: the triangle .4 below the slopes, measured upright, and over the corona)
    float tymp = max(max(sdTri(tp + vec2(0., .4), hw, ph), -tp.y), .98 - p.z);
    ped = max(ped, -tymp);
    roof = min(ent, ped);
  }

  float stone = min(min(min(col, windows), min(frame, antae)), roof);
  if (stone < best.x) best = vec2(stone, 1.);
  if (glass < best.x) best = vec2(glass, 4.);
  // the doorway's light: a thin sheet inside the doorway
  float emit = max(archD(p.xy) - .05, abs(p.z - (EMIT_Z - .05)) - .05);
  if (emit < best.x) best = vec2(emit, 6.);
  return best;
}

vec3 normalAt(vec3 p) {
  const vec2 e = vec2(.0015, -.0015);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

vec2 march(vec3 ro, vec3 rd, float far) {
  float t = .01;
  for (int i = 0; i < 260; i++) {
    vec2 h = map(ro + rd * t);
    if (h.x < .0006 * t + .0004) return vec2(t, h.y);
    t += h.x;
    if (t > far) break;
  }
  return vec2(-1., 0.);
}

// whether nothing stands between a point and another this far along a direction
float clear(vec3 ro, vec3 rd, float dist) {
  float t = .015;
  for (int i = 0; i < 140; i++) {
    if (t > dist - .04) return 1.;
    vec2 h = map(ro + rd * t);
    if (h.y > 5.5) return 1.;
    if (h.x < .0008) return 0.;
    t += h.x;
  }
  return 1.;
}

float occlusion(vec3 p, vec3 n) {
  float o = 0., w = 1.;
  for (int i = 1; i <= 5; i++) {
    float h = .06 * float(i) * float(i);
    o += w * (h - map(p + n * h).x);
    w *= .6;
  }
  return clamp(1. - 1.6 * o, 0., 1.);
}

// ---------------------------------------------------------------- the river, in plan
// the nearest point of its middle line: how far along (0 at the doorway, 1 at its end), how far across (in half
// breadths, signed), and its half breadth there
vec3 riverAt(vec2 xz) {
  float best = 1e9, along = 1., across = 9., hw = 1.;
  for (int i = 0; i < ${RN - 1}; i++) {
    vec2 a = course[i].xy, b = course[i + 1].xy;
    vec2 ab = b - a;
    float t = clamp(dot(xz - a, ab) / dot(ab, ab), 0., 1.);
    vec2 d = xz - (a + ab * t);
    float dd = dot(d, d);
    if (dd < best) {
      best = dd;
      along = mix(course[i].z, course[i + 1].z, t);
      hw = mix(course[i].w, course[i + 1].w, t);
      float side = sign(ab.x * d.y - ab.y * d.x);
      across = side * sqrt(dd) / hw;
    }
  }
  return vec3(along, across, hw);
}
// the height of the surface the river lies on, under a point of the plan
float surfaceY(vec2 xz) {
  if (xz.y < PORCH) return 0.;
  float k = ceil((xz.y - PORCH) / RUN);
  return k <= NSTEPS ? -RISE * k : STREET_Y;
}

// ---------------------------------------------------------------- the lights
struct Surface { vec3 albedo; float spec; float rough; };
Surface surfaceOf(float m, vec3 p) {
  if (m < 1.5) {
    float n = fbm(p.xy * 1.7 + p.z * .9);
    return Surface(vec3(.6 + .1 * n), .02, .6);
  }
  if (m < 2.5) return Surface(vec3(.5 + .08 * fbm(p.xz * 2.)), .04, .5);
  if (m < 3.5) {
    vec3 c = cobble(p.xz);
    float wet = puddle(p.xz);
    float stone = smoothstep(-.002, .01, c.x);
    return Surface(vec3(mix(.02, .05 + .05 * c.z, stone)), 1., mix(.34, .14, wet));
  }
  if (m > 4.5) return Surface(vec3(.14), .6, .28);
  return Surface(vec3(.02), .5, .05);
}
float fresnel(float c) { return .03 + .97 * pow(1. - clamp(c, 0., 1.), 5.); }

// one sample of the doorway's light at a point: a point on the lit sheet, as far as can be seen through
float doorLight(vec3 p, vec3 n, vec3 v, Surface s) {
  float a1 = 2. * DOOR_R * DOOR_C, a2 = .5 * PI * DOOR_R * DOOR_R, area = a1 + a2;
  vec2 o;
  if (rnd() * area < a1) o = vec2((rnd() * 2. - 1.) * DOOR_R, rnd() * DOOR_C);
  else { float r = DOOR_R * sqrt(rnd()); float a = PI * rnd(); o = vec2(r * cos(a), DOOR_C + r * sin(a)); }
  vec3 l = vec3(o, EMIT_Z) - p;
  float d2 = dot(l, l), d = sqrt(d2);
  l /= d;
  float cs = dot(n, l), ce = -l.z;
  if (cs <= 0. || ce <= 0.) return 0.;
  float g = cs * ce * area / d2;
  vec3 h = normalize(l + v);
  float e = 2. / (s.rough * s.rough) - 2.;
  float brdf = s.albedo.x / PI + s.spec * fresnel(dot(h, v)) * (e + 2.) / (8. * PI) * pow(max(dot(n, h), 0.), e);
  return min(g * brdf, .8) * clear(p + n * .004, l, d);
}

// one sample of the river's light at a point: a point on the river, a little over the surface it runs on
float riverLight(vec3 p, vec3 n, vec3 v, Surface s) {
  float u = rnd();
  float x = u * ${RN - 1}.;
  int i = int(min(floor(x), ${RN - 2}.));
  float t = x - float(i);
  vec2 a = course[i].xy, b = course[i + 1].xy;
  float hw = mix(course[i].w, course[i + 1].w, t);
  vec2 dir = normalize(b - a);
  vec2 xz = mix(a, b, t) + vec2(-dir.y, dir.x) * (rnd() * 2. - 1.) * hw;
  vec3 q = vec3(xz.x, surfaceY(xz) + .06, xz.y);
  float area = RIVER_LEN * 2. * hw;
  vec3 l = q - p;
  float d2 = dot(l, l), d = sqrt(d2);
  l /= d;
  float cs = dot(n, l), ce = -l.y;
  // (the river glows all round, not only upwards: a little of its light reaches what stands over it)
  ce = max(ce, .25);
  if (cs <= 0.) return 0.;
  float g = min(cs * ce * area / max(d2, .04), 6.);
  vec3 h = normalize(l + v);
  float e = 2. / (s.rough * s.rough) - 2.;
  float brdf = s.albedo.x / PI + s.spec * fresnel(dot(h, v)) * (e + 2.) / (8. * PI) * pow(max(dot(n, h), 0.), e);
  return g * brdf * clear(p + n * .004, l, d);
}

// the night sky, and a faint moon with a broad, soft light, at a point
float skyLight(vec3 p, vec3 n, Surface s) {
  vec3 d = normalize(n + sphere());
  float sky = d.y > 0. ? (.12 + .88 * d.y) * clear(p + n * .004, d, 50.) : 0.;
  vec3 l = normalize(MOON + sphere() * .14);
  float cs = dot(n, l);
  float moon = cs > 0. ? cs * clear(p + n * .004, l, 60.) : 0.;
  return s.albedo.x * (sky * .55 + moon * .3);
}

void main() {
  ivec2 px = ivec2(gl_FragCoord.xy);
  seed = uint(px.x) * 1973u + uint(px.y) * 9277u + uint(sampleIndex) * 26699u + 1u;
  seed = pcg(seed);
  vec2 jitter = vec2(rnd(), rnd());
  vec2 ndc = (gl_FragCoord.xy - .5 + jitter) / res * 2. - 1.;
  vec3 rd = normalize(vec3(ndc.x * TAN * res.x / res.y, ndc.y * TAN + SHIFT * TAN, -1.));
  vec3 ro = EYE;

  float base = 0., door = 0., rlit = 0., emitter = 0.;
  float along = 0., across = 0., doorAway = 0., onFloor = 0.;
  float under = 0., kind = 0.;

  vec2 hit = march(ro, rd, 160.);
  float fog = 1.;
  if (hit.x > 0.) {
    fog = exp(-max(hit.x - 44., 0.) / 10.);
    vec3 p = ro + rd * hit.x;
    float m = hit.y;
    if (m > 5.5) {
      emitter = 1.;
      door = 1.;
      kind = 1.;
    } else {
      vec3 n = normalAt(p);
      // (the street's stones are worn and wet: they turn the light nearly as the level street would. Their own
      // edges, as steep as they are, each caught the doorway as a bright dash, one to every stone)
      if (m > 2.5 && m < 3.5) n = normalize(mix(n, vec3(0., 1., 0.), .92));
      vec3 v = -rd;
      DEBUG_NORMAL
      Surface s = surfaceOf(m, p);
      base = skyLight(p, n, s);
      door = doorLight(p, n, v, s);
      rlit = riverLight(p, n, v, s);
      doorAway = length(p - vec3(0., DOOR_C * .5, WALL_Z));
      kind = m < 1.5 ? .5 : (m < 2.5 ? .7 : (m < 3.5 ? .3 : (m < 4.5 ? .45 : .55)));
      // the wet street shows what stands over it
      if (m > 2.5 && m < 3.5) {
        float fr = fresnel(dot(n, v));
        vec3 r = reflect(rd, n);
        r = normalize(r + sphere() * s.rough * .5);
        if (dot(r, n) < 0.) r = reflect(r, n);
        vec2 h2 = march(p + n * .01, r, 120.);
        if (h2.x > 0.) {
          vec3 p2 = p + n * .01 + r * h2.x;
          if (h2.y > 5.5) door += fr;
          else {
            vec3 n2 = normalAt(p2);
            Surface s2 = surfaceOf(h2.y, p2);
            base += fr * skyLight(p2, n2, s2);
            door += fr * doorLight(p2, n2, -r, s2);
          }
        }
      }
      // where the point lies under the river: along it and across it
      if (m > 1.5 && m < 3.5) {
        vec3 ra = riverAt(p.xz);
        along = ra.x;
        across = ra.y;
        onFloor = 1.;
        // how the surface under the river takes its light: a step's edge or a joint between stones is darker
        if (m > 2.5) {
          vec3 c = cobble(p.xz);
          under = mix(.55, 1., smoothstep(-.002, .01, c.x)) * mix(1., 1.15, puddle(p.xz));
        } else {
          under = mix(.6, 1., smoothstep(.0, .25, n.y));
        }
      }
    }
  }

  vec4 a0 = texelFetch(prev0, px, 0);
  vec4 a1 = texelFetch(prev1, px, 0);
  vec4 a2 = texelFetch(prev2, px, 0);
  o0 = a0 + vec4(min(base, 1.) * fog, min(door, 1.) * fog, min(rlit, 1.) * fog, emitter);
  o1 = a1 + vec4(along * onFloor, min(abs(across), 4.) * onFloor, doorAway, onFloor);
  o2 = a2 + vec4(under * onFloor, kind, 0., 1.);
}
`

const TRACE = TRACE_SRC.replace("DEBUG_NORMAL", DEBUG === "normal" ? "o0 = texelFetch(prev0, px, 0) + vec4(n * .5 + .5, 1.); o1 = texelFetch(prev1, px, 0); o2 = texelFetch(prev2, px, 0); return;" : "")

const SHOW = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D acc0;
uniform sampler2D acc1;
uniform sampler2D acc2;
uniform float samples;
uniform int mode;
uniform vec2 res;
out vec4 color;

// the lights' values, packed into eight bits: K is how many times over the faintest light is spread
const float K = 500.;
float encode(float x) { return log2(1. + K * clamp(x, 0., 1.)) / log2(1. + K); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  ivec2 px = ivec2(gl_FragCoord.xy);
  vec4 a0 = texelFetch(acc0, px, 0) / samples;
  vec4 a1 = texelFetch(acc1, px, 0);
  vec4 a2 = texelFetch(acc2, px, 0) / samples;
  float floorShare = a1.w / samples;
  float along = a1.w > 0. ? a1.x / a1.w : 1.;
  float across = a1.w > 0. ? a1.y / a1.w : 4.;
  float doorAway = a1.z / samples;
  float base = a0.x, door = a0.y, rlit = a0.z, emitter = a0.w;
  if (mode == 4) { color = vec4(a0.rgb, 1.); return; }
  if (mode == 1) {
    color = vec4(encode(base), encode(door), encode(rlit), 1.);
  } else if (mode == 2) {
    // (where no floor lies under a point, it is the river's end and far across it: never lit)
    float u = mix(1., along, step(.5, floorShare));
    float v = mix(4., across, step(.5, floorShare));
    color = vec4(clamp(u, 0., 1.), clamp(v / 4., 0., 1.), 0., 1.);
  } else if (mode == 3) {
    color = vec4(a2.x / max(floorShare, 1e-4) * step(.5, floorShare), clamp(doorAway / 60., 0., 1.), mix(a2.y, 1., emitter), 1.);
  } else {
    // a look at the whole: grey stone under the moon, the doorway's light and the river in Neon
    vec3 ink = vec3(.039), neon = vec3(.8, 1., 0.);
    vec3 c = ink + vec3(.6) * base * 1.3 + neon * door * 3.2 + neon * rlit * 1.6;
    float river = exp(-across * across * 2.2) * step(.5, floorShare) * (a2.x / max(floorShare, 1e-4));
    c = mix(c, neon, clamp(river * 1.1, 0., 1.));
    c = mix(c, neon, emitter);
    c += (hash(gl_FragCoord.xy) - .5) * .03;
    color = vec4(pow(clamp(c, 0., 1.), vec3(1.)), 1.);
  }
}
`

const VERT = /* glsl */ `#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2. - 1., 0., 1.); }
`

const canvas = document.getElementById('c')
canvas.width = W
canvas.height = H
canvas.style.width = W + 'px'
canvas.style.height = H + 'px'
const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: false })
if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('float targets are not available')

const compile = (src, type) => {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}
const program = (frag) => {
  const p = gl.createProgram()
  gl.attachShader(p, compile(VERT, gl.VERTEX_SHADER))
  gl.attachShader(p, compile(frag, gl.FRAGMENT_SHADER))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p))
  return p
}
const trace = program(TRACE)
const show = program(SHOW)

const target = () => {
  const textures = [0, 1, 2].map(() => {
    const t = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    return t
  })
  const fb = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  textures.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0))
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2])
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  return { fb, textures }
}
let from = target()
let to = target()

const courseData = new Float32Array(RN * 4)
river.points.forEach((pt, i) => courseData.set([pt[0], pt[1], i / (RN - 1), pt[2]], i * 4))

const pause = () => new Promise((resolve) => setTimeout(resolve, 0))
/** Where the doorway lies in the picture: its top and its foot, up from the picture's bottom edge, and its half
 *  breadth, all in picture heights; and the picture's width to its height. And the steps' risers, from the
 *  porch's edge down: each one's top edge and foot, up from the picture's bottom edge (picture heights). */
window.__geometry = (() => {
  const eyeY = C.streetY + C.eye
  const away = C.dist - C.wallZ
  const up = (y) => ((y - eyeY) / away / C.tan - C.shift + 1) / 2
  const at = (y, z) => ((y - eyeY) / (C.dist - z) / C.tan - C.shift + 1) / 2
  const risers = []
  for (let k = 0; k < C.steps; k++) {
    const z = C.porch + C.run * k
    risers.push([at(-C.rise * k, z), at(-C.rise * (k + 1), z)])
  }
  const aspect = W / H
  return { top: up(C.doorH), foot: up(0), half: (C.doorR / away / (C.tan * aspect) / 2) * aspect, aspect, encode: 500, risers }
})()
window.__progress = 0
window.__done = false
window.__config = { ...C, riverLength: river.length }

/** Draws the result in one of the modes (preview, light, space, aux, raw), from the last target written. */
window.__show = (mode) => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, W, H)
  gl.useProgram(show)
  from.textures.forEach((t, i) => {
    gl.activeTexture(gl.TEXTURE0 + i)
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.uniform1i(gl.getUniformLocation(show, 'acc' + i), i)
  })
  gl.uniform1f(gl.getUniformLocation(show, 'samples'), SPP)
  gl.uniform1i(gl.getUniformLocation(show, 'mode'), { preview: 0, light: 1, space: 2, aux: 3, raw: 4 }[mode] ?? 0)
  gl.uniform2f(gl.getUniformLocation(show, 'res'), W, H)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  gl.finish()
}

async function run() {
  const started = performance.now()
  gl.useProgram(trace)
  gl.uniform2f(gl.getUniformLocation(trace, 'res'), W, H)
  gl.uniform4fv(gl.getUniformLocation(trace, 'course'), courseData)
  const sampleAt = gl.getUniformLocation(trace, 'sampleIndex')
  gl.viewport(0, 0, W, H)
  gl.enable(gl.SCISSOR_TEST)
  for (let s = 0; s < SPP; s++) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb)
    from.textures.forEach((t, i) => {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.uniform1i(gl.getUniformLocation(trace, 'prev' + i), i)
    })
    gl.uniform1i(sampleAt, s)
    for (let y = 0; y < H; y += TILE) {
      gl.scissor(0, y, W, Math.min(TILE, H - y))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.finish()
      await pause()
    }
    ;[from, to] = [to, from]
    window.__progress = (s + 1) / SPP
  }
  gl.disable(gl.SCISSOR_TEST)
  window.__show(MODE)
  window.__seconds = (performance.now() - started) / 1000
  window.__done = true
}
run().catch((e) => {
  window.__error = String(e && e.message ? e.message : e)
  window.__done = true
})
