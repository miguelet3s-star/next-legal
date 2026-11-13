// Genera los videos en bucle del logo para pantallas (30 cuadros/s), en horizontal (1920×1080)
// y vertical (1080×1920).
// Uso: node scripts/logo-loops.mjs [horizontal|vertical] [tinta|claro|presentacion|presentacion-claro] [--cuadro <segundo>]
//   sin argumentos → genera todos los bucles en marca/08-videos/<formato>/
//   --cuadro 3     → guarda solo ese instante como PNG (para revisar sin esperar el video)
// Video del stand (horizontal, 20 s): lema → cuenta regresiva al estreno → invitación a la web con QR.
//   node scripts/logo-loops.mjs estreno [--dia 2026-11-20]   un video para ese día (por defecto, hoy)
//   node scripts/logo-loops.mjs estreno --todos              uno por cada día desde hoy hasta la víspera
//   La fecha del estreno se lee de src/lib/launch.ts; la dirección de la web es WEB, aquí abajo.
// El logo se toma tal cual de marca/01-logo (no se redibuja) y los textos se componen con
// logo-loops-fuente.json (Manrope 700 y 800 en trazos). Cada bucle termina donde empieza.
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'marca/08-videos')
const FPS = 30
const WEB = 'https://miguelet3s-star.github.io/next-legal/'
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
const fuente = JSON.parse(readFileSync(join(ROOT, 'scripts/logo-loops-fuente.json'), 'utf8'))

/** Ancho de un texto en píxeles. */
function medir(txt, px, peso = '700') {
  const f = fuente[peso]
  return [...txt].reduce((w, ch) => w + (f.g[ch] ?? f.g['?']).a, 0) * px / f.em
}
/** Trazo de una letra llevado a píxeles: escala `sc`, origen en (ox, oy), eje vertical hacia abajo. */
function colocar(d, sc, ox, oy) {
  return d.replace(/([MLQCHVZ])([^MLQCHVZ]*)/g, (_, c, resto) => {
    const v = resto.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
    if (c === 'H') return 'H' + v.map((x) => n(ox + x * sc)).join(' ')
    if (c === 'V') return 'V' + v.map((y) => n(oy - y * sc)).join(' ')
    return c + v.map((x, i) => n(i % 2 ? oy - x * sc : ox + x * sc)).join(' ')
  })
}
/** Texto en un solo trazo, con la línea base en (x, y). `ancla`: 'inicio' o 'centro'. */
function escribir(txt, px, x, y, fill, { peso = '700', ancla = 'inicio' } = {}) {
  const f = fuente[peso], sc = px / f.em
  let cx = ancla === 'centro' ? x - medir(txt, px, peso) / 2 : x, d = ''
  for (const ch of txt) {
    const g = f.g[ch] ?? f.g['?']
    if (g.d) d += colocar(g.d, sc, cx, y)
    cx += g.a * sc
  }
  return `<path d="${d}" fill="${fill}"/>`
}

