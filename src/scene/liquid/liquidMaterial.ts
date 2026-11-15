/**
 * The liquid: polished dark glass with Hyper Neon light, as in the brand's liquid artwork.
 *
 * Nothing here is a triangle mesh: every pixel ray-marches a field, so the surface is exact at any
 * zoom, with no facets, creases or polygon edges.
 *
 * Two forms of the same body:
 *  - The drop (at rest): one analytic sphere with a slow swell and a soft bulge under the cursor.
 *    It is mathematically smooth, which a mirror-like material needs.
 *  - The pieces (once the scroll begins): 77 soft ellipsoids fused by a smooth union. Pieces that
 *    touch run into one surface; pieces that drift apart neck and pinch off like droplets.
 * `uShell` blends one into the other, so the calm drop tenses into bands as the rings start to turn.
 *
 * Drawing the pieces takes two passes:
 *  1. Bins (binMaterial): every piece's sphere of influence is splatted into a 1/8-resolution float
 *     target as one bit, so each screen tile knows which pieces can touch it.
 *  2. Liquid (liquidMaterial): one full-screen triangle. A pixel reads its tile's bits, keeps the
 *     pieces its ray really passes, marches the field, writes true depth and shades it.
 * A piece's share of the union fades to exactly zero a fixed distance from its surface, so the field
 * at a point depends on that point alone: every pixel sees the same surface.
 *
 * Shading: a mirror reflection of an analytic studio (sky gradient, the breach behind the globe, soft
 * strip lights) weighted by Fresnel, the inner core light, the cursor light, and the scene's fog.
 */
import * as THREE from 'three'
import { config } from '../../config'
import { WORLD_SCALE } from '../../choreography/framing'
import { FADE_FROM_LOCAL, REACH_LOCAL } from './liquidField'

/** Screen tile size of the bins, in drawing-buffer pixels. */
export const TILE = 8
/** Each bin channel carries this many pieces as exact powers of two in a float. */
export const BITS = 24
/** A piece shapes the union fully up to FADE_FROM beyond its own surface, and not at all past REACH (world units). */
export const FADE_FROM = FADE_FROM_LOCAL * WORLD_SCALE
export const REACH = REACH_LOCAL * WORLD_SCALE

const binVert = /* glsl */ `
attribute vec4 aSupport;
attribute vec2 aBit;
uniform vec2 uPad;
uniform float uNear;
flat varying vec2 vBit;
void main() {
  vBit = aBit;
  gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
  float R = aSupport.w;
  if ( R <= 0.0 ) return;
  vec3 vc = ( viewMatrix * vec4( aSupport.xyz, 1.0 ) ).xyz;
  float zc = -vc.z;
  if ( zc + R <= uNear ) return; // wholly behind the camera
  vec2 lo = vec2( -1.0 );
  vec2 hi = vec2( 1.0 );
  if ( zc - R > uNear ) {
    // conservative screen bounds of the sphere: its box, projected at whichever depth pushes it further out
    float zf = zc - R;
    float zb = zc + R;
    vec2 a = vc.xy - R;
    vec2 b = vc.xy + R;
    vec2 P = vec2( projectionMatrix[ 0 ][ 0 ], projectionMatrix[ 1 ][ 1 ] );
    lo = P * vec2( a.x < 0.0 ? a.x / zf : a.x / zb, a.y < 0.0 ? a.y / zf : a.y / zb ) - uPad;
    hi = P * vec2( b.x > 0.0 ? b.x / zf : b.x / zb, b.y > 0.0 ? b.y / zf : b.y / zb ) + uPad;
  }
  gl_Position = vec4( mix( lo, hi, position.xy * 0.5 + 0.5 ), 0.0, 1.0 );
}`

const binFrag = /* glsl */ `
flat varying vec2 vBit;
void main() {
  float c = vBit.x;
  float v = vBit.y;
  gl_FragColor = vec4( c < 0.5 ? v : 0.0, ( c > 0.5 && c < 1.5 ) ? v : 0.0, ( c > 1.5 && c < 2.5 ) ? v : 0.0, c > 2.5 ? v : 0.0 );
}`

