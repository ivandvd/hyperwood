# Hyperwood: hero

The opening section of the Hyperwood site: one continuous WebGL scene, pinned for 7.5 screens of scroll.

A drop of black liquid the size of a planet hangs over a dark valley, in front of a Hyper Neon corona. Scrolling follows one order through the stages the protocol names: the core starts to glow through the glass (Accepted), the drop tears open into turning bands with light pouring between them (Matched), the bands burst into droplets that sweep past the camera (Proven), and the last droplet settles under a neon aurora and becomes the Hyperwood mark (Settled). Scrolling back rebuilds the drop exactly.

## Run it

```bash
npm install
npm run dev          # http://localhost:5210
npm run build        # type-check and production build
npm run lint
npm run test:choreography   # the motion maths: 77 pieces, 9 rings, restored after a scroll there and back
npx tsx scripts/liquid-shape.ts   # how round and even the fused pieces are
```

- `?demo=1` plays the whole scroll as a timed take, with no scrolling.
- `?demo=1&capture=1` hands the clocks to a script: `window.__hyperwoodCapture.step()` renders exact 1/60 s frames, for recording.

## Where things are

| What | Where |
|---|---|
| Every word of the interface | `src/content.ts` |
| Every art-direction number: palette, light, liquid, motion, scroll | `src/config.ts` |
| Interface colours, type and sizes (from the brand kit tokens) | `src/styles/tokens.css` |
| The liquid: shader, the globe, the field maths | `src/scene/liquid/` |
| Motion of the pieces as a pure function of scroll | `src/choreography/` |
| Valley, sky, aurora, fog | `src/scene/environment/` |
| Titles, preloader, cursor | `src/ui/` |
| The mark and the morph that forms it | `src/brand/mark.ts`, `src/state/mark.ts`, `src/scene/liquid/Mark.tsx` |

## How the liquid is drawn

Nothing in the globe is a triangle mesh. At rest it is one analytic sphere with a slow swell, which a mirror-like material needs to stay perfectly smooth. Once the scroll begins it hands over to 77 soft ellipsoids fused by a smooth union: pieces that touch run into one surface, pieces that drift apart neck and pinch off like droplets. Each pixel ray-marches that field, so the surface has no facets at any zoom. Details are in the header of `src/scene/liquid/liquidMaterial.ts`.

## The ending: a drop becomes the mark

The brand kit names one way to connect a circle and the logo (kit 03.9, Logo animation): a drop becomes the mark. The hero ends on that, kept small and quiet.

- **The drop gathers light.** As the sky darkens, the last droplet settles into a still sphere and neon closes in from its rim, driven by the scroll, so the eye never loses it.
- **Then it becomes the mark.** When the story reaches its last stretch the drop finishes filling and morphs into the symbol with the kit engine: the master path, 98 cubic segments, interpolated from a circle of the same construction on the kit curve. This part runs on the clock, not on the scroll, and runs back when the scroll goes back.
- **It is liquid.** A blurred copy of the shape is its height, so the thick lobes stand proud and the necks lie low, and it is lit from that: a soft key, a deeper rim, a glint, and the cursor light sliding over it. The settings are `mark.depth` in `src/config.ts`.
- **It is drawn inside the scene.** The mark is a camera-facing plane lit with the same Hyper Neon as the corona and the aurora, so it takes the same grade, grain and haze as everything else, with a faint pool of its own light behind it. Once resolved the silhouette is the master; only the light inside it keeps moving, and it drifts a few pixels.
- **Where it departs from the kit.** The kit plays the morph in 900 ms and keeps the logo free of effects. Here the morph is given more time, the colour is the graded neon of the scene, not the flat hex, and there is a soft halo behind the mark. All of it is under `mark` in `src/config.ts`; the artwork numbers there come from the kit and are not tuning knobs.
## Screens

The scene is composed for a wide screen and adapts to tall ones (phones, upright tablets). The lens widens so the whole globe fits the width, the camera aims lower so the globe sits above the copy, and the last droplet takes a larger share of the width. The numbers are `camera.tall` and `phrase.keyScreenWidthTall` in `src/config.ts`. On those screens the header and the copy sit on a soft Ink shade, because the burst runs bright behind them, and the phase indicator joins the copy; the rules are at the end of `src/ui/Interface.module.css`.

Checked in a desktop browser at phone, tablet and desktop sizes. Not yet checked on a real phone, where the browser toolbars change the visible height.

## Keeping it smooth

Measured on a 1920 x 1080, 120 Hz screen (RTX 5060): a frame costs about 2.5 ms for most of the story and about 5 ms while the bands are open, against a budget of 8.3 ms.

- **The liquid shader keeps almost no per-pixel state.** For each piece on its ray a pixel stores an index and two distances; everything else is read from the data texture when needed. Large per-pixel tables are very slow under Direct3D (the backend WebGL uses on Windows) for every pixel on screen, liquid or not. That one change took the pass from about 8 ms to under 1 ms where there is little liquid. Do not add arrays to that shader without measuring.
- **Rays that skim a surface take growing steps**, so they no longer crawl to the step limit.
- **The terrain is generated in a worker** (`src/scene/environment/terrain.worker.ts`), so the page keeps animating while it loads. The preloader waits for it.
- **A check behind the preloader** holds the heaviest moment of the story for a few frames. If the machine cannot keep its refresh rate there, the pixel ratio drops a step before the reveal (`config.preloader.bench*`). The drawing buffer is also capped at `config.performance.maxPixels`.
- Film grain is strongest in the midtones and only a trace in near-black, where it read as static.

To measure: the dev build exposes `window.__hyperwood`; render with `gl.render(scene, camera)` in a loop and force the GPU to finish with a one-pixel `readPixels`, which gives the true cost without the display refresh in the way.

## Brand

Colours, type and the lockup come from the Hyperwood brand kit (`hbrand`): Hyper Neon `#CCFF00`, Ink `#0A0A0A`, Manrope, IBM Plex Mono, the horizontal lockup as supplied. The liquid follows the kit's image direction: broad continuous surfaces, glossy dark material, neon reflected light, quiet space.

## Before this ships

- **Copy is a draft.** It follows the architecture document; it needs sign-off like the items tagged Draft in the brand guidelines.
- **Licence.** The scene's structure and motion were rebuilt from the uberdesigner "keycap sphere" template prompt. Its free tier covers personal use only and its terms ask that the template, its prompt and its files are not shared. Commercial use needs their paid plan, so settle that before launch.