/** El lema, palabra por palabra (posiciones en unidades de 1 px de letra). */
const lema = (() => {
  const esp = medir(' ', 1)
  let x = 0
  const palabras = 'El abogado que usted necesita'.split(' ').map((texto) => {
    const w = { texto, x, ancho: medir(texto, 1) }
    x += w.ancho + esp
    return w
  })
  return { ancho: x - esp, palabras }
})()

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
function cuadro(F, tema, p, e, conLema, extra = '') {
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
    const sc = F.lemaPx, xIni = (W - lema.ancho * sc) / 2, yBase = cy + F.lemaY
    const ultima = lema.palabras.length - 1
    texto = lema.palabras.map((w, i) => {
      const s = e.palabras[i]
      if (s.entra <= 0 || s.sale >= 1) return ''
      const y = yBase + (1 - outBack(s.entra)) * F.lemaPx * 0.9 - Math.sin(Math.PI * s.salto) * F.lemaPx * 0.28 - inOutCubic(s.sale) * F.lemaPx * 0.6
      const op = Math.min(1, s.entra * 2) * (1 - s.sale)
      return `<g opacity="${n(op)}">${escribir(w.texto, F.lemaPx, xIni + w.x * sc, y, i === ultima ? 'url(#gt)' : tema.lema)}</g>`
    }).join('')
    // Raya bajo la última palabra: se dibuja de izquierda a derecha.
    const u = lema.palabras[ultima]
    if (e.raya > 0) {
      const rx = xIni + u.x * sc, rw = u.ancho * sc * e.raya, alto = F.lemaPx * 0.11
      texto += `<rect x="${n(rx)}" y="${n(yBase + F.lemaPx * 0.3)}" width="${n(rw)}" height="${n(alto)}" rx="${n(alto / 2)}" fill="url(#gt)" opacity="${n(1 - e.palabras[ultima].sale)}"/>`
    }
    const sc0 = xIni + u.x * sc
    texto = `<defs><linearGradient id="gt" gradientUnits="userSpaceOnUse" x1="${n(sc0)}" x2="${n(sc0 + u.ancho * sc)}" y1="0" y2="0"><stop offset="0" stop-color="${tema.oscuro ? '#7FA6FF' : tema.a}"/><stop offset="1" stop-color="${tema.oscuro ? '#3FD0EE' : tema.b}"/></linearGradient></defs>${texto}`
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
${texto}${extra}
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

// ---------- Video del stand: lema → cuenta regresiva → invitación a la web ----------
const ESTRENO = (() => {
  const src = readFileSync(join(ROOT, 'src/lib/launch.ts'), 'utf8')
  const iso = src.match(/LAUNCH_DATE = new Date\('([^']+)'\)/)?.[1]
  if (!iso) throw new Error('No se encontró LAUNCH_DATE en src/lib/launch.ts')
  const fecha = new Date(iso)
  const dia = fecha.toLocaleDateString('en-CA', { timeZone: 'America/Tegucigalpa' }) // AAAA-MM-DD
  const texto = fecha.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Tegucigalpa' }).replace(',', '')
  return { dia, texto }
})()
const hoyHN = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tegucigalpa' })
const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
const sumarDias = (d, k) => new Date(Date.parse(d) + k * 86400000).toISOString().slice(0, 10)

const F_STAND = { ...FORMATOS.horizontal, S: 3.3, cyLema: 285, lemaY: 395, lemaPx: 86 }
const T_STAND = 20
const QR = (() => {
  const { size, data } = QRCode.create(WEB, { errorCorrectionLevel: 'M' }).modules
  return { size, data }
})()

/** Aparición y salida de un elemento: sube al entrar, se va hacia arriba al salir. */
function pieza(t, entra, sale, contenido, i = 0) {
  const a = span(t, entra + i * 0.14, entra + 0.55 + i * 0.14), b = span(t, sale + i * 0.05, sale + 0.4 + i * 0.05)
  if (a <= 0 || b >= 1) return ''
  const dy = (1 - outBack(a)) * 46 - inOutCubic(b) * 34
  return `<g opacity="${n(Math.min(1, a * 2) * (1 - b))}" transform="translate(0 ${n(dy)})">${contenido}</g>`
}

function escenasStand(t, dias) {
  const W = F_STAND.W, cx = W / 2
  let out = `<defs><linearGradient id="gn" gradientUnits="userSpaceOnUse" x1="${cx - 260}" x2="${cx + 260}" y1="0" y2="0"><stop offset="0" stop-color="#7FA6FF"/><stop offset="1" stop-color="#3FD0EE"/></linearGradient></defs>`

  // Escena B · expectativa y cuenta regresiva (6.8–12.6 s)
  const B0 = 6.8, B1 = 12.6
  if (t > B0 && t < B1 + 0.6) {
    out += pieza(t, B0, B1, escribir('Pronto, encontrar abogado será así de fácil', 54, cx, 590, '#C9D8FF', { ancla: 'centro' }), 0)
    const visto = dias + Math.round((1 - outCubic(span(t, B0 + 0.3, B0 + 1.9))) * 14)
    const antes = dias === 1 ? 'Falta' : 'Faltan', despues = dias === 1 ? 'día' : 'días'
    const wA = medir(antes, 80), wN = medir(String(dias), 240, '800'), wD = medir(despues, 80), hueco = 38
    const x0 = cx - (wA + wN + wD + hueco * 2) / 2, yb = 815
    const latido = 1 + 0.035 * Math.max(0, Math.sin(TAU * (t - B0 - 2))) * span(t, B0 + 2, B0 + 2.2)
    const xN = x0 + wA + hueco + wN / 2
    const numero = `<g transform="translate(${n(xN)} ${yb - 86}) scale(${n(latido)}) translate(${n(-xN)} ${-(yb - 86)})">${escribir(String(visto), 240, xN, yb, 'url(#gn)', { peso: '800', ancla: 'centro' })}</g>`
    out += pieza(t, B0, B1, escribir(antes, 80, x0, yb, '#FFFFFF') + numero + escribir(despues, 80, x0 + wA + wN + hueco * 2, yb, '#FFFFFF'), 1)
    out += pieza(t, B0, B1, escribir(`Estreno: ${ESTRENO.texto}`, 50, cx, 925, '#8FDDF2', { ancla: 'centro' }), 2)
  }

  // Escena C · invitación a la web con QR (13.1–19.0 s)
  const C0 = 13.1, C1 = 19.0
  if (t > C0 && t < C1 + 0.6) {
    const titulo = 'Regístrese hoy y entre primero', sub = 'Escanee el código con su celular'
    const web = WEB.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const wT = medir(titulo, 68, '800'), wP = medir(web, 36, '800') + 56, lado = 340, hueco = 100
    const x0 = cx - (Math.max(wT, wP) + hueco + lado) / 2, xq = x0 + Math.max(wT, wP) + hueco, yq = 555
    out += pieza(t, C0, C1, escribir(titulo, 68, x0, 660, '#FFFFFF', { peso: '800' }), 0)
    out += pieza(t, C0, C1, escribir(sub, 46, x0, 738, '#C9D8FF'), 1)
    out += pieza(t, C0, C1, `<rect x="${n(x0)}" y="790" width="${n(wP)}" height="72" rx="36" fill="#FFFFFF" fill-opacity=".1" stroke="#8FDDF2" stroke-opacity=".55" stroke-width="2"/>${escribir(web, 36, x0 + 28, 839, '#8FDDF2', { peso: '800' })}`, 2)
    // Ondas que salen del código para llamar la vista
    let ondas = ''
    for (const fase of [0, 0.5]) {
      const k = ((t - C0) / 2.4 + fase) % 1, crece = 70 * k
      ondas += `<rect x="${n(xq - crece)}" y="${n(yq - crece)}" width="${n(lado + crece * 2)}" height="${n(lado + crece * 2)}" rx="${n(30 + crece)}" fill="none" stroke="#3FD0EE" stroke-width="3" opacity="${n(0.55 * (1 - k))}"/>`
    }
    const margen = 30, m = (lado - margen * 2) / QR.size
    let d = ''
    for (let r = 0; r < QR.size; r++) for (let c = 0; c < QR.size; c++) if (QR.data[r * QR.size + c]) d += `M${n(xq + margen + c * m)} ${n(yq + margen + r * m)}h${n(m + 0.4)}v${n(m + 0.4)}h${n(-m - 0.4)}z`
    out += pieza(t, C0, C1, `${ondas}<rect x="${n(xq)}" y="${yq}" width="${lado}" height="${lado}" rx="30" fill="#FFFFFF"/><path d="${d}" fill="#0E1F47"/>`, 1)
  }
  return out
}

/** Estado del logo y del lema (escena A, 2.3–6.3 s) en el video del stand. */
function estadoStand(t) {
  const N = lema.palabras.length
  return {
    arcoDesde: inOutCubic(span(t, 19.15, 19.8)),
    arcoHasta: outCubic(span(t, 0.4, 1.5)),
    next: span(t, 0.95, 1.6),
    legal: span(t, 1.2, 1.85),
    sube: inOutCubic(span(t, 19.05, 19.65)),
    brillo: t < 6 ? span(t, 2.0, 3.1) : t < 12.8 ? span(t, 8.6, 9.7) : span(t, 15.0, 16.1),
    escala: (0.9 + 0.1 * outBack(span(t, 0.4, 1.9))) * (1 + 0.015 * Math.sin(TAU * t / 5)),
    palabras: lema.palabras.map((_, i) => ({
      entra: span(t, 2.3 + i * 0.2, 2.8 + i * 0.2),
      salto: span(t, 4.5 + i * 0.13, 5.05 + i * 0.13),
      sale: span(t, 6.1 + i * 0.06, 6.5 + i * 0.06),
    })),
    raya: outCubic(span(t, 2.4 + N * 0.2, 3.1 + N * 0.2)) * (1 - span(t, 6.1, 6.4)),
  }
}
const svgStand = (t, dias) => cuadro(F_STAND, TEMAS.oscuro, t / T_STAND, estadoStand(t), true, escenasStand(t, dias))

async function codificar(F, T, svg, salida) {
  mkdirSync(dirname(salida), { recursive: true })
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${F.W}x${F.H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', salida], { stdio: ['pipe', 'inherit', 'inherit'] })
  const fin = new Promise((ok, mal) => ff.on('close', (c) => (c === 0 ? ok() : mal(new Error(`ffmpeg salió con ${c}`)))))
  for (let i = 0; i < T * FPS; i++) {
    const raw = await sharp(Buffer.from(svg(i / FPS))).removeAlpha().raw().toBuffer()
    if (!ff.stdin.write(raw)) await new Promise((r) => ff.stdin.once('drain', r))
  }
  ff.stdin.end()
  await fin
  console.log('ok', salida)
}

const args = process.argv.slice(2)
const iCuadro = args.indexOf('--cuadro')
const tCuadro = iCuadro >= 0 ? Number(args[iCuadro + 1]) : null
const foto = async (svg, nombre) => {
  const png = join(process.env.CUADROS ?? OUT, `${nombre}-${tCuadro}s.png`)
  await sharp(Buffer.from(svg)).png().toFile(png)
  console.log('ok', png)
}

if (args.includes('estreno')) {
  const iDia = args.indexOf('--dia')
  const desde = iDia >= 0 ? args[iDia + 1] : hoyHN()
  const dias = args.includes('--todos') ? Array.from({ length: Math.max(0, diasEntre(desde, ESTRENO.dia)) }, (_, k) => sumarDias(desde, k)) : [desde]
  for (const dia of dias) {
    const faltan = diasEntre(dia, ESTRENO.dia)
    if (faltan < 1) { console.log(`${dia}: el estreno (${ESTRENO.dia}) ya llegó; no se genera`); continue }
    const nombre = `next-legal-estreno-${dia}-${faltan === 1 ? 'falta-1-dia' : `faltan-${faltan}-dias`}`
    if (tCuadro !== null) await foto(svgStand(tCuadro, faltan), nombre)
    else await codificar(F_STAND, T_STAND, (t) => svgStand(t, faltan), join(OUT, 'estreno', `${nombre}.mp4`))
  }
} else {
  const formatos = args.filter((a) => a in FORMATOS)
  const nombres = args.filter((a) => a in VIDEOS)
  for (const formato of formatos.length ? formatos : Object.keys(FORMATOS)) {
    for (const nombre of nombres.length ? nombres : Object.keys(VIDEOS)) {
      const F = FORMATOS[formato], v = VIDEOS[nombre]
      if (tCuadro !== null) await foto(svgEn(F, v, tCuadro), `${formato}-${nombre}`)
      else await codificar(F, v.T, (t) => svgEn(F, v, t), join(OUT, formato, v.archivo))
    }
  }
}
