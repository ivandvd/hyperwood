/**
 * Which ground is under the top of the screen (&flow=soar): light where a part marked `data-light` is there, dark
 * elsewhere. Written on the page's root (`data-tone="light"`) and announced (a `hw-tone` event), so that what stands
 * at the top of the screen (the logo that stays, the fall of colour behind it) can take the ground's colours, as the
 * reference's header does on its light parts.
 */
export function watchTone(root: HTMLElement, ...more: (Element | null)[]): () => void {
  const under = new Set<Element>()
  let light = false
  const set = () => {
    const now = under.size > 0
    if (now === light) return
    light = now
    if (now) document.documentElement.setAttribute('data-tone', 'light')
    else document.documentElement.removeAttribute('data-tone')
    dispatchEvent(new Event('hw-tone'))
  }
  // (a band across the top of the screen, as tall as the logo's fall: what crosses it is under the top)
  const watch = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) under.add(entry.target)
        else under.delete(entry.target)
      }
      set()
    },
    { rootMargin: '0px 0px -92% 0px' },
  )
  root.querySelectorAll('[data-light]').forEach((el) => watch.observe(el))
  for (const el of more) if (el) watch.observe(el)
  return () => {
    watch.disconnect()
    document.documentElement.removeAttribute('data-tone')
  }
}
