/**
 * Builds the terrain data off the main thread, so the page keeps animating while it loads.
 * It starts working as soon as it is created and posts one message with the finished arrays.
 */
import { buildTerrainData } from './terrainBuild'

const scope = self as unknown as { postMessage: (message: unknown, transfer: Transferable[]) => void }
const data = buildTerrainData()
scope.postMessage(data, [data.valley.buffer, data.heights.buffer, data.detail.buffer])
