// Escenario de los videos del stand. Se abre con ?v=<escena> y lo graba scripts/stand/grabar.mjs.
// Cada video empieza y termina en la misma "tarjeta" (logo, «Muy pronto» y QR) para repetirse sin corte;
// en medio, la app real se maneja sola dentro de un teléfono o una ventana.
import '@fontsource-variable/manrope'
import QRCode from 'qrcode'
import logoSvg from '../../marca/identidad/nextlegal-logo-blanco.svg?raw'

/** A dónde lleva el QR. No se muestra escrita en ningún video. */
const WEB = 'https://nextlegalhn.github.io/'
const SESION = 'nextlegal.session.v1'

const $ = (s) => document.querySelector(s)
const lienzo = $('#lienzo'), logo = $('#logo'), pronto = $('#pronto'), qr = $('#qr'), une = $('#une')
const titulo = $('#titulo'), equipo = $('#equipo'), app = $('#app'), dedo = $('#dedo')
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const suave = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2)

// ---------- Piezas de marca ----------
function montarLogo() {
  logo.innerHTML = logoSvg
  const svg = logo.querySelector('svg')
  svg.removeAttribute('width'); svg.removeAttribute('height')
  const [arco, next, legal] = svg.querySelectorAll('path')
  arco.classList.add('arco-logo')
  next.parentNode.classList.add('palabra')
  legal.parentNode.classList.add('palabra', 'legal')
  // Destello que recorre el arco y "Legal" (recortado a su forma).
  const ns = 'http://www.w3.org/2000/svg'
  const defs = svg.querySelector('defs')
  defs.insertAdjacentHTML('beforeend', `<linearGradient id="luz" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="zona"></clipPath>`)
  const zona = svg.querySelector('#zona')
  zona.append(arco.cloneNode(), legal.cloneNode())
  zona.firstChild.removeAttribute('class'); zona.firstChild.removeAttribute('fill')
  const g = document.createElementNS(ns, 'g')
  g.setAttribute('clip-path', 'url(#zona)')
  g.innerHTML = '<rect class="destello" x="-20" y="30" width="46" height="100" fill="url(#luz)" transform="skewX(-18)"/>'
  svg.append(g)
}

function montarPronto() {
  const letras = [...pronto.textContent]
  const mezcla = (k) => `rgb(${Math.round(255 - 192 * k)}, ${Math.round(255 - 47 * k)}, ${Math.round(255 - 17 * k)})`
  pronto.innerHTML = letras.map((ch, i) => `<span style="--i:${i};color:${mezcla(Math.max(0, (i - 3) / (letras.length - 4)))}">${ch}</span>`).join('')
}

function montarQr() {
  const { size, data } = QRCode.create(WEB, { errorCorrectionLevel: 'M' }).modules
  let rects = ''
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!data[r * size + c]) continue
    const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 60
    rects += `<rect x="${c}" y="${r}" width="1.03" height="1.03" style="--dx:${(Math.cos(ang) * dist).toFixed(1)}px;--dy:${(Math.sin(ang) * dist).toFixed(1)}px;--d:${Math.round(Math.random() * 500)}"/>`
  }
  qr.querySelector('.qr-carta').innerHTML = `<svg viewBox="0 0 ${size} ${size}" fill="#0e1f47" shape-rendering="crispEdges">${rects}</svg>`
}

function montarMotas() {
  let html = ''
  for (let i = 0; i < 26; i++) {
    const t = 4 + Math.round(Math.random() * 3), div = [1, 2, 2, 3][i % 4]
    html += `<i style="left:${(Math.random() * 100).toFixed(1)}%;width:${t}px;height:${t}px;--o:${(0.25 + Math.random() * 0.45).toFixed(2)};animation-duration:calc(var(--T) / ${div});animation-delay:calc(var(--T) * -${Math.random().toFixed(3)})"></i>`
  }
  $('#motas').innerHTML = html
}

function ponerTitulo(texto, acento) {
  titulo.innerHTML = texto.split(' ').map((w, i) => `<span style="--i:${i}" class="${acento.includes(w) ? 'acento' : ''}">${w} </span>`).join('')
}

