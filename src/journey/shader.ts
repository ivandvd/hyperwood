/**
 * The journey's picture: one shader over the whole screen, driven by how far the journey has been scrolled.
 *
 * It is put together from pieces, because the hero comes in two kinds (the end of this file). The hero as a
 * room, which the page shows:
 *
 *   the lids      two bowed bands of Hyper Neon close over the opening words, then part again
 *   the drop      in the opening eye stands a drop of light. It rises to where a bare bulb hangs and draws in
 *                 to the bulb's size: it is the lamp of a room
 *   the room      the lamp's light reaches further and further, and the films, which lie under this picture,
 *                 show where it reaches (film/FilmStack.tsx). Scrolled on, the light draws back to the
 *                 lamp, the lamp goes over to the next film's bulb, and its light opens the next room: three
 *                 films. Then it draws back for the last time
 *   the gate, the current: as below (this hero has no wordmark and no dots)
 *
 * And the hero as the mark, which it was before the films (the address ?hero=mark):
 *
 *   the lids      two bowed bands of Hyper Neon close over the opening words, then part again
 *   the drop      in the opening eye stands a drop of light. It spreads into the Hyperwood mark (the brand
 *                 kit's own morph: a drop becomes the mark)
 *   the body      the mark's light draws back to its edges and it is a body of black liquid, lit the way the
 *                 kit's liquid artwork is lit: Neon along its edges, a broad glow on its undersides, the dark
 *                 between. It turns towards the pointer, and sways a little when there is none
 *   the word      the wordmark under it, in Neon: its glow swells where the pointer's light falls
 *   the dots      a fine matrix that shows around the pointer
 *   the gate      the body fills with light again; the mark gathers back into a drop, the drop rises and
 *                 pours down into a gate of light
 *   the current   a river of light pours out of the gate, as wide as the gate, and runs over the floor in
 *                 bends towards the viewer: Neon in two bands, the deeper green of the brand's own mix
 *                 between them and along its margins
 *
 * Colour: everything is a tone between Ink and Hyper Neon (config.journey.palette). Nothing is white or pale;
 * the lightest tone is a hot neon.
 *
 * Where things stand is the page's business: the body, the word and the gate are drawn where the stage's
 * layout has put their boxes (journey.module.css; timeline.ts measures them and passes them in). When things
 * happen is config.journey.beats and config.journey.lids.
 *
 * The mark's picture is opaque. The room's has a clear share: wherever the film shows, the colour is this
 * picture's share of the light only, and alpha says how large that share is (timeline.ts asks for a canvas
 * that keeps its alpha).
 *
 * `progress` is the journey, 0 to 1. `time` is seconds, and stays 0 under reduced motion.
 * All coordinates: `uv` 0..1 with y up; `a` is the same in screen heights, x from the middle.
 */
import { config } from '../config'
import { markTiming, roomTiming } from './timing'
import { EXCHANGE as EX } from './exchange'

/** A number as GLSL wants a float written. */
const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))
const F = config.journey.floor
const B = config.journey.body
const T = config.journey.beats
const W = config.journey.wave
/** The most pieces a course has: the traced wave's. (The first course has fewer; its points beyond its last
 *  lie on its last and give nothing.) */
const MOST = Math.max(F.pieces, W.pieces)
const R = config.journey.room
/** (the room's journey is longer: its own beats, and when its films follow one another) */
const TR = roomTiming.beats
const RT = roomTiming.room
/** A beat as the two ends of a smoothstep. */
const beat = (b: readonly [number, number]) => `${f(b[0])}, ${f(b[1])}`

export const VERTEX = `attribute vec2 corner;void main(){gl_Position=vec4(corner,0.,1.);}`

/** The mark as a body: its two fields, and which way its surface faces. */
const MARK_FUNCS = /* glsl */ `// ---------------------------------------------------------------- the mark, as a body
// markTex holds two things about the mark: r, how full the body is over each point (its height squared: the
// shape of a film blown up over the outline, so its root is a round cross-section); g, the distance to the
// outline. Object units: the mark is 2 wide; the texture covers 2.4 by 1.2.
vec2 turned; // how far the body is turned, about its upright and about its level: 0, 0 is flat to the screen
vec2 markField( vec2 q ) {
  vec2 f = texture2D( markTex, clamp( q / vec2( 2.4, 1.2 ) + .5, 0., 1. ) ).rg;
  return vec2( f.r / 16., f.g * .42 - .08 );
}
vec3 markLocal( vec3 p ) {
  p.xy = turn( -.05 ) * p.xy;
  p.xz = turn( turned.x ) * p.xz;
  p.yz = turn( turned.y ) * p.yz;
  return p;
}
// How thick the body is over a point of the mark, and how far the point is from the outline.
vec2 markBody( vec2 q ) {
  vec2 f = markField( q );
  // as thick as the stroke is wide, less a little. (The film's own edge is a texel coarse: along the outline
  // a round rim of the distance inside it is added, so the body begins to rise exactly on the outline.)
  float inward = clamp( -f.y, 0., .02 );
  float thick = ${f(B.full)} * sqrt( max( f.x, 0. ) + .12 * ( inward - inward * inward / .04 ) );
  // (a liquid is never quite still)
  thick *= 1. + .05 * sin( q.x * 5.2 - time * .6 ) * sin( q.y * 4.1 + time * .43 );
  return vec2( thick, f.y );
}
float markDistance( vec3 p ) {
  vec3 l = markLocal( p );
  vec2 b = markBody( l.xy );
  float away = max( abs( l.x ) - 1.2, abs( l.y ) - .6 );
  return max( max( b.y, abs( l.z ) - b.x ), away ) * .5;
}
// Which way the body's surface faces at a point on it. Worked out from the shape itself: the surface leans
// the way its thickness falls away, and stands upright where there is none left (the outline); beyond the
// outline, straight away from it.
vec3 markNormal( vec3 p ) {
  vec3 l = markLocal( p );
  vec2 e = vec2( .007, 0. );
  vec2 x1 = markBody( l.xy + e.xy );
  vec2 x0 = markBody( l.xy - e.xy );
  vec2 y1 = markBody( l.xy + e.yx );
  vec2 y0 = markBody( l.xy - e.yx );
  vec2 thinning = -vec2( x1.x * x1.x - x0.x * x0.x, y1.x * y1.x - y0.x * y0.x ) / ( 2. * e.x );
  vec2 outward = vec2( x1.y - x0.y, y1.y - y0.y ) / ( 2. * e.x );
  vec2 here = markBody( l.xy );
  vec3 n = vec3( mix( thinning, outward * .2, ss( -.003, .001, here.y ) ), 2. * here.x * ( l.z < 0. ? -1. : 1. ) );
  n = normalize( n + vec3( 0., 0., 1e-6 ) );
  // back from the body's own axes to the screen's
  n.yz = turn( -turned.y ) * n.yz;
  n.xz = turn( -turned.x ) * n.xz;
  n.xy = turn( .05 ) * n.xy;
  return n;
}

`

