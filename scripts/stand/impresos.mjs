// Genera los QR y las piezas impresas del stand: acrílico (doble cara, carta), flyer (carta) y los QR sueltos.
// Uso: node scripts/stand/impresos.mjs   → marca/09-stand/{qr,acrilicos,flyer}
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'
import QRCode from 'qrcode'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = join(ROOT, 'marca/09-stand')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const WEB = 'https://miguelet3s-star.github.io/next-legal/'
const IG = 'https://www.instagram.com/nextlegalhn/'
const FORM = 'https://forms.gle/wK3WDjRJYFCfWh4z8'
const url = (p) => pathToFileURL(join(ROOT, p)).href
const TINTA = '#0E1F47'

function qrSvg(texto, color = TINTA) {
  const { size, data } = QRCode.create(texto, { errorCorrectionLevel: 'H' }).modules
  let r = ''
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (data[y * size + x]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${size + 4} ${size + 4}" fill="${color}" shape-rendering="crispEdges">${r}</svg>`
}
const QRS = { web: qrSvg(WEB), instagram: qrSvg(IG), encuesta: qrSvg(FORM) }
mkdirSync(join(OUT, 'qr'), { recursive: true })
for (const [n, svg] of Object.entries(QRS)) {
  writeFileSync(join(OUT, 'qr', `qr-${n}.svg`), svg)
  await sharp(Buffer.from(svg), { density: 300 }).resize(1500, 1500).flatten({ background: '#fff' }).png().toFile(join(OUT, 'qr', `qr-${n}.png`))
}

const CSS = `
@font-face{font-family:Manrope;font-weight:400;src:url(${url('marca/04-tipografia/manrope-latin-400-normal.woff')})}
@font-face{font-family:Manrope;font-weight:700;src:url(${url('marca/04-tipografia/manrope-latin-700-normal.woff')})}
@font-face{font-family:Manrope;font-weight:800;src:url(${url('marca/04-tipografia/manrope-latin-800-normal.woff')})}
@page{size:8.5in 11in;margin:0}
*{box-sizing:border-box;margin:0}
html,body{width:8.5in;height:11in;font-family:Manrope,sans-serif;color:${TINTA};background:#fff}
.pag{width:8.5in;height:11in;padding:12mm;display:flex;flex-direction:column;page-break-after:always;overflow:hidden}
.pag:last-child{page-break-after:auto}
.cab{background:${TINTA};border-radius:7mm;height:58mm;display:grid;place-items:center;position:relative;overflow:hidden}
.cab::after{content:'';position:absolute;left:-10mm;right:-10mm;bottom:-31mm;height:40mm;border-radius:50%;border-top:2.4mm solid rgba(23,179,214,.3)}
.cab img{height:30mm;position:relative;z-index:1}
.kick{margin-top:11mm;text-align:center;font-weight:800;font-size:12pt;letter-spacing:.2em;text-transform:uppercase;color:#0e7f99}
h1{margin-top:3mm;text-align:center;font-weight:800;font-size:36pt;line-height:1.05;letter-spacing:-.01em}
.qrc{position:relative;margin:8mm auto 0;width:104mm;height:104mm;padding:5mm;border-radius:7mm;background:#fff;border:.8mm solid ${TINTA}}
.qrc::before,.qrc::after{content:'';position:absolute;width:20mm;height:20mm;border:2.2mm solid #17B3D6}
.qrc::before{left:-3.5mm;top:-3.5mm;border-right:0;border-bottom:0;border-radius:6mm 0 0 0}
.qrc::after{right:-3.5mm;bottom:-3.5mm;border-left:0;border-top:0;border-radius:0 0 6mm 0}
.qrc svg{width:100%;height:100%;display:block}
.pie{margin-top:auto;padding-top:7mm;text-align:center}
.pie b{display:block;font-size:17pt;font-weight:800}
.pie span{display:block;margin-top:2mm;font-size:12pt;color:#4b5877}
.tira{margin-top:7mm;background:linear-gradient(90deg,#1E5BFF,#17B3D6);color:#fff;border-radius:4mm;padding:4mm;text-align:center;font-weight:700;font-size:11.5pt;letter-spacing:.04em}
.usr{margin:5mm 0 0;text-align:center;font-weight:800;font-size:30pt;color:#1E5BFF}
.tres{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm;margin-top:9mm}
.card{border:.7mm solid ${TINTA};border-radius:5mm;padding:4mm 4mm 5mm;text-align:center}
.card .q{width:100%;aspect-ratio:1}.card .q svg{width:100%;height:100%;display:block}
.card b{display:block;margin-top:3mm;font-size:13pt;font-weight:800}
.card span{display:block;margin-top:1mm;font-size:9.5pt;color:#4b5877}
`
const LOGO = url('marca/01-logo/nextlegal-logo-blanco.png')
const LOGO_C = url('marca/01-logo/nextlegal-logo-color.png')
const cabecera = `<div class="cab"><img src="${LOGO}"></div>`

const ACRILICO_A = `<div class="pag">${cabecera}
<p class="kick">Escanee con su celular</p>
<h1>Conozca<br>Next Legal</h1>
<div class="qrc">${QRS.web}</div>
<div class="pie"><b>El abogado que usted necesita, a un toque de distancia.</b><span>Apunte la cámara al código y entre a nuestra página.</span></div>
<div class="tira">MUY PRONTO · TECNOLOGÍA LEGAL HECHA EN HONDURAS</div></div>`
const ACRILICO_B = `<div class="pag">${cabecera}
<p class="kick">Síganos en redes</p>
<h1>Siga a<br>Next Legal</h1>
<div class="qrc">${QRS.instagram}</div>
<p class="usr">@nextlegalhn</p>
<div class="pie"><span>Apunte la cámara al código y pulse «Seguir» en Instagram.</span></div>
<div class="tira">NEXT LEGAL · INSTAGRAM</div></div>`
const FLYER = `<div class="pag">${cabecera}
<p class="kick">Muy pronto</p>
<h1>El abogado que usted necesita,<br>a un toque de distancia</h1>
<div class="tres">
 <div class="card"><div class="q">${QRS.web}</div><b>Conozca la web</b><span>Entre a Next Legal</span></div>
 <div class="card"><div class="q">${QRS.instagram}</div><b>@nextlegalhn</b><span>Síganos en Instagram</span></div>
 <div class="card"><div class="q">${QRS.encuesta}</div><b>Su opinión</b><span>Responda la encuesta</span></div>
</div>
<div class="pie"><b>Apunte la cámara de su celular a cada código.</b><span>Next Legal · Tecnología legal hecha en Honduras</span></div>
<div class="tira">ENTIENDA SU CASO · CONOZCA SU TARIFA · DE UN SOLO TOQUE</div></div>`

const html = (cuerpo) => `<!doctype html><html lang="es"><meta charset="utf-8"><style>${CSS}</style><body>${cuerpo}</body></html>`
const piezas = [
  ['acrilicos/acrilico-carta-doble-cara', ACRILICO_A + ACRILICO_B, 2],
  ['acrilicos/acrilico-cara-A-web', ACRILICO_A, 1],
  ['acrilicos/acrilico-cara-B-instagram', ACRILICO_B, 1],
  ['flyer/flyer-carta', FLYER, 1],
]
const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
for (const [nombre, cuerpo, paginas] of piezas) {
  mkdirSync(dirname(join(OUT, nombre)), { recursive: true })
  const f = join(OUT, nombre + '.html')
  writeFileSync(f, html(cuerpo))
  const p = await nav.newPage()
  await p.setViewport({ width: 816, height: 1056, deviceScaleFactor: 3.125 })
  await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0' })
  await p.evaluate(() => document.fonts.ready)
  await p.pdf({ path: join(OUT, nombre + '.pdf'), width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true })
  if (paginas === 1) await p.screenshot({ path: join(OUT, nombre + '.png'), clip: { x: 0, y: 0, width: 816, height: 1056 } })
  await p.close()
  await sharp(join(OUT, nombre + '.html')).metadata().catch(() => {})
}
await nav.close()
console.log('listo')
