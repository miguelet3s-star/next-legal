// Video lento para escanear con calma: un QR grande por vez (Instagram, encuesta y web), 18 s cada uno,
// con pasos escritos y barra de tiempo. Salida: marca/stand/video-qr-lento.mp4 (54 s, bucle).
// Uso: node scripts/stand/cta-lento.mjs   (antes: node scripts/stand/impresos.mjs para los QR)
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'
import { tmpdir } from 'node:os'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = join(ROOT, 'marca/stand')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const qr = (n) => readFileSync(join(ROOT, `marca/stand/qr-${n}.svg`), 'utf8')
const f = (p) => pathToFileURL(join(ROOT, p)).href
const ETAPA = 18, N = 3, DUR = ETAPA * N, FPS_IN = 15

const ETAPAS = [
  { qr: 'instagram', kick: 'Síganos en redes', tit: '@nextlegalhn', sub: 'Siga a Next Legal en Instagram' },
  { qr: 'encuesta', kick: 'Su opinión cuenta', tit: 'Responda la encuesta', sub: 'Le toma menos de un minuto' },
  { qr: 'web', kick: 'Conozca la plataforma', tit: 'Visite Next Legal', sub: 'Entre a nuestra página web' },
]
const pasos = ['Abra la cámara de su celular', 'Apunte al código y espere un segundo', 'Toque el aviso que aparece en pantalla']

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:M;font-weight:400;src:url(${f('marca/identidad/manrope-latin-500-normal.woff')})}
@font-face{font-family:M;font-weight:700;src:url(${f('marca/identidad/manrope-latin-700-normal.woff')})}
@font-face{font-family:M;font-weight:800;src:url(${f('marca/identidad/manrope-latin-800-normal.woff')})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:#0a1736;font-family:M,sans-serif;color:#fff}
#l{position:relative;width:1920px;height:1080px;overflow:hidden;background:radial-gradient(ellipse at 30% 40%,#17378c 0%,#0e1f47 58%,#0a1736 100%)}
.o{position:absolute;border-radius:50%;filter:blur(120px)}
#logo{position:absolute;left:110px;top:70px;height:120px}
.et{position:absolute;inset:0}
.kick{position:absolute;left:110px;top:300px;font-size:30px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#5fd4ee}
.tit{position:absolute;left:110px;top:352px;width:900px;font-size:92px;line-height:1.02;font-weight:800;letter-spacing:-.015em}
.sub{position:absolute;left:110px;top:560px;font-size:38px;color:#c5d2f0}
.pasos{position:absolute;left:110px;top:680px;list-style:none;font-size:32px;color:#fff;font-weight:700}
.pasos li{display:flex;align-items:center;gap:22px;margin-bottom:26px}
.pasos b{display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#1e5bff,#17b3d6);font-size:28px;font-weight:800}
.q{position:absolute;left:1160px;top:170px;width:640px;height:640px;background:#fff;border-radius:44px;padding:26px;box-shadow:0 0 0 14px rgba(255,255,255,.1),0 40px 90px -20px rgba(0,0,0,.6)}
.q svg{width:100%;height:100%;display:block}
.cap{position:absolute;left:1160px;top:846px;width:640px;text-align:center;font-size:30px;color:#c5d2f0}
#barra{position:absolute;left:110px;right:110px;bottom:70px;height:10px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden}
#prog{height:100%;width:0;background:linear-gradient(90deg,#1e5bff,#17b3d6);border-radius:5px}
#pts{position:absolute;right:110px;top:84px;display:flex;gap:16px}
#pts i{width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.25)}
</style><div id="l"><div class="o" id="o1" style="width:760px;height:760px;left:-200px;top:-240px;background:#1e5bff;opacity:.6"></div><div class="o" id="o2" style="width:640px;height:640px;right:-160px;bottom:-260px;background:#17b3d6;opacity:.4"></div>
<img id="logo" src="${f('marca/identidad/nextlegal-logo-blanco.png')}"><div id="pts"><i></i><i></i><i></i></div>
${ETAPAS.map((e) => `<div class="et"><div class="kick">${e.kick}</div><div class="tit">${e.tit}</div><div class="sub">${e.sub}</div>
<ul class="pasos">${pasos.map((p, i) => `<li><b>${i + 1}</b>${p}</li>`).join('')}</ul><div class="q">${qr(e.qr)}</div><div class="cap">Mantenga el celular quieto frente al código</div></div>`).join('')}
<div id="barra"><div id="prog"></div></div></div>
<script>
const E=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3), ets=[...document.querySelectorAll('.et')], pts=[...document.querySelectorAll('#pts i')]
function render(t){
  const D=${DUR}, ET=${ETAPA}, s=t/D*Math.PI*2
  document.querySelector('#o1').style.transform='translate('+(Math.sin(s)*120)+'px,'+(Math.cos(s)*70)+'px)'
  document.querySelector('#o2').style.transform='translate('+(-Math.sin(s)*110)+'px,'+(-Math.cos(s)*60)+'px)'
  const k=Math.min(${N - 1},Math.floor(t/ET)), u=t-k*ET
  ets.forEach((e,i)=>{ const on=i===k; const a=on?Math.min(E(u/0.9),1-E((u-(ET-0.9))/0.8)):0; e.style.opacity=a; e.style.transform='translateY('+((1-E(u/0.9))*(on?18:0))+'px)'; e.style.visibility=on?'visible':'hidden' })
  pts.forEach((p,i)=>{p.style.background=i===k?'#5fd4ee':'rgba(255,255,255,.25)'; p.style.transform='scale('+(i===k?1.3:1)+')'})
  document.querySelector('#prog').style.width=(u/ET*100)+'%'
}
render(0)
</script>`

const TMP = join(tmpdir(), 'nl-fuente')
mkdirSync(TMP, { recursive: true })
const fuente = join(TMP, 'qr-lento-fuente.html')
writeFileSync(fuente, html)
const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
const p = await nav.newPage()
await p.setViewport({ width: 1920, height: 1080 })
await p.goto(pathToFileURL(fuente).href, { waitUntil: 'networkidle0' })
await p.evaluate(() => document.fonts.ready)
const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS_IN), '-i', '-', '-vf', 'fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', join(OUT, 'video-qr-lento.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] })
for (let i = 0; i < DUR * FPS_IN; i++) {
  await p.evaluate((t) => render(t), i / FPS_IN)
  const png = await p.screenshot({ type: 'png' })
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r))
}
ff.stdin.end()
await new Promise((r) => ff.on('close', r))
await nav.close()
console.log('listo lento')