/** The beats of the mark and its shape of light: a drop, the mark, a body, the mark again, a drop, the gate. */
const MARK_LIGHT = /* glsl */ `  // ---------------- the beats of the mark: a drop, the mark, a body, the mark again, a drop, the gate
  float arrive = ss( ${beat(T.drop)}, s );
  float spread = ss( ${beat(T.morph)}, s );
  float cool = ss( ${beat(T.cool)}, s );
  float leave = ss( ${beat(T.heroOut)}, s );
  // (the gathering has four parts: into a drop, the drop's rise, the drop drawn down to the floor, its
  // lower end squared off into the gate's foot)
  float gather = clamp( ( s - ${f(T.gather[0])} ) / ${f(T.gather[1] - T.gather[0])}, 0., 1. );
  float draw = ss( 0., .42, gather );
  float rise = ss( .32, .68, gather );
  float pour = ss( .6, .92, gather );
  float square = ss( .84, 1., gather );
  float stand = ss( ${beat(T.stand)}, s );
  // how much of its pose the body has taken, and how full of light it is: flat and full at either end
  float pose = cool * ( 1. - ss( 0., .8, leave ) );
  float alight = max( 1. - cool, ss( .3, 1., leave ) );
  vec2 sway = vec2( sin( time * .29 ), sin( time * .21 + 1.3 ) ) * .13;
  vec2 tilt = mix( sway, pointer - .5, pointerActive );
  turned = vec2( tilt.x * .9 + .16, tilt.y * .65 - .2 ) * pose;
  // where it stands: the drop shows in the middle of the screen and carries the mark to its place
  vec2 home = vec2( body.x, body.y + .006 * sin( time * .55 ) * pose );
  vec2 centre = mix( vec2( 0., .5 ), home, spread );
  vec2 o = ( a - centre ) / body.z;
  // the mark's outline as it lies on the screen, in screen heights (negative inside)
  vec2 lying = ( turn( -.05 ) * o ) / cos( turned );
  float markD = mix( 1., ( markField( lying ).y + length( max( abs( lying ) - vec2( 1.2, .6 ), 0. ) ) ) * body.z, markReady );
  // the gate's outline: an arch, its shaft, cut off at the foot
  vec2 archAt = vec2( gateX, gate.y - gate.x );
  float gateD = max( length( vec2( a.x - gateX, max( a.y - archAt.y, 0. ) ) ) - gate.x, gate.z - a.y );

  // ---------------- the shape of light. A drop; the mark runs out of it (what of the mark lies within "run"
  // of the drop's middle), while the drop itself dwindles. Later the same backwards, and the drop rises and
  // pours down into the gate.
  float bodyShown = ss( ${f(T.cool[0] - 0.002)}, ${f(T.cool[0] + 0.006)}, s ) * ( 1. - ss( ${f(T.heroOut[1] - 0.006)}, ${f(T.heroOut[1] + 0.002)}, s ) ) * markReady;
  float flatShown = 0.;
  float shape = markD;
  float melt = .03;
  float dropR = body.z * ${f(B.drop)};
  float whole = body.z * 1.25;
  if ( s < ${f(T.cool[0] + 0.008)} ) {
    float fromMiddle = length( a - centre );
    float run = mix( dropR * .6 * arrive, whole, spread );
    float dropNow = mix( dropR * arrive, -melt, ss( .2, .8, spread ) );
    shape = joined( cutBy( markD, fromMiddle - run, melt ), fromMiddle - dropNow, melt );
    flatShown = ( 1. - ss( ${f(T.cool[0])}, ${f(T.cool[0] + 0.008)}, s ) ) * step( .001, arrive );
  } else if ( s > ${f(T.heroOut[1] - 0.008)} ) {
    float run = mix( whole, -melt, draw );
    vec2 dropAt = mix( home, archAt, rise );
    float dropNow = mix( mix( -melt, dropR, ss( .15, .7, draw ) ), gate.x, rise );
    // (the drop, drawn down by as much as it has poured: a pill)
    vec2 fromDrop = a - dropAt;
    fromDrop.y -= clamp( fromDrop.y, -pour * max( archAt.y - gate.z - gate.x, 0. ), 0. );
    float gathered = joined( cutBy( markD, length( a - home ) - run, melt ), length( fromDrop ) - dropNow, melt );
    shape = mix( gathered, gateD, square );
    flatShown = ss( ${f(T.heroOut[1] - 0.008)}, ${f(T.heroOut[1])}, s );
  }
`

/** The body itself: black liquid, Neon on its edges. */
const MARK_BODY = /* glsl */ `  // ---------------- the body: black liquid, Neon on its edges
  vec2 ob = ( a - home ) / body.z;
  if ( bodyShown > .001 && max( abs( ob.x ) / 1.42, abs( ob.y ) / 1.08 ) < 1. ) {
    float px = 1. / ( body.z * res.y );
    vec3 origin = vec3( ob, .95 );
    float ray = 0.;
    float hit = 0.;
    float step_ = 0.;
    float nearest = 1.;
    float nearestAt = 0.;
    for ( int i = 0; i < 64; i++ ) {
      float dist = markDistance( origin - vec3( 0., 0., ray ) );
      if ( dist < nearest ) { nearest = dist; nearestAt = ray; }
      if ( dist < .0007 ) { hit = 1.; break; }
      step_ = max( dist, .0013 );
      ray += step_;
      if ( ray > 1.9 ) break;
    }
    // A ray that passes within half a pixel of the body counts as on it, and one a little further off takes
    // a share: the outline is a clean line, and a ray that runs along the edge without settling is no gap.
    // (nearest is half the true distance, as markDistance gives it)
    float graze = 1. - ss( px * .25, px * .75, nearest );
    float there = max( hit, graze );
    if ( there > .002 ) {
      if ( hit > .5 ) {
        // settle on the surface itself (a few halvings back and forth)
        for ( int i = 0; i < 5; i++ ) {
          step_ *= .5;
          ray += markDistance( origin - vec3( 0., 0., ray ) ) < .0 ? -step_ : step_;
        }
      } else ray = nearestAt;
      vec3 surface = origin - vec3( 0., 0., ray );
      vec3 n = markNormal( surface );
      // Lit as the kit's liquid artwork is: the light comes from behind and from the floor. So the edge
      // glows all the way round, hottest at the very outline and strongest underneath; the undersides carry
      // a broad glow that thins into the dark, the flanks to the right a fainter one; the faces towards the
      // eye stay black. A strip of light overhead is mirrored as a thin line along the upper shoulders.
      float facing = clamp( n.z, 0., 1. );
      float fres = 1. - facing;
      vec2 lean = n.xy / max( length( n.xy ), 1e-4 );
      float fromBelow = ss( -.3, .9, dot( lean, vec2( -.243, -.97 ) ) );
      float fromRight = ss( .25, 1., dot( lean, vec2( .949, .316 ) ) );
      float edgeGain = .5 + .5 * fromBelow + .2 * fromRight;
      float level = ( pow( fres, 5. ) * .62 + pow( fres, 2.3 ) * .42 ) * edgeGain
        + pow( fres, .46 ) * ( fromBelow * .86 + fromRight * .3 );
      // (the faces that look up keep a trace of the room, so the black is not flat)
      level += .06 * ss( .15, .9, n.y ) * facing;
      vec3 mirrored = vec3( 2. * n.z * n.xy, 2. * n.z * n.z - 1. );
      float strip = exp( -pow( ( mirrored.y - .66 ) / .06, 2. ) ) * ( 1. - ss( .45, .85, abs( mirrored.x + .12 ) ) ) * ss( .1, .4, n.z );
      level += strip * .62;
      vec3 bodyColor = tone( clamp( level, 0., 1. ) );
      bodyColor = mix( bodyColor, cHot, strip * strip * .55 );
      // Full of light, it is the mark itself, in Neon. The light leaves the faces towards the eye first and
      // the edges last, and comes back the same way.
      float drained = mix( -.02, 1.3, 1. - alight );
      bodyColor = mix( bodyColor, cNeon, ss( drained - .26, drained, fres ) );
      result = mix( result, bodyColor, there * bodyShown );
    }
  }

`

