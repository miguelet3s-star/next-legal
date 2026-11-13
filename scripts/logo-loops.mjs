// Genera los videos en bucle del logo para pantallas (30 cuadros/s), en horizontal (1920×1080)
// y vertical (1080×1920).
// Uso: node scripts/logo-loops.mjs [horizontal|vertical] [tinta|claro|presentacion|presentacion-claro] [--cuadro <segundo>]
//   sin argumentos → genera todos en marca/08-videos/<formato>/
//   --cuadro 3     → guarda solo ese instante como PNG (para revisar sin esperar el video)
// El logo se toma tal cual de marca/01-logo (no se redibuja) y el lema de logo-loops-lema.json
// (Manrope 700 en trazos, palabra por palabra). Cada bucle termina exactamente donde empieza.
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'marca/08-videos')
const FPS = 30
const ARC = 'M54 62 C 90 44, 140 36, 204 55 C 196 58, 186 62, 178 61 C 150 52, 100 50, 54 62 Z'

// Arcos de fondo: escala, x, y, opacidad (oscuro), opacidad (claro), amplitud, fase, vueltas por bucle
const FORMATOS = {
  horizontal: {
    W: 1920, H: 1080, S: 4.2, cy: 540, cyLema: 450, lemaY: 315, lemaPx: 74,
    arcos: [
      [14, -1100, -640, 0.16, 0.13, 150, 0, 1],
      [9, 500, -200, 0.1, 0.09, 190, 0.35, 2],
      [16, -700, 80, 0.13, 0.1, 170, 0.6, 1],
      [10, -700, 420, 0.09, 0.08, 220, 0.15, 2],
    ],
  },
  vertical: {
    W: 1080, H: 1920, S: 3.5, cy: 930, cyLema: 850, lemaY: 300, lemaPx: 56,
    arcos: [
      [9.5, -620, -330, 0.16, 0.13, 110, 0, 1],
      [6.2, -120, 150, 0.1, 0.09, 140, 0.35, 2],
      [11, -900, 1010, 0.13, 0.1, 120, 0.6, 1],
      [7, -380, 1420, 0.09, 0.08, 160, 0.15, 2],
    ],
  },
}

/** Lee del SVG oficial los trazos de "Next" y "Legal" con su transformación. */
function wordmark(file) {
  const svg = readFileSync(join(ROOT, 'marca/01-logo', file), 'utf8')
  const paths = [...svg.matchAll(/<path transform="([^"]+)" d="([^"]+)"/g)].map((m) => ({ transform: m[1], d: m[2] }))
  if (paths.length !== 2) throw new Error(`No se pudo leer el logo de ${file}`)
  return { next: paths[0], legal: paths[1] }
}
const lema = JSON.parse(readFileSync(join(ROOT, 'scripts/logo-loops-lema.json'), 'utf8'))

const TEMAS = {
  oscuro: { oscuro: true, logo: wordmark('nextlegal-logo-blanco.svg'), next: '#FFFFFF', a: '#5B8CFF', b: '#3FD0EE', lema: '#FFFFFF', brillo: 0.75 },
  claro: { oscuro: false, logo: wordmark('nextlegal-logo-color.svg'), next: '#0E1F47', a: '#1E5BFF', b: '#139CC0', lema: '#0E1F47', brillo: 0.85 },
}

const clamp = (x) => Math.min(1, Math.max(0, x))
const span = (t, a, b) => clamp((t - a) / (b - a))
const outCubic = (x) => 1 - (1 - x) ** 3
const outBack = (x) => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2
const inOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
const TAU = Math.PI * 2
const n = (x) => +x.toFixed(3)

/** Fondo: luz que gira despacio y arcos grandes (la forma del logo, muy tenue) meciéndose. */
function fondo(F, tema, p) {
  const cx = 60 + 16 * Math.cos(TAU * p), cy = 40 + 12 * Math.sin(TAU * p)
  const defs = tema.oscuro
    ? `<radialGradient id="bg" cx="${n(cx)}%" cy="${n(cy)}%" r="85%"><stop offset="0" stop-color="#1B44A8"/><stop offset=".62" stop-color="#0E1F47"/><stop offset="1" stop-color="#0A1736"/></radialGradient>`
    : `<radialGradient id="bg" cx="${n(cx)}%" cy="${n(cy)}%" r="85%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F2F4F8"/><stop offset="1" stop-color="#E4EAF6"/></radialGradient>`
  const capas = F.arcos.map(([s, x, y, oO, oC, amp, fase, k]) => {
    const dx = amp * Math.sin(TAU * (p * k + fase)), dy = amp * 0.22 * Math.cos(TAU * (p * k + fase))
    const op = (tema.oscuro ? oO : oC) * (0.75 + 0.25 * Math.sin(TAU * (p + fase * 2)))
    return `<path d="${ARC}" fill="url(#ga)" opacity="${n(op)}" transform="translate(${n(x + dx)} ${n(y + dy)}) scale(${s})"/>`
  }).join('')
  return { defs, cuerpo: `<rect width="${F.W}" height="${F.H}" fill="url(#bg)"/>${capas}` }
}