// ---------- Manejo de la app dentro del equipo ----------
const W = () => app.contentWindow
const uno = (sel) => app.contentDocument.querySelector(sel)
const conTexto = (sel, txt) => [...app.contentDocument.querySelectorAll(sel)].find((e) => e.textContent.replace(/\s+/g, ' ').includes(txt) && e.getClientRects().length > 0)
async function hasta(fn, ms = 6000) {
  const t0 = performance.now()
  for (;;) {
    const v = fn()
    if (v) return v
    if (performance.now() - t0 > ms) throw new Error(`No apareció: ${fn}`)
    await esperar(60)
  }
}
async function abrir(ruta) {
  await new Promise((ok) => { app.onload = ok; app.src = ruta })
  await hasta(() => app.contentDocument.querySelector('#root')?.children.length)
  await esperar(500)
}
async function desplazar(dy, ms = 900) {
  const w = W(), y0 = w.scrollY, t0 = performance.now()
  await new Promise((ok) => {
    const paso = () => {
      const k = Math.min(1, (performance.now() - t0) / ms)
      w.scrollTo({ top: y0 + dy * suave(k), behavior: 'instant' })
      if (k < 1) requestAnimationFrame(paso); else ok()
    }
    paso()
  })
}
async function aLaVista(el) {
  const alto = W().innerHeight, r = el.getBoundingClientRect()
  if (r.top < 110 || r.bottom > alto - 130) await desplazar(r.top + r.height / 2 - alto * 0.45, 800)
}
async function tocar(el, pausa = 420) {
  if (!el) throw new Error('No se encontró el elemento a tocar')
  await aLaVista(el)
  const r = el.getBoundingClientRect()
  dedo.style.opacity = 1
  dedo.style.left = `${r.left + r.width / 2}px`
  dedo.style.top = `${r.top + r.height / 2}px`
  await esperar(600)
  dedo.classList.add('toque')
  await esperar(170)
  el.click()
  await esperar(260)
  dedo.classList.remove('toque')
  await esperar(pausa)
}
async function teclear(el, texto) {
  await tocar(el, 150)
  el.focus({ preventScroll: true })
  const proto = el.tagName === 'TEXTAREA' ? W().HTMLTextAreaElement.prototype : W().HTMLInputElement.prototype
  const poner = Object.getOwnPropertyDescriptor(proto, 'value').set
  for (let i = 1; i <= texto.length; i++) {
    poner.call(el, texto.slice(0, i))
    el.dispatchEvent(new (W().Event)('input', { bubbles: true }))
    await esperar(46)
  }
  await esperar(350)
}
const ocultarDedo = () => { dedo.style.opacity = 0 }

// ---------- Escenas ----------
const ESCENAS = {
  'muy-pronto': { T: 12 },

  registro: {
    T: 20, titulo: 'Regístrese en un minuto', acento: ['minuto'], equipo: 'telefono', inicio: '/?embed',
    async preparar() {
      const f = await hasta(() => uno('#unete .lx-form-card'))
      // La portada revela cada bloque al entrar en pantalla; aquí el teléfono aún está fuera de cuadro.
      for (const el of app.contentDocument.querySelectorAll('[data-reveal]')) el.classList.add('is-in')
      W().scrollTo({ top: f.getBoundingClientRect().top + W().scrollY - 96, behavior: 'instant' })
      await esperar(600)
    },
    async correr() {
      await esperar(500)
      await teclear(uno('#unete input[autocomplete="name"]'), 'María López')
      await teclear(uno('#unete input[type="email"]'), 'maria.lopez@gmail.com')
      await tocar(conTexto('#unete .lx-picks button', 'Despido o salario'))
      await tocar(conTexto('#unete button', 'Crear mi cuenta'), 300)
      ocultarDedo()
      const t = await hasta(() => uno('.lx-ticket'))
      await desplazar(t.getBoundingClientRect().top - 110, 800)
      await esperar(3200)
    },
  },

  buscar: {
    T: 21, titulo: 'Encuentre a su abogado', acento: ['abogado'], equipo: 'telefono', inicio: '/inicio?embed', sesion: 'cliente',
    async correr() {
      await esperar(400)
      await teclear(uno('.hero-search input'), 'me despidieron')
      await tocar(uno('.hero-search .btn'), 300)
      ocultarDedo()
      await hasta(() => uno('.lawyer-result'))
      await esperar(900)
      await desplazar(430, 1700)
      await esperar(500)
      await tocar([...app.contentDocument.querySelectorAll('.lawyer-result .btn-outline')].find((e) => e.getBoundingClientRect().top > 150))
      ocultarDedo()
      await hasta(() => uno('.lawyer-page'))
      await esperar(1100)
      await desplazar(520, 1900)
      await esperar(1300)
    },
  },

  agendar: {
    T: 25, titulo: 'Agende su consulta en línea', acento: ['en', 'línea'], equipo: 'telefono', inicio: '/buscar?cat=laboral&embed', sesion: 'cliente',
    async preparar() {
      const a = await hasta(() => uno('a[href*="/agendar/"]'))
      await abrir(`${a.getAttribute('href')}?embed`)
    },
    async correr() {
      await esperar(400)
      await teclear(uno('textarea.field'), 'Me despidieron y no me han pagado.')
      await tocar(conTexto('button.btn-primary', 'Continuar'))
      const dias = await hasta(() => { const d = app.contentDocument.querySelectorAll('.day-pill'); return d.length > 1 && d })
      await tocar(dias[1], 250)
      const horas = await hasta(() => { const h = app.contentDocument.querySelectorAll('.slot-group .pill'); return h.length && h })
      await tocar(horas[Math.min(1, horas.length - 1)], 250)
      await tocar(conTexto('button.btn-primary', 'Continuar'))
      await tocar(await hasta(() => conTexto('button.btn-primary', 'Ir a pagar')))
      await tocar(await hasta(() => conTexto('button.btn-primary', 'Pagar')), 200)
      ocultarDedo()
      await hasta(() => uno('.seal-stamp'))
      await esperar(3200)
    },
  },

  caso: {
    T: 24, titulo: 'Siga su caso paso a paso', acento: ['paso', 'a'], equipo: 'telefono', inicio: '/casos?embed', sesion: 'cliente',
    async correr() {
      await esperar(700)
      await tocar(uno('.case-card'), 200)
      ocultarDedo()
      await hasta(() => uno('.folder-head'))
      await esperar(1200)
      await desplazar(560, 2200)
      await esperar(900)
      await desplazar(-330, 1100)
      await tocar(await hasta(() => uno('.folder-person .btn')), 200)
      const caja = await hasta(() => uno('.chat-compose input'))
      await esperar(700)
      await teclear(caja, 'Gracias por el avance. ¿Qué sigue?')
      await tocar(uno('.chat-compose button'), 200)
      ocultarDedo()
      await esperar(2200)
    },
  },

  despacho: {
    T: 22, titulo: 'Su despacho, también en línea', acento: ['despacho,'], equipo: 'ancho', inicio: '/despacho?embed', sesion: 'abogado',
    async correr() {
      await esperar(1500)
      await desplazar(260, 1500)
      await esperar(700)
      await tocar(conTexto('.sidebar .side-link', 'Agenda'), 200)
      await esperar(2000)
      await tocar(conTexto('.sidebar .side-link', 'Expedientes'), 200)
      await esperar(1700)
      await tocar(conTexto('.sidebar .side-link', 'Ingresos'), 200)
      ocultarDedo()
      await esperar(2600)
    },
  },
}