/** What follows the pointer about the mark: the dotted matrix, and the glow round the wordmark. */
const MARK_POINTER = /* glsl */ `  // ---------------- the dots: short runs of a fine matrix, only around the pointer
  float steady = cool * ( 1. - ss( 0., .45, leave ) );
  float dotsShown = steady * pointerActive;
  if ( dotsShown > .001 ) {
    vec2 grid = uv * vec2( aspect, 1. ) * 180.;
    vec2 cell = floor( grid );
    vec2 block = floor( cell / vec2( 7., 6. ) );
    float seed = hash( block );
    float along = 1. - step( .5, abs( mod( cell.y, 6. ) - mod( floor( seed * 11. ), 6. ) ) );
    float upright = 1. - step( .5, abs( mod( cell.x, 7. ) - floor( seed * 7. ) ) );
    float pulse = ss( -.5, .7, sin( time * .65 + seed * 6.283 + block.y * .24 ) );
    float twinkle = .25 + .75 * pow( .5 + .5 * sin( time * ( 1.4 + seed * 1.8 ) + dot( cell, vec2( 2.17, 3.31 ) ) ), 3. );
    float round_ = 1. - ss( .08, .22, length( fract( grid ) - .5 ) );
    float nearPointer = 1. - ss( .06, .4, length( ( uv - pointer ) * vec2( aspect, 1. ) ) );
    float edges = ss( 0., .12, uv.y ) * ( 1. - ss( .88, 1., uv.y ) );
    float dots = round_ * max( along, upright ) * ( .16 + .6 * pulse ) * twinkle * nearPointer * edges * dotsShown;
    result = mix( result, cHot, dots );
  }

  // ---------------- the word: Neon, always the one colour. Light that falls on it shows in the glow around
  // the letters, never in the letters themselves (the logo carries no effects).
  // Only the glow is drawn here. The letters are the page's own: the wordmark as supplied, drawn by the
  // browser over this picture at the screen's full sharpness (journey.module.css, .word). Drawn here they
  // were only as sharp as this picture's pixels, and soft while they came into focus.
  float wordIn = ss( ${beat(T.word)}, s );
  float wordShown = wordIn * ( 1. - ss( 0., .5, leave ) ) * typeReady;
  if ( wordShown > .001 ) {
    float glow = texture2D( typeTex, uv ).g;
    float spot = exp( -dot( ( uv - pointer ) * vec2( aspect, 1. ) / .26, ( uv - pointer ) * vec2( aspect, 1. ) / .26 ) ) * pointerActive;
    // with no pointer, a sheen passes over the letters now and then
    float passing = fract( time * .085 ) * 2.6 - .8;
    float sheen = exp( -pow( ( uv.x + ( uv.y - .5 ) * .35 - passing ) / .045, 2. ) ) * ( 1. - pointerActive ) * step( .001, time );
    float shine = clamp( spot + sheen * .85, 0., 1. );
    result += cNeon * glow * ( .1 + .42 * shine ) * wordShown;
  }

`

/* ------------------------------------------------------------------------------------------------------------
   The hero as a room. The films stand in a box that lies under this picture (film/FilmStack.tsx), and the
   journey's light is their bulb: the drop rises to where the bulb hangs and is the lamp, the lamp's light opens
   the room, and later the same backwards. These pieces stand in for the mark's. */

/** The bulb's light as a round with a soft edge, which is what the drop is made into before it is given the
 *  bulb's own fall (config.journey.room.light): how far from the bulb's middle the light is down to half, and
 *  how soft the edge has to be for a round of that size to be nine tenths lit where the bulb's light is. Both
 *  in film widths. */
const [HALF, EDGE] = (() => {
  const { full, sigma, tail, knee } = R.light
  const lit = (r: number) => {
    const x = full * Math.exp((-r * r) / (2 * sigma * sigma)) + tail[0] * Math.exp(-r / tail[1])
    const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (1 - x)) / knee))
    return 1 + (x - 1) * h - knee * h * (1 - h)
  }
  const where = (level: number) => {
    let within = 0
    let beyond = 6 * sigma
    for (let i = 0; i < 40; i++) {
      const middle = (within + beyond) / 2
      if (lit(middle) > level) within = middle
      else beyond = middle
    }
    return within
  }
  const half = where(0.5)
  // (a smooth step is nine tenths lit 0.608 of its half-breadth inside its middle)
  return [half, (half - where(0.9)) / 0.608]
})()

/** What the page tells the picture about the room. */
const ROOM_UNIFORMS = /* glsl */ `// ---------------------------------------------------------------- the hero as a room
// the bulb of the film that is showing: where it hangs (as "a" counts, below) and how wide that film is drawn,
// in screen heights
uniform vec3 lamp;
// the box the films play in: its middle, half its width and half its height
uniform vec4 room;
// the drop's radius
uniform float drop;
// over how much of half the box's width the film gives way to the page at either side (none where the box
// runs from edge to edge of the screen)
uniform float roomSide;
// 1: the drop drawn as the films' lamp seen through their lens, out of focus and grainy (the address ?drop=lens)
uniform float lens;

`

/** The beats of the light and its shape: a drop, the lamp, the drop again, the gate. */
const ROOM_LIGHT = /* glsl */ `  // ---------------- the beats of the light: a drop, the lamp of the room, a drop again, the gate
  float arrive = ss( ${beat(TR.drop)}, s );
  // (the drop rises to where the bulb hangs and draws in to its size: it is the lamp)
  float hang = ss( ${beat(TR.morph)}, s );
  // How far the lamp's light reaches: all the way while a room stands open. Between two films it draws back
  // to the lamp and comes out again (in the dark between, the page puts the next film in the box and moves
  // the lamp to where that film's bulb hangs: timeline.ts).
  float reach = ss( ${beat(RT.open)}, s ) * ( 1. - ss( ${beat(RT.shut)}, s ) );
${RT.turns.map((turn) => `  reach *= 1. - ss( ${beat(turn.shut)}, s ) * ( 1. - ss( ${beat(turn.open)}, s ) );\n`).join('')}  // (the gathering has four parts: the lamp swells into the drop, the drop goes to the gate's place, it is
  // drawn down to the floor, its lower end is squared off into the gate's foot)
  float gather = clamp( ( s - ${f(TR.gather[0])} ) / ${f(TR.gather[1] - TR.gather[0])}, 0., 1. );
  float swell = ss( ${beat(R.swell)}, gather );
  float rise = ss( .32, .68, gather );
  float pour = ss( .6, .92, gather );
  float square = ss( .84, 1., gather );
  float stand = ss( ${beat(TR.stand)}, s );
  // the gate's outline: an arch, its shaft, cut off at the foot
  vec2 archAt = vec2( gateX, gate.y - gate.x );
  float gateD = max( length( vec2( a.x - gateX, max( a.y - archAt.y, 0. ) ) ) - gate.x, gate.z - a.y );

  // ---------------- the shape of light. A drop in the opening eye. It rises to the bulb's place and draws in
  // to the bulb's size; later it swells again, goes to the gate's place and pours down into the gate.
  // (before the hero, or after it)
  float early = step( s, ${f((TR.word[1] + TR.heroOut[0]) / 2)} );
  // How much it is the lamp (1), how much the drop (0). The drop is made into the lamp in two steps that run
  // into one another: its size and its edge go to the bulb's, the edge ever softer ("shaped"); then its fall
  // is the bulb's own (the lamp, below).
  float asLamp = mix( 1. - swell, ss( .15, 1., hang ), early );
  float shaped = ss( 0., .6, asLamp );
  float filmWide = max( lamp.z, .0001 );
  vec2 lightAt = mix( mix( lamp.xy, archAt, rise ), mix( vec2( 0., .5 ), lamp.xy, hang ), early );
  // (as a drop it is as large as the drop, and on its way to the gate as broad as the gate; as the lamp it
  // ends where the bulb's light is down to half)
  float radius = mix( mix( mix( drop, gate.x, rise ), drop * arrive, early ), filmWide * ${f(HALF)}, shaped );
  vec2 fromLight = a - lightAt;
  float lightAway = length( fromLight );
  // (the drop, drawn down by as much as it has poured: a pill)
  fromLight.y -= clamp( fromLight.y, -pour * max( archAt.y - gate.z - gate.x, 0. ), 0. );
  float shape = mix( length( fromLight ) - radius, gateD, square );
  float flatShown = step( .001, arrive );
  // (what the picture's later parts ask of the mark: here the light is the only shape, and there is no body)
  float markD = shape;
  float bodyShown = 0.;
`

