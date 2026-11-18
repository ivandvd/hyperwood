/**
 * The exchange (the address ?gate=exchange, with the films): the gate as the doorway of a stock exchange of our
 * own, a temple front of fluted columns on a podium, its steps down to a wet street, at night. It is rendered
 * once by scripts/exchange/render.js, a small path tracer (no picture from anywhere else), into four pictures of
 * one size, each held top row first:
 *   base   the building and the street under a faint night sky
 *   door   the same, lit by the open doorway alone (the doorway's light at one), with the wet street's reflections
 *   glow   the same, lit by the river alone (the river at one)
 *   space  where each point lies under the river: how far along it (red: 0 at the doorway, 1 at its end) and
 *          how far from its middle line (green: half breadths over 0 to 4)
 * The three lights are kept in eight bits each: a light x is stored as log2(1 + K x) / log2(1 + K).
 * The page puts them together while it is scrolled (shader.ts, "the exchange"): the doorway's light reaches out
 * and the building comes out of the night with it, then the river pours out of the doorway, down the steps and
 * away over the street.
 * (The pictures themselves are exchange.pictures.ts: this file has only numbers, so the shader can be put together
 * outside the browser too, by scripts/check-shader.ts.)
 */
export const EXCHANGE = {
  /** the pictures' width to their height */
  aspect: 2.1,
  /** where the doorway lies in them: its top and its foot, up from their bottom edge, and its half breadth, all
   *  in picture heights (the render reports these: window.__geometry) */
  doorway: { top: 0.71825, foot: 0.58381, half: 0.041935 },
  /** where the steps meet the street, up from the pictures' bottom edge (picture heights), and how far along the
   *  river that is (0 at the doorway): there the guide's river, the page's river as it was, runs on (shader.ts) */
  stepsFoot: 0.52112,
  alongSteps: 0.1913,
  /** how far along the river the porch's edge is, where the steps begin, and how broad the river is at the steps'
   *  foot: its half breadth there, in picture heights */
  alongPorch: 0.1125,
  footBreadth: 0.05422,
  /** the steps' risers, from the porch's edge down: each one's top edge and foot, up from the pictures' bottom
   *  edge (picture heights; the render reports these: window.__geometry.risers). Under the river each riser is a
   *  shade deeper than the treads, so the river runs down the steps rather than lying over them */
  risers: [
    [0.57449, 0.56999],
    [0.56908, 0.56454],
    [0.56355, 0.55896],
    [0.5579, 0.55325],
    [0.55212, 0.54742],
    [0.54621, 0.54145],
    [0.54016, 0.53535],
    [0.53396, 0.5291],
    [0.52762, 0.5227],
  ] as const,
  /** K, above */
  encode: 500,
}
