/**
 * Everything the two terrains need that is slow to compute: the valley's vertex positions, the foreground
 * massif's heights and its erosion map. About a second of noise maths, pure and deterministic, so it runs
 * in a worker (terrain.worker.ts) while the page starts, or here on the main thread where a worker cannot.
 */
import { config } from '../../config'
import { createTerrainHeight } from './terrainHeight'
import { buildForegroundDetail, sampleForeground } from './foregroundHeight'

export interface TerrainData {
  /** Valley vertex positions (x, y, z per vertex) on its non-uniform grid. */
  valley: Float32Array
  /** Foreground massif heights on its patch grid. */
  heights: Float32Array
  /** Foreground erosion map (one byte per pixel). */
  detail: Uint8Array
}

/** The valley grid: dense near the camera and the valley axis, sparse far away. */
export function buildValleyPositions(): Float32Array {
  const T = config.terrain
  const height = createTerrainHeight(T.seed, T.floor)
  const nx = T.segmentsX + 1
  const nz = T.segmentsZ + 1
  const pos = new Float32Array(nx * nz * 3)
  for (let j = 0; j < nz; j++) {
    const tz = j / (nz - 1)
    const z = T.zNear - (T.zNear - T.zFar) * Math.pow(tz, 1.75)
    for (let i = 0; i < nx; i++) {
      const u = (i / (nx - 1)) * 2 - 1
      const x = Math.sign(u) * Math.pow(Math.abs(u), 1.45) * (T.width / 2)
      const k = (j * nx + i) * 3
      pos[k] = x
      pos[k + 1] = height(x, z)
      pos[k + 2] = z
    }
  }
  return pos
}

export function buildTerrainData(): TerrainData {
  const heights = sampleForeground()
  return { valley: buildValleyPositions(), heights, detail: buildForegroundDetail(heights) }
}
