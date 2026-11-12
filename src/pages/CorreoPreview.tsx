import { DesktopTower, DeviceMobile, EnvelopeSimple } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { renderWelcomeEmail, welcomeSubject } from '../emails/bienvenida'
import '../landing.css'

/** Vista previa del correo de bienvenida, tal como llegaría a la bandeja de entrada. */
export default function CorreoPreview() {
  const [q] = useSearchParams()
  const [mobile, setMobile] = useState(false)
  const key = q.toString()
  const data = useMemo(() => {
    const p = new URLSearchParams(key)
    return {
      name: p.get('nombre') || 'Carla Mejía',
      email: p.get('correo') || 'carla.mejia@gmail.com',
      folio: p.get('folio') || '0328',
      role: (p.get('rol') === 'abogado' ? 'abogado' : 'cliente') as 'cliente' | 'abogado',
      interest: p.get('tema') || 'Despido o salario',
    }
  }, [key])
  const html = useMemo(() => renderWelcomeEmail({ ...data, assetsBase: window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '') }), [data])

  return (
    <div className="mail-prev">
      <header className="mail-prev-bar">
        <div className="mail-prev-meta">
          <span className="mail-prev-icon"><EnvelopeSimple weight="fill" size={20} /></span>
          <div>
            <b>{welcomeSubject(data)}</b>
            <small>De: Next Legal · Para: {data.email}</small>
          </div>
        </div>
        <div className="mail-prev-toggle" role="radiogroup" aria-label="Tamaño de pantalla">
          <button type="button" role="radio" aria-checked={!mobile} className={!mobile ? 'on' : ''} onClick={() => setMobile(false)}><DesktopTower weight="fill" size={18} /> Computadora</button>
          <button type="button" role="radio" aria-checked={mobile} className={mobile ? 'on' : ''} onClick={() => setMobile(true)}><DeviceMobile weight="fill" size={18} /> Celular</button>
        </div>
      </header>
      <p className="mail-prev-note">Vista previa. La fecha de lanzamiento es provisional: la cuenta regresiva se calcula en el momento del envío.</p>
      <iframe className={`mail-prev-frame ${mobile ? 'is-mobile' : ''}`} title="Vista previa del correo de bienvenida" srcDoc={html} />
    </div>
  )
}
