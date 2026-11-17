/**
 * The journey's picture: one shader over the whole screen, driven by how far the journey has been scrolled.
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
 * `progress` is the journey, 0 to 1. `time` is seconds, and stays 0 under reduced motion.
 * All coordinates: `uv` 0..1 with y up; `a` is the same in screen heights, x from the middle.
 */
import { config } from '../config'

/** A number as GLSL wants a float written. */
const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))
const L = config.journey.lids
const F = config.journey.floor
const B = config.journey.body
const T = config.journey.beats
const W = config.journey.wave
/** The most pieces a course has: the traced wave's. (The first course has fewer; its points beyond its last
 *  lie on its last and give nothing.) */
const MOST = Math.max(F.pieces, W.pieces)
/** A beat as the two ends of a smoothstep. */
const beat = (b: readonly [number, number]) => `${f(b[0])}, ${f(b[1])}`

export const VERTEX = `attribute vec2 corner;void main(){gl_Position=vec4(corner,0.,1.);}`

export const FRAGMENT = /* glsl */ `
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

// ---------------------------------------------------------------- the mark, as a body
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

// ---------------------------------------------------------------- the current
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

  // ---------------- the beats of the mark: a drop, the mark, a body, the mark again, a drop, the gate
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
  vec2 archAt = vec2( 0., gate.y - gate.x );
  float gateD = max( length( vec2( a.x, max( a.y - archAt.y, 0. ) ) ) - gate.x, gate.z - a.y );

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
  float riverIn = ss( ${f(T.river[0] - 0.01)}, ${f(T.river[0] + 0.015)}, s );
  // its light on the air around it
  float outline = max( mix( markD, shape, flatShown ), 0. );
  // (the gate glows more than the mark did: a rim of the deeper green all round it)
  float halo = exp( -outline / .028 ) * mix( .21, .5, square ) + exp( -outline / .16 ) * mix( .07, .1, square );
  vec3 result = cInk + cNeon * halo * max( flatShown, bodyShown );
  if ( flatShown > .001 ) {
    // (once the current runs, the gate's lower half softens into it: its edge is as soft as the current's
    // by the time it reaches the floor)
    float melting = riverIn * ( 1. - ss( 0., .6, ( a.y - gate.z ) / max( gate.y - gate.z, .001 ) ) );
    float crisp = 1.2 / res.y * mix( 1., 2.2, square );
    float inside = 1. - ss( -crisp, crisp, shape );
    // (only its sides soften: its foot stays whole, under the current)
    float sides = length( vec2( a.x, max( a.y - archAt.y, 0. ) ) ) - gate.x;
    float soft = mix( crisp, gate.x * .3, melting );
    // (and its foot fades downward into the current, so no corner shows where the current has turned away)
    float fade = mix( crisp, gate.x * .7, riverIn );
    inside = mix( inside, ( 1. - ss( -soft, soft, sides ) ) * ss( gate.z - fade, gate.z + crisp, a.y ), step( .001, riverIn ) );
    // Neon. As the gate it is full Neon at the threshold and a shade deeper under the arch: the brand's own
    // mix with Ink, nothing paler than Neon
    float up = clamp( ( a.y - gate.z ) / max( gate.y - gate.z, .001 ), 0., 1. );
    vec3 door = mix( cInk, cNeon, 1. - .12 * ss( .55, 1., up ) );
    result = mix( result, mix( cNeon, door, ss( .3, 1., pour ) ), inside * flatShown );
  }

  // ---------------- the floor before the gate: the gate's light spills over it
  if ( stand > .001 && a.y < gate.z + .012 ) {
    // the floor: 1 away at the gate's foot, nearer and nearer down the screen
    float away = ${f(F.rise)} / max( gate.z + ${f(F.rise)} - a.y, .001 );
    float side = a.x * away;
    float run = 1. - away;
    // (the floor begins a hair above the gate's foot, so no seam shows between the two)
    float below = ss( -.0022, .0022, gate.z + .003 - a.y );
    // the gate's light spills over the floor before it: a fan, brightest at the threshold, that the current
    // then runs out of
    // (it is nothing on the gate's own line, so no edge runs along the floor)
    float fan = max( run, 0. );
    float spill = exp( -pow( side / ( gate.x * ( 1.6 + 7. * fan ) ), 2. ) ) * exp( -fan / .16 ) * ss( 0., .05, fan );
    // (only while the gate stands alone: once the current runs, the current is the light on the floor)
    result = mix( result, cNeon, spill * .2 * ( 1. - riverIn ) * stand * below );
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

  // ---------------- the body: black liquid, Neon on its edges
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

  // ---------------- the dots: short runs of a fine matrix, only around the pointer
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
  // the letters, never in the letters themselves (the logo carries no effects)
  float wordIn = ss( ${beat(T.word)}, s );
  float wordShown = wordIn * ( 1. - ss( 0., .5, leave ) ) * typeReady;
  if ( wordShown > .001 ) {
    // (it comes into focus as it arrives)
    vec2 word = texture2D( typeTex, uv, ( 1. - wordIn ) * 4.5 ).rg;
    float spot = exp( -dot( ( uv - pointer ) * vec2( aspect, 1. ) / .26, ( uv - pointer ) * vec2( aspect, 1. ) / .26 ) ) * pointerActive;
    // with no pointer, a sheen passes over the letters now and then
    float passing = fract( time * .085 ) * 2.6 - .8;
    float sheen = exp( -pow( ( uv.x + ( uv.y - .5 ) * .35 - passing ) / .045, 2. ) ) * ( 1. - pointerActive ) * step( .001, time );
    float shine = clamp( spot + sheen * .85, 0., 1. );
    result += cNeon * word.g * ( .1 + .42 * shine ) * wordShown;
    result = mix( result, cNeon, clamp( word.r, 0., 1. ) * wordShown );
  }

  // ---------------- the lids, over everything: Ink behind them until they have shut, the drop after
  vec3 behind = mix( cInk, result, step( ${f(L.part[0])}, s ) );
  result = mix( behind, lidColor, lid );

  // a breath of grain, so the long gradients cannot band
  result += ( hash( gl_FragCoord.xy ) - .5 ) * .012;
  gl_FragColor = vec4( max( result, 0. ), 1. );
}`
