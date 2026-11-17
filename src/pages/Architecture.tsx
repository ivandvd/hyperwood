/**
 * The Architecture page: the long read. The landing page says each thing once; this page carries the design
 * in full, section by section, in the order and the words of the architecture paper.
 * Ink for confidential trading, markets, the payout and trackers; a Paper sheet for the technical reading that
 * follows (the kit: "Paper sections for reading"), with every diagram set into it as an Ink panel.
 */
import { useEffect } from 'react'
import { SiteHeader } from '../ui/SiteHeader'
import { glideTo } from '../ui/glide'
import { FocusReveal } from '../ui/FocusReveal'
import { FadeUpLines } from '../ui/FadeUpLines'
import { playTitles } from '../ui/titles'
import { config } from '../config'
import { Split } from '../sections/Split'
import { Markets } from '../sections/Markets'
import { Payout } from '../sections/Payout'
import { Trackers } from '../sections/Trackers'
import { Execution } from '../sections/Execution'
import { Network, Policy, Roadmap } from '../sections/Lower'
import { FlowBand } from '../sections/devices'
import { Footer } from '../deck/Footer'
import { sections } from '../content.sections'
import kit from '../sections/kit.module.css'
import s from './architecture.module.css'

const HOME = { label: sections.doc.home, href: '../' }

export function Architecture() {
  const D = sections.doc

  useEffect(() => {
    playTitles('doc')
    // arriving from a tile of the landing page: go to the section it named, once the page has its height
    const id = location.hash.slice(1)
    if (!id) return
    const timer = window.setTimeout(() => glideTo(id, 0.9), 350)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      <SiteHeader backed nav={sections.nav} more={HOME} home="../" />
      <main>
        <header className={s.head}>
          <p className={kit.eyebrow}>
            <b>{D.label}</b>
            <span>{D.sub}</span>
          </p>
          <h1 className={`t-display ${s.title}`}>
            <FocusReveal text={D.title} group="doc" className="fr--stack" />
          </h1>
          <FadeUpLines className={s.lead} group="doc" delay={config.titles.bodyDelay} text={D.lead} />
          <nav className={s.contents} aria-label="Contents">
            {sections.nav.map(([label, id], i) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  if (glideTo(id)) e.preventDefault()
                }}
              >
                <b>{String(i + 1).padStart(2, '0')}</b>
                {label}
              </a>
            ))}
          </nav>
        </header>
        <Split />
        <Markets />
        <Payout />
        <Trackers />
        {/* the kit's pattern closes the Ink part; the technical reading that follows stands on Paper */}
        <FlowBand />
        <div className={`${kit.sheet} ${kit.paper} ${s.sheet}`}>
          <Execution />
          <Network />
          <Policy />
          <Roadmap />
        </div>
      </main>
      <Footer nav={sections.nav} more={HOME} />
    </>
  )
}
