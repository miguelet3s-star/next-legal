import { ArrowLeft, CalendarPlus, CheckCircle, Clock, MapPin, SealCheck, Star, VideoCamera } from '@phosphor-icons/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getLawyer } from '../data/mock'
import { EmptyState, categoryName } from '../components/ui'
import { Guilloche, LawyerArch } from '../components/visual'
import { useApp } from '../lib/app'
import { freeSlots, openDays } from '../lib/db'
import { dayNumber, formatTime, monthShort, relativeDay, today } from '../lib/dates'
import { daysLabel, effectiveSettings, modesLabel } from '../lib/lawyers'
import { formatLempiras } from '../lib/money'
import { getDb } from '../lib/store'

export default function LawyerProfile() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { db } = useApp()
  const lawyer = getLawyer(id)
  if (!lawyer) return <EmptyState title="No encontramos ese perfil" text="Vuelva a la búsqueda y elija otro abogado."><button className="btn btn-primary" onClick={() => navigate('/buscar')}>Buscar abogado</button></EmptyState>
  const s = effectiveSettings(db, lawyer)
  const ref = today()
  const day = s.acceptsNew ? openDays(s, ref, 6).find((d) => freeSlots(getDb(), lawyer.id, s, d).length > 0) : undefined
  const slots = day ? freeSlots(getDb(), lawyer.id, s, day).slice(0, 4) : []
  const book = `/agendar/${lawyer.id}`

  return (
    <div className="page lawyer-page">
      <section className="hero-band profile-band">
        <Guilloche />
        <button className="icon-btn light back" onClick={() => navigate(-1)} aria-label="Volver"><ArrowLeft weight="bold" /></button>
        <div className="hero-copy">
          <span className="verified-pill"><SealCheck weight="fill" size={16} /> Verificado · Colegiación N.º {lawyer.bar}</span>
          <h1>{lawyer.name}</h1>
          <p className="profile-area">{categoryName(lawyer.category)}</p>
          <div className="profile-facts">
            <span><b><Star weight="fill" className="star" size={18} /> {lawyer.rating.toFixed(1)}</b><small>{lawyer.reviews} opiniones</small></span>
            <span><b>{lawyer.years} años</b><small>de experiencia</small></span>
            <span><b>{lawyer.casesSolved}</b><small>casos resueltos</small></span>
          </div>
        </div>
        <LawyerArch lawyer={lawyer} className="hero-arch" />
      </section>

      <div className="desk">
        <div className="desk-main panel">
          <p className="profile-bio">{s.bio}</p>
          {lawyer.helps && (
            <>
              <h2>Le ayuda</h2>
              <ul className="helps">{lawyer.helps.map((h) => <li key={h}><CheckCircle weight="fill" size={22} /> {h}</li>)}</ul>
            </>
          )}
          <h2>Temas que atiende</h2>
          <div className="tags">{lawyer.specialties.map((x) => <span key={x} className="tag">{x}</span>)}</div>
          <h2>Atención</h2>
          <p className="meta"><MapPin size={20} /> {lawyer.city}</p>
          <p className="meta"><VideoCamera size={20} /> {modesLabel(s.modes)}</p>
          <p className="meta"><Clock size={20} /> {daysLabel(s.days)}, de {formatTime(s.from)} a {formatTime(s.to)}</p>
        </div>

        <aside className="desk-side">
          <section className="panel book-card">
            <span className="book-price"><b>{formatLempiras(s.price)}</b><small className="muted">la consulta de 60 minutos</small></span>
            {day ? (
              <>
                <p className="book-next"><b>Horas libres {relativeDay(day, ref).toLowerCase() === 'mañana' ? 'mañana' : `el ${dayNumber(day)} de ${monthShort(day)}`}</b></p>
                <div className="pill-row">{slots.map((t) => <Link key={t} to={`${book}?dia=${day}&hora=${t}`} className="pill">{formatTime(t)}</Link>)}</div>
                <Link to={book} className="btn btn-primary btn-block btn-lg"><CalendarPlus size={22} weight="fill" /> Agendar consulta</Link>
                <p className="muted small center">Si se cancela antes de realizarse, se le devuelve el total.</p>
              </>
            ) : <p className="notice-box">{lawyer.name} tiene la agenda llena por ahora. Puede elegir otro abogado del mismo tema.</p>}
          </section>
        </aside>
      </div>

      {day && (
        <div className="sticky-cta">
          <span><b>{formatLempiras(s.price)}</b><small className="muted">la consulta</small></span>
          <Link to={book} className="btn btn-primary"><CalendarPlus size={20} weight="fill" /> Agendar consulta</Link>
        </div>
      )}
    </div>
  )
}