/** The lamp: the drop, drawn as the films draw their bulb. */
const ROOM_LAMP = /* glsl */ `  // ---------------- the lamp. Until the drop pours it is one round of light, drawn here in place of the shape
  // above: crisp and with its glow on the air while it is the drop (the same picture as above); smaller and
  // ever softer as it is made into the lamp, its glow going; and at last with the bulb's own fall, as the
  // films have it (how much Neon at a distance from the bulb's middle: measured on the finished films). By
  // then the round and that fall are all but one, so nothing shows where the one takes over: the light on
  // the screen and the bulb in the film are one picture where they hand over to one another.
  if ( pour < .0001 ) {
    float edge = mix( 1.2 / res.y, filmWide * ${f(EDGE)}, shaped );
    vec3 light = cInk + cNeon * halo * flatShown * ( 1. - shaped );
    light = mix( light, cNeon, ( 1. - ss( -edge, edge, lightAway - radius ) ) * flatShown );
    float lampAway = lightAway / filmWide;
    float lampLight = ${f(R.light.full)} * exp( -lampAway * lampAway / ${f(2 * R.light.sigma ** 2)} ) + ${f(R.light.tail[0])} * exp( -lampAway / ${f(R.light.tail[1])} );
    // (never more than Neon, and rounded off where it comes to that)
    float under = clamp( .5 + .5 * ( 1. - lampLight ) / ${f(R.light.knee)}, 0., 1. );
    lampLight = mix( 1., lampLight, under ) - ${f(R.light.knee)} * under * ( 1. - under );
    result = mix( light, mix( cInk, cNeon, lampLight ), ss( .6, 1., asLamp ) * flatShown );
    // (The address ?drop=lens: the drop drawn as the films' lamp is seen through their lens while it is out of
    // focus. A light out of focus is a round a shade deeper inside than at its rim; and the films' grain and
    // flicker lie on it and on its glow, as on everything in them, at their 24 frames a second. The rim goes as
    // the drop comes into focus as the lamp; the grain stays, as the films have it; all of it goes as the drop
    // rises to the gate, which is as clean as the river. (Faint rings inside the round, as some lenses give,
    // were tried too: moving, they read as a target.))
    if ( lens > .5 ) {
      float frame = floor( time * 24. );
      float grain = hash( floor( gl_FragCoord.xy / 1.5 ) + frame * vec2( 7.13, 3.71 ) ) - .5;
      float flicker = .008 * sin( 6.2832 * frame / 5.3 ) + .005 * sin( 6.2832 * frame / 2.1 );
      vec3 span = cNeon - cInk;
      // (how much of this point is the drop's light: its place on the line from Ink to Neon)
      float lit = clamp( dot( result - cInk, span ) / dot( span, span ), 0., 1. );
      float r = lightAway / max( radius, 1e-4 );
      float defocus = 1. - shaped;
      float inner = 1. - defocus * .06 * ( 1. - ss( .72, .97, r ) );
      float filmic = flatShown * ( 1. - ss( 0., .7, rise ) );
      lit = lit * mix( 1., inner * ( 1. + flicker ), filmic ) + grain * .08 * lit * filmic;
      // (grain goes both ways: below Neon towards Ink, above it towards the hot Neon kept for highlights, so the
      // light is as bright as it was on the whole and only its surface is grained)
      result = mix( cInk + span * clamp( lit, 0., 1. ), cHot, clamp( ( lit - 1. ) * 3., 0., 1. ) );
    }
  }
  // (with the room wholly open the lamp is the film's own, and nothing of this one is drawn)
  result = mix( result, cInk, ss( .9, 1., reach ) );

`

/** The room: where the film under this picture shows through. */
const ROOM_THROUGH = /* glsl */ `  // ---------------- the room. The lamp's light reaches further and further, and the film, which lies under this
  // picture, shows where it reaches. The front of the light is soft by a share of how far it has got, so no
  // edge travels. With the light all the way out, the whole box is the film's.
  vec2 corner = abs( lamp.xy - room.xy ) + room.zw;
  float front = length( corner ) / ${f(1 - R.soft)} * 1.03 * pow( reach, ${f(R.ease)} );
  float through = ( 1. - ss( front * ${f(1 - R.soft)}, max( front, .0001 ), length( a - lamp.xy ) ) ) * ss( 0., .01, reach );
  // (Only inside the box. The box's upper and lower edges melt into the page: the box itself fades there.
  // Its sides do the same here: towards either side the film gives way to the page's Ink.)
  vec2 within = room.zw - abs( a - room.xy );
  through *= ss( -1.5 / res.y, room.z * roomSide, within.x ) * step( -1.5 / res.y, within.y );
  // From here on "result" is only this picture's share of the light at a point, and "seen" says how large that
  // share is: the rest is the film's.
  float seen = 1. - through;
  result *= seen;

`

/** The gate as the doorway of a stock exchange of our own (?gate=exchange): its pictures (exchange.ts). */
const EXCHANGE_UNIFORMS = /* glsl */ `// ---------------------------------------------------------------- the exchange
// its four pictures (exchange.ts), and how far they have come in (0 until the page has them)
uniform sampler2D exBase;
uniform sampler2D exDoor;
uniform sampler2D exGlow;
uniform sampler2D exSpace;
uniform float exchange;
// a light as the pictures keep it, back to itself
float exLight( float v ) { return ( exp2( v * ${f(Math.log2(1 + EX.encode))} ) - 1. ) / ${f(EX.encode)}; }

`

/** The exchange, in place of the guide's gate. Its moments are the picture's: as the picture would take over, the
 *  doors open (the doorway's light reaches out); as its river would arrive, the river pours: down the steps first,
 *  then over the street, where it is the guide's river as the page had it. */
