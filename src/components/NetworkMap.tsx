import { useEffect, useRef } from 'react'
import hondurasSvg from '../assets/honduras.svg?raw'
import { asset } from '../lib/asset'

/**
 * Red Next Legal sobre el mapa de Honduras: cientos de puntos conectados en todo el país,
 * con pulsos de luz que viajan entre ellos. Se pausa fuera de pantalla y respeta "reducir movimiento".
 */
type Node = { x: number; y: number; r: number; ph: number; links: number[] }
type Pulse = { a: number; b: number; t: number; v: number }

const AVATARS = [
  { x: 23.5, y: 33, src: asset('/img/abogados/valeria-paz-cara.jpg'), name: 'Valeria Paz', area: 'Familia', city: 'San Pedro Sula', card: true },
  { x: 37, y: 63, src: asset('/img/abogados/andrea-castillo-cara.jpg'), name: 'Andrea Castillo', area: 'Laboral', city: 'Tegucigalpa', card: true },
  { x: 48, y: 20, src: asset('/img/l-mafer.jpg') },
  { x: 11, y: 47, src: asset('/img/l-jessica.jpg') },
  { x: 25, y: 55, src: asset('/img/abogados/daniel-rivera-cara.jpg') },
  { x: 60, y: 47, src: asset('/img/abogados/roberto-zelaya-cara.jpg') },
  { x: 33, y: 86, src: asset('/img/l-luis.jpg') },
  { x: 49, y: 76, src: asset('/img/l-carlos.jpg') },
  { x: 83, y: 32, src: asset('/img/l-daniela.jpg') },
  { x: 66, y: 38, src: asset('/img/l-carlosr.jpg') },
]

export function NetworkMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let nodes: Node[] = []
    let pulses: Pulse[] = []
    let w = 0, h = 0, raf = 0, visible = true, cancelled = false, last = 0
    let linkLayer: HTMLCanvasElement | null = null
    // Pulso de luz precalculado: se dibuja con drawImage en vez de crear un degradado por cuadro
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 24
    { const sc = sprite.getContext('2d'); if (sc) { const g = sc.createRadialGradient(12, 12, 0, 12, 12, 12); g.addColorStop(0, 'rgba(170,235,255,1)'); g.addColorStop(.35, 'rgba(90,200,240,.6)'); g.addColorStop(1, 'rgba(63,208,238,0)'); sc.fillStyle = g; sc.fillRect(0, 0, 24, 24) } }
    const start = performance.now()

    // Silueta de Honduras para ubicar los puntos solo dentro del país
    const shape = hondurasSvg.replace(/<path class="hn-base"[^>]*\/>/g, '').replace('<svg ', '<svg fill="#000" ')
    const img = new Image()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(shape)

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = r.width; h = r.height
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const off = document.createElement('canvas')
      off.width = Math.round(w); off.height = Math.round(h)
      const o = off.getContext('2d')
      if (!o || !img.complete || !w) return
      o.drawImage(img, 0, 0, w, h)
      const data = o.getImageData(0, 0, off.width, off.height).data
      const inside = (x: number, y: number) => data[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] > 120
      // Muestreo con separación mínima para que la red se vea pareja y densa
      const target = Math.round(Math.min(760, (w * h) / 520)), minD = Math.max(7, Math.sqrt((w * h) / target) * 0.6)
      nodes = []
      let tries = 0
      while (nodes.length < target && tries < target * 60) {
        tries++
        const x = Math.random() * w, y = Math.random() * h
        if (!inside(x, y)) continue
        if (nodes.some((n) => (n.x - x) ** 2 + (n.y - y) ** 2 < minD * minD)) continue
        nodes.push({ x, y, r: 1.2 + Math.random() * 1.8, ph: Math.random() * Math.PI * 2, links: [] })
      }
      nodes.forEach((n, i) => {
        const near = nodes.map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 })).filter((e) => e.j !== i).sort((a, b) => a.d - b.d).slice(0, 3)
        n.links = near.filter((e) => e.d < (minD * 2.6) ** 2).map((e) => e.j)
      })
      pulses = []
      // Capa fija con las conexiones (no cambia entre cuadros)
      const dprL = Math.min(window.devicePixelRatio || 1, 2)
      linkLayer = document.createElement('canvas')
      linkLayer.width = Math.round(w * dprL); linkLayer.height = Math.round(h * dprL)
      const lc = linkLayer.getContext('2d')
      if (lc) {
        lc.setTransform(dprL, 0, 0, dprL, 0, 0)
        lc.lineWidth = 0.8; lc.strokeStyle = 'rgba(110,160,255,.28)'
        lc.beginPath()
        nodes.forEach((n, i) => n.links.forEach((j) => { if (j > i) { lc.moveTo(n.x, n.y); lc.lineTo(nodes[j].x, nodes[j].y) } }))
        lc.stroke()
      }
    }

    const spawn = () => {
      if (!nodes.length) return
      const a = Math.floor(Math.random() * nodes.length)
      const l = nodes[a].links
      if (!l.length) return
      pulses.push({ a, b: l[Math.floor(Math.random() * l.length)], t: 0, v: 0.012 + Math.random() * 0.02 })
    }

    const draw = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, w, h)
      if (linkLayer) ctx.drawImage(linkLayer, 0, 0, w, h)
      // Pulsos de luz que viajan por la red
      if (!still) { for (let k = 0; k < 6; k++) spawn(); if (pulses.length > 240) pulses.splice(0, pulses.length - 240) }
      pulses = pulses.filter((p) => p.t <= 1)
      pulses.forEach((p) => {
        p.t += p.v
        const A = nodes[p.a], B = nodes[p.b]
        const x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t
        ctx.drawImage(sprite, x - 7, y - 7, 14, 14)
      })
      // Puntos que titilan
      nodes.forEach((n) => {
        const a = 0.55 + 0.45 * Math.sin(t * 1.6 + n.ph)
        ctx.globalAlpha = a
        ctx.fillStyle = '#96cdff'
        ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2)
      })
    }

    const loop = (now: number) => {
      // ~40 cuadros por segundo: fluido y liviano
      if (visible && !document.hidden && now - last > 24) { last = now; draw(now); ctx.globalAlpha = 1 }
      raf = requestAnimationFrame(loop)
    }

    img.onload = () => {
      if (cancelled) return
      build()
      if (still) draw(start + 3000)
      else raf = requestAnimationFrame(loop)
    }
    const ro = new ResizeObserver(() => { if (img.complete) { build(); if (still) draw(start + 3000) } })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)
    return () => { cancelled = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect() }
  }, [])

  return (
    <figure className="lx-netmap" aria-label="Red de abogados y personas conectadas en toda Honduras">
      <canvas ref={canvasRef} className="lx-netmap-canvas" aria-hidden="true" />
      {AVATARS.map((a, i) => (
        <span key={a.src} className={`lx-netmap-av ${a.card ? 'has-card' : ''} ${'left' in a && a.left ? 'card-left' : ''}`} style={{ left: `${a.x}%`, top: `${a.y}%`, ['--i' as string]: i }}>
          <img src={a.src} alt="" />
          {a.card && <span className="lx-netmap-card"><b>{a.name}</b><small>{a.area} · {a.city}</small></span>}
        </span>
      ))}
      <figcaption className="lx-netmap-legend">
        <span><i className="lg-dot" /> Personas conectadas</span>
        <span><i className="lg-av" /> Abogados de la red</span>
      </figcaption>
    </figure>
  )
}
