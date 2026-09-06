import * as THREE from 'three'
import { marks, type MarkKey } from '../data/marks'

/**
 * Rasterises a 24×24 mark into a square texture. The glyph is drawn white so a
 * sprite can tint it, and the SVG is inlined as a data URL so nothing is
 * fetched over the network. The canvas exists immediately and fills in on
 * decode, so callers get a stable texture object plus a nudge to draw a frame.
 */
export function markTexture(key: MarkKey, size: number, onReady: () => void) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#ffffff">${marks[key]}</svg>`
  const img = new Image()
  img.onload = () => {
    const pad = size * 0.13
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2)
    texture.needsUpdate = true
    onReady()
  }
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return texture
}

const TITLE = '500 46px "Space Grotesk", ui-sans-serif, sans-serif'
const SUB = '400 30px "JetBrains Mono", ui-monospace, monospace'

/**
 * A two-line readout for one node: what it runs on, then which service it is.
 * Drawn with canvas text rather than inside the SVG, because the page's own
 * webfonts do not apply inside a rasterised SVG. Redrawn once they land.
 */
export function labelTexture(title: string, sub: string, onReady: () => void) {
  const canvas = document.createElement('canvas')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const draw = () => {
    const probe = canvas.getContext('2d')!
    probe.font = TITLE
    const titleWidth = probe.measureText(title).width
    probe.font = SUB
    const subWidth = probe.measureText(sub).width

    // Resizing wipes the canvas and resets context state, so measure first.
    canvas.width = Math.ceil(Math.max(titleWidth, subWidth)) + 56
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.textAlign = 'center'
    ctx.font = TITLE
    ctx.fillStyle = '#EDF1F8'
    ctx.fillText(title, canvas.width / 2, 50)
    ctx.font = SUB
    ctx.fillStyle = '#93A3C2'
    ctx.fillText(sub, canvas.width / 2, 98)
    texture.needsUpdate = true
  }

  draw()
  void document.fonts.ready.then(() => {
    draw()
    onReady()
  })
  return texture
}
