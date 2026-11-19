/**
 * Work that can wait for a still moment: something the page will need further down, which takes a few
 * milliseconds of its own thread (on a phone, several frames), and would otherwise be done at the moment the
 * reader comes near it, which may be in the middle of a movement.
 *
 * A job is done when the page has not been scrolled for a third of a second and the browser has nothing to do;
 * then the next still moment is waited for, so the jobs never add up to one long halt. None is done while the
 * opening is up, nor in the first seconds after it (the opening words are coming into focus then). A job that
 * has not had its moment by the time it is needed is simply done then, as it was: this only brings it forward.
 */
const QUIET = 320
/** How long after the opening has gone the first job may be done (ms). */
const SETTLED = 2600

const jobs: (() => void)[] = []
let timer = 0
let watching = false
let openedAt = 0

const idle = (run: () => void) => {
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 800 })
  else setTimeout(run, 0)
}

function arm() {
  window.clearTimeout(timer)
  if (!jobs.length) {
    if (watching) removeEventListener('scroll', arm)
    watching = false
    return
  }
  if (!watching) addEventListener('scroll', arm, { passive: true })
  watching = true
  timer = window.setTimeout(() => {
    if (document.documentElement.hasAttribute('data-opening')) return arm()
    openedAt ||= performance.now()
    if (performance.now() - openedAt < SETTLED) return arm()
    idle(() => {
      jobs.shift()?.()
      arm()
    })
  }, QUIET)
}

/** Does `job` at a still moment. Returns a way to call it off. */
export function whenStill(job: () => void) {
  jobs.push(job)
  arm()
  return () => {
    const at = jobs.indexOf(job)
    if (at >= 0) jobs.splice(at, 1)
  }
}