const vert = /* glsl */ `
uniform mat4 uInvViewProj;
varying vec3 vFar;
void main() {
  vec4 f = uInvViewProj * vec4( position.xy, 1.0, 1.0 );
  vFar = f.xyz / f.w;
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`

const frag = /* glsl */ `
#define MAXP 24
#define TILE ${TILE}
#define BITS ${BITS}
#define NCARD 4
uniform sampler2D uData;
uniform sampler2D uBins;
uniform float uUseBins;
uniform int uCount;
uniform float uK;
uniform float uD0;
uniform float uD1;
uniform mat4 uViewProj;
// the resting drop
uniform float uShell;
uniform vec3 uGlobe;
uniform vec4 uGlobeQ;
uniform float uShellR;
uniform float uShellPad;
uniform vec3 uSlosh;
uniform vec4 uBump;
uniform vec2 uBump2;
// material and light
uniform float uF0;
uniform vec3 uBody;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uGround;
uniform vec3 uGlow;
uniform vec3 uGlowDir;
uniform vec3 uGlowLobes;
uniform vec3 uGlowPowers;
uniform float uGlowStrength;
uniform float uBreachGain;
uniform vec3 uVoidTop;
uniform vec3 uVoidBottom;
uniform float uFade;
uniform vec3 uCardDir[ NCARD ];
uniform vec3 uCardU[ NCARD ];
uniform vec3 uCardV[ NCARD ];
uniform vec3 uCardCol[ NCARD ];
uniform vec3 uCardShape[ NCARD ];
uniform float uFogAmount;
uniform vec3 uCorePos;
uniform float uFill;
uniform int uSteps;
uniform vec3 uNeon;
uniform vec3 uCoreColor;
uniform float uCoreIntensity;
uniform float uCoreAlbedo;
uniform float uCoreShininess;
uniform vec4 uCursor;
uniform vec3 uCursorColor;
uniform float uCursorIntensity;
uniform vec4 uHover;
uniform vec3 uHoverColor;
uniform float uInner;
uniform float uInnerR;
uniform float uAurora;
uniform vec3 uAuroraColor;
uniform float uOcclusion;
uniform vec3 fogColor;
uniform float fogDensity;
uniform vec3 uHeightFog;
uniform vec3 uFarFog;

varying vec3 vFar;

// The pieces this pixel's ray passes: for each, only its index and where the ray enters and leaves its
// sphere of influence. Everything else about a piece is read from the data texture when it is needed.
// Keep this small on purpose: a pixel shader that carries large tables is slow for every pixel on screen,
// whether or not that pixel has any liquid (the Direct3D backend spills them to memory).
int gI[ MAXP ];
float gT0[ MAXP ];
float gT1[ MAXP ];
int gN;
vec3 gRayO;
vec3 gRayD;

vec3 qrot( vec4 q, vec3 v ) { return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v ); }

// data rows: 0 = centre + radius of the sphere of influence (0 when the piece is gone), 1 = quaternion,
// 2 = half-sizes
void addPiece( int i, vec3 ro, vec3 rd ) {
  if ( gN >= MAXP ) return;
  vec4 a = texelFetch( uData, ivec2( i, 0 ), 0 );
  // does this ray pass through the piece's sphere of influence, and where?
  vec3 oc = ro - a.xyz;
  float bb = dot( oc, rd );
  float h = bb * bb - ( dot( oc, oc ) - a.w * a.w );
  if ( h <= 0.0 ) return;
  h = sqrt( h );
  float t1 = -bb + h;
  if ( t1 <= 0.0 ) return;
  gI[ gN ] = i;
  gT0[ gN ] = max( -bb - h, 0.0 );
  gT1[ gN ] = t1;
  gN++;
}

// distance to an ellipsoid (first-order exact at the surface, which is all a sphere tracer needs)
float sdEllipsoid( vec3 p, vec3 r ) {
  float k0 = length( p / r );
  float k1 = length( p / ( r * r ) );
  return k0 * ( k0 - 1.0 ) / max( k1, 1e-6 );
}

// a piece's share of the union: .x fades to exactly zero once the point is uD1 away from the piece's
// surface (so the liquid at a point depends on that point alone); .y is the raw share
vec2 shares( vec3 pl, vec3 r ) {
  float d = sdEllipsoid( pl, r );
  float e = exp( -uK * d );
  return vec2( e * ( 1.0 - smoothstep( uD0, uD1, d ) ), e );
}

// the pieces along the view ray: .x = distance to their union, .y = a true lower bound on that distance
// (the raw union, safe to step by), .z = where the next piece's reach begins
vec3 piecesT( float t ) {
  float acc = 0.0;
  float raw = 0.0;
  float next = 1e9;
  vec3 p = gRayO + t * gRayD;
  for ( int i = 0; i < gN; i++ ) {
    if ( t < gT0[ i ] ) { next = min( next, gT0[ i ] ); continue; }
    if ( t > gT1[ i ] ) continue;
    int k = gI[ i ];
    vec4 q = texelFetch( uData, ivec2( k, 1 ), 0 );
    vec2 s = shares( qrot( vec4( -q.xyz, q.w ), p - texelFetch( uData, ivec2( k, 0 ), 0 ).xyz ), texelFetch( uData, ivec2( k, 2 ), 0 ).xyz );
    acc += s.x;
    raw += s.y;
  }
  return vec3( acc > 1e-7 ? -log( acc ) / uK : 1e9, raw > 1e-12 ? -log( raw ) / uK : 1e9, next );
}

// the pieces at any world point (normals, occlusion)
float piecesW( vec3 p ) {
  float acc = 0.0;
  for ( int i = 0; i < gN; i++ ) {
    int k = gI[ i ];
    vec4 a = texelFetch( uData, ivec2( k, 0 ), 0 );
    vec3 d = p - a.xyz;
    if ( dot( d, d ) >= a.w * a.w ) continue;
    vec4 q = texelFetch( uData, ivec2( k, 1 ), 0 );
    acc += shares( qrot( vec4( -q.xyz, q.w ), d ), texelFetch( uData, ivec2( k, 2 ), 0 ).xyz ).x;
  }
  return acc > 1e-7 ? -log( acc ) / uK : 1e9;
}

// the resting drop: a sphere whose radius swells slowly and rises under the cursor
float dropRadius( vec3 dir ) {
  vec3 dl = qrot( vec4( -uGlobeQ.xyz, uGlobeQ.w ), dir );
  float a = dot( dl, vec3( 1.7, 1.1, 0.8 ) ) * uSlosh.y;
  float b = dot( dl, vec3( -0.9, 1.6, 1.3 ) ) * uSlosh.y;
  float c = dot( dl, vec3( 0.4, -1.2, 1.5 ) ) * uSlosh.y;
  float t = uSlosh.z;
  float s = 0.5 * sin( 2.0 * a + t ) + 0.3 * sin( 2.7 * b - 0.71 * t + 1.7 ) + 0.2 * sin( 3.4 * c + 1.3 * t + 4.1 );
  // under the cursor the liquid rises, and a wider, shallow trough forms around the rise
  float ang = acos( clamp( dot( dir, uBump.xyz ), -1.0, 1.0 ) );
  float a2 = ang * ang;
  float bump = uBump.w * exp( -a2 / uBump2.x ) - uBump2.y * exp( -a2 / ( uBump2.x * 5.0 ) );
  return uShellR + uSlosh.x * s + bump;
}
float dropW( vec3 p ) {
  vec3 d = p - uGlobe;
  float r = length( d );
  return r - dropRadius( d / max( r, 1e-4 ) );
}

// the liquid at any world point: the drop, the pieces, or the blend while one becomes the other
float liquidW( vec3 p ) {
  if ( uShell >= 1.0 ) return dropW( p );
  float u = piecesW( p );
  if ( uShell <= 0.0 ) return u;
  return mix( dropW( p ), min( u, 1e4 ), 1.0 - uShell );
}

vec3 liquidNormal( vec3 p, float e ) {
  const vec2 k = vec2( 1.0, -1.0 );
  return normalize(
    k.xyy * liquidW( p + k.xyy * e ) + k.yyx * liquidW( p + k.yyx * e ) +
    k.yxy * liquidW( p + k.yxy * e ) + k.xxx * liquidW( p + k.xxx * e ) );
}

// a soft rounded strip light in the studio, seen in direction d
float card( vec3 d, int i ) {
  float z = dot( d, uCardDir[ i ] );
  if ( z <= 0.02 ) return 0.0;
  vec2 q = abs( vec2( dot( d, uCardU[ i ] ), dot( d, uCardV[ i ] ) ) / z ) - uCardShape[ i ].xy;
  float sd = length( max( q, 0.0 ) ) + min( max( q.x, q.y ), 0.0 );
  float s = uCardShape[ i ].z;
  return ( 1.0 - smoothstep( -s, s, sd ) ) * smoothstep( 0.02, 0.3, z );
}

// what the liquid reflects: the same sky the valley sits under, plus the studio lights
vec3 envColor( vec3 d ) {
  float h = d.y;
  vec3 col = mix( uHorizon, uZenith, smoothstep( -0.02, 0.75, h ) );
  col = mix( col, uGround, smoothstep( 0.02, -0.32, h ) );
  // the breach of light behind the globe: at grazing angles the surface mirrors it, which is the neon rim
  float g = max( dot( d, uGlowDir ), 0.0 );
  col += uGlow * ( pow( g, uGlowPowers.x ) * uGlowLobes.x + pow( g, uGlowPowers.y ) * uGlowLobes.y + pow( g, uGlowPowers.z ) * uGlowLobes.z ) * uGlowStrength * uBreachGain;

  // the final void: near-black, with the northern lights low behind
  vec3 voidCol = mix( uVoidBottom, uVoidTop, smoothstep( -0.25, 0.7, h ) );
  float band = smoothstep( 0.02, 0.22, h ) * ( 1.0 - smoothstep( 0.3, 0.85, h ) ) * smoothstep( 0.1, -0.5, d.z );
  voidCol += uAuroraColor * band * uAurora;
  col = mix( col, voidCol, uFade );

  for ( int i = 0; i < NCARD; i++ ) col += uCardCol[ i ] * card( d, i );
  return col;
}

float heightFog( vec3 camPos, vec3 wp ) {
  float a = uHeightFog.x;
  float b = uHeightFog.y;
  vec3 ray = wp - camPos;
  float L = length( ray );
  float y0 = camPos.y - uHeightFog.z;
  float dy = ray.y;
  float e0 = exp( -b * y0 );
  float integral = abs( dy ) < 1e-3 ? a * L * e0 : a * L * ( e0 - exp( -b * ( y0 + dy ) ) ) / ( b * dy );
  return 1.0 - exp( -max( integral, 0.0 ) );
}

// a point light on polished glass: a soft inner glow plus a hot glint, strongest at grazing angles
vec3 pointLight( vec3 p, vec3 n, vec3 v, vec3 pos, vec3 color, float intensity, float albedo, float shininess ) {
  vec3 L = pos - p;
  float dl = max( length( L ), 1.0 );
  L /= dl;
  float nl = max( dot( n, L ), 0.0 );
  if ( nl <= 0.0 ) return vec3( 0.0 );
  vec3 hv = normalize( L + v );
  float nh = max( dot( n, hv ), 0.0 );
  float fl = uF0 + ( 1.0 - uF0 ) * pow( 1.0 - max( dot( v, hv ), 0.0 ), 5.0 );
  float spec = fl * pow( nh, shininess ) * ( shininess + 8.0 ) / 25.13;
  return color * ( intensity / ( dl * dl ) ) * nl * ( albedo + spec );
}

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize( vFar - ro );
  gRayO = ro;
  gRayD = rd;

  // where the ray crosses the space the resting drop can occupy
  float tS0 = 1e9;
  float tS1 = -1.0;
  if ( uShell > 0.0 ) {
    vec3 oc = ro - uGlobe;
    float bb = dot( oc, rd );
    float rr = uShellR + uShellPad;
    float h = bb * bb - ( dot( oc, oc ) - rr * rr );
    if ( h > 0.0 ) {
      h = sqrt( h );
      if ( -bb + h > 0.0 ) { tS0 = max( -bb - h, 0.0 ); tS1 = -bb + h; }
    }
  }

  // which pieces can touch this pixel?
  gN = 0;
  if ( uShell < 1.0 ) {
    // The two ways to find the pieces are chosen when the shader is built, never by a uniform: the fallback's
    // fixed loop would otherwise be unrolled into the shader and run for every pixel of every frame.
#ifdef USE_BINS
    {
      vec4 m = texelFetch( uBins, ivec2( gl_FragCoord.xy ) / TILE, 0 );
      // Walk only the bits that are set. The loop must end on the data, not on a constant: a fixed-count
      // loop with a test inside is unrolled and flattened by the Direct3D compiler behind WebGL on Windows,
      // and then every pixel on screen, empty sky included, pays for all 96 possible pieces.
      for ( int c = 0; c < 4; c++ ) {
        // the sums are exact integers; adding a rounding half here would corrupt values past 2^23
        uint bits = uint( m[ c ] );
        while ( bits != 0u ) {
          uint low = bits & ( ~bits + 1u );
          addPiece( c * BITS + int( log2( float( low ) ) + 0.5 ), ro, rd );
          bits ^= low;
        }
      }
    }
#else
    for ( int i = 0; i < 96; i++ ) {
      if ( i >= uCount ) break;
      addPiece( i, ro, rd );
    }
#endif
  }
  // (discard does not end the shader under Direct3D, so leave explicitly)
  if ( gN == 0 && tS1 < 0.0 ) { discard; return; }

  float t = tS0;
  float tEnd = tS1;
  for ( int i = 0; i < gN; i++ ) {
    t = min( t, gT0[ i ] );
    tEnd = max( tEnd, gT1[ i ] );
  }

  // march: step by a true lower bound on the distance, never leaping past the start of a new piece's reach
  float au = 1.0 - uShell;
  bool hit = false;
  // (the step limit is a uniform on purpose: a constant one lets the Direct3D compiler unroll all 128 steps
  // into every pixel, which is then paid even where there is no liquid at all)
  for ( int s = 0; s < uSteps; s++ ) {
    vec3 f = gN > 0 ? piecesT( t ) : vec3( 1e9 );
    float fx = f.x;
    float fs = f.y;
    if ( uShell > 0.0 ) {
      float fd = dropW( ro + rd * t );
      if ( uShell >= 1.0 ) { fx = fd; fs = fd; }
      else { fx = mix( fd, min( f.x, 1e4 ), au ); fs = mix( fd, min( f.y, 1e4 ), au ); }
    }
    if ( fx < 0.00035 * t ) { hit = true; break; }
    // creep through the thin band where the bound and the surface differ
    // The smallest step grows with the step count. A ray that skims a surface would otherwise crawl to the
    // step limit in hundredths of a unit; those few rays used to cost as much as all the others together.
    float stepLen = fs < 5e3 ? max( fs * 0.86, 0.03 + 0.008 * float( s ) ) : 1e9;
    t += min( stepLen, f.z - t + 0.05 );
    if ( t > tEnd ) break;
  }
  if ( !hit ) { discard; return; }

  vec3 p = ro + rd * t;
  vec3 n = liquidNormal( p, max( 0.0008 * t, 0.015 ) );
  vec3 v = -rd;
  float nv = clamp( dot( n, v ), 0.0, 1.0 );

  // occlusion: creases between bands and between droplets hold less light
  float occ = 0.0;
  float sc = 1.0;
  for ( int i = 1; i <= 3; i++ ) {
    float hh = float( i ) * 1.6;
    occ += max( hh - liquidW( p + n * hh ), 0.0 ) * sc;
    sc *= 0.55;
  }
  float ao = clamp( 1.0 - uOcclusion * occ * 0.32, 0.0, 1.0 );

  float fres = uF0 + ( 1.0 - uF0 ) * pow( 1.0 - nv, 5.0 );
  vec3 col = uBody * ( 0.3 + 0.7 * ao );
  col += envColor( reflect( rd, n ) ) * fres * mix( 1.0, ao, 0.75 );

  // the core inside the globe
  if ( uCoreIntensity > 0.0 )
    col += pointLight( p, n, v, uCorePos, uCoreColor, uCoreIntensity, uCoreAlbedo, uCoreShininess ) * mix( 1.0, ao, 0.5 );
  // the core seen through the dark glass, before the globe opens: brightest where the view ray
  // passes closest to it
  if ( uInner > 0.0 ) {
    vec3 toCore = uCorePos - ro;
    vec3 off = toCore - rd * dot( toCore, rd );
    col += uCoreColor * uInner * exp( -dot( off, off ) / ( uInnerR * uInnerR ) ) * ( 0.4 + 0.6 * nv );
  }
  // the light that rides with the cursor over the resting drop
  if ( uHover.w > 0.001 )
    col += pointLight( p, n, v, uHover.xyz, uHoverColor, uHover.w, 0.0, 80.0 );
  // the cursor light of the final section
  if ( uCursor.w > 0.001 )
    col += pointLight( p, n, v, uCursor.xyz, uCursorColor, uCursorIntensity * uCursor.w, 0.02, 120.0 );

  // the scene's air: distance fog, height fog and the far haze, exactly as on the valley
  vec4 clip = uViewProj * vec4( p, 1.0 );
  float fd = clip.w;
  float fogFactor = 1.0 - exp( -fogDensity * fogDensity * fd * fd );
  float kH = heightFog( ro, p );
  float kFar = smoothstep( uFarFog.x, uFarFog.y, fd ) * uFarFog.z;
  fogFactor = 1.0 - ( 1.0 - fogFactor ) * ( 1.0 - kH ) * ( 1.0 - kFar );
  col = mix( col, fogColor, fogFactor * uFogAmount );

  // the last drop gathers light: neon closes in from its rim until the whole drop is lit (state/mark.ts)
  if ( uFill > 0.0 ) {
    float rim = sqrt( max( 0.0, 1.0 - nv * nv ) );
    float edge = 1.0 - uFill * 1.1;
    col = mix( col, uNeon, smoothstep( edge - 0.06, edge + 0.04, rim ) * smoothstep( 0.0, 0.1, uFill ) );
  }

  // never let a NaN/Inf pixel reach bloom (one bad pixel would flash the whole frame)
  if ( any( isnan( col ) ) || any( isinf( col ) ) ) col = vec3( 0.0 );
  gl_FragColor = vec4( max( col, 0.0 ), 1.0 );
  gl_FragDepth = clip.z / clip.w * 0.5 + 0.5;
}`

