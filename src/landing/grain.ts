/**
 * Grain for the page's lights (the app's stage): a small tile of noise, made once in the page and handed out as a
 * picture address. A light is let through it (a mask), so the light is grainy, as the reference's is, and its
 * falloff does not band; where there is no light there is nothing, and the page's Ink stays one Ink.
 */
let made: string | null = null
let paper: string | null = null

/** `url(...)` of a tile of grain for the light ground (&flow=soar): Ink let through at from nothing to `most`, so
 *  the Paper reads as paper, as the reference's white is filmed. */
export function paperGrain(size = 200, most = 0.075): string {
  if (paper) return paper
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return (paper = 'none')
  const image = ctx.createImageData(size, size)
  let seed = 0x51e2a7
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 8) / 16777216
  }
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = image.data[i + 1] = image.data[i + 2] = 10
    image.data[i + 3] = Math.round(255 * most * random())
  }
  ctx.putImageData(image, 0, 0)
  return (paper = `url(${canvas.toDataURL('image/png')})`)
}

/** `url(...)` of a tile of noise: every pixel opaque black let through between `low` and fully. */
export function grain(size = 192, low = 0.56): string {
  if (made) return made
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return (made = 'none')
  const image = ctx.createImageData(size, size)
  // (the same tile every time: a small generator with a fixed start)
  let seed = 0x2f6e2b1
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 8) / 16777216
  }
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i + 3] = Math.round(255 * (low + (1 - low) * random()))
  }
  ctx.putImageData(image, 0, 0)
  return (made = `url(${canvas.toDataURL('image/png')})`)
}
