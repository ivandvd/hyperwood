/**
 * The wheel glides. A wheel does not move the page directly: each notch moves a goal, and the page's real
 * scroll follows it (so everything that reads the scroll, the pinned journey first of all, stays in step).
 * Touch, the keyboard and the scrollbar are left exactly as the browser has them, and anything that scrolls by
 * itself keeps its own wheel. Off under reduced motion.
 */
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

export function startGlide(): () => void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let goal = scrollY
  let frame = 0
  let before = 0

  const stop = () => {
    cancelAnimationFrame(frame)
    frame = 0
    before = 0
    goal = scrollY
  }
  const step = (now: number) => {
    if (reduced.matches) return stop()
    const dt = Math.min(50, now - before || 16)
    before = now
    const left = goal - scrollY
    if (Math.abs(left) < 0.75) {
      window.scrollTo({ top: goal, behavior: 'instant' })
      frame = 0
      before = 0
      return
    }
    window.scrollTo({ top: scrollY + left * (1 - Math.exp(-dt / 105)), behavior: 'instant' })
    frame = requestAnimationFrame(step)
  }
  const onWheel = (event: WheelEvent) => {
    // zooming, sideways scrolling and modified wheels are the browser's
    if (reduced.matches || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    const from = event.target instanceof Element ? event.target : null
    if (from?.closest('input,textarea,select,[contenteditable="true"],dialog')) return
    for (let el = from; el && el !== document.body; el = el.parentElement) {
      const style = getComputedStyle(el)
      if (/auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) return
    }
    event.preventDefault()
    const by = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
    if (!frame) goal = scrollY
    goal = clamp(goal + by, 0, document.documentElement.scrollHeight - innerHeight)
    if (!frame) frame = requestAnimationFrame(step)
  }
  const onScroll = () => {
    if (!frame) goal = scrollY
  }
  const onKey = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stop()
  }

  addEventListener('wheel', onWheel, { passive: false })
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('pointerdown', stop, { passive: true })
  addEventListener('touchstart', stop, { passive: true })
  addEventListener('keydown', onKey)
  addEventListener('resize', stop)
  reduced.addEventListener('change', stop)
  return () => {
    stop()
    removeEventListener('wheel', onWheel)
    removeEventListener('scroll', onScroll)
    removeEventListener('pointerdown', stop)
    removeEventListener('touchstart', stop)
    removeEventListener('keydown', onKey)
    removeEventListener('resize', stop)
    reduced.removeEventListener('change', stop)
  }
}
