// Correo de bienvenida a la lista de espera. HTML compatible con clientes de correo:
// tablas, estilos en línea y sin JavaScript. La cuenta regresiva se calcula al enviar
// (los correos no pueden animarse; para una cuenta en vivo se usaría un GIF dinámico).
import { LAUNCH_DATE, formatLaunchDate, pad2, timeLeft } from '../lib/launch'

export interface WelcomeData {
  name: string
  email: string
  folio: string
  role: 'cliente' | 'abogado'
  interest?: string
  assetsBase?: string
  now?: Date
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export function welcomeSubject(d: Pick<WelcomeData, 'name' | 'folio'>): string {
  return `${d.name.split(' ')[0]}, su lugar en Next Legal está apartado (N.º ${d.folio})`
}

export function renderWelcomeEmail(d: WelcomeData): string {
  const base = d.assetsBase ?? ''
  const first = esc(d.name.trim().split(/\s+/)[0] ?? '')
  const t = timeLeft(LAUNCH_DATE, d.now)
  const roleLine = d.role === 'abogado'
    ? 'Prepararemos su perfil profesional para que reciba clientes desde el primer día.'
    : 'El día del lanzamiento podrá buscar abogado, comparar tarifas y agendar su consulta.'
  const interest = d.interest ? `<p style="margin:0 0 6px;font:500 14px/1.5 Arial,Helvetica,sans-serif;color:#5a6680">${d.role === 'abogado' ? 'Áreas registradas' : 'Su tema'}: <b style="color:#0e1f47">${esc(d.interest)}</b></p>` : ''

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bienvenida a Next Legal</title></head>
<body style="margin:0;padding:0;background:#f2f4f8">
<span style="display:none;max-height:0;overflow:hidden">Su número de registro es ${esc(d.folio)}. Faltan ${t.days} días para el lanzamiento.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f8">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#0e1f47;padding:34px 36px 30px" align="left">
      <img src="${base}/email/nextlegal-logo-blanco.png" width="180" alt="Next Legal" style="display:block;border:0;width:180px;height:auto">
      <p style="margin:26px 0 8px;font:800 28px/1.15 Arial,Helvetica,sans-serif;color:#ffffff">Le damos la bienvenida a Next Legal, ${first}.</p>
      <p style="margin:0;font:500 16px/1.5 Arial,Helvetica,sans-serif;color:#c9d4ee">Su lugar está apartado. El derecho, al alcance de todas las personas.</p>
    </td></tr>
    <tr><td style="background:#0e1f47;padding:0 36px 34px" align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e5bff;border-radius:14px">
        <tr><td align="center" style="padding:22px 12px 8px;font:700 13px/1 Arial,Helvetica,sans-serif;color:#dbe8ff;letter-spacing:.6px">FALTAN PARA EL LANZAMIENTO</td></tr>
        <tr><td align="center" style="padding:6px 12px 16px">
          <img src="${base}/email/countdown.gif" width="528" alt="Faltan ${pad2(t.days)} días, ${pad2(t.hours)} horas y ${pad2(t.minutes)} minutos para el lanzamiento" style="display:block;border:0;width:100%;max-width:528px;height:auto;border-radius:10px">
        </td></tr>
        <tr><td align="center" style="padding:0 12px 22px;font:600 13px/1.4 Arial,Helvetica,sans-serif;color:#ffffff">${esc(formatLaunchDate())}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:32px 36px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d9dfeb;border-radius:12px">
        <tr>
          <td style="padding:18px 20px">
            <p style="margin:0 0 4px;font:700 12px/1 Arial,Helvetica,sans-serif;color:#5a6680">SU NÚMERO DE REGISTRO</p>
            <p style="margin:0;font:800 36px/1.1 Arial,Helvetica,sans-serif;color:#0e1f47;white-space:nowrap">N.º ${esc(d.folio)}</p>
          </td>
          <td align="right" width="96" style="padding:18px 16px 18px 0"><img src="${base}/email/sello.png" width="76" alt="" style="display:block;border:0;width:76px;height:76px"></td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:18px 36px 4px">
      ${interest}
      <p style="margin:0 0 18px;font:500 16px/1.6 Arial,Helvetica,sans-serif;color:#3a4766">${roleLine} Le avisaremos a <b style="color:#0e1f47">${esc(d.email)}</b> en cuanto abramos.</p>
    </td></tr>
    <tr><td style="padding:0 36px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${[['Abogados de trayectoria', 'Colegiados, con experiencia y resultados a la vista.'], ['Precio claro desde el inicio', 'Conozca el costo de su consulta antes de confirmarla.'], ['Su caso, siempre a la vista', 'Avances, documentos y chat desde su celular.']].map(([a, b]) => `
        <tr><td width="34" valign="top" style="padding:8px 0"><div style="width:24px;height:24px;border-radius:12px;background:#1f7a50;color:#ffffff;font:800 14px/24px Arial,Helvetica,sans-serif;text-align:center">✓</div></td>
        <td style="padding:8px 0"><p style="margin:0;font:800 15px/1.3 Arial,Helvetica,sans-serif;color:#0e1f47">${a}</p><p style="margin:2px 0 0;font:500 14px/1.45 Arial,Helvetica,sans-serif;color:#5a6680">${b}</p></td></tr>`).join('')}
      </table>
    </td></tr>
    <tr><td align="center" style="padding:26px 36px 34px">
      <a href="https://nextlegal.hn/inicio" style="display:inline-block;background:#1e5bff;color:#ffffff;text-decoration:none;font:800 16px/1 Arial,Helvetica,sans-serif;padding:18px 30px;border-radius:10px">Ir al inicio</a>
      <p style="margin:18px 0 0;font:500 13px/1.5 Arial,Helvetica,sans-serif;color:#5a6680">Comparta Next Legal con quien lo necesite: el derecho le pertenece a todas las personas.</p>
    </td></tr>
    <tr><td style="background:#f2f4f8;padding:22px 36px" align="center">
      <p style="margin:0 0 6px;font:700 12px/1.5 Arial,Helvetica,sans-serif;color:#0e1f47">Next Legal · Hecho en Honduras</p>
      <p style="margin:0;font:500 11px/1.5 Arial,Helvetica,sans-serif;color:#8a93a8">Recibe este correo porque se registró en la lista de espera de Next Legal.<br>Si no fue usted, ignore este mensaje o <a href="#" style="color:#5a6680">cancele su suscripción</a>.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`
}
