/**
 * Preloader.
 *  - a tiny canvas dot-sphere (≈110 points on a lat/long lattice) rotating in 3D: front dots are larger and
 *    brighter, the back half is culled — reads as a volume at a cost of well under 1 ms per frame;
 *  - an honest counter: asset loading (three's loading manager: GLTF, heightmap, textures) + web fonts +
 *    the scene actually rendering frames (shaders compiled). It reaches 100 only when all of that is true,
 *    and travels from the left edge (28px) to the right edge as it counts;
 *  - exit: the sphere implodes, then a circle opens from the centre and uncovers the site (1.5 s) —
 *    drawn inside WebGL, see exit() below.
 */
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useProgress } from '@react-three/drei'
import { config } from '../config'
import { store } from '../state/store'
import { capture } from '../scroll/capture'
import { demo } from '../scroll/demo'
import { setTitlesReady } from './titles'
import { content } from '../content'
import styles from './Preloader.module.css'

/* ---------------- dot sphere ---------------- */
function useDotSphere(canvas: React.RefObject<HTMLCanvasElement | null>, running: React.RefObject<boolean>) {
  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const S = config.preloader.sphereSize
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = cv.height = Math.round(S * dpr)
    ctx.scale(dpr, dpr)

    // lat/long lattice (the halftone look of the design), half the density of the mockup
    const pts: [number, number, number][] = []
    const bands = config.preloader.latBands
    for (let b = 1; b < bands; b++) {
      const lat = -Math.PI / 2 + (b * Math.PI) / bands
      const n = Math.max(4, Math.round(config.preloader.lonCount * Math.cos(lat)))
      for (let i = 0; i < n; i++) {
        const lon = (i / n) * Math.PI * 2 + (b % 2 ? Math.PI / n : 0)
        pts.push([Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)])
      }
    }

    const R = S * 0.46
    const tilt = 0.38
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    let raf = 0
    const t0 = performance.now()
    const draw = (now: number) => {
      if (!running.current) return
      const a = ((now - t0) / 1000) * config.preloader.rotationSpeed
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      ctx.clearRect(0, 0, S, S)
      ctx.fillStyle = '#fff'
      for (const [x, y, z] of pts) {
        // spin about Y, then tilt about X
        const x1 = x * ca + z * sa
        const z1 = -x * sa + z * ca
        const y2 = y * ct - z1 * st
        const z2 = y * st + z1 * ct
        if (z2 < -0.05) continue // back half culled
        const persp = 1 / (1.9 - z2 * 0.35)
        const px = S / 2 + x1 * R * persp * 1.9
        const py = S / 2 + y2 * R * persp * 1.9
        const r = 0.35 + 1.25 * Math.max(0, z2) // halftone: centre dots are the largest
        ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, z2)
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [canvas, running])
}

