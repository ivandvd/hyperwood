/**
 * Shared rock/snow material for every mountain in the scene (procedural valley + foreground massifs),
 * so they all sit in one palette and one light: slope/altitude snow, strata, fragment micro relief,
 * optional erosion detail texture, and the dissolve into the final void.
 */
import * as THREE from 'three'
import { config } from '../../config'
import { glslNoise } from '../shaders/noise.glsl'

export interface RockMaterialOptions {
  /** Greyscale erosion/detail map (planar UV). */
  detailMap?: THREE.Texture
  /** How strongly the detail map is overlaid onto the palette (0..1, overlay blend). */
  detailStrength?: number
  /** World-space scale of the procedural micro relief. */
  reliefScale?: number
  /** Strength of the micro relief. */
  relief?: number
  /** Altitude band where snow can settle (world Y). */
  snowLine?: [number, number]
  key: string
}

export function createRockMaterial(opts: RockMaterialOptions) {
  const A = config.atmosphere
  const uniforms = {
    uFade: { value: 0 },
    uVoid: { value: new THREE.Color(A.voidColor) },
    uRockA: { value: new THREE.Color(A.rock.dark) },
    uRockB: { value: new THREE.Color(A.rock.light) },
    uSnow: { value: new THREE.Color(A.rock.snow) },
    uDetail: { value: opts.detailMap ?? null },
    uDetailStrength: { value: opts.detailStrength ?? 0.85 },
  }
  const snow = opts.snowLine ?? [-40, 25]
  const relief = (opts.relief ?? 2.2).toFixed(3)
  const reliefScale = (opts.reliefScale ?? 0.09).toFixed(4)
  const useDetail = !!opts.detailMap

  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, metalness: 0, envMapIntensity: 0.35 })
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vTWorldPos;
varying vec3 vTWorldNormal;
${useDetail ? 'attribute vec2 aRockUv;\nvarying vec2 vTUv;' : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vTWorldPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
vTWorldNormal = normalize( mat3( modelMatrix ) * objectNormal );
${useDetail ? 'vTUv = aRockUv;' : ''}`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uFade;
uniform vec3 uVoid;
uniform vec3 uRockA;
uniform vec3 uRockB;
uniform vec3 uSnow;
uniform sampler2D uDetail;
uniform float uDetailStrength;
varying vec3 vTWorldPos;
varying vec3 vTWorldNormal;
${useDetail ? 'varying vec2 vTUv;' : ''}
${glslNoise}
float terrainSnow;
`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
{
  vec3 wp = vTWorldPos;
  vec3 wn = normalize( vTWorldNormal );
  float n1 = kcFbm( wp.xz * 0.018 );
  float n2 = kcNoise( wp.xz * 0.11 + wp.y * 0.05 );
  float strata = 0.5 + 0.5 * sin( wp.y * 0.21 + n1 * 6.0 );
  float detail = ${useDetail ? 'texture2D( uDetail, vTUv ).r' : '0.5'};
  vec3 rock = mix( uRockA, uRockB, clamp( n1 * 0.8 + strata * 0.2 + n2 * 0.12 + ( detail - 0.5 ) * 0.5, 0.0, 1.0 ) );
  float alt = smoothstep( ${snow[0].toFixed(1)}, ${snow[1].toFixed(1)}, wp.y + ( n1 - 0.5 ) * 40.0 );
  float slopeSnow = smoothstep( 0.62, 0.86, wn.y + ( n2 - 0.5 ) * 0.22 );
  ${useDetail ? '// the erosion map: bright = settled snow/scree, dark = exposed rock gullies\n  slopeSnow = mix( slopeSnow, smoothstep( 0.6, 0.9, detail ), 0.35 ) * smoothstep( 0.35, 0.6, wn.y );' : ''}
  terrainSnow = slopeSnow * alt;
  vec3 base = mix( rock, uSnow, terrainSnow );
  ${useDetail ? `// the asset's own texture, overlay-blended into the scene palette
  vec3 ov = mix( 2.0 * base * detail, 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - detail ), step( 0.5, base ) );
  base = mix( base, clamp( ov, 0.0, 1.0 ), uDetailStrength );` : ''}
  diffuseColor.rgb = base;
}`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix( roughnessFactor, 0.7, terrainSnow );`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
{
  float dist = length( vTWorldPos - cameraPosition );
  float fade = 1.0 - smoothstep( 120.0, 900.0, dist );
  if ( fade > 0.001 ) {
    vec2 p = vTWorldPos.xz * ${reliefScale};
    float e = 0.35;
    float h0 = kcFbm3( p );
    float hx = kcFbm3( p + vec2( e, 0.0 ) );
    float hz = kcFbm3( p + vec2( 0.0, e ) );
    vec3 gw = vec3( -( hx - h0 ), 0.0, -( hz - h0 ) ) * ( ${relief} * fade );
    normal = normalize( normal + ( viewMatrix * vec4( gw, 0.0 ) ).xyz );
  }
}`,
      )
      .replace(
        '#include <dithering_fragment>',
        `gl_FragColor.rgb = mix( gl_FragColor.rgb, uVoid, uFade );
if ( any( isnan( gl_FragColor.rgb ) ) || any( isinf( gl_FragColor.rgb ) ) ) gl_FragColor.rgb = uVoid;
#include <dithering_fragment>`,
      )
  }
  material.customProgramCacheKey = () => `hyperwood-rock-${opts.key}`
  return { material, uniforms }
}
