// Acrílico de doble cara (sku 30096): cada cara es un panel apaisado de 27.9 × 8.5 cm, con la lógica de la viñeta
// (banda de marcas + mensaje) más QR. Salida en marca/stand/: hoja carta y A4 con las dos caras,
// y cada cara suelta en PNG a 300 dpi. Variante «sin-aliados» sin logos de terceros.
// Uso: node scripts/stand/acrilico.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'
import { tmpdir } from 'node:os'
const TMP = join(tmpdir(), 'nl-fuente')
mkdirSync(TMP, { recursive: true })

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = join(ROOT, 'marca/stand')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const f = (p) => pathToFileURL(join(ROOT, p)).href
const qr = (n) => readFileSync(join(ROOT, `marca/stand/qr-${n}.svg`), 'utf8')
const TINTA = '#0E1F47'
const ALIADOS = ['cah', 'ccit', 'ccic', 'cohep', 'ahm', 'unah', 'uth', 'consortium', 'arias', 'garciabodan']
const W = 27.9, H = 8.5 // cm

const CSS = `
@font-face{font-family:M;font-weight:400;src:url(${f('marca/identidad/manrope-latin-500-normal.woff')})}
@font-face{font-family:M;font-weight:700;src:url(${f('marca/identidad/manrope-latin-700-normal.woff')})}
@font-face{font-family:M;font-weight:800;src:url(${f('marca/identidad/manrope-latin-800-normal.woff')})}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:M,sans-serif;color:${TINTA};background:#fff}
.hoja{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2cm;page-break-after:always}
.rot{font-size:8pt;font-weight:700;letter-spacing:.14em;color:#8a96b4;text-transform:uppercase;text-align:center;margin-bottom:.15cm}
.panel{position:relative;width:${W}cm;height:${H}cm;background:#fff;padding:.7cm;display:grid;grid-template-columns:1fr 5.4cm;grid-template-rows:1fr 1.5cm;column-gap:.9cm;row-gap:.35cm;outline:.02cm solid #c8d0e4}
.info{display:flex;flex-direction:column;justify-content:center;min-width:0}
.marca{display:flex;align-items:center;gap:.5cm}
.marca img{height:1.45cm}
.marca i{width:.04cm;height:1.1cm;background:${TINTA};opacity:.35}
.marca span{font-size:8.5pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0e7f99;line-height:1.35}
h1{margin-top:.4cm;font-weight:800;font-size:40pt;line-height:1.05;letter-spacing:-.015em}
h1 em{font-style:normal;color:#1E5BFF}
.sub{margin-top:.3cm;font-size:13pt;font-weight:400;color:#3f4d70}
.sub b{color:${TINTA};font-weight:800}
.qrc{position:relative;align-self:center;justify-self:center;width:5.3cm;height:5.3cm;padding:.25cm;border-radius:.45cm;background:#fff;border:.05cm solid ${TINTA}}
.qrc::before,.qrc::after{content:'';position:absolute;width:1.2cm;height:1.2cm;border:.13cm solid #17B3D6}
.qrc::before{left:-.2cm;top:-.2cm;border-right:0;border-bottom:0;border-radius:.35cm 0 0 0}
.qrc::after{right:-.2cm;bottom:-.2cm;border-left:0;border-top:0;border-radius:0 0 .35cm 0}
.qrc svg{width:100%;height:100%;display:block}
.banda{grid-column:1/3;background:${TINTA};border-radius:.35cm;display:flex;align-items:center;justify-content:space-between;padding:0 .6cm;gap:.3cm}
.banda img{height:.7cm;width:auto}
.banda .nl{height:.8cm}
.banda p{color:#fff;font-weight:700;font-size:10.5pt;letter-spacing:.08em;width:100%;text-align:center}
`
const logos = (sinAliados) => sinAliados
  ? `<p>TECNOLOGÍA LEGAL HECHA EN HONDURAS · MUY PRONTO</p>`
  : ALIADOS.map((a) => `<img src="${f(`public/aliados/${a}.png`)}" alt="">`).join('')

const cara = (c, sinAliados) => `<div><div class="rot">${c.rot}</div><div class="panel">
 <div class="info"><div class="marca"><img src="${f('marca/identidad/nextlegal-logo-color.png')}"><i></i><span>${c.kick}</span></div>
 <h1>${c.h1}</h1><p class="sub">${c.sub}</p></div>
 <div class="qrc">${qr(c.qr)}</div>
 <div class="banda">${logos(sinAliados)}</div></div></div>`

const CARAS = {
  A: { rot: 'Cara A · Web', qr: 'web', kick: 'Muy pronto<br>Tecnología legal hecha en Honduras', h1: 'Conozca <em>Next Legal</em>', sub: 'El abogado que usted necesita, a un toque de distancia.<br><b>Escanee el código con la cámara de su celular.</b>' },
  B: { rot: 'Cara B · Redes', qr: 'instagram', kick: 'Síganos en redes<br>Next Legal Honduras', h1: 'Siga a <em>@nextlegalhn</em>', sub: 'Novedades, consejos legales y el lanzamiento.<br><b>Escanee y pulse «Seguir» en Instagram.</b>' },
}
const hoja = (s) => `<div class="hoja">${cara(CARAS.A, s)}${cara(CARAS.B, s)}</div>`
const doc = (cuerpo, size) => `<!doctype html><meta charset="utf-8"><style>@page{size:${size};margin:0}${CSS}html,body{width:100%}.hoja{height:100vh}</style><body>${cuerpo}</body>`

mkdirSync(OUT, { recursive: true })
const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
const pagina = async (file) => { const p = await nav.newPage(); await p.goto(pathToFileURL(file).href, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready); return p }
for (const [sufijo, s] of [['', false], ['-sin-aliados', true]]) {
  for (const [tam, css, w, h] of [['carta', 'letter landscape', '11in', '8.5in'], ['A4', 'A4 landscape', '297mm', '210mm']]) {
    const file = join(TMP, `acrilico-28x8.5-${tam}${sufijo}.html`)
    writeFileSync(file, doc(hoja(s), css))
    const p = await pagina(file)
    await p.pdf({ path: join(OUT, `acrilico-28x8.5-${tam}${sufijo}.pdf`), width: w, height: h, printBackground: true, preferCSSPageSize: true })
    await p.close()
  }
  // cada cara suelta a 300 dpi (27.9 cm = 3295 px)
  for (const k of ['A', 'B']) {
    const file = join(TMP, `cara-${k}${sufijo}.html`)
    writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${CSS}body{width:${W}cm;height:${H}cm}.rot{display:none}</style><body>${cara(CARAS[k], s)}</body>`)
    const p = await pagina(file)
    const px = (cm) => Math.round(cm / 2.54 * 96)
    await p.setViewport({ width: px(W), height: px(H), deviceScaleFactor: 300 / 96 })
    await p.screenshot({ path: join(OUT, `acrilico-28x8.5-cara-${k}-${k === 'A' ? 'web' : 'instagram'}${sufijo}.png`), clip: { x: 0, y: 0, width: px(W), height: px(H) } })
    await p.close()
  }
}
await nav.close()
console.log('listo')
