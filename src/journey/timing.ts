/**
 * When things happen in the journey, for either hero. Everything here is journey progress, 0 to 1.
 *
 * config.journey holds the journey's numbers as it was made, with the mark as its hero: the lids, the beats,
 * when the picture of the gate and the river takes over. That journey is `markTiming`, exactly as it is there.
 *
 * With the room as hero the journey is longer (config.journey.room.stay): where the mark stayed for one look,
 * the room stays for three films. `roomTiming` is the same journey carried over into the longer one: what comes
 * before the hero's rest comes as much sooner, in progress, as the journey is longer, and what comes after it
 * as much later, so every beat keeps the stretch of scrolling it had. (journey.module.css makes the section
 * that much taller.)
 *
 * In the room's rest the three films follow one another (`room.turns`), each change in three parts: the lamp's
 * light draws back to the lamp, the lamp goes over to where the next film's bulb hangs (the room is dark then,
 * and the film is changed in the middle of it), and its light opens the next room. The words of one film go
 * with its light, and the next film's come as its room opens.
 */
import { config } from '../config'

type Beat = readonly [number, number]
const J = config.journey

export interface Timing {
  /** The lids' moments (their shapes are config.journey.lids as they are). */
  lids: { appear: Beat; from: number; to: number; part: Beat }
  beats: { [K in keyof typeof J.beats]: Beat }
  /** The same without WebGL. */
  stillBeats: { [K in keyof typeof J.stillBeats]: Beat }
  /** The picture of the gate and the river: when it takes over, when the river comes, when the closing words
   *  do. (`out` is not a moment but a stretch: how much later it takes over further from the gate's foot.) */
  picture: { mix: Beat; out: Beat; arrive: Beat; copy: Beat }
  /** A short stretch of progress, given as the mark's journey counts it, in this journey's measure. */
  span(stretch: number): number
}

/** One change of film. */
export interface Turn {
  /** the light draws back to the lamp */
  shut: Beat
  /** the lamp goes over to the next bulb's place */
  over: Beat
  /** the light opens the next room */
  open: Beat
  /** the middle of the dark: before it the one film is in the box, after it the next */
  at: number
  /** the one film's words go, the next film's come */
  wordsOut: Beat
  wordsIn: Beat
}

export interface RoomTiming extends Timing {
  room: {
    /** the lamp's light opens the first room, and draws back from the last */
    open: Beat
    shut: Beat
    /** the hero's rest: from its first words being there to its last words going */
    rest: Beat
    turns: Turn[]
  }
}

export const markTiming: Timing = {
  lids: J.lids,
  beats: J.beats,
  stillBeats: J.stillBeats,
  picture: J.picture,
  span: (stretch) => stretch,
}

export const roomTiming: RoomTiming = (() => {
  const R = J.room
  const longer = 1 + R.stay
  // (the rest is where the journey is let out: its two halves stay with what comes before and after)
  const middle = (J.beats.word[1] + J.beats.heroOut[0]) / 2
  const carry = (s: number) => (s <= middle ? s : s + R.stay) / longer
  const both = (beat: Beat): [number, number] => [carry(beat[0]), carry(beat[1])]
  const each = <T extends Record<string, Beat>>(beats: T) =>
    Object.fromEntries(Object.entries(beats).map(([name, beat]) => [name, both(beat)])) as unknown as { [K in keyof T]: Beat }
  const span = (stretch: number) => stretch / longer

  const rest = [carry(J.beats.word[1]), carry(J.beats.heroOut[0])] as const
  const length = rest[1] - rest[0]
  const turn = R.turn * length
  const turns = R.turns.map((share): Turn => {
    const from = rest[0] + share * length - turn / 2
    const part = (a: number, b: number) => [from + a * turn, from + b * turn] as const
    return { shut: part(0, 0.4), over: part(0.4, 0.6), open: part(0.6, 1), at: from + turn / 2, wordsOut: part(-0.12, 0.2), wordsIn: part(0.72, 1.04) }
  })

  return {
    lids: { appear: both(J.lids.appear), from: carry(J.lids.from), to: carry(J.lids.to), part: both(J.lids.part) },
    beats: each(J.beats),
    stillBeats: each(J.stillBeats),
    picture: { mix: both(J.picture.mix), out: [span(J.picture.out[0]), span(J.picture.out[1])], arrive: both(J.picture.arrive), copy: both(J.picture.copy) },
    span,
    room: { open: both(R.open), shut: both(R.shut), rest, turns },
  }
})()
