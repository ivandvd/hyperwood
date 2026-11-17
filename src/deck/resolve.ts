import { brandEase } from '../brand/mark'

/**
 * The kit's Resolve (03.9, imagery only): a picture arrives drawn in blocks that shrink from 48 px to 1 over
 * 900 ms. `hold` is where the picture is held inside its frame when the frame has another shape (as
 * object-position, 0 to 1). The canvas lies over the image and steps aside when it is done.
 */
export function resolve(img: HTMLImageElement, canvas: HTMLCanvasElement, hold = { x: 1, y: 0.5 }) {
  const ctx = canvas.getContext('2d')
  const off = document.createElement('canvas')
  const octx = off.getContext('2d')
  const w = 720
  const boxW = canvas.clientWidth
  const boxH = canvas.clientHeight
  if (!ctx || !octx || !img.naturalWidth || !boxW) return () => {}
  const h = Math.max(1, Math.round((w * boxH) / boxW))
  canvas.width = w
  canvas.height = h
  // the part of the picture that object-fit: cover shows
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / scale
  const sh = h / scale
  const sx = (img.naturalWidth - sw) * hold.x
  const sy = (img.naturalHeight - sh) * hold.y
  let id = 0
  let start = 0
  canvas.dataset.on = ''
  const step = (now: number) => {
    if (!start) start = now
    const p = Math.min(1, (now - start) / 900)
    const block = Math.max(1, Math.round(1 + 47 * (1 - brandEase(p))))
    off.width = Math.ceil(w / block)
    off.height = Math.ceil(h / block)
    octx.imageSmoothingEnabled = true
    octx.drawImage(img, sx, sy, sw, sh, 0, 0, off.width, off.height)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(off, 0, 0, off.width, off.height, 0, 0, w, h)
    if (p < 1) id = requestAnimationFrame(step)
    else delete canvas.dataset.on
  }
  id = requestAnimationFrame(step)
  return () => {
    cancelAnimationFrame(id)
    delete canvas.dataset.on
  }
}
