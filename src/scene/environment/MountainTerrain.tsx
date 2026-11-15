/**
 * Mountain valley: a CPU-generated heightfield (ridged multifractal + domain warp, see terrainHeight.ts)
 * on a non-uniform grid (dense near the camera and the valley axis, sparse far away),
 * shaded with a slope/altitude rock–snow shader and fragment-level micro relief.
 */
import { use, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { config } from '../../config'
import { store } from '../../state/store'
import { terrainData } from './terrainData'
import { createRockMaterial } from './rockMaterial'

function buildTerrainGeometry(pos: Float32Array) {
  const nx = config.terrain.segmentsX + 1
  const nz = config.terrain.segmentsZ + 1
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6)
  let o = 0
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i
      const b = a + 1
      const c = a + nx
      const d = c + 1
      // winding so the surface faces +Y (z decreases with j)
      idx[o++] = a
      idx[o++] = b
      idx[o++] = c
      idx[o++] = b
      idx[o++] = d
      idx[o++] = c
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(new THREE.BufferAttribute(idx, 1))
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return g
}

export function MountainTerrain() {
  // the heights are computed in a worker while the page starts (terrainData.ts)
  const data = use(terrainData())
  const geometry = useMemo(() => buildTerrainGeometry(data.valley), [data])

  const { material, uniforms } = useMemo(() => createRockMaterial({ key: 'valley' }), [])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(() => {
    // the valley dissolves into darkness during the disassembly
    uniforms.uFade.value = store.w.environment
  })

  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}
