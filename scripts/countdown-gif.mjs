// Genera la cuenta regresiva animada del correo (GIF de 60 cuadros, uno por segundo).
// Uso: node scripts/countdown-gif.mjs <salida.gif> [fecha-lanzamiento-ISO]
// En producción se generaría al enviar cada correo (o con un servicio de GIF dinámico).
import sharp from 'sharp'
const out = process.argv[2]
const target = new Date(process.argv[3] ?? '2026-12-03T09:00:00-06:00')
const W = 528, H = 132, N = 60
const pad = (n) => String(n).padStart(2, '0')
const box = (x, val, label) => `
  <rect x="${x}" y="8" width="120" height="116" rx="14" fill="#1a2d5c"/>
  <text x="${x + 60}" y="78" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="54" fill="#ffffff">${val}</text>
  <text x="${x + 60}" y="108" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="1" fill="#9fb0d4">${label}</text>`
const frames = []
const start = Date.now()
for (let i = 0; i < N; i++) {
  const ms = Math.max(0, target.getTime() - (start + i * 1000))
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#1e5bff"/>
    ${box(0, pad(d), 'DÍAS')}${box(136, pad(h), 'HORAS')}${box(272, pad(m), 'MINUTOS')}${box(408, pad(sec), 'SEGUNDOS')}</svg>`
  frames.push(await sharp(Buffer.from(svg)).png().toBuffer())
}
await sharp(frames, { join: { animated: true } }).gif({ delay: Array(N).fill(1000), loop: 0, colours: 32 }).toFile(out)
console.log('ok', out)
