/**
 * The hero's stage: the liquid globe that bursts over a valley, and the last drop that draws the mark.
 * Everything it is made of lives in scene/, choreography/, state/, scroll/ and ui/Interface. This file is the
 * door to all of that: the page loads it beside itself (App.tsx), and the opening (ui/opening.ts) is on screen
 * until it is ready.
 *
 * After the story the stage hands over to the page: the scene draws in to a frame and the first frame of the
 * deck slides over it (scroll/useScrollTimeline, App.module.css).
 */
import { useEffect, useRef, useState } from 'react'
import { Experience } from '../scene/Experience'
import { Interface } from '../ui/Interface'
import { useScrollTimeline, type StageState } from '../scroll/useScrollTimeline'
import { store } from '../state/store'
import { demo } from '../scroll/demo'
import type { DeckMode } from '../deck/track'
import styles from '../App.module.css'

interface Props {
  mode: DeckMode
  onState: (s: StageState) => void
}

export default function GlobeStage({ mode, onState }: Props) {
  const stage = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<StageState>({ framed: false, covered: false })
  const onScreen = useRef(true)
  const covered = useRef(false)

  // the scene draws only while it can be seen: on screen and not under the first frame of the deck
  const drive = () => store.setFrameloop?.(onScreen.current && !covered.current ? 'always' : 'never')
  useScrollTimeline(stage, mode, (next) => {
    covered.current = next.covered
    drive()
    setState(next)
    onState(next)
  })

  useEffect(() => {
    const move = (e: PointerEvent) => {
      store.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      store.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
      store.pointer.active = true
    }
    const leave = () => (store.pointer.active = false)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
    }
  }, [])

  useEffect(() => {
    const el = stage.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const seen = new IntersectionObserver(([e]) => {
      onScreen.current = e.isIntersecting
      store.setFrameloop?.(onScreen.current && !covered.current ? 'always' : 'never')
      if (!e.isIntersecting) store.pointerOverKey = false
    })
    seen.observe(el)
    return () => seen.disconnect()
  }, [])

  // the timed take (?demo=1) never scrolls: no scrollbar in the recording
  useEffect(() => {
    if (!demo.on) return
    const root = document.documentElement
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = ''
    }
  }, [])

  return (
    <div className={styles.stage} ref={stage} data-framed={state.framed ? '' : undefined} data-covered={state.covered ? '' : undefined}>
      <div className={styles.scene}>
        <Experience />
      </div>
      <div className={styles.edge} aria-hidden />
      <Interface />
    </div>
  )
}