/* ---------------- preloader ---------------- */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null)
  const sphere = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const counter = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const running = useRef(true)
  const { progress, active, total } = useProgress()
  const assets = useRef({ progress: 0, done: false })
  assets.current.progress = progress
  // everything in this scene is generated in code: with nothing to download, the asset share is done
  assets.current.done = !active && (progress >= 100 || total === 0)

  useDotSphere(canvas, running)

  useEffect(() => {
    const el = root.current
    if (!el) return
    let fontsReady = false
    document.fonts?.ready.then(() => (fontsReady = true)).catch(() => (fontsReady = true))
    if (!document.fonts) fontsReady = true

    let shown = 0
    let exiting = false
    let raf = 0
    // the GPU has to be settled before we reveal: count consecutive smooth frames of the scene
    let stable = 0
    let lastNow = performance.now()
    let lastTime = store.time
    const P = config.preloader
    // performance check (see config.preloader.benchAt): skipped for scripted takes, which run on their own clock
    const bench = { phase: capture.on || demo.on ? 'done' : 'rest', frames: 0, rest: [] as number[], heavy: [] as number[], rounds: 0 }
    const median = (v: number[]) => [...v].sort((x, y) => x - y)[v.length >> 1]
    const tick = (now: number) => {
      const dt = now - lastNow
      lastNow = now
      if (store.time > lastTime) stable = dt < 34 ? stable + 1 : 0 // only frames the scene actually drew
      // the terrain is still on its way from the worker: smooth frames only count once it is in the scene
      if (!store.terrainReady) stable = 0
      // hold the heaviest moment of the story behind the cover: is this machine fast enough at this resolution?
      if (bench.phase !== 'done' && store.terrainReady && store.time > 0.6 && store.time > lastTime) {
        if (bench.phase === 'rest') {
          if (dt < 60) bench.rest.push(dt)
          if (bench.rest.length >= 14) {
            store.bench = P.benchAt
            bench.phase = 'heavy'
            bench.frames = 0
          }
        } else {
          // the first frames there also compile and upload what that moment needs: not counted
          if (++bench.frames > 8) bench.heavy.push(dt)
          if (bench.heavy.length >= 18) {
            const Q = config.performance
            const slow = median(bench.heavy) > median(bench.rest) * P.benchSlow
            if (slow && store.setDpr && store.dpr > Q.minDpr + 0.01 && bench.rounds < P.benchRounds) {
              store.dpr = Math.max(Q.minDpr, store.dpr * P.benchStep)
              store.setDpr(store.dpr)
              bench.rounds++
              bench.frames = 0
              bench.heavy = []
            } else {
              store.bench = -1
              bench.phase = 'done'
            }
            stable = 0
          }
        }
      }
      lastTime = store.time
      const settled = bench.phase === 'done' && store.terrainReady && store.time > 0.5 && (stable >= P.stableFrames || store.time > P.stableTimeout)
      // weighted, honest progress: assets 80 %, fonts 10 %, scene rendering smoothly 10 %
      const a = (assets.current.done ? 1 : assets.current.progress / 100) * (store.terrainReady ? 1 : 0.6)
      const frames = settled ? 1 : Math.min(0.95, Math.min(1, store.time / 0.5) * 0.5 + (stable / P.stableFrames) * 0.5)
      const target = 0.8 * a + 0.1 * (fontsReady ? 1 : 0) + 0.1 * frames
      shown += (target - shown) * 0.08
      if (target >= 0.999 && shown > 0.995) shown = 1
      const pct = Math.floor(shown * 100)
      if (num.current) num.current.textContent = String(pct)
      if (counter.current) {
        const travel = el.clientWidth - 56 - counter.current.offsetWidth
        counter.current.style.transform = `translate3d(${(Math.max(0, travel) * shown).toFixed(1)}px,0,0)`
      }
      if (shown >= 1 && !exiting) {
        exiting = true
        exit()
        return
      }
      raf = requestAnimationFrame(tick)
    }

    /**
     * Exit. The circle is drawn by WebGL itself (last step of the colour grade), not by a CSS mask:
     * a full-screen animated mask-image is re-rasterised by the browser every frame on top of the WebGL
     * canvas, and on Windows/Chrome that compositing hitch shows as a black frame. Sequence:
     *   1. the sphere implodes; WebGL already paints the preloader colour over the whole frame (reveal 0);
     *   2. once the post chain has drawn that cover for a few frames, the DOM background is switched off —
     *      an identical colour replaces an identical colour, nothing changes on screen;
     *   3. the circle opens in WebGL; only the small counter keeps a CSS mask (cheap) so it is swallowed
     *      by the circle exactly as before.
     */
    const exit = () => {
      store.reveal = 0
      const startFrames = store.postFrames
      const cnt = counter.current
      const radius = { r: 0 }
      const maxR = Math.hypot(el.clientWidth, el.clientHeight) / 2 + 4
      const maskCounter = () => {
        if (!cnt) return
        const rc = cnt.getBoundingClientRect()
        const cx = el.clientWidth / 2 - rc.left
        const cy = el.clientHeight / 2 - rc.top
        const m = `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, transparent ${radius.r.toFixed(1)}px, #000 ${(radius.r + 1).toFixed(1)}px)`
        cnt.style.maskImage = m
        cnt.style.webkitMaskImage = m
      }
      const openCircle = () => {
        el.style.background = 'transparent'
        el.parentElement?.removeAttribute('data-loading')
        el.style.pointerEvents = 'none'
        const tl = gsap.timeline({
          onComplete: () => {
            store.reveal = 1
            running.current = false
            el.style.display = 'none'
          },
        })
        tl.to(radius, {
          r: maxR,
          duration: P.revealDuration,
          ease: P.revealEase,
          onUpdate: () => {
            store.reveal = radius.r / maxR
            maskCounter()
          },
        })
        // the hero title starts focusing while the circle opens
        tl.call(setTitlesReady, [], `-=${P.revealDuration * 0.55}`)
      }
      gsap.to(sphere.current, {
        scale: 0.2,
        opacity: 0,
        duration: P.sphereOutDuration,
        ease: 'power3.in',
        onComplete: () => {
          // wait until the WebGL cover has really been presented (or give up after ~0.5 s and fall back)
          const t0 = performance.now()
          const wait = () => {
            if (store.postFrames - startFrames >= 3) openCircle()
            else if (performance.now() - t0 > 500) fallback()
            else requestAnimationFrame(wait)
          }
          wait()
        },
      })
      // no post chain (e.g. it failed to start): reveal with the CSS mask on the whole layer, as before
      const fallback = () => {
        store.reveal = 1
        el.parentElement?.removeAttribute('data-loading')
        gsap.to(radius, {
          r: maxR,
          duration: P.revealDuration,
          ease: P.revealEase,
          onUpdate: () => {
            const m = `radial-gradient(circle at 50% 50%, transparent ${radius.r.toFixed(1)}px, #000 ${(radius.r + 1).toFixed(1)}px)`
            el.style.maskImage = m
            el.style.webkitMaskImage = m
          },
          onComplete: () => {
            running.current = false
            el.style.display = 'none'
          },
        })
        gsap.delayedCall(P.revealDuration * 0.45, setTitlesReady)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={styles.preloader} ref={root} aria-hidden>
      <div className={styles.center} ref={sphere}>
        <canvas className={styles.sphere} ref={canvas} />
        <span className="t-label">{content.loading}</span>
      </div>
      <div className={styles.counter} ref={counter}>
        <span className={styles.num} ref={num}>
          0
        </span>
        <span className={styles.pct}>%</span>
      </div>
    </div>
  )
}
