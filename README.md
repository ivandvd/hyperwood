# Hyperwood

The Hyperwood site. Three pages:

- **The landing page** (`index.html`): an opening, then a pinned scroll journey drawn by one shader, a light section on the protocol, and the footer.
- **The Architecture page** (`architecture/index.html`): the long read. Eight sections that follow the architecture paper ("Hyperwood: Architecture and Core Execution") page by page.
- **The earlier landing page** (`classic.html`): the globe hero and the four frames, kept as they were until the new landing page is approved. Not linked from anywhere.

The landing page says each thing once and shows it. The Architecture page carries everything the paper says.

## Run it

```bash
npm install
npm run dev          # http://localhost:5210 and http://localhost:5210/architecture/
npm run build        # type-check and production build (both pages)
npm run lint
npm run test:choreography   # the hero's motion maths: 77 pieces, 9 rings, restored after a scroll there and back
npx tsx scripts/liquid-shape.ts   # how round and even the hero's fused pieces are
```

- `?demo=1` plays the hero's whole scroll as a timed take, with no scrolling.
- `?demo=1&capture=1` hands the clocks to a script: `window.__hyperwoodCapture.step()` renders exact 1/60 s frames, for recording.
- `?debug` (dev server only) reads shader logs back, which makes the page wait for every program.

## Where things are

