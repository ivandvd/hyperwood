/**
 * The films, and what the page has to know about each.
 * (How a film is made and finished: the README, "The films", and scripts/film/.)
 */
import booth from '../assets/film/booth.mp4'
import boothStill from '../assets/film/booth.jpg'
import board from '../assets/film/board.mp4'
import boardStill from '../assets/film/board.jpg'
import seal from '../assets/film/seal.mp4'
import sealStill from '../assets/film/seal.jpg'

export interface Film {
  clip: string
  /** its first frame: what stands there until the film plays */
  still: string
  /** which slice of the film an upright screen shows (CSS object-position, in per cent): the slice with the
   *  figure in it and the bulb at its left */
  at: number
  /** where its bulb hangs, as shares of the film's width and height. Measured on the finished film (the
   *  middle of its full Neon, the median over the take: `npx tsx scripts/film/light.ts`); the camera is
   *  locked, so it stays there. */
  bulb: [number, number]
}

export const films = {
  /** a broker alone in a lit telephone booth */
  booth: { clip: booth, still: boothStill, at: 50, bulb: [0.332, 0.1868] },
  /** a board boy chalking prices onto a great blackboard */
  board: { clip: board, still: boardStill, at: 48, bulb: [0.3528, 0.282] },
  /** a settlement clerk pressing the seal into certificates */
  seal: { clip: seal, still: sealStill, at: 56, bulb: [0.3897, 0.2632] },
} satisfies Record<string, Film>

export type FilmName = keyof typeof films

/** The order the film page shows them in. (The landing page tells its own story with them, in its own order:
 *  `films` in content.home.ts.) */
export const reel: FilmName[] = ['booth', 'board', 'seal']

/** A film's width to its height. */
export const SHAPE = 4 / 3