const id = new URLSearchParams(location.search).get('v') ?? 'muy-pronto'
const escena = ESCENAS[id]
if (!escena) throw new Error(`Escena desconocida: ${id}`)
window.__T = escena.T
lienzo.style.setProperty('--T', `${escena.T}s`)

/** Video de marca: la tarjeta se deshace y se vuelve a armar pieza por pieza. */
async function marca() {
  await esperar(1700)
  for (const el of [une, qr, pronto, logo]) { el.classList.add('fuera'); await esperar(170) }
  await esperar(1300)
  logo.classList.remove('fuera'); await esperar(1000)
  pronto.classList.remove('fuera'); await esperar(900)
  qr.classList.remove('fuera'); await esperar(1500)
  une.classList.remove('fuera'); await esperar(900)
  pronto.classList.add('ola'); await esperar(1700); pronto.classList.remove('ola')
}

async function demostracion() {
  await esperar(1500)
  lienzo.classList.replace('card', 'demo')
  await esperar(650)
  titulo.classList.add('ver')
  await esperar(250)
  equipo.classList.add('dentro')
  await esperar(1500)
  await escena.correr()
  equipo.classList.replace('dentro', 'salir')
  titulo.classList.replace('ver', 'salir')
  await esperar(650)
  lienzo.classList.replace('demo', 'card')
  await esperar(1300)
}

async function preparar() {
  montarLogo(); montarPronto(); montarQr(); montarMotas()
  if (escena.equipo) {
    equipo.classList.add(escena.equipo)
    ponerTitulo(escena.titulo, escena.acento)
    if (escena.equipo === 'ancho') titulo.classList.add('estrecho')
    localStorage.clear()
    if (escena.sesion) localStorage.setItem(SESION, JSON.stringify({ role: escena.sesion, userId: escena.sesion === 'cliente' ? 'juan-perez' : 'andrea-castillo' }))
    await abrir(escena.inicio)
    await escena.preparar?.()
  }
  await document.fonts.ready
  await esperar(400)
  window.__listo = true
}

window.__empezar = () => {
  const t0 = performance.now()
  ;(escena.equipo ? demostracion() : marca())
    .then(() => { window.__fin = (performance.now() - t0) / 1000 })
    .catch((e) => { window.__error = String(e?.message ?? e) })
}
preparar().catch((e) => { window.__error = String(e?.message ?? e) })