const exchangeScene = (PT: Omit<typeof config.journey.picture, 'mix' | 'arrive' | 'out' | 'copy'> & { mix: readonly [number, number]; arrive: readonly [number, number] }) => {
  const span = PT.arrive[1] - PT.arrive[0]
  const open: [number, number] = [PT.mix[0], PT.mix[1] + span * 0.3]
  const steps: [number, number] = [PT.arrive[0] - span * 0.1, PT.arrive[0] + span * 0.25]
  const street: [number, number] = [PT.arrive[0] + span * 0.18, PT.arrive[1] + span * 0.05]
  // (the guide's picture: its doorway's foot, up from its bottom edge, in its heights; the CSS gives its doorway
  // 1.603 times its breadth of height, and the picture is as tall as the screen or 0.62512 of its width)
  const melFoot = PT.arch[0] + PT.arch[1] - 1.603 * 2 * PT.arch[1]
  // (how much broader the river is at the steps' foot than at their top; the guide's river's half breadth just
  // under its doorway, where it is half lit, in its picture's heights (measured: 294 of its 1536 rows across); and
  // how far under the steps' foot it opens out to that breadth, in the same heights)
  const SPREAD = 1.35
  const GUIDE_RIVER_HALF = 0.0957
  const OPEN = 0.08
  return /* glsl */ `  // ---------------- the exchange: the gate is the doorway of a stock exchange (exchange.ts). Its pictures are laid
  // by the gate (the doorway on the gate, at its size). First the doorway's light reaches out over the steps, the
  // columns and the wet street, and the building comes out of the night with it; then the river pours out of the
  // doorway, down the steps and away over the street. (Nothing of it is worked out before the doors begin to open:
  // till then it is not on the screen.)
  if ( exchange > .001 && s > ${f(open[0] - 0.003)} ) {
    // where a point of the screen lies in the pictures (across, and up from their bottom edge: 0 to 1)
    float exH = ( gate.y - gate.z ) / ${f(EX.doorway.top - EX.doorway.foot)};
    vec2 exAt = vec2( .5 + ( a.x - gateX ) / ( exH * ${f(EX.aspect)} ), ${f(EX.doorway.foot)} + ( a.y - gate.z ) / exH );
    float within = step( 0., exAt.x ) * step( exAt.x, 1. ) * step( 0., exAt.y ) * step( exAt.y, 1. );
    float exV = exAt.y;
    exAt.y = 1. - exAt.y;
    float stoneL = exLight( texture2D( exBase, exAt ).r ) * within;
    float doorL = exLight( texture2D( exDoor, exAt ).r ) * within;
    float glowL = exLight( texture2D( exGlow, exAt ).r ) * within;
    vec2 place = texture2D( exSpace, exAt ).rg;
    float along = mix( 1., place.r, within );
    float off = mix( 4., place.g * 4., within );
    // The doors open: the doorway's light reaches out from its foot (how far, in doorway half breadths), with a
    // soft front, and the night's stone comes up with it.
    float opened = ss( ${beat(open)}, s );
    float fromFoot = length( vec2( a.x - gateX, ( a.y - gate.z ) * 1.25 ) ) / gate.x;
    float spread = opened * 56.;
    float doorLit = 1. - ss( spread * .45, spread + .001, fromFoot );
    // (the night's stone is faint: the building is seen by the doorway's light, and the night only shows its outline)
    float night = ss( .15, 1., opened );
    vec3 scene = mix( cInk, vec3( .6, .61, .58 ), .36 * pow( clamp( stoneL * 2.4, 0., 1. ), .85 ) * night );
    // (the doorway's light on it: on the line from the stone to Neon, never paler; where it is faint, the stone
    // keeps its own grey)
    scene = mix( scene, cNeon, ss( .03, .72, 1. - exp( -doorL * 10. ) ) * doorLit );
    // The river, out of the doorway and down the steps along its course in the pictures (0 at the doorway).
    // Liquid light: full Neon along its middle, a shade deeper towards its margins, with bands that drift along it
    // as it flows; its glow on the air, and its light on the steps about it. Down the steps it spreads a little,
    // its edges clean, and each riser under it is a shade deeper than the treads, so it runs down the steps and
    // does not lie over them. At their foot the guide's river takes it on, as broad (below); only without the
    // guide's picture does this one run on over the street too.
    float front = mix( -.03, ${f(EX.alongSteps + 0.02)}, ss( ${beat(steps)}, s ) ) + ( 1. - picture ) * ${f(1.03 - EX.alongSteps - 0.02)} * ss( ${beat(street)}, s );
    // (once at the steps' foot it runs on a little under the guide's river, which covers its end)
    front = mix( front, ${f(EX.alongSteps + 0.14)}, ss( ${f(EX.alongSteps)}, ${f(EX.alongSteps + 0.02)}, front ) * picture );
    float poured = 1. - ss( front - .015, front, along );
    // (the steps' foot is a level line across the screen: under it the guide's river comes in over a few pixels,
    // and this one goes out a little further down, so the one is whole before the other goes. Its course turns
    // as it leaves the steps: under the guide's river it runs straight on instead, as broad as at the steps' foot,
    // since by its course its end slanted across the seam and bent away to the side)
    float melH = max( 1., .62512 * res.x / res.y );
    float stepsFoot = gate.z - ${f(EX.doorway.foot - EX.stepsFoot)} * exH;
    float handOver = ss( -.001 * melH, .009 * melH, stepsFoot - a.y );
    poured *= 1. - ss( .004 * melH, .014 * melH, stepsFoot - a.y ) * picture;
    off = mix( off, abs( a.x - gateX ) / ( ${f(EX.footBreadth)} * exH ), ss( -.0005 * melH, .0005 * melH, stepsFoot - a.y ) * picture );
    float offR = off / ( 1. + ${f(SPREAD - 1)} * ss( ${f(EX.alongPorch)}, ${f(EX.alongSteps)}, along ) * picture );
    float level = 1. - .34 * ss( .05, .95, offR );
    level -= .1 * ( .5 + .5 * sin( along * 70. - time * 1.3 + offR * 2.5 ) ) * ss( .2, .7, offR );
    // (which risers of the steps a point is on: they are level lines across the pictures)
    float pxV = .5 / ( exH * res.y );
    float riser = 0.;
    ${EX.risers.map(([top, foot]) => `riser += ss( ${f(foot)} - pxV, ${f(foot)} + pxV, exV ) - ss( ${f(top)} - pxV, ${f(top)} + pxV, exV );`).join('\n    ')}
    level -= .16 * riser;
    vec3 riverC = mix( cInk, cNeon, clamp( level, 0., 1. ) );
    // (its light is strong on the wet street about it, and faint on the building, which stays black and white)
    float onStreet = 1. - step( 3.95, off );
    float ownLight = mix( 1., 1. - ss( ${f(EX.alongSteps)}, ${f(EX.alongSteps + 0.05)}, along ), picture );
    scene = mix( scene, cNeon, ss( .06, .85, 1. - exp( -glowL * 4. ) ) * mix( .25, 1., onStreet ) * poured * ownLight );
    scene = mix( scene, cNeon, .22 * exp( -max( offR - .9, 0. ) * 2.2 ) * ( 1. - .4 * riser ) * poured );
    scene = mix( scene, riverC, ( 1. - ss( .8, .96, offR ) ) * poured );
    // The river as it was: the guide's painted river, laid at the size the page gave it, its doorway's foot at the
    // steps' foot (its doorway itself is the exchange's, up the steps, and is left out). It comes in from that
    // foot downward and ripples as it runs, as before. It begins as broad as the river coming down the steps, and
    // opens out to its own breadth as it comes onto the street, as water does at the foot of a flight of steps.
    if ( picture > .001 ) {
      float narrow = clamp( ${f(0.88 * SPREAD * EX.footBreadth)} * exH / ( ${f(GUIDE_RIVER_HALF)} * melH ), .2, 1. );
      float opening = mix( narrow, 1., ss( 0., ${f(OPEN)} * melH, stepsFoot - a.y ) );
      vec2 tex = vec2( .5 + ( a.x - gateX ) / ( melH * ${f(PT.size[0] / PT.size[1])} * opening ), ${f(melFoot)} + ( a.y - stepsFoot ) / melH );
      // (the guide's ripple, number for number: none at its foot, more and more down the river)
      float riverDepth = clamp( ( .48 - tex.y ) / .48, 0., 1. );
      float riverWeight = ss( 0., .65, riverDepth );
      float travel = riverDepth * 8.5 - time * .48;
      float meander = .048 * sin( travel ) + .022 * sin( riverDepth * 15. - time * .31 + 1.4 );
      float breathing = 1. + riverWeight * .065 * sin( riverDepth * 10. - time * .38 );
      tex.x = .5 + ( tex.x - .5 ) / breathing + meander * riverWeight;
      tex.y += .012 * sin( riverDepth * 12. - time * .48 ) * riverWeight;
      tex.x += .006 * sin( riverDepth * 24. - time * .85 ) * riverWeight;
      float over = abs( tex.x - .5 ) - ${f(0.5 - PT.margin)};
      if ( over > 0. ) tex.x = .5 + sign( tex.x - .5 ) * ( .5 - ${f(PT.margin)} * exp( -over / ${f(PT.margin)} ) );
      // (read through a small blur: the painting carries a grain of its own, which broke its edges into specks)
      vec2 grain = vec2( ${f(1.6 / PT.size[0])}, ${f(1.6 / PT.size[1])} );
      vec2 melAt = vec2( tex.x, 1. - tex.y );
      vec3 art = .25 * ( texture2D( portalTex, melAt + grain * vec2( .9, .4 ) ).rgb + texture2D( portalTex, melAt + grain * vec2( -.4, .9 ) ).rgb
        + texture2D( portalTex, melAt + grain * vec2( -.9, -.4 ) ).rgb + texture2D( portalTex, melAt + grain * vec2( .4, -.9 ) ).rgb );
      art *= step( 0., tex.y ) * step( tex.y, 1. );
      // (its front begins at its foot, wholly above it, and runs down: nothing of it shows before it pours)
      float revealFront = mix( ${f(melFoot + PT.feather)}, ${f(PT.front[1])}, ss( ${beat(street)}, s ) );
      float artReveal = ss( revealFront - ${f(PT.feather)}, revealFront + ${f(PT.feather)}, tex.y );
      float lightOf = clamp( ( dot( art, vec3( .3, .59, .11 ) ) * artReveal - ${f(PT.light[0])} ) / ${f(PT.light[1] - PT.light[0])}, 0., 1. );
      lightOf = pow( lightOf, ${f(PT.light[2])} );
      lightOf *= 1. - ${f(PT.tone[0])} * ss( ${f(PT.tone[1])}, ${f(PT.tone[2])}, art.b - art.r );
      // (only below its doorway's foot: it begins there, as the river coming down the steps ends)
      lightOf *= handOver;
      scene = mix( scene, cNeon, lightOf * picture );
    }
    // The gate stays the doorway's own light, crisp over the pictures, and glows on the air about it as the
    // films' bulb glows: a close bright rim and a broad soft fall, so the doorway is the building's light and not
    // laid on it. (No grain over the pictures: they are to be smooth.) The pictures take the screen over as the
    // doors begin to open.
    float gateIn = ( 1. - ss( -1.2 / res.y, 1.2 / res.y, gateD ) ) * square;
    float awayD = max( gateD, 0. ) / gate.x;
    float bloom = .42 * exp( -awayD / .16 ) + .14 * exp( -awayD / 1.1 );
    scene = mix( scene, cNeon, mix( halo, bloom, opened ) * ( 1. - gateIn ) );
    scene = mix( scene, result, gateIn );
    result = mix( result, scene, exchange * ss( ${f(open[0] - 0.003)}, ${f(open[0])}, s ) );
  }

`
}

