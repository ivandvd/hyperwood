import { useEffect, useRef, useState } from 'react'

/**
 * True once the element has come into view, and it stays true: a section reveals itself once per visit
 * (the brand kit's rule for motion: play once per view).
 * `line` is how far up the screen the element's top has to travel first, as a share of the screen height.
 */
export function useInView<T extends Element>(line = 0.2) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: `0px 0px -${Math.round(line * 100)}% 0px` },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [line, seen])

  return [ref, seen] as const
}

/** True while the element is on screen (it goes false again when it leaves): for motion that should rest off screen. */
export function useVisible<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, visible] as const
}