| What | Where |
|---|---|
| The opening (the loading screen and how the page is uncovered) | its elements and styles in `index.html`, what it waits for in `src/ui/opening.ts`, timings under `opening` in `src/config.ts` |
| The journey: the pinned opening of the landing page | `src/journey/`: `shader.ts` (the picture), `timeline.ts` (what moves when), `markField.ts` (the mark as a body), `Journey.tsx`, `Header.tsx`, `glide.ts` (the wheel) |
| The protocol section and the footer | `src/landing/` |
| Every word of the landing page | `src/content.home.ts` (the footer's cautions, which every page shows: `src/content.cautions.ts`) |
| Every number of the journey: palette, beats, lids, the body, the floor | `journey` in `src/config.ts`; type sizes and where things stand at the end of `src/styles/tokens.css` |
| The Architecture page | `src/pages/Architecture.tsx`, sections in `src/sections/`, words in `src/content.ts` (section 01) and `src/content.sections.ts` (02 to 08) |
| The earlier landing page | `classic.html`, `src/classic.tsx`, `src/App.tsx`, `src/hero/`, `src/scene/`, `src/deck/` (see "The earlier landing page" below) |
| Interface colours, type and sizes (from the brand kit tokens) | `src/styles/tokens.css` |
| The kit's files used as they are: symbol, lockup, wordmark, liquid artwork | `src/assets/brand/` |

## The landing page

### The opening

What is on screen while the page gets ready, and how the page is uncovered. It is the same on the landing page and on the earlier one; only what it waits for differs.

- **It is in the page itself.** Its elements and styles are in `index.html`, so the page is Ink and the Hyperwood mark is already filling with the first paint, before any script or stylesheet has arrived. (The production build links its stylesheets at the end of the body for the same reason: `vite.config.ts`.)
- **The mark fills from the left, in three movements that add up** (`config.opening.fill`). The first starts with the first paint. The second starts when the hero's scene exists. The last starts when the hero is whole and checked, and closes whatever is left, so the mark is always full a moment later. A small figure says the same in numbers. It is the kit's Flow reveal: a left-to-right wipe that follows the shape.
- **Then the Ink sinks.** A wave runs down the screen as the cover's lit edge and the hero is there above it. The same lit edge seals the order in the first frame below.
- **Nothing in it is moved frame by frame.** Each movement is handed to the browser whole, as an animation of transform (`src/ui/opening.ts`), and the browser runs those on its own thread. While the page is busy starting the 3D scene, and it is for a tenth of a second at a time, the mark keeps filling evenly. The figure is one column of numbers stepped the same way.
- **It decides when the page may show.** On the landing page: the journey's program is compiled, the mark's fields are worked out and the typeface has arrived (`journeyOpening` in `src/journey/timeline.ts`), and never later than 4 s. On the earlier page: both mountains are in the picture, a short check has held the story's heaviest moment behind the cover and, on a slow machine, stepped the drawing down a size so scrolling stays smooth, and frames are even (`config.opening`).
- On the test machine the landing page is uncovered about 0.9 s after it is requested (production build, local server) and the cover has gone 1.5 s later. The earlier page takes about 1.8 s. The page cannot be scrolled until then.
- Reduced motion: the mark is simply there, whole, and the cover fades.
- `performance.mark` entries named `hw:...` record how a start-up went. The landing page: mark-there, journey-program, scene, journey-whole, ready, journey-first-frame. The earlier page: scene, programs-asked, programs-there, first-frame, mountain-there, check-heavy, check-done, ready. The browser's performance tools show them.

### The journey

The top of the page is one pinned stage, held for about six and a half screens of scrolling, while one shader over the whole screen tells the story (`src/journey/shader.ts`). One number drives it: how far the section has been scrolled (`timeline.ts`). When each thing happens is `journey.beats` and `journey.lids` in `src/config.ts`; the page and the shader both read them.

| What happens | Beat |
|---|---|
| "Equity perps. Private positions." comes into focus on Ink as the opening's wave passes | on load |
| Two bowed lids of Hyper Neon close over the words. Each line blurs, swells and takes the lids' colour exactly where a lid covers it | `lids` |
| The lids part. In the opening eye stands a drop of light | `lids.part`, `drop` |
| The drop runs out into the Hyperwood mark, flat and in Neon. This is the kit's own morph: a drop becomes the mark | `morph` |
| The mark's light draws back to its edges, and it is a body of black liquid. The wordmark comes into focus under it, then the line and the header | `cool`, `word`, `header` |
| The hero. The body turns towards the pointer, and sways a little when there is none. The wordmark is hot where the pointer's light falls. A fine dotted matrix shows around the pointer | between `word` and `heroOut` |
| The words go and the body fills with light again. The mark runs back into a drop, the drop rises, draws itself down, and its lower end squares off into a foot: the gate | `heroOut`, `gather`, `stand` |
| The closing words come out from the gate, one sentence on either side of it, each with a note under it: "The proof is public." "The position is yours." | `closing` |
| A river of light pours out of the gate: it pools at the gate's foot, runs away to the left, back across to the right, and round again along the bottom of the screen towards the viewer | `river` |

How it is made:

- **One shader, nothing else.** Hand-written WebGL (WebGL 2 where there is one), no library. On the test machine a frame costs about 0.3 ms at 1440 by 900 (0.65 ms with the current running: its 64 pieces cost about 0.2 ms more than the first course did) and about 1 ms on a 1920 by 1080 screen at one and a half times density. The drawing buffer is capped (`journey.maxDpr`, `journey.maxPixels`), and nothing is drawn while the journey is off screen. In the dev build `window.__hwJourney.cost(s, n)` draws the journey at `s` n times and gives the true cost of one frame.
- **Colour.** Every tone of the picture lies between Ink and Hyper Neon (`journey.palette`). The gate and the current are the kit's own mix, exactly: Ink and Neon mixed in a straight line, nothing paler than Neon. The body uses a named scale along the same line (Ink, deep, moss, lime, Neon) with a hot Neon kept for its thin highlights and the dots. Nothing is white. Type is white and the brand's marks are Neon, as on the rest of the site.
- **Type never lies on the light.** The closing words stand beside the gate's upper, straight part (`--closing-level`, `--door-gap` in `tokens.css`), above where it opens out into the current, so they are one colour from end to end. The bell and the pool read where the notes stand and keep out of them on every screen. On an upright screen there is no room beside the gate: the title stands above it and the notes beside it.
- **The page lays things out, the shader draws them there.** Three boxes in the stage's layout are places, not pictures: the hero's `sculpture` and `word`, and the closing's `door` (`Journey.tsx`, `journey.module.css`, sizes at the end of `tokens.css`). `timeline.ts` measures them and passes them to the shader, so another shape of screen needs no numbers of its own.
- **The mark as a body** (`markField.ts`). Two fields are worked out once from the master path. The distance to the outline keeps the silhouette the exact mark. The other is the shape a film takes when it is held along the outline and blown up from inside: its root is a round cross-section, as thick as the stroke is wide, so the necks are thin tubes and the lobes full drops, with no crease anywhere. The shader marches a ray through the two. Which way the surface faces is worked out from the shape itself (how its thickness falls away), not from differences of the distance: near the outline those see a thin sheet and call it flat, which showed as a dark seam inside the rim.
- **It is lit as the kit's liquid artwork is** (`src/assets/brand/hyperwood-liquid-artwork.jpg`): black liquid, with the light behind it and on the floor. The edge glows all the way round, hottest at the very outline and strongest underneath. The undersides carry a broad glow that thins into the dark. A strip of light overhead is mirrored as a thin line along the upper shoulders. A soft halo lies on the air around it.
- **The drop, the mark and the gate are one shape of light**, drawn flat: outlines joined and cut with rounded meetings, so the mark runs out of the drop with round fronts, the way a liquid does. At the two hand-overs the body lies flat to the screen and is full of light, so the flat shape and the body are the same picture and nothing jumps.
- **The word is the wordmark** as supplied (`hyperwood-wordmark-neon.svg`), drawn into a texture where its box stands. It is never bent or distorted, and it is always the one colour: light that falls on it (the pointer's, or a sheen that passes now and then when there is no pointer) shows in the glow around the letters, never in the letters.
- **The gate and the current are one flow.** The gate stands where the reference's stands and is its size: a round-headed door 13.5 hundredths of the screen's height wide and 26.5 tall, its top 30.5 down (its box is `door` in the layout, the numbers are in `tokens.css`). The current begins inside it, half way up, so the gate's lower half softens into the current and there is no line where the two meet. Once the light pours the gate has no foot: the course begins at the gate's middle and grows broader on its way down, so the gate's sides open out like a bell and run into the current in two long curves, as the reference's do. The pieces about the gate arrive together (`wave.together`), so the gate swells into its bell on both sides at once, and close about the gate the current carries no band (`wave.plain`), so the gate's own fill, sides and foot cannot be told from the light around them.
- **The current is one soft stroke of light.** The page works out its course every frame and hands it to the shader as a few dozen points. The shader lays a soft band along every piece of the course, as a blur would, and adds the bands up. So the light is smooth everywhere, two reaches that come close run into one another, and nothing depends on which point of the course is the nearest.
- **Its course is the reference's wave, traced** (`layWave` in `timeline.ts`, `journey.wave`). The outline of the reference frame's flow was measured, and nineteen points were fitted until the outline our course gives lies on it: a pool that spreads to the right of the gate's foot, a sweep away to the left, a sweep back across to the right, and a third that comes round along the bottom of the screen towards the viewer, with a dark gap from the right and a dark wedge from the left between them. The points are places measured from the gate, in gate half-widths, so the wave keeps its shape on any screen; on a narrow one they close up towards the middle. The pool gives way by degrees where a note stands in its place (a small laptop screen, a phone held sideways).
- **The wave is one smooth curve.** Its outline has no bump, neck or facet, and three things see to that. The points are not on the course: they pull at it, and the course is the cubic B-spline between them, which has no kink and cannot swing out between two points that lie close (a curve drawn through the points did, at the left turn). The breadth is carried along the same curve, and inside the shader a piece's breadth runs evenly from its one end to its other, so the next piece takes up exactly where it leaves off (pieces that each had one breadth left a small step at every joint, and the tighter edge showed it). And the course is cut into 64 pieces, each about half as long as the current is broad. Where the gate's sides meet the pool the corner is rounded off. When changing the points, keep them few and evenly spread, and never let the breadth go down and up again between neighbours: that is a neck.
- **The wave's edge has a measure of its own.** Its three sweeps lie close together and the last is as broad as the screen. An edge that grows softer with the breadth runs them into one mass, so the traced wave is drawn by how far inside its outline a point lies: about a quarter of full strength on the outline, full strength a short way in, next to nothing a short way out (`wave.soft`, `wave.glow`). The dark between two sweeps stays dark.
- **The first course is still there.** `layCourse` and `journey.floor`: two sweeps on a floor in perspective, drawn with an edge as soft as the current is broad. The page shows it, exactly as it was, when the address ends in `?wave=old`.
- **What was tried before, and why it went.** A current measured against its nearest reach has a seam wherever another reach becomes the nearest, and shows the straight pieces on its bends. A soft band laid on the floor, not on the screen, smears towards the viewer: its near edge comes out several times softer than its far one. Both looked made, not poured. A current in one flat colour with a crisp edge is no wave at all: it needs its soft edge and its second tone. A band laid by how far inside the outline a point lies had a crease along the middle of every sweep.
- **Two tones.** Neon, and the deeper green Neon makes with Ink. A band a shade deeper lies between the middle of each sweep and its edge and drifts a little as it flows; where the current is thin it is Neon alone. Along its margins the deeper green thins into the dark.
- **The lids are shared.** Their numbers (`journey.lids`) are read by the shader and by the script that tints the words, so the words change exactly where the lids are.
- **The wheel glides** (`glide.ts`): a wheel moves a goal and the page's real scroll follows it. Touch, the keyboard and the scrollbar are the browser's own.
- **Without WebGL** nothing is drawn: the stage stays Ink, the hero shows the symbol and the wordmark as they are supplied, the gate is a plain shape of light, and the words keep a closer timing so the stage is never empty (`journey.stillBeats`). **Reduced motion:** no ambient movement, no easing, no glide; the scroll still tells the story.
- **Screens.** Checked in a desktop browser at 1440 by 900, 1920 by 1080 and 1280 by 720, and emulated at 820 by 1180, 390 by 844, 360 by 640, and a phone on its side (844 by 390, 667 by 375). Not yet on a real phone.

### The protocol section

A light page (Paper, the kit's surface for reading) that scrolls up over the journey (`src/landing/Protocol.tsx`): an order's five stages as dotted rings, "Sealed orders. Proven settlement.", four things the protocol does, the way to the Architecture page, and the caution about privacy.

### The footer

It waits under the page, fixed to the bottom, and is uncovered as the protocol section scrolls off it (`src/landing/Foot.tsx`). It carries the cautions the paper insists on, and the wordmark at full width: crisp at the top of the letters and softening towards the baseline.

## The earlier landing page

`classic.html` is the landing page as it was before the journey: the globe hero, the hand-over and the four frames. It is kept whole and working so that nothing approved is lost while the new page is reviewed. Delete it (with `src/classic.tsx`, `src/App.tsx`, `src/hero/`, `src/scene/`, `src/choreography/`, `src/state/`, `src/scroll/`, `src/deck/`, `src/ui/Interface*`, and the three.js and GSAP dependencies) once the new page is the one.

### The hero

One continuous WebGL scene, pinned for 9.5 screens of scroll.

A drop of black liquid the size of a planet hangs over a dark valley, in front of a Hyper Neon corona. Scrolling follows one order through the stages the protocol names: the core starts to glow through the glass (Accepted), the drop tears open into turning bands with light pouring between them (Matched), the bands burst into droplets that sweep past the camera (Proven), and the last droplet settles under a neon aurora and becomes the Hyperwood mark (Settled). Scrolling back rebuilds the drop exactly.

**How the liquid is drawn.** Nothing in the globe is a triangle mesh. At rest it is one analytic sphere with a slow swell, which a mirror-like material needs to stay perfectly smooth. Once the scroll begins it hands over to 77 soft ellipsoids fused by a smooth union: pieces that touch run into one surface, pieces that drift apart neck and pinch off like droplets. Each pixel ray-marches that field, so the surface has no facets at any zoom. Details are in the header of `src/scene/liquid/liquidMaterial.ts`.

**The ending: the drop draws the mark.** The brand kit names one way to connect a circle and the logo (kit 03.9, Logo animation): a drop becomes the mark. The hero ends on that, kept small and quiet. The drop is the mark's own first lobe, and it draws the rest.

- **The drop gathers light.** As the sky darkens, the last droplet settles into a still sphere and neon closes in from its rim, driven by the scroll, so the eye never loses it.
- **Then it draws the mark.** The drop settles exactly where the mark's first lobe will be (`mark.start`). When the story reaches its last stretch it finishes filling, then pours out along the mark: up the first wave, down, over the second, and round into the head. This part runs on the clock, not on the scroll, takes `mark.draw` seconds, and runs back when the scroll goes back.
- **How the drawing is made** (`src/brand/flow.ts`). For every point inside the master, one number is worked out once: when the liquid gets there if it starts as the drop and can only run inside the outline. It is a travel time, solved outward from the drop with the fast marching method, and the liquid runs fastest mid-stream and slower along the walls (`mark.wall`, `mark.reach`). The shader shows the points whose time has come, and lets the height fall to nothing at the front (`mark.nose`) so the tip is lit like the tip of a stream.
- **The kit morph is still there.** Set `mark.reveal` to `'morph'`, or add `?mark=morph` to the address.
- **It is liquid.** A blurred copy of the shape is its height, and it is lit from that: a soft key, a deeper rim, a glint, and the cursor light sliding over it (`mark.depth`).
- **Where it departs from the kit.** The kit reveals the logo with a morph in 900 ms, rules out drawing it along its path, and keeps it free of effects. Here the drop draws the mark over a few seconds (asked for), the colour is the graded neon of the scene, and there is a soft halo behind the mark.

**Screens.** The scene is composed for a wide screen and adapts to tall ones (phones, upright tablets): the lens widens so the whole globe fits the width, the camera aims lower so the globe sits above the copy, and the last droplet takes a larger share of the width (`camera.tall`, `phrase.keyScreenWidthTall`). On those screens the header and the copy sit on a soft Ink shade.

### The hand-over

After the story the scene draws in to a rounded frame, the same card every later frame is, and the first frame of the deck slides up over it. Two CSS variables on the stage carry it (`--frame`, `--covered`): `src/scroll/useScrollTimeline.ts` writes them, `src/App.module.css` and `src/ui/Interface.module.css` turn them into the picture. The scene stops drawing once it is covered.

### The deck: four frames

Below the hero the page is a stack of frames, each one card the size of the screen with the hero's own arrangement: a large title at the lower left, a short paragraph, one picture. A frame slides up over the one before, which draws back and dims. While a frame is on top it is held for a stretch of scroll, and its picture follows that scroll.

| Frame | What it says | Its picture | File |
|---|---|---|---|
| Sealed orders. Proven settlement. | What the network sees and what stays with you. | The order the hero followed, as a ticket. Ink runs down its values and seals them to cipher; then it passes Accepted, Matched and Proven, and its request id, batch, state root and proof become public. A switch shows the same order as its owner reads it. | `Privacy.tsx` |
| Close the position. Choose the payout. | One closing instruction, two destinations. | The paper's worked example as liquid: the equity grows as a drop of neon, runs down between the two destinations, fills Collateral, then passes across to the equity tracker. After that the destinations are buttons. | `Payout.tsx` |
| A Layer 3 on Robinhood Chain. | Network, execution, markets, trackers. | Four tiles, each a statement with a small picture, each a link into the Architecture page. | `Network.tsx` |
| Equity perps. Private positions. | The tagline again, and the call to action. | The kit's liquid artwork, arriving with the kit's Resolve. | `Close.tsx` |

How it is made:

- **`track.ts`** measures three movements for every frame (arriving, held, being covered), eases them towards the scroll, and hands them to whoever draws the frame. One scroll listener and one frame loop serve the deck. CSS does the pinning (`deck.module.css`): a tall track, a sticky screen, the card.
- **Two modes**, switched by one attribute on `<html>` (`data-deck`): `stack` on wide screens, as described; `flow` on phones, upright or low windows and under reduced motion, where the frames are ordinary cards one under another and a picture plays as its card crosses the screen.
- **A frame is designed at 1384 by 795** (the card on a 1440 by 900 screen) and scales with its card, the way a film frame does. Sizes inside a frame are in `--u`, one pixel of that design.
- **`liquid.ts`** draws the neon liquid of the payout frame in a small WebGL canvas: a few bodies fused by a smooth union, lit like the hero's mark. It also gives the liquid's surface to the page, so the type on a destination changes colour exactly on the liquid's edge.
- **`Frame.tsx`** is what every frame shares: the card with a breath of the hero's aurora, the title (the hero's focus pull), the paragraph, the draw-back when covered.
- **Examples are marked as examples.** The ticket's values and the payout's amounts come from the paper's worked example and say so.

## The Architecture page

| # | Section | Paper | File |
|---|---|---|---|
| 01 | Public and confidential | p. 3 | `Split.tsx` |
| 02 | Equity markets | p. 4 | `Markets.tsx` |
| 03 | The payout choice | p. 10 | `Payout.tsx` |
| 04 | Tracker tokens | p. 11 to 12 | `Trackers.tsx` |
| 05 | Core execution | p. 5 to 9 | `Execution.tsx` |
| 06 | Network | p. 1 to 2 | `Lower.tsx` |
| 07 | Finality and policy | p. 13 | `Lower.tsx` |
| 08 | Implementation sequence | p. 14 | `Lower.tsx` |

- **Surfaces.** Ink for sections 01 to 04, one Hyper Neon poster in 03, a Paper sheet for 05 to 08 with every diagram set into it as an Ink panel (the kit: "Paper sections for reading"). A surface is a class in `kit.module.css` (`.paper`, `.ink`) that redefines a handful of tokens.
- **Imagery** is the kit's: the oversized contour on the poster, the pattern band before the Paper sheet, the current lines behind the block interval.
- **Examples are marked as examples.** The values in section 01 come from the worked example of section 03 and say so. The clock and the tracker chart are marked Schematic.
- A tile on the landing page opens the section it names (`architecture/#network` and so on).

## Shared

- **The header** is fixed. Over the hero it is the lockup alone. After the hand-over, a bar with the links, the call to action and a neon hairline that shows how far down the page you are.
- **The call to action has no destination yet.** `cta.href` in `src/content.sections.ts` is `#`, and the button does nothing until it is set.
- **Reduced motion.** The opening's cover fades, the frames are ordinary cards, and every picture shows its finished state.
- **Other projects are not named** on the site. The comparison with other venues decided what to stress, not what to print.

## Brand

Colours, type and the lockup come from the Hyperwood brand kit (`hbrand`): Hyper Neon `#CCFF00`, Ink `#0A0A0A`, Manrope, IBM Plex Mono, the horizontal lockup as supplied. The liquid follows the kit's image direction: broad continuous surfaces, glossy dark material, neon reflected light, quiet space.

**The picture uses two colours only.** The kit colours its liquid field as a straight mix of Ink and Hyper Neon, so the last step of the hero's picture does the same: the brightness of each pixel picks its place on that line (`config.post.brand`, the shader is in `src/scene/PostFX.tsx`). Light keeps its shape but cannot turn pale or white, and the brightest thing on screen is exactly `#CCFF00`. White stays for type, which is drawn outside the scene. The deck's liquid ends on the same line. Add `?brand=0` to the address to see the hero without the grade.

## Keeping it smooth

Measured on a 1920 by 1080, 120 Hz screen (RTX 5060).

- **The hero.** A frame costs about 2.5 ms for most of the story and about 5 ms while the bands are open, against a budget of 8.3 ms. The liquid shader keeps almost no per-pixel state: large per-pixel tables are very slow under Direct3D (the backend WebGL uses on Windows) for every pixel on screen. Do not add arrays to that shader without measuring. Rays that skim a surface take growing steps. The drawing buffer is capped at `config.performance.maxPixels`.
- **Starting up: nothing may stop the screen.** The opening is animated by the browser's own thread, but that thread shares the graphics process with everything else, so anything that makes the graphics process wait freezes the opening too. Four things did, and are arranged so they no longer do:
  - *Programs are compiled beside the page, not in a drawn frame* (`src/scene/warm.ts`). Before the first frame the scene, the post chain and the two small scenes drawn beside them are asked for, and nothing is drawn until the driver says they are done. A program depends on where it is drawn and on which lights are on, so they are asked for in that state: with a linear buffer in place (the composer draws into one), and once for every set of the two lights the story switches. The mountains arrive later, from a worker, and are shown only when their programs are there.
  - *The payout frame's canvas is made late* (`src/deck/Payout.tsx`): when its frame is a few screens away, and its program is never waited for.
  - *The frames below the hero are not drawn while the opening is up* (`deck.module.css`). For that first moment the page is short and they sit right under the screen.
  - *The terrain worker starts with the page* (`src/main.tsx`), not with the hero's code, so the two overlap.
- **How to check it.** Record a trace of a page load with the browser's performance tools (or Chrome tracing with the `viz`, `gpu` and `toplevel` categories). The frames put on screen while the opening is up should come at the display's own pace: on the test machine a first visit loses 4 or 5 single frames in two seconds and never two in a row for long (the worst gap is 25 ms). A long task on the graphics process's main thread, or a program status read that waits, is what to look for when that changes.
- **The journey's first picture waits for a still screen** (`mayBegin` in `src/journey/timeline.ts`). Compiling the program beside the page is not the whole cost: the first time a program draws, the graphics driver builds it, and with this shader that stopped every animation on screen for about 36 ms, the opening's among them. So while the opening is up the program is compiled and the mark's fields are worked out, but nothing is handed to the driver. The first picture is drawn once the opening words stand still, about half a second after the cover has gone, or at the first scroll. Nothing is lost by it: the first screen is Ink, which the stage is anyway. On the test machine a first visit now shows no late frame from the graphics process while the opening is up, and one (20 ms) at that first picture.
- **The deck.** One listener and one frame loop; pictures draw only when something changed. The hero's scene stops drawing once the first frame covers it.

To measure the hero: the dev build exposes `window.__hyperwood`; render with `gl.render(scene, camera)` in a loop and force the GPU to finish with a one-pixel `readPixels`, which gives the true cost without the display refresh in the way.

Checked in a desktop browser at 1440 by 900, 1920 by 1080, 1366 by 650 and at phone width. Not yet checked on a real phone, where the browser toolbars change the visible height.

## Before this ships

- **Copy is a draft.** It follows the architecture paper; it needs sign-off.
- **The call to action** needs its destination.
- **A real phone** has not been tried.
- **Licence.** Two uberdesigner templates stand behind this site, and their free tier covers personal use only: commercial and client work needs their paid plan, and their terms ask that a template, its prompt and its files are not shared. Settle that before launch.
  - *The landing page's journey* started from the idea of their "Melune" template: words that lids of colour close over, a gate of light, a river running out of it. The code, the pictures and the story (the drop, the mark as a body, the gate it gathers into) are written for Hyperwood, and none of the template's files are used.
  - *The earlier landing page's hero* was rebuilt from their "keycap sphere" template prompt, and the two text effects (`FocusReveal.tsx`, `FadeUpLines.tsx`) and the ring cursor (`Cursor.tsx`) were ported from the same template's material.
