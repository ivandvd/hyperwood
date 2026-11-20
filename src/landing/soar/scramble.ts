/**
 * Text that turns into other text a letter at a time, from the left, the letters not yet there running through
 * glyphs: an order sealing into ciphertext, and back. One run per element; a new run on the same element ends the
 * last. The glyphs change about every 45 ms, so the run reads as a run and not as a flicker.
 */
const runs = new WeakMap<HTMLElement, number>()

export function scramble(el: HTMLElement, to: string, ms = 700, glyphs = '0123456789abcdef'): void {
  const prev = runs.get(el)
  if (prev) cancelAnimationFrame(prev)
  const from = el.textContent ?? ''
  const n = Math.max(from.length, to.length)
  const began = performance.now()
  let last = -1
  const step = (now: number) => {
    const t = (now - began) / ms
    const tick = Math.floor((now - began) / 45)
    if (tick !== last || t >= 1) {
      last = tick
      let out = ''
      for (let i = 0; i < n; i++) {
        // each letter settles at its own moment, left to right, over the first four fifths of the run
        const at = (i / Math.max(1, n - 1)) * 0.8
        if (t >= at + 0.2) out += to[i] ?? ''
        else if (t >= at) out += to[i] === ' ' || to[i] === undefined ? (to[i] ?? '') : glyphs[(i * 7 + tick * 13) % glyphs.length]
        else out += from[i] ?? ''
      }
      el.textContent = out
    }
    if (t < 1) runs.set(el, requestAnimationFrame(step))
    else {
      el.textContent = to
      runs.delete(el)
    }
  }
  runs.set(el, requestAnimationFrame(step))
}

/** Puts the text in place at once, ending any run on the element. */
export function settle(el: HTMLElement, to: string): void {
  const prev = runs.get(el)
  if (prev) cancelAnimationFrame(prev)
  runs.delete(el)
  el.textContent = to
}
