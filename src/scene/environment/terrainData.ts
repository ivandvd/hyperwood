/**
 * The terrain data as one shared promise. The work starts when this module loads, in a worker, so it
 * overlaps with the rest of the start-up; the terrain components suspend on it and the preloader waits for it.
 */
import { store } from '../../state/store'
import { buildTerrainData, type TerrainData } from './terrainBuild'

let job: Promise<TerrainData> | null = null

export function terrainData(): Promise<TerrainData> {
  job ??= new Promise<TerrainData>((resolve) => {
    const done = (data: TerrainData) => {
      store.terrainReady = true
      resolve(data)
    }
    try {
      const worker = new Worker(new URL('./terrain.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<TerrainData>) => {
        worker.terminate()
        done(e.data)
      }
      // no worker after all: build it here, as before
      worker.onerror = () => {
        worker.terminate()
        done(buildTerrainData())
      }
    } catch {
      done(buildTerrainData())
    }
  })
  return job
}

terrainData()
