// Video de cierre para el monitor: tres QR (web, Instagram, encuesta) como llamada a la acción.
// Salida: marca/stand/video-cta-qr.mp4 (1920×1080, 30 cuadros/s, 12 s, empalma en bucle).
// Uso: node scripts/stand/cta.mjs        (antes: node scripts/stand/impresos.mjs para generar los QR)
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
const DUR = 12, FPS = 30

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:M;font-weight:400;src:url(${f('marca/identidad/manrope-latin-500-normal.woff')})}
@font-face{font-family:M;font-weight:700;src:url(${f('marca/identidad/manrope-latin-700-normal.woff')})}
@font-face{font-family:M;font-weight:800;src:url(${f('marca/identidad/manrope-latin-800-normal.woff')})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:#0a1736;font-family:M,sans-serif;color:#fff}
#l{position:relative;width:1920px;height:1080px;overflow:hidden;background:radial-gradient(ellipse at 60% 40%,#17378c 0%,#0e1f47 55%,#0a1736 100%)}
.o{position:absolute;border-radius:50%;filter:blur(110px)}
#logo{position:absolute;left:50%;top:70px;height:150px;transform:translateX(-50%)}
#tit{position:absolute;left:0;right:0;top:262px;text-align:center;font-weight:800;font-size:70px;letter-spacing:-.01em}
#tit span{color:#5fd4ee}
#sub{position:absolute;left:0;right:0;top:352px;text-align:center;font-size:30px;color:#b9c7e8;font-weight:400}
.c{position:absolute;top:430px;width:500px;height:560px;border-radius:34px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.22);backdrop-filter:blur(6px);text-align:center;padding-top:28px}
.q{width:350px;height:350px;margin:0 auto;background:#fff;border-radius:22px;padding:10px}.q svg{width:100%;height:100%;display:block}
.c b{display:block;margin-top:24px;font-size:38px;font-weight:800}.c i{display:block;margin-top:8px;font-style:normal;font-size:26px;color:#b9c7e8}
#pie{position:absolute;left:0;right:0;bottom:36px;text-align:center;font-size:26px;color:#9fb2dc;letter-spacing:.14em;font-weight:700}
</style><div id="l"><div class="o" id="o1" style="width:820px;height:820px;left:-180px;top:-260px;background:#1e5bff;opacity:.7"></div><div class="o" id="o2" style="width:700px;height:700px;right:-160px;bottom:-280px;background:#17b3d6;opacity:.45"></div>
<img id="logo" src="${f('marca/identidad/nextlegal-logo-blanco.png')}">
<div id="tit">Escanee y <span>sea parte</span></div><div id="sub">Apunte la cámara de su celular a cada código</div>
<div class="c"><div class="q">${qr('web')}</div><b>Conozca la web</b><i>Next Legal</i></div>
<div class="c"><div class="q">${qr('instagram')}</div><b>@nextlegalhn</b><i>Síganos en Instagram</i></div>
<div class="c"><div class="q">${qr('encuesta')}</div><b>Su opinión cuenta</b><i>Responda la encuesta</i></div>
<div id="pie">MUY PRONTO · TECNOLOGÍA LEGAL HECHA EN HONDURAS</div></div>
<script>
const E=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3), R=(x)=>{x=Math.min(1,Math.max(0,x));const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}
const $=(s)=>document.querySelector(s), cs=[...document.querySelectorAll('.c')]
function render(t){
  const D=${DUR}, s=t/D*Math.PI*2
  $('#o1').style.transform='translate('+(Math.sin(s)*260)+'px,'+(Math.cos(s)*140)+'px)'
  $('#o2').style.transform='translate('+(-Math.sin(s)*240)+'px,'+(-Math.cos(s)*110)+'px)'
  const out=1-E((t-(D-0.7))/0.6)           // sale al final para empalmar con el inicio
  const ap=(a,d)=>E((t-a)/d)*out
  $('#logo').style.opacity=1; $('#logo').style.transform='translateX(-50%) translateY('+((1-E(t/0.8))*-30)+'px)'
  for (const [id,a] of [['#tit',0.7],['#sub',1.1],['#pie',1.6]]) { const e=ap(a,0.7); $(id).style.opacity=e; $(id).style.transform='translateY('+((1-e)*24)+'px)' }
  cs.forEach((c,i)=>{ const a=1.2+i*0.45, e=R((t-a)/0.8)*(out>=1?1:out); const op=ap(a,0.45); c.style.opacity=op; c.style.transform='translateY('+((1-e)*90)+'px) scale('+(0.92+0.08*e)+')' })
}
cs.forEach((c,i)=>{c.style.left=(130+i*580)+'px'})
render(0)
</script>`

const TMP = join(tmpdir(), 'nl-fuente')
mkdirSync(TMP, { recursive: true })
const fuente = join(TMP, 'cta-fuente.html')
writeFileSync(fuente, html)
const nav = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
const p = await nav.newPage()
await p.setViewport({ width: 1920, height: 1080 })
await p.goto(pathToFileURL(fuente).href, { waitUntil: 'networkidle0' })
await p.evaluate(() => document.fonts.ready)
const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', join(OUT, 'video-cta-qr.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] })
for (let i = 0; i < DUR * FPS; i++) {
  await p.evaluate((t) => render(t), i / FPS)
  const png = await p.screenshot({ type: 'png' })
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r))
}
ff.stdin.end()
await new Promise((r) => ff.on('close', r))
await nav.close()
console.log('listo')