const fragment = (room: boolean, exchange = false) => {
  // (what both heroes have in common reads its moments from the journey it is in: timing.ts)
  const when = room ? roomTiming : markTiming
  const L = { ...config.journey.lids, ...when.lids }
  const T = when.beats
  const PT = { ...config.journey.picture, ...when.picture }
  return /* glsl */ `
precision highp float;
uniform vec2 res;
uniform vec2 pointer;
uniform float pointerActive;
uniform float time;
uniform float progress;
uniform sampler2D typeTex;
uniform float typeReady;
uniform sampler2D markTex;
uniform float markReady;
// the body: its middle (x in screen heights from the middle of the screen, y up from the bottom) and half its width
uniform vec3 body;
// the gate: half its width, its top and its foot (screen heights, up from the bottom)
uniform vec3 gate;
// the current's course over the floor, point by point: how far to the side, how far from the gate, and how
// broad the piece that ends there is (timeline.ts works it out every frame)
uniform vec3 course[${MOST + 1}];
// which course that is: 1 the wave traced from the reference frame, 0 the first course (drawn as it was),
// and how many pieces it has
uniform float traced;
uniform float pieces;
// the gate's middle, across from the middle of the screen (screen heights)
uniform float gateX;
// whether one of the two currents above is drawn (1) or the guide's picture is (0); the picture, and how far
// it has come in (0 until the page has it)
uniform float flow;
uniform float picture;
uniform sampler2D portalTex;
uniform vec3 cInk;
uniform vec3 cNeon;
uniform vec3 cHot;
uniform vec3 cLime;
uniform vec3 cMoss;
uniform vec3 cDeep;

float ss( float a, float b, float v ) { return smoothstep( a, b, v ); }
mat2 turn( float angle ) { float c = cos( angle ), s = sin( angle ); return mat2( c, -s, s, c ); }
float hash( vec2 p ) { return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }
// two outlines run together (the lesser of two distances, rounded where they meet), and one cut by another
float joined( float a, float b, float k ) { float h = max( k - abs( a - b ), 0. ) / k; return min( a, b ) - h * h * k * .25; }
float cutBy( float a, float b, float k ) { return -joined( -a, -b, k ); }

// ---------------------------------------------------------------- tone
// The one scale every colour of the picture is taken from: Ink, deep, moss, lime, Neon, hot.
vec3 tone( float v ) {
  vec3 c = mix( cInk, cDeep, ss( 0., .2, v ) );
  c = mix( c, cMoss, ss( .16, .44, v ) );
  c = mix( c, cLime, ss( .42, .68, v ) );
  c = mix( c, cNeon, ss( .66, .88, v ) );
  return mix( c, cHot, ss( .9, 1., v ) );
}

${room ? ROOM_UNIFORMS : MARK_FUNCS}${exchange ? EXCHANGE_UNIFORMS : ''}// ---------------------------------------------------------------- the current
// (the error function, to three places and without an exponential: the light of a soft band over a length of it)
float erf_( float x ) {
  float ax = abs( x );
  float d = 1. + ax * ( .278393 + ax * ( .230389 + ax * ( .000972 + ax * .078108 ) ) );
  d *= d;
  float y = 1. - 1. / ( d * d );
  return x < 0. ? -y : y;
}

void main() {
  vec2 uv = gl_FragCoord.xy / res;
  float aspect = res.x / res.y;
  vec2 a = vec2( ( uv.x - .5 ) * aspect, uv.y );
  float s = progress;

  // ---------------- the lids: they close over the words, and part again
  float cover = ss( ${f(L.from)}, ${f(L.to)}, s ) * ( 1. - ss( ${beat(L.part)}, s ) );
  float bow = ${f(L.bow)} * pow( abs( uv.x - .5 ) * 2., ${f(L.bowPower)} );
  float aperture = mix( ${f(L.open)}, ${f(L.shut)}, cover ) - bow;
  float lid = ss( aperture - ${f(L.feather)}, aperture + ${f(L.feather)}, abs( uv.y - .5 ) ) * ss( ${beat(L.appear)}, s );
  vec3 lidColor = mix( cLime, cNeon, ss( .04, .5, abs( uv.y - .5 ) ) );

${room ? ROOM_LIGHT : MARK_LIGHT}  float riverIn = ss( ${f(T.river[0] - when.span(0.01))}, ${f(T.river[0] + when.span(0.015))}, s ) * flow;
  // its light on the air around it
  float outline = max( mix( markD, shape, flatShown ), 0. );
  // (the gate glows more than the mark did: a rim of the deeper green all round it. Where the guide's picture
  // is to take over, the gate comes to stand as the picture's doorway does: with a close glow and no haze)
  float tight = square * ( 1. - flow );
  float halo = exp( -pow( outline / mix( .028, gate.x * ${f(PT.rim[1])}, tight ), mix( 1., 1.5, tight ) ) ) * mix( mix( .21, .5, square ), ${f(PT.rim[0])}, tight )
    + exp( -outline / .16 ) * mix( .07, .1, square ) * ( 1. - tight );
  // (and, as the guide's doorway, its glow thins out towards its closed foot: none at the foot's corners)
  halo *= mix( 1., ss( gate.z, gate.z + gate.x * ${f(PT.rim[2])}, a.y ), tight );
  vec3 result = cInk + cNeon * halo * max( flatShown, bodyShown );
  if ( flatShown > .001 ) {
    // (once the current runs, the gate's lower half softens into it: its edge is as soft as the current's
    // by the time it reaches the floor)
    float melting = riverIn * ( 1. - ss( 0., .6, ( a.y - gate.z ) / max( gate.y - gate.z, .001 ) ) );
    float crisp = 1.2 / res.y * mix( 1., 2.2, square );
    float inside = 1. - ss( -crisp, crisp, shape );
    // (only its sides soften: its foot stays whole, under the current)
    float sides = length( vec2( a.x - gateX, max( a.y - archAt.y, 0. ) ) ) - gate.x;
    float soft = mix( crisp, gate.x * .3, melting );
    // (and its foot fades downward into the current, so no corner shows where the current has turned away)
    float fade = mix( crisp, gate.x * .7, riverIn );
    inside = mix( inside, ( 1. - ss( -soft, soft, sides ) ) * ss( gate.z - fade, gate.z + crisp, a.y ), step( .001, riverIn ) );
    // Neon. As the gate it is full Neon at the threshold and a shade deeper under the arch: the brand's own
    // mix with Ink, nothing paler than Neon. (Where the guide's picture is to take over, the fall is the
    // picture stage's own: see below.)
    float up = clamp( ( a.y - gate.z ) / max( gate.y - gate.z, .001 ), 0., 1. );
    vec3 door = mix( cInk, cNeon, 1. - mix( ${f(PT.crown[0])} * ss( ${f(PT.crown[1])}, ${f(PT.crown[2])}, up ), .12 * ss( .55, 1., up ), flow ) );
    result = mix( result, mix( cNeon, door, ss( .3, 1., pour ) ), inside * flatShown );
  }

${room ? ROOM_LAMP : ''}  // ---------------- the floor before the gate: the gate's light spills over it
  if ( stand > .001 && a.y < gate.z + .012 ) {
    // the floor: 1 away at the gate's foot, nearer and nearer down the screen
    float away = ${f(F.rise)} / max( gate.z + ${f(F.rise)} - a.y, .001 );
    float side = ( a.x - gateX ) * away;
    float run = 1. - away;
    // (the floor begins a hair above the gate's foot, so no seam shows between the two)
    float below = ss( -.0022, .0022, gate.z + .003 - a.y );
    // the gate's light spills over the floor before it: a fan, brightest at the threshold, that the current
    // then runs out of
    // (it is nothing on the gate's own line, so no edge runs along the floor)
    float fan = max( run, 0. );
    float spill = exp( -pow( side / ( gate.x * ( 1.6 + 7. * fan ) ), 2. ) ) * exp( -fan / .16 ) * ss( 0., .05, fan );
    // (only while the gate stands alone: once the current runs, the current is the light on the floor)
    result = mix( result, cNeon, spill * .2 * ( 1. - riverIn ) * stand * below * flow );
  }

  // ---------------- the current: out of the gate, and over the floor towards the viewer
  // (above the gate's foot it is only ever inside and close beside the gate)
  if ( riverIn > .001 && a.y < gate.y && ( a.y < gate.z + .05 || abs( a.x ) < gate.x * 3. ) ) {
    {
      // The current is one soft stroke of light along its course, which begins inside the gate (so the
      // gate's lower half and the current's first step are one thing). Every piece of the course lays a soft band
      // (brightest on its middle line, fading like a blur) and the bands add up. So the light is smooth
      // everywhere, two reaches that come close run into one another, and nothing here depends on which
      // point of the course is the nearest. "lit" is that sum: 1 on the middle of a single reach.
      // It arrives from the gate, along its own course.
      float arrived = mix( -.08, .86, ss( ${beat(T.river)}, s ) );
      float courseEnd = gate.z / ( gate.z + ${f(F.rise)} ) + .06;
      float lit = 0.;
      float along = 0.;
      float broad = 0.;
      for ( int i = 1; i <= ${MOST}; i++ ) {
        if ( float( i ) > pieces ) break;
        vec3 from = course[ i - 1 ];
        vec3 to = course[ i ];
        vec2 piece = to.xy - from.xy;
        float len = max( length( piece ), 1e-5 );
        vec2 way = piece / len;
        vec2 rel = a - from.xy;
        float run = dot( rel, way );
        // (The traced wave: a piece's breadth runs evenly from its one end to its other, so the next piece
        // takes up exactly where this one leaves off and no joint shows in the outline. The first course:
        // each piece has the breadth of its end, as it always had.)
        float wide = mix( to.z, mix( from.z, to.z, clamp( run / len, 0., 1. ) ), traced );
        float on = run / wide;
        float off = ( rel.x * way.y - rel.y * way.x ) / wide;
        // (a piece more than two and a half breadths off gives no light worth the sum)
        float past = on - len / wide;
        if ( abs( off ) < 2.6 && on > -2.6 && past < 2.6 ) {
          float light = exp( -3.2 * off * off ) * .5 * ( erf_( 1.789 * on ) - erf_( 1.789 * past ) );
          float where = courseEnd * ( float( i ) - 1.5 ) / ( pieces - 1. );
          // (the traced wave: the pieces about the gate arrive together, so the gate swells into its bell
          // on both sides at once; the current then runs on from there)
          where = mix( where, max( where - courseEnd * ${f(W.together)}, 0. ) / ${f(1 - W.together)}, traced );
          light *= 1. - ss( -.07, .07, where - arrived );
          lit += light;
          along += light * where;
          broad += light * wide;
        }
      }
      float share = 1. / max( lit, 1e-5 );
      along *= share;
      broad *= share;
      // Its two tones, both on the line between Ink and Neon: Neon, and the deeper green Neon makes with Ink.
      // Across the broad part of the current they lie in wide bands that run into one another (Neon in the
      // middle, a band a shade deeper either side, Neon again towards the margin) and drift a little as it
      // flows. Far off, where the current is thin, it is Neon alone. Along its margins the deeper green
      // thins into the dark.
      // (how far a point is from the current's middle, in breadths, read back from how lit it is)
      float out_ = sqrt( max( -log( clamp( lit, 1e-4, 1. ) ), 0. ) / 3.2 );
      float bands = ss( .05, .13, broad ) * ( .5 - .5 * cos( out_ * 7.4 + .5 * sin( along * 9. - time * .6 ) ) );
      float level = 1. - .2 * bands - .3 * ( 1. - ss( .0, .24, lit ) );
      float bodyOf = ss( .02, .44, lit );
      float glowOf = .42 * pow( clamp( lit, 0., 1. ), .45 );
      if ( traced > .5 ) {
        // The traced wave: the same two tones in the same order, laid by how far inside the current's outline
        // a point lies and no longer by its share of the breadth. The wave's three sweeps lie close together
        // and its last is as broad as the screen: an edge that grew softer with the breadth, as the first
        // course's does, would run them into one mass. So the outline is soft by a measure of its own (as
        // the reference's is) and the dark between two sweeps stays dark.
        float seenHalf = broad * ${f(W.seen)};
        float depth = lit > 1e-4 ? seenHalf - broad * out_ : -1.;
        float soft = clamp( seenHalf * ${f(W.soft[0])}, ${f(W.soft[1])}, ${f(W.soft[2])} );
        bodyOf = ss( -.5 * soft, 1.6 * soft, depth );
        glowOf = ${f(W.glow[0])} * exp( min( depth, 0. ) / ( soft * ${f(W.glow[1])} ) );
        // (the band: as in the first course, by how far from the middle line a point lies. That measure is
        // rounded off where it reaches nothing, on the middle line and where two sweeps lie over one
        // another, so the band ends without a crease; and it drifts more gently, so two sweeps that meet
        // do not show a seam)
        float aside = -log( clamp( lit, 1e-4, 4. ) ) / 3.2;
        aside = sqrt( .5 * ( aside + sqrt( aside * aside + .0009 ) ) );
        bands = ss( .05, .13, broad ) * ( .5 - .5 * cos( aside * 7.4 + .3 * sin( along * 4. - time * .6 ) ) );
        // (No band close about the gate. The gate opens out into the current there, and the two are to be
        // one light: with the current at full Neon around it, the gate's own fill, its straight sides and
        // its foot cannot be told from the current, and the gate has no foot once the light pours.)
        bands *= ss( ${f(W.plain[0])}, ${f(W.plain[1])}, length( vec2( a.x, a.y - gate.z ) ) / gate.x );
        level = 1. - .2 * bands - .3 * ( 1. - ss( -.5 * soft, 2.2 * soft, depth ) );
      }
      float amount = ( 1. - ( 1. - bodyOf ) * ( 1. - glowOf ) ) * riverIn;
      // (it only ever adds light: where it lies over the gate, the gate stays as bright as it was)
      result = mix( result, max( result, mix( cInk, cNeon, clamp( level, 0., 1. ) ) ), amount );
    }
  }

${exchange ? exchangeScene(PT) : `  // ---------------- the gate and the river, as the guide draws them: one painted picture. It is laid by the gate
  // (its doorway on the gate, at the gate's size), takes the screen over from the gate drawn above, and is
  // revealed from the gate downward. Below the gate it ripples, so the river runs. Its colours are read as
  // the brand's one light: Neon where the picture is light, Ink where it is dark.
  // (It comes out at the gate's foot: the picture takes over there first, and a little later the further
  // from the foot a point lies. Each point comes in as softly as the next, so the light shows under the
  // foot and spreads, and no edge travels. The guide lets the whole of it in at once.)
  float late = min( length( vec2( a.x - gateX, a.y - gate.z ) ) / gate.x * ${f(PT.out[0])}, ${f(PT.out[1])} );
  float taken = ss( ${f(PT.mix[0])} + late, ${f(PT.mix[1])} + late, s ) * picture;
  if ( taken > .001 ) {
    // where a point of the screen lies in the picture (across, and up from its bottom edge: 0 to 1)
    float artH = gate.x / ${f(PT.arch[1])};
    vec2 tex = vec2( .5 + ( a.x - gateX ) / ( artH * ${f(PT.size[0] / PT.size[1])} ), ${f(PT.arch[0] + PT.arch[1])} + ( a.y - gate.y ) / artH );
    // (the guide's ripple, number for number: none at the gate, more and more down the river)
    float riverDepth = clamp( ( .48 - tex.y ) / .48, 0., 1. );
    float riverWeight = ss( 0., .65, riverDepth );
    float travel = riverDepth * 8.5 - time * .48;
    float meander = .048 * sin( travel ) + .022 * sin( riverDepth * 15. - time * .31 + 1.4 );
    float breathing = 1. + riverWeight * .065 * sin( riverDepth * 10. - time * .38 );
    tex.x = .5 + ( tex.x - .5 ) / breathing + meander * riverWeight;
    tex.y += .012 * sin( riverDepth * 12. - time * .48 ) * riverWeight;
    tex.x += .006 * sin( riverDepth * 24. - time * .85 ) * riverWeight;
    // (On a wide screen the ripple reaches a little past the picture's sides at the bottom corners. The guide
    // shows black there, which leaves a notch in the river. Here the picture's last few hundredths are drawn
    // out instead, smoothly: the river runs on off the screen.)
    float over = abs( tex.x - .5 ) - ${f(0.5 - PT.margin)};
    if ( over > 0. ) tex.x = .5 + sign( tex.x - .5 ) * ( .5 - ${f(PT.margin)} * exp( -over / ${f(PT.margin)} ) );
    // (the picture is held as it comes, its top row first: it is read from the top down)
    vec3 art = texture2D( portalTex, vec2( tex.x, 1. - tex.y ) ).rgb;
    art *= step( 0., tex.y ) * step( tex.y, 1. );
    // (one soft front reveals the river, from the gate's foot downward: the guide's)
    float riverArrival = ss( ${beat(PT.arrive)}, s );
    float revealFront = mix( ${f(PT.front[0])}, ${f(PT.front[1])}, riverArrival );
    float artReveal = ss( revealFront - ${f(PT.feather)}, revealFront + ${f(PT.feather)}, tex.y );
    // How lit a point of the picture is: as light as the picture is there, in a straight line. The picture
    // is a soft thing: a pale body, and rims that fall away through deep vivid colours into black. Read
    // straight, its body is full Neon and its rims are a glow that falls away into Ink as softly as the
    // picture's own. (A steep reading was tried first. It made a flat shape with a hard edge of the pour:
    // it swallowed the gate, and it came in all at once where the guide's swells.)
    // (the front dims the picture before it is read, as the guide's does)
    float lightOf = clamp( ( dot( art, vec3( .3, .59, .11 ) ) * artReveal - ${f(PT.light[0])} ) / ${f(PT.light[1] - PT.light[0])}, 0., 1. );
    lightOf = pow( lightOf, ${f(PT.light[2])} );
    // (a second tone, a shade deeper, where the picture runs cool: the bands along the river's edges)
    lightOf *= 1. - ${f(PT.tone[0])} * ss( ${f(PT.tone[1])}, ${f(PT.tone[2])}, art.b - art.r );
    // The gate stays a gate. The guide's doorway is orange above and pale below, where its light pours out:
    // so the gate's crown is a shade deeper than its foot and the pour, in one even fall by height. (The
    // gate the shader draws before this has the same fall: nothing in the gate changes when the pour comes.
    // Read off the picture's own orange instead, the fall came out blotched.)
    lightOf *= 1. - ${f(PT.crown[0])} * ss( ${f(PT.crown[1])}, ${f(PT.crown[2])}, ( a.y - gate.z ) / max( gate.y - gate.z, .001 ) );
    result = mix( result, mix( cInk, cNeon, lightOf ), taken );
  }

`}${room ? ROOM_THROUGH : MARK_BODY}${room ? '' : MARK_POINTER}  // ---------------- the lids, over everything: Ink behind them until they have shut, the drop after
  vec3 behind = mix( cInk, result, step( ${f(L.part[0])}, s ) );
  result = mix( behind, lidColor, lid );
${room ? `  seen = mix( mix( 1., seen, step( ${f(L.part[0])}, s ) ), 1., lid );\n` : ''}
  // a breath of grain, so the long gradients cannot band
  result += ( hash( gl_FragCoord.xy ) - .5 ) * .012${room ? ' * seen' : ''};
  gl_FragColor = vec4( max( result, 0. ), ${room ? 'seen' : '1.'} );
}`
}

/** The journey with the mark as its hero. */
export const FRAGMENT = fragment(false)
/** The journey with the room as its hero: the films, and the lamp that is their bulb. */
export const FRAGMENT_ROOM = fragment(true)
/** The same, with the gate as the doorway of a stock exchange (?gate=exchange). */
export const FRAGMENT_ROOM_EXCHANGE = fragment(true, true)
