/**
 * The story of the front-running example (FrontRun.tsx, Ahead.tsx): when each thing happens in its loop, and where
 * everything is at a time, in each lane's own units (across and down in lane heights).
 */
/* ------------------------------------------------------------------ the story, in seconds of its loop */
export const STORY = { length: 9.8, fadeFrom: 8.9 }
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const io = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2)
const out = (k: number) => 1 - (1 - k) ** 3
const mixN = (a: number, b: number, k: number) => a + (b - a) * k

/** Each lane in its own units: across 0 to `wide` (the lane's width over its height), down 0 to 1. */
export type Lane = { wide: number }
/** where the book stands in a lane (fractions of its width across, of its height down) */
export const BOOK = { left: 0.78, right: 0.95, top: 0.1, bottom: 0.92 }
/** the price as the book's level (down the lane): $184.00, $185.60, and $184.10 */
export const LEVEL = { base: 0.64, high: 0.3, after: 0.62 }

/** Where everything is at time t, in each lane's units (x across in lane heights, y down in lane heights). */
export function storyAt(t: number, wide: number) {
  const x = (u: number) => u * wide
  const bookMid = x((BOOK.left + BOOK.right) / 2)
  // the order: forms, flows to the book's mouth, goes in and is one with the book
  const R = 0.13
  const grow = out(prog(t, 0.0, 0.5))
  const flow = io(prog(t, 0.5, 3.0))
  const dive = io(prog(t, 3.0, 3.6))
  const orderX = mixN(mixN(x(0.07), x(0.7), flow), bookMid, dive)
  const orderBase = (lvl: number) => mixN(0.5, lvl + 0.06, dive)
  const orderR = R * grow * (1 - 0.75 * prog(t, 3.25, 3.6))

  // the public venue's bot: comes up under the order, touches it, races ahead into the book; later pulls out
  const pb = { x: 0, y: 0, r: 0 }
  const appear = out(prog(t, 0.8, 1.2))
  const read = io(prog(t, 1.1, 1.5))
  const race = io(prog(t, 1.5, 2.1))
  const inBook = io(prog(t, 2.1, 2.45))
  const leave = io(prog(t, 4.0, 4.9))
  {
    const startX = x(0.24)
    // (under the order, where it is: it reads it as it goes)
    const underX = orderX - 0.03
    pb.x = mixN(mixN(mixN(startX, underX, read), x(0.72), race), bookMid, inBook)
    pb.y = mixN(mixN(mixN(0.88, 0.5 + R + 0.035, read), 0.5, race), LEVEL.base, inBook)
    pb.r = 0.085 * appear * (1 - 0.8 * prog(t, 2.25, 2.45))
    if (t >= 4.0) {
      // (it pulls out of the book and away to the right, inside the lane, and is gone)
      pb.x = mixN(bookMid, x(0.995), leave)
      pb.y = mixN(LEVEL.high - 0.02, 0.16, leave)
      pb.r = 0.085 * out(prog(t, 4.0, 4.3)) * (1 - prog(t, 4.6, 4.9))
    }
  }
  // what it takes with it: a drop of the order's light, out of the book with it
  const taken = { x: pb.x - 0.07, y: pb.y + 0.07, r: t >= 4.0 ? 0.055 * out(prog(t, 4.05, 4.4)) * (1 - prog(t, 4.6, 4.9)) : 0 }
  // the public book's level: up when the bot goes in, back down when it pulls out
  const up = io(prog(t, 2.2, 2.7))
  const down = io(prog(t, 4.0, 4.6))
  const publicLevel = mixN(mixN(LEVEL.base, LEVEL.high, up), LEVEL.after, down)
  const publicSplash = 0.02 * Math.exp(-6 * Math.max(0, t - 2.2)) * (t > 2.2 ? 1 : 0) + 0.014 * Math.exp(-6 * Math.max(0, t - 3.45)) * (t > 3.45 ? 1 : 0)

  // Hyperwood's bot: comes up to the sealed order, cannot run into it, sinks away
  const near = io(prog(t, 1.1, 1.6))
  const sink = io(prog(t, 1.9, 2.6))
  const sealedOrderX = orderX
  const hb = {
    x: mixN(mixN(x(0.24), orderX + 0.02, near), x(0.5), sink),
    y: mixN(mixN(0.88, 0.5 + R * 1.32 + 0.085 + 0.012, near), 1.1, sink) + 0.012 * Math.sin(t * 9) * near * (1 - sink),
    r: 0.085 * appear * (1 - sink),
  }
  const hyperwoodSplash = 0.014 * Math.exp(-6 * Math.max(0, t - 3.45)) * (t > 3.45 ? 1 : 0)

  return {
    order: { x: orderX, yPublic: orderBase(publicLevel), yHyperwood: orderBase(LEVEL.base), r: orderR },
    seal: { x: sealedOrderX, r: R * 1.32 * grow, there: 1 - prog(t, 3.0, 3.35) },
    publicBot: pb,
    taken,
    publicLevel,
    publicSplash,
    hyperwoodBot: hb,
    hyperwoodSplash,
    /** when each word comes */
    words: {
      order: out(prog(t, 0.3, 0.7)) * (1 - prog(t, 2.8, 3.1)),
      bot: appear * (1 - prog(t, 1.9, 2.2)),
      notRead: out(prog(t, 1.35, 1.7)) * (1 - prog(t, 2.2, 2.5)),
      high: up,
      filledPublic: out(prog(t, 3.5, 3.9)),
      cost: out(prog(t, 4.4, 4.8)),
      filledHyperwood: out(prog(t, 3.5, 3.9)),
    },
  }
}
export type Story = ReturnType<typeof storyAt>

/** how much of it is there at time t (it goes at the loop's end) */
export const fadeAt = (t: number) => 1 - clamp01((t - STORY.fadeFrom) / (STORY.length - STORY.fadeFrom))