function cardBasis(dir: readonly number[]) {
  const w = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize()
  const up = Math.abs(w.y) > 0.92 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)
  const u = new THREE.Vector3().crossVectors(up, w).normalize()
  const v = new THREE.Vector3().crossVectors(w, u).normalize()
  return { w, u, v }
}

export function createBinMaterial() {
  const uniforms = {
    uPad: { value: new THREE.Vector2() },
    uNear: { value: config.camera.near as number },
  }
  const material = new THREE.ShaderMaterial({
    vertexShader: binVert,
    fragmentShader: binFrag,
    uniforms,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    // every piece adds its own bit: exact in a float target
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
    toneMapped: false,
  })
  return { material, uniforms }
}

export function createLiquidMaterial() {
  const A = config.atmosphere
  const S = config.studio
  const L = config.lighting
  const Q = config.liquid
  const M = config.mouse
  const bases = S.cards.map((c) => cardBasis(c.dir))
  const uniforms = {
    uData: { value: null as THREE.Texture | null },
    uBins: { value: null as THREE.Texture | null },
    uUseBins: { value: 1 },
    uCount: { value: 0 },
    // world units: the field is evaluated in world space
    uK: { value: (Q.sharpness / WORLD_SCALE) as number },
    uD0: { value: FADE_FROM },
    uD1: { value: REACH },
    uViewProj: { value: new THREE.Matrix4() },
    uInvViewProj: { value: new THREE.Matrix4() },
    uShell: { value: 1 },
    uGlobe: { value: new THREE.Vector3() },
    uGlobeQ: { value: new THREE.Vector4(0, 0, 0, 1) },
    uShellR: { value: (config.sphere.radius + Q.thickness) * WORLD_SCALE },
    // the furthest the drop's surface can move: the swell plus the rise under the cursor
    uShellPad: { value: (Q.slosh.amplitude + M.strength + 0.5) * WORLD_SCALE },
    uSlosh: { value: new THREE.Vector3(Q.slosh.amplitude * WORLD_SCALE, Q.slosh.frequency, 0) },
    uBump: { value: new THREE.Vector4(0, 0, 1, 0) },
    uBump2: { value: new THREE.Vector2(M.radius * M.radius, 0) },
    uF0: { value: S.f0 as number },
    uBody: { value: new THREE.Color(S.body) },
    uHorizon: { value: new THREE.Color(A.fogColor) },
    uZenith: { value: new THREE.Color(A.skyZenith) },
    uGround: { value: new THREE.Color(A.voidColor) },
    uGlow: { value: new THREE.Color(A.skyGlow) },
    uGlowDir: { value: new THREE.Vector3(0, 0.1, -1).normalize() },
    uGlowLobes: { value: new THREE.Vector3(...A.glowLobes) },
    uGlowPowers: { value: new THREE.Vector3(...A.glowPowers) },
    uGlowStrength: { value: 1 },
    uBreachGain: { value: S.breachGain as number },
    uVoidTop: { value: new THREE.Color(A.voidTop) },
    uVoidBottom: { value: new THREE.Color(A.voidColor) },
    uFade: { value: 0 },
    uCardDir: { value: bases.map((b) => b.w) },
    uCardU: { value: bases.map((b) => b.u) },
    uCardV: { value: bases.map((b) => b.v) },
    // set every frame: the studio dims a little in the void, and the final key comes up there
    uCardCol: { value: S.cards.map(() => new THREE.Color(0, 0, 0)) },
    uCardShape: { value: S.cards.map((c) => new THREE.Vector3(c.half[0], c.half[1], c.soft)) },
    uFogAmount: { value: S.fog as number },
    uCorePos: { value: new THREE.Vector3() },
    uFill: { value: 0 },
    uSteps: { value: 80 },
    uNeon: { value: new THREE.Color(config.mark.color).multiplyScalar(config.mark.gain) },
    uCoreColor: { value: new THREE.Color(L.core.color) },
    uCoreIntensity: { value: 0 },
    uCoreAlbedo: { value: S.coreAlbedo as number },
    uCoreShininess: { value: S.coreShininess as number },
    uCursor: { value: new THREE.Vector4() },
    uCursorColor: { value: new THREE.Color(config.cursorLight.color) },
    uCursorIntensity: { value: config.cursorLight.intensity as number },
    uHover: { value: new THREE.Vector4() },
    uHoverColor: { value: new THREE.Color(M.lightColor) },
    uInner: { value: 0 },
    uInnerR: { value: 1 },
    uAurora: { value: 0 },
    uAuroraColor: { value: new THREE.Color(config.aurora.low) },
    uOcclusion: { value: S.occlusion as number },
    fogColor: { value: new THREE.Color(A.fogColor) },
    fogDensity: { value: A.fogDensity as number },
    uHeightFog: { value: new THREE.Vector3(A.heightFog.density, A.heightFog.falloff, A.heightFog.base) },
    uFarFog: { value: new THREE.Vector3(A.farFog.start, A.farFog.end, A.farFog.max) },
  }
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms,
    // tile bins by default; the globe removes this where exact float blending is missing
    defines: { USE_BINS: '' },
    toneMapped: false,
  })
  /** Each card's colour at full strength (linear), and whether it belongs to the closing section. */
  const cards = S.cards.map((c) => ({ color: new THREE.Color(c.color).multiplyScalar(c.intensity), final: c.final === true }))
  return { material, uniforms, cards }
}
