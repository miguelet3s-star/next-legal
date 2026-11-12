import { ArrowLeft, Briefcase, Eye, EyeSlash, SignIn, UserCheck } from '@phosphor-icons/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { LiveLines } from '../components/LiveLines'
import { AppleMark, GoogleG } from '../components/AuthLogos'
import { isEmail } from '../lib/leads'
import '../landing.css'

type Role = 'cliente' | 'abogado'

/**
 * Inicio de sesión de Next Legal (prototipo). La autenticación real se conectará después
 * con un proveedor seguro (por ejemplo, Supabase Auth); aquí solo se valida el formulario.
 */
export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('cliente')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; pass?: string }>({})
  const [loading, setLoading] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!isEmail(email.trim().toLowerCase())) errs.email = 'Escriba su correo, por ejemplo nombre@gmail.com'
    if (pass.length < 8) errs.pass = 'La contraseña tiene al menos 8 caracteres'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    setTimeout(() => navigate('/inicio'), 900)
  }

  return (
    <div className="ln">
      <aside className="ln-brand">
        <LiveLines />
        <Link to="/" className="ln-back"><ArrowLeft weight="bold" size={18} /> Volver al inicio</Link>
        <div className="ln-stage" aria-hidden="true">
          <span className="ln-orbit o1" /><span className="ln-orbit o2" /><span className="ln-orbit o3" />
          <span className="ln-glow" />
          <BrandLogo tone="light" className="ln-logo-xl" />
        </div>
        <div className="ln-welcome">
          <h1>Qué gusto verle de nuevo</h1>
          <p>Su caso, sus documentos y su abogado, en un solo lugar.</p>
        </div>
      </aside>

      <main className="ln-main">
        <div className="ln-mobile-head"><BrandLogo tone="dark" className="ln-logo-sm" /></div>
        <form className="ln-card" onSubmit={submit} noValidate>
          <h2>Iniciar sesión</h2>
          <p className="ln-sub">Entre con el correo que usó al crear su cuenta.</p>

          <div className="ln-role" role="radiogroup" aria-label="Tipo de cuenta">
            <button type="button" role="radio" aria-checked={role === 'cliente'} className={role === 'cliente' ? 'on' : ''} onClick={() => setRole('cliente')}><UserCheck weight="fill" size={20} /> Cliente</button>
            <button type="button" role="radio" aria-checked={role === 'abogado'} className={role === 'abogado' ? 'on' : ''} onClick={() => setRole('abogado')}><Briefcase weight="fill" size={20} /> Abogado</button>
          </div>

          <label className="lx-field">
            <span>Correo electrónico</span>
            <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@gmail.com" aria-invalid={!!errors.email} />
            {errors.email && <small className="lx-err">{errors.email}</small>}
          </label>
          <label className="lx-field">
            <span className="ln-pass-label">Contraseña <Link to="/entrar" className="ln-forgot">¿Olvidó su contraseña?</Link></span>
            <div className="ln-pass">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Su contraseña" aria-invalid={!!errors.pass} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{show ? <EyeSlash size={20} /> : <Eye size={20} />}</button>
            </div>
            {errors.pass && <small className="lx-err">{errors.pass}</small>}
          </label>

          <button className="lx-btn lx-btn-lg lx-btn-block" disabled={loading}>
            <span>{loading ? 'Entrando…' : role === 'abogado' ? 'Entrar a mi despacho' : 'Iniciar sesión'}</span>
            <span className="lx-btn-icon">{loading ? <span className="ln-spin" /> : <SignIn weight="fill" size={22} />}</span>
          </button>

          <div className="ln-divider"><span>o continúe con</span></div>
          <div className="ln-social">
            <button type="button" className="ln-google" onClick={() => navigate('/inicio')}><GoogleG size={20} /> Continuar con Google</button>
            <button type="button" className="ln-apple" onClick={() => navigate('/inicio')}><AppleMark size={20} /> Continuar con Apple</button>
          </div>

          <p className="ln-new">¿Aún no tiene cuenta? <Link to="/#unete">Crear cuenta</Link></p>
        </form>
      </main>
    </div>
  )
}
