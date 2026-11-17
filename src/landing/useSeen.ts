/**
 * Whether a section has come into view yet. It turns true once, the first time a part of the section is on
 * screen, and stays true: the section's parts come in then (kit.module.css, .reveal). Where the browser cannot
 * tell, everything is simply there.
 */
import { useEffect, useRef, useState } from 'react'

const canWatch = typeof IntersectionObserver === 'function'

export function useSeen<T extends HTMLElement>(share = 0.12) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(!canWatch)
  useEffect(() => {
    const node = ref.current
    if (!node || seen) return
    const watch = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true)
          watch.disconnect()
        }
      },
      { threshold: share },
    )
    watch.observe(node)
    return () => watch.disconnect()
  }, [seen, share])
  return [ref, seen] as const
}
