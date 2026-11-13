// Graba los videos del stand (1920×1080, 30 cuadros/s, MP4 en bucle) a partir de scripts/stand/escena.html.
// Uso: node scripts/stand/grabar.mjs [escena…] [--prueba] [--foto <segundo>]
//   sin argumentos → graba las seis en marca/08-videos/stand/
//   --prueba       → corre cada escena a velocidad real sin grabar y dice cuánto dura (para ajustar T)
//   --foto 9       → guarda solo ese instante como PNG
// Cómo graba: dentro de la página el reloj corre LENTO veces más despacio (temporizadores, fechas y
// animaciones), y se toma una captura cada LENTO/30 s. Así cada cuadro sale completo aunque la captura tarde.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { createServer } from 'vite'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = join(ROOT, 'marca/08-videos/stand')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const ESCENAS = ['muy-pronto', 'registro', 'buscar', 'agendar', 'caso', 'despacho']
const NOMBRE = { 'muy-pronto': '01-muy-pronto', registro: '02-registro', buscar: '03-busque-su-abogado', agendar: '04-agende-su-consulta', caso: '05-siga-su-caso', despacho: '06-despacho-del-abogado' }
const FPS = 30, PUERTO = 5199, EN_PARALELO = 3

const args = process.argv.slice(2)
const prueba = args.includes('--prueba')
const iFoto = args.indexOf('--foto')
const foto = iFoto >= 0 ? Number(args[iFoto + 1]) : null
const LENTO = prueba ? 1 : Number(process.env.LENTO ?? 12)
const elegidas = args.filter((a) => ESCENAS.includes(a))
const lista = elegidas.length ? elegidas : ESCENAS

/** Reloj lento: se inyecta en la página y en la app que lleva dentro, antes de cualquier otro código. */
function relojLento(K) {
  if (K === 1) return
  const real = performance.now.bind(performance), t0 = real(), d0 = Date.now(), Fecha = Date
  const ahora = () => t0 + (real() - t0) / K
  performance.now = ahora
  window.Date = class extends Fecha {
    constructor(...a) { if (a.length) super(...a); else super(d0 + (Fecha.now() - d0) / K) }
    static now() { return d0 + (Fecha.now() - d0) / K }
  }
  const st = window.setTimeout, si = window.setInterval, raf = window.requestAnimationFrame
  window.setTimeout = (f, ms = 0, ...a) => st(f, ms * K, ...a)
  window.setInterval = (f, ms = 0, ...a) => si(f, ms * K, ...a)
  window.requestAnimationFrame = (f) => raf(() => f(ahora()))
  // Animaciones y transiciones de CSS: cada una que aparece se pone a 1/K de velocidad.
  const vistas = new WeakSet()
  const frenar = () => {
    for (const a of document.getAnimations()) if (!vistas.has(a)) { vistas.add(a); a.playbackRate = 1 / K }
    raf(frenar)
  }
  raf(frenar)
}

async function grabar(navegador, id) {
  const pagina = await navegador.newPage()
  await pagina.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  await pagina.evaluateOnNewDocument(relojLento, LENTO)
  pagina.on('pageerror', (e) => console.error(`[${id}] error en la página:`, e.message))
  await pagina.goto(`http://localhost:${PUERTO}/scripts/stand/escena.html?v=${id}`, { waitUntil: 'load' })
  await pagina.waitForFunction('window.__listo || window.__error', { timeout: 120000 * LENTO })
  const fallo = () => pagina.evaluate('window.__error')
  if (await fallo()) throw new Error(`[${id}] ${await fallo()}`)
  const T = await pagina.evaluate('window.__T')
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

  if (prueba || foto !== null) {
    await pagina.evaluate('window.__empezar()')
    if (foto !== null) {
      await dormir(foto * 1000 * LENTO)
      mkdirSync(process.env.CUADROS ?? OUT, { recursive: true })
      const png = join(process.env.CUADROS ?? OUT, `${NOMBRE[id]}-${foto}s.png`)
      await pagina.screenshot({ path: png })
      console.log('ok', png)
    } else {
      await pagina.waitForFunction('window.__fin || window.__error', { timeout: 120000 })
      console.log(`[${id}] T = ${T} s · la escena termina a los ${(await pagina.evaluate('window.__fin'))?.toFixed(1)} s`, (await fallo()) ?? '')
    }
    await pagina.close()
    return
  }

  mkdirSync(OUT, { recursive: true })
  const salida = join(OUT, `next-legal-stand-${NOMBRE[id]}.mp4`)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', salida], { stdio: ['pipe', 'inherit', 'inherit'] })
  const fin = new Promise((ok, mal) => ff.on('close', (c) => (c === 0 ? ok() : mal(new Error(`ffmpeg salió con ${c}`)))))
  const paso = 1000 * LENTO / FPS, total = T * FPS
  let atraso = 0
  await pagina.evaluate('window.__empezar()')
  const inicio = Date.now()
  for (let i = 0; i < total; i++) {
    const falta = inicio + i * paso - Date.now()
    if (falta > 0) await dormir(falta); else atraso = Math.max(atraso, -falta)
    const png = await pagina.screenshot({ type: 'png', optimizeForSpeed: true })
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r))
  }
  ff.stdin.end()
  await fin
  const termino = await pagina.evaluate('window.__fin')
  const error = await fallo()
  console.log(`ok ${salida} · escena terminó a los ${termino?.toFixed(1) ?? '¿?'} s de ${T} · atraso máx. ${(atraso / LENTO).toFixed(0)} ms`, error ? `· ERROR: ${error}` : '')
  if (error || !termino || termino > T - 0.3) process.exitCode = 1
  await pagina.close()
}

const servidor = await createServer({ root: ROOT, logLevel: 'error', server: { port: PUERTO, strictPort: true } })
await servidor.listen()
try {
  // Primera visita: Vite prepara las dependencias (y recarga la página) antes de grabar en serio.
  const calienta = await puppeteer.launch({ executablePath: CHROME, headless: true })
  const p = await calienta.newPage()
  await p.goto(`http://localhost:${PUERTO}/scripts/stand/escena.html?v=muy-pronto`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 4000))
  await calienta.close()

  const cola = [...lista]
  const obrero = async () => {
    for (let id = cola.shift(); id; id = cola.shift()) {
      // Un navegador por escena: cada una empieza con los datos de muestra limpios.
      const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--window-size=1920,1080', '--hide-scrollbars', '--force-device-scale-factor=1'] })
      try { await grabar(navegador, id) } catch (e) { console.error(e.message); process.exitCode = 1 } finally { await navegador.close() }
    }
  }
  await Promise.all(Array.from({ length: Math.min(EN_PARALELO, lista.length) }, obrero))
} finally {
  await servidor.close()
}
process.exit(process.exitCode ?? 0)
