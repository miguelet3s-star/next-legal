import { useEffect, useRef } from 'react'

/**
 * Línea gráfica de Next Legal en bucle: hilos de guilloché que respiran y se cruzan,
 * con una luz que los recorre. Se pausa fuera de pantalla y respeta "reducir movimiento".
 */
export function LiveLines({ tone = 'dark', className = '' }: { tone?: 'dark' | 'light'; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dark = tone === 'dark'
    let w = 0, h = 0, raf = 0, visible = true
    const start = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = r.width; h = r.height
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const LINES = dark ? 26 : 20
    const draw = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, w, h)
      const mid = h * (dark ? 0.55 : 0.5)
      const amp = Math.min(h * 0.22, 170)
      // Luz que recorre los hilos de izquierda a derecha cada ~9 s
      const light = ((t / 9) % 1.4) - 0.2
      for (let k = 0; k < LINES; k++) {
        const p = k / (LINES - 1)
        const breath = 0.72 + 0.28 * Math.sin(t * 0.35 + k * 0.32)
        const a = amp * breath * (0.55 + p * 0.6)
        const grad = ctx.createLinearGradient(0, 0, w, 0)
        const base = dark ? 0.16 + 0.22 * Math.sin(p * Math.PI) : 0.05 + 0.07 * Math.sin(p * Math.PI)
        const c1 = dark ? '47,107,255' : '30,91,255'
        const c2 = dark ? '23,179,214' : '23,179,214'
        const lo = Math.max(0, light - 0.12), hi = Math.min(1, light + 0.12)
        grad.addColorStop(0, `rgba(${c1},${base})`)
        if (light > 0 && light < 1) {
          grad.addColorStop(lo, `rgba(${c1},${base})`)
          grad.addColorStop(Math.min(1, Math.max(0, light)), `rgba(${dark ? '160,220,255' : '30,91,255'},${dark ? Math.min(0.85, base * 2.6) : base * 2.4})`)
          grad.addColorStop(hi, `rgba(${c2},${base})`)
        }
        grad.addColorStop(1, `rgba(${c2},${base})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = dark ? 1.1 : 1
        ctx.beginPath()
        for (let x = -10; x <= w + 10; x += 12) {
          const u = x / Math.max(w, 1)
          const y = mid
            + Math.sin(u * 5.2 + t * 0.32 + k * 0.38) * a
            + Math.sin(u * 13.5 - t * 0.55 + k) * 12 * breath
            + Math.cos(u * 2.1 + t * 0.18) * 30
          if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }

    let last = 0
    const loop = (now: number) => {
      // ~30 cuadros por segundo: las líneas se mueven lento, no hace falta más
      if (visible && !document.hidden && now - last > 32) { last = now; draw(now) }
      raf = requestAnimationFrame(loop)
    }

    resize()
    const ro = new ResizeObserver(() => { resize(); if (still) draw(start + 4000) })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)
    if (still) draw(start + 4000)
    else raf = requestAnimationFrame(loop)

    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect() }
  }, [tone])

  return <canvas ref={ref} className={`lx-lines lx-lines-${tone} ${className}`} aria-hidden="true" />
}