/**
 * Un cuadro. `e` describe el estado del logo:
 * arcoDesde/arcoHasta (0–1, tramo visible del arco), next/legal (0–1 de aparición),
 * sube (0–1, salida hacia arriba), brillo (posición 0–1 del destello, o null),
 * escala del logo, y por palabra del lema: entra (0–1), salto (0–1), sale (0–1); raya (0–1).
 */
function cuadro(F, tema, p, e, conLema) {
  const { W, S } = F, cy = conLema ? F.cyLema : F.cy
  const { defs, cuerpo } = fondo(F, tema, p)
  const flota = Math.sin(TAU * p * 2)
  const palabra = (w, fill, k) => {
    if (k <= 0) return ''
    const dy = (1 - outBack(k)) * 12 - e.sube * 7
    return `<g opacity="${n(Math.min(1, k * 1.6) * (1 - e.sube))}" transform="translate(0 ${n(dy)})"><path transform="${w.transform}" d="${w.d}" fill="${fill}"/></g>`
  }
  const x0 = 54 + 150 * e.arcoDesde, x1 = 54 + 150 * e.arcoHasta
  const arco = x1 > x0
    ? `<g transform="translate(0 ${n(-2 * flota)}) rotate(${n(-0.9 * flota)} 54 62)"><path d="${ARC}" fill="url(#ga)" clip-path="url(#tramo)"/></g>`
    : ''
  let brillo = ''
  if (e.brillo !== null && e.brillo > 0 && e.brillo < 1 && e.legal >= 1 && e.sube === 0) {
    brillo = `<g clip-path="url(#zona)"><rect x="${n(20 + 270 * e.brillo)}" y="30" width="46" height="100" fill="url(#luz)" transform="skewX(-18)"/></g>`
  }

  let texto = ''
  if (conLema) {
    const sc = F.lemaPx / lema.unidadesPorEm, xIni = (W - lema.ancho * sc) / 2, yBase = cy + F.lemaY
    const ultima = lema.palabras.length - 1
    texto = lema.palabras.map((w, i) => {
      const s = e.palabras[i]
      if (s.entra <= 0 || s.sale >= 1) return ''
      const y = yBase + (1 - outBack(s.entra)) * F.lemaPx * 0.9 - Math.sin(Math.PI * s.salto) * F.lemaPx * 0.28 - inOutCubic(s.sale) * F.lemaPx * 0.6
      const op = Math.min(1, s.entra * 2) * (1 - s.sale)
      return `<path d="${w.d}" fill="${i === ultima ? 'url(#gt)' : tema.lema}" opacity="${n(op)}" transform="translate(${n(xIni + w.x * sc)} ${n(y)}) scale(${n(sc)})"/>`
    }).join('')
    // Raya bajo la última palabra: se dibuja de izquierda a derecha.
    const u = lema.palabras[ultima]
    if (e.raya > 0) {
      const rx = xIni + u.x * sc, rw = u.ancho * sc * e.raya, alto = F.lemaPx * 0.11
      texto += `<rect x="${n(rx)}" y="${n(yBase + F.lemaPx * 0.3)}" width="${n(rw)}" height="${n(alto)}" rx="${n(alto / 2)}" fill="url(#gt)" opacity="${n(1 - e.palabras[ultima].sale)}"/>`
    }
    const sc0 = xIni + u.x * sc
    texto = `<defs><linearGradient id="gt" gradientUnits="userSpaceOnUse" x1="${n(tema.oscuro ? 0 : sc0)}" x2="${n(tema.oscuro ? u.ancho : sc0 + u.ancho * sc)}" y1="0" y2="0"><stop offset="0" stop-color="${tema.oscuro ? '#7FA6FF' : tema.a}"/><stop offset="1" stop-color="${tema.oscuro ? '#3FD0EE' : tema.b}"/></linearGradient></defs>${texto}`
  }

  const k = S * e.escala
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${F.W}" height="${F.H}" viewBox="0 0 ${F.W} ${F.H}">
<defs>${defs}
<linearGradient id="ga" gradientUnits="userSpaceOnUse" x1="54" x2="204" y1="0" y2="0"><stop offset="0" stop-color="${tema.a}"/><stop offset="1" stop-color="${tema.b}"/></linearGradient>
<linearGradient id="gl" gradientUnits="userSpaceOnUse" x1="127" x2="252" y1="0" y2="0"><stop offset="0" stop-color="${tema.a}"/><stop offset="1" stop-color="${tema.b}"/></linearGradient>
<linearGradient id="luz" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${tema.brillo}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="tramo"><rect x="${n(x0)}" y="30" width="${n(Math.max(0, x1 - x0))}" height="40"/></clipPath>
<clipPath id="zona"><path d="${ARC}"/><path transform="${tema.logo.legal.transform}" d="${tema.logo.legal.d}"/></clipPath>
</defs>
${cuerpo}
<g transform="translate(${n(W / 2 - 134 * k)} ${n(cy - 83 * k)}) scale(${n(k)})">
${arco}${palabra(tema.logo.next, tema.next, e.next)}${palabra(tema.logo.legal, 'url(#gl)', e.legal)}${brillo}
</g>
${texto}
</svg>`
}

/** Logo siempre presente: respira y pasa un destello dos veces por bucle. */
function vivo(t, T) {
  const fase = (t / T * 2) % 1
  return { arcoDesde: 0, arcoHasta: 1, next: 1, legal: 1, sube: 0, brillo: span(fase, 0.3, 0.62), escala: 1 + 0.02 * Math.sin(TAU * t / T * 2), palabras: [], raya: 0 }
}

/** El arco se traza, entran las palabras del logo, el lema llega palabra por palabra, salta en ola y todo sale. */
function presentacion(t) {
  const N = lema.palabras.length
  const palabras = lema.palabras.map((_, i) => ({
    entra: span(t, 2.5 + i * 0.2, 3.0 + i * 0.2),
    salto: t < 8 ? span(t, 5.6 + i * 0.13, 6.15 + i * 0.13) : span(t, 8.4 + i * 0.13, 8.95 + i * 0.13),
    sale: span(t, 10.0 + i * 0.07, 10.45 + i * 0.07),
  }))
  const entrada = 0.9 + 0.1 * outBack(span(t, 0.4, 1.9))
  return {
    arcoDesde: inOutCubic(span(t, 10.4, 11.3)),
    arcoHasta: outCubic(span(t, 0.4, 1.5)),
    next: span(t, 0.95, 1.6),
    legal: span(t, 1.2, 1.85),
    sube: inOutCubic(span(t, 10.3, 11.0)),
    brillo: t < 6 ? span(t, 2.1, 3.2) : span(t, 6.9, 8.0),
    escala: entrada * (1 + 0.015 * Math.sin(TAU * t / 6)),
    palabras,
    raya: outCubic(span(t, 2.6 + N * 0.2, 3.3 + N * 0.2)) * (1 - span(t, 10.0, 10.4)),
  }
}

const VIDEOS = {
  tinta: { archivo: 'next-legal-logo-bucle-tinta.mp4', T: 10, tema: TEMAS.oscuro, estado: (t) => vivo(t, 10), lema: false },
  claro: { archivo: 'next-legal-logo-bucle-claro.mp4', T: 10, tema: TEMAS.claro, estado: (t) => vivo(t, 10), lema: false },
  presentacion: { archivo: 'next-legal-logo-bucle-presentacion.mp4', T: 12, tema: TEMAS.oscuro, estado: presentacion, lema: true },
  'presentacion-claro': { archivo: 'next-legal-logo-bucle-presentacion-claro.mp4', T: 12, tema: TEMAS.claro, estado: presentacion, lema: true },
}

const svgEn = (F, v, t) => cuadro(F, v.tema, t / v.T, v.estado(t), v.lema)

async function generar(formato, nombre) {
  const F = FORMATOS[formato], v = VIDEOS[nombre]
  mkdirSync(join(OUT, formato), { recursive: true })
  const salida = join(OUT, formato, v.archivo)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${F.W}x${F.H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', salida], { stdio: ['pipe', 'inherit', 'inherit'] })
  const fin = new Promise((ok, mal) => ff.on('close', (c) => (c === 0 ? ok() : mal(new Error(`ffmpeg salió con ${c}`)))))
  for (let i = 0; i < v.T * FPS; i++) {
    const raw = await sharp(Buffer.from(svgEn(F, v, i / FPS))).removeAlpha().raw().toBuffer()
    if (!ff.stdin.write(raw)) await new Promise((r) => ff.stdin.once('drain', r))
  }
  ff.stdin.end()
  await fin
  console.log('ok', salida)
}

const args = process.argv.slice(2)
const iCuadro = args.indexOf('--cuadro')
const formatos = args.filter((a) => a in FORMATOS)
const nombres = args.filter((a) => a in VIDEOS)
for (const formato of formatos.length ? formatos : Object.keys(FORMATOS)) {
  for (const nombre of nombres.length ? nombres : Object.keys(VIDEOS)) {
    if (iCuadro >= 0) {
      const t = Number(args[iCuadro + 1])
      const png = join(process.env.CUADROS ?? OUT, `${formato}-${nombre}-${t}s.png`)
      await sharp(Buffer.from(svgEn(FORMATOS[formato], VIDEOS[nombre], t))).png().toFile(png)
      console.log('ok', png)
    } else {
      await generar(formato, nombre)
    }
  }
}
