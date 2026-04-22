import { useEffect, useRef } from 'react'
import { Noise as NoiseGenerator } from 'noisejs'

type NoiseProps = {
  patternSize?: number
  patternScaleX?: number
  patternScaleY?: number
  patternRefreshInterval?: number
  patternAlpha?: number
}

export default function Noise({
  patternSize = 250,
  patternScaleX = 2,
  patternScaleY = 2,
  patternRefreshInterval = 2,
  patternAlpha = 15,
}: NoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const noise = new NoiseGenerator(Math.random())
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const alpha = Math.max(0, Math.min(255, Math.round((patternAlpha / 100) * 255)))
    const width = Math.max(16, Math.round(patternSize * patternScaleX))
    const height = Math.max(16, Math.round(patternSize * patternScaleY))

    canvas.width = width
    canvas.height = height

    let raf = 0
    let frame = 0

    const paint = () => {
      const imageData = context.createImageData(width, height)
      const data = imageData.data
      const t = frame * 0.012

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const idx = (y * width + x) * 4
          const value = (noise.perlin3(x / 34, y / 34, t) + 1) * 0.5
          const color = Math.round(value * 255)
          data[idx] = color
          data[idx + 1] = color
          data[idx + 2] = color
          data[idx + 3] = alpha
        }
      }

      context.putImageData(imageData, 0, 0)
      frame += 1
    }

    const tick = () => {
      if (reducedMotion || frame % patternRefreshInterval === 0) {
        paint()
      }
      raf = window.requestAnimationFrame(tick)
    }

    paint()
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [patternAlpha, patternRefreshInterval, patternScaleX, patternScaleY, patternSize])

  return <canvas ref={canvasRef} className="contact-noise-canvas" aria-hidden="true" />
}
