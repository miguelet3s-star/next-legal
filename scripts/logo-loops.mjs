// Genera los videos en bucle del logo para pantallas verticales (1080×1920, 30 cuadros/s).
// Uso: node scripts/logo-loops.mjs [tinta|claro|presentacion] [--cuadro <segundo>]
//   sin nombre  → genera los tres en marca/08-videos/
//   --cuadro 3  → guarda solo ese instante como PNG (para revisar sin esperar el video)
// El logo se toma tal cual de marca/01-logo (no se redibuja) y el lema de logo-loops-lema.json
// (Manrope 700 en trazos). Cada bucle termina exactamente donde empieza.
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'marca/08-videos')
const W = 1080, H = 1920, FPS = 30
const ARC = 'M54 62 C 90 44, 140 36, 204 55 C 196 58, 186 62, 178 61 C 150 52, 100 50, 54 62 Z'

/** Lee del SVG oficial los trazos de "Next" y "Legal" con su transformación. */
function wordmark(file) {
  const svg = readFileSync(join(ROOT, 'marca/01-logo', file), 'utf8')
  const paths = [...svg.matchAll(/<path transform="([^"]+)" d="([^"]+)"/g)].map((m) => ({ transform: m[1], d: m[2] }))
  if (paths.length !== 2) throw new Error(`No se pudo leer el logo de ${file}`)
  return { next: paths[0], legal: paths[1] }
}
const lema = JSON.parse(readFileSync(join(ROOT, 'scripts/logo-loops-lema.json'), 'utf8'))

const TEMAS = {
  oscuro: { logo: wordmark('nextlegal-logo-blanco.svg'), next: '#FFFFFF', a: '#5B8CFF', b: '#3FD0EE', lema1: '#FFFFFF', lema2: '#8FDDF2', brillo: 0.75 },
  claro: { logo: wordmark('nextlegal-logo-color.svg'), next: '#0E1F47', a: '#1E5BFF', b: '#139CC0', lema1: '#0E1F47', lema2: '#1E5BFF', brillo: 0.85 },
}

const clamp = (x) => Math.min(1, Math.max(0, x))
const span = (t, a, b) => clamp((t - a) / (b - a))
const outCubic = (x) => 1 - (1 - x) ** 3
const inOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
const TAU = Math.PI * 2
const n = (x) => +x.toFixed(3)

/** Arcos grandes de fondo: la forma del logo, muy tenue, meciéndose. */
function fondo(tema, p) {
  const oscuro = tema === TEMAS.oscuro
  const cx = 62 + 14 * Math.cos(TAU * p), cy = 34 + 8 * Math.sin(TAU * p)
  const base = oscuro
    ? `<radialGradient id="bg" cx="${n(cx)}%" cy="${n(cy)}%" r="85%"><stop offset="0" stop-color="#1B44A8"/><stop offset=".62" stop-color="#0E1F47"/><stop offset="1" stop-color="#0A1736"/></radialGradient>`
    : `<radialGradient id="bg" cx="${n(cx)}%" cy="${n(cy)}%" r="85%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F2F4F8"/><stop offset="1" stop-color="#E4EAF6"/></radialGradient>`
  // escala, x, y, opacidad, amplitud, fase, vueltas por bucle
  const arcos = [
    [9.5, -620, -330, oscuro ? 0.16 : 0.13, 70, 0, 1],
    [6.2, -120, 150, oscuro ? 0.1 : 0.09, 90, 0.35, 1],
    [11, -900, 1010, oscuro ? 0.13 : 0.1, 80, 0.6, 1],
    [7, -380, 1420, oscuro ? 0.09 : 0.08, 110, 0.15, 1],
  ]
  const capas = arcos.map(([s, x, y, o, amp, fase, k]) => {
    const dx = amp * Math.sin(TAU * (p * k + fase)), dy = amp * 0.25 * Math.cos(TAU * (p * k + fase))
    const op = o * (0.8 + 0.2 * Math.sin(TAU * (p + fase * 2)))
    return `<path d="${ARC}" fill="url(#ga)" opacity="${n(op)}" transform="translate(${n(x + dx)} ${n(y + dy)}) scale(${s})"/>`
  }).join('')
  return { defs: base, cuerpo: `<rect width="${W}" height="${H}" fill="url(#bg)"/>${capas}` }
}

/**
 * Un cuadro. `e` describe el estado del logo:
 * arcoDesde/arcoHasta (0–1, tramo visible del arco), next/legal/lema1/lema2 (0–1 de aparición),
 * sube (0–1, salida hacia arriba), brillo (posición 0–1 del destello, o null).
 */
