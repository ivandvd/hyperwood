/**
 * A value that can be sealed. Sealed, it reads as cipher of the same length; unsealed, as itself.
 * Going from one to the other runs a short scramble from left to right. The face is the mono one, so the
 * width never changes and nothing around it moves. Screen readers get the word, not the noise.
 */
import { useLayoutEffect, useRef } from 'react'
import { reducedMotion } from './motion'

const HEX = '0123456789abcdef'

/** The same cipher for the same text, every time. Spaces stay, so the line keeps its rhythm. */
function cipherOf(text: string) {
  let seed = 2166136261
  for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619)
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') {
      out += ' '
      continue
    }
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    out += HEX[((t ^ (t >>> 14)) >>> 0) % 16]
  }
  return out
}

interface Props {
  text: string
  sealed: boolean
  /** What a screen reader hears while the value is sealed. */
  sealedLabel?: string
  className?: string
  /** Seconds to wait before the scramble starts, so a column of values goes one after another. */
  delay?: number
}

export function Cipher({ text, sealed, sealedLabel = 'Sealed', className, delay = 0 }: Props) {
  const face = useRef<HTMLSpanElement>(null)
  const shown = useRef<string | null>(null)

  useLayoutEffect(() => {
    const el = face.current
    if (!el) return
    const to = sealed ? cipherOf(text) : text
    const from = shown.current
    shown.current = to
    if (from === null || from.length !== to.length || reducedMotion()) {
      el.textContent = to
      return
    }

    const n = to.length
    const total = Math.min(900, 380 + n * 16)
    const window_ = total * 0.3
    let id = 0
    let start = 0
    let last = -1
    const step = (now: number) => {
      if (!start) start = now + delay * 1000
      const t = now - start
      // the noise changes about twenty times a second; faster reads as flicker
      const tick = Math.floor(t / 48)
      if (t >= 0 && tick !== last) {
        last = tick
        let out = ''
        for (let i = 0; i < n; i++) {
          const at = (i / n) * (total - window_)
          if (to[i] === ' ' && from[i] === ' ') out += ' '
          else if (t >= at + window_) out += to[i]
          else if (t >= at) out += HEX[(Math.random() * 16) | 0]
          else out += from[i]
        }
        el.textContent = out
      }
      if (t < total) id = requestAnimationFrame(step)
      else el.textContent = to
    }
    id = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(id)
      el.textContent = to
    }
  }, [text, sealed, delay])

  return (
    <span className={className} data-sealed={sealed ? '' : undefined}>
      <span className="ul-sr">{sealed ? sealedLabel : text}</span>
      <span ref={face} aria-hidden />
    </span>
  )
}