function cuadro(tema, p, e, conLema) {
  const S = 3.5, cy = conLema ? 850 : 930
  const tx = W / 2 - 134 * S, ty = cy - 83 * S
  const { defs, cuerpo } = fondo(tema, p)
  const flota = Math.sin(TAU * p * 2)
  const palabra = (w, fill, k) => {
    if (k <= 0) return ''
    const dy = (1 - outCubic(k)) * 9 - e.sube * 7
    return `<g opacity="${n(k * (1 - e.sube))}" transform="translate(0 ${n(dy)})"><path transform="${w.transform}" d="${w.d}" fill="${fill}"/></g>`
  }
  const x0 = 54 + 150 * e.arcoDesde, x1 = 54 + 150 * e.arcoHasta
  const arco = x1 > x0
    ? `<g transform="translate(0 ${n(-1.6 * flota)}) rotate(${n(-0.7 * flota)} 54 62)"><path d="${ARC}" fill="url(#ga)" clip-path="url(#tramo)"/></g>`
    : ''
  let brillo = ''
  if (e.brillo !== null && e.brillo > 0 && e.brillo < 1) {
    const bx = 20 + 270 * e.brillo
    brillo = `<g clip-path="url(#zona)"><rect x="${n(bx)}" y="30" width="46" height="100" fill="url(#luz)" transform="skewX(-18)" /></g>`
  }
  const linea = (l, i, k, fill) => {
    if (k <= 0) return ''
    const fs = 54, sc = fs / lema.unidadesPorEm, ancho = l.ancho * sc
    const y = cy + 300 + i * 74 + (1 - outCubic(k)) * 26 - e.sube * 20
    return `<path d="${l.d}" fill="${fill}" opacity="${n(k * (1 - e.sube))}" transform="translate(${n((W - ancho) / 2)} ${n(y)}) scale(${sc})"/>`
  }
  const texto = conLema ? linea(lema.lineas[0], 0, e.lema1, tema.lema1) + linea(lema.lineas[1], 1, e.lema2, tema.lema2) : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${defs}
<linearGradient id="ga" gradientUnits="userSpaceOnUse" x1="54" x2="204" y1="0" y2="0"><stop offset="0" stop-color="${tema.a}"/><stop offset="1" stop-color="${tema.b}"/></linearGradient>
<linearGradient id="gl" gradientUnits="userSpaceOnUse" x1="127" x2="252" y1="0" y2="0"><stop offset="0" stop-color="${tema.a}"/><stop offset="1" stop-color="${tema.b}"/></linearGradient>
<linearGradient id="luz" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${tema.brillo}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="tramo"><rect x="${n(x0)}" y="30" width="${n(Math.max(0, x1 - x0))}" height="40"/></clipPath>
<clipPath id="zona"><path d="${ARC}"/><path transform="${tema.logo.legal.transform}" d="${tema.logo.legal.d}"/></clipPath>
</defs>
${cuerpo}
<g transform="translate(${n(tx)} ${n(ty)}) scale(${S})">
${arco}${palabra(tema.logo.next, tema.next, e.next)}${palabra(tema.logo.legal, 'url(#gl)', e.legal)}${e.legal >= 1 && e.sube === 0 ? brillo : ''}
</g>
${texto}
</svg>`
}

/** Logo siempre presente: solo respira y pasa un destello dos veces por bucle. */
function vivo(t, T) {
  const fase = (t / T * 2) % 1 // dos destellos por bucle
  return { arcoDesde: 0, arcoHasta: 1, next: 1, legal: 1, lema1: 0, lema2: 0, sube: 0, brillo: span(fase, 0.3, 0.62) }
}

/** El arco se traza, entran las palabras y el lema, y todo sale por donde vino. */
function presentacion(t) {
  const sale = inOutCubic(span(t, 10.3, 11.3))
  const destello = t < 6 ? span(t, 2.3, 3.5) : span(t, 6.8, 8)
  return {
    arcoDesde: sale,
    arcoHasta: outCubic(span(t, 0.4, 1.6)),
    next: span(t, 1.0, 1.7),
    legal: span(t, 1.25, 1.95),
    lema1: span(t, 2.6, 3.4),
    lema2: span(t, 2.95, 3.75),
    sube: inOutCubic(span(t, 10.1, 10.9)),
    brillo: destello,
  }
}

const VIDEOS = {
  tinta: { archivo: 'next-legal-logo-bucle-tinta.mp4', T: 10, tema: TEMAS.oscuro, estado: (t) => vivo(t, 10), lema: false },
  claro: { archivo: 'next-legal-logo-bucle-claro.mp4', T: 10, tema: TEMAS.claro, estado: (t) => vivo(t, 10), lema: false },
  presentacion: { archivo: 'next-legal-logo-bucle-presentacion.mp4', T: 12, tema: TEMAS.oscuro, estado: presentacion, lema: true },
}

const svgEn = (v, t) => cuadro(v.tema, t / v.T, v.estado(t), v.lema)

async function generar(nombre) {
  const v = VIDEOS[nombre]
  const salida = join(OUT, v.archivo)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', salida], { stdio: ['pipe', 'inherit', 'inherit'] })
  const fin = new Promise((ok, mal) => ff.on('close', (c) => (c === 0 ? ok() : mal(new Error(`ffmpeg salió con ${c}`)))))
  const total = v.T * FPS
  for (let i = 0; i < total; i++) {
    const raw = await sharp(Buffer.from(svgEn(v, i / FPS))).removeAlpha().raw().toBuffer()
    if (!ff.stdin.write(raw)) await new Promise((r) => ff.stdin.once('drain', r))
  }
  ff.stdin.end()
  await fin
  console.log('ok', salida)
}

mkdirSync(OUT, { recursive: true })
const args = process.argv.slice(2)
const iCuadro = args.indexOf('--cuadro')
const nombres = args.filter((a, i) => a in VIDEOS && i !== iCuadro + 1)
const lista = nombres.length ? nombres : Object.keys(VIDEOS)
if (iCuadro >= 0) {
  const t = Number(args[iCuadro + 1])
  for (const nombre of lista) {
    const png = join(process.env.CUADROS ?? OUT, `${nombre}-${t}s.png`)
    await sharp(Buffer.from(svgEn(VIDEOS[nombre], t))).png().toFile(png)
    console.log('ok', png)
  }
} else {
  for (const nombre of lista) await generar(nombre)
}
