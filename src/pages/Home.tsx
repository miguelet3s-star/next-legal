import { CalendarPlus, CaretRight, CheckCircle, ChatCircleText, Clock, FolderOpen, MagnifyingGlass, MapPin, SquaresFour, VideoCamera } from '@phosphor-icons/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories, getLawyer, lawyers } from '../data/mock'
import { Avatar, categoryIcons } from '../components/ui'
import { Arch, CaseRoute, Guilloche } from '../components/visual'
import { useApp } from '../lib/app'
import { asset } from '../lib/asset'
import { dayNumber, formatTime, monthShort, today, untilLabel, weekday } from '../lib/dates'
import { downloadIcs } from '../lib/ics'
import { LawyerTile } from '../components/LawyerTile'
import { TOPIC_PHOTO } from './topics'

const QUICK: { label: string; to: string }[] = [
  { label: 'Me despidieron', to: '/buscar?q=despido' },
  { label: 'Pensión para mis hijos', to: '/buscar?q=pension' },
  { label: 'Quiero divorciarme', to: '/buscar?q=divorcio' },
  { label: 'Me deben dinero', to: '/buscar?q=deuda' },
  { label: 'Comprar un terreno', to: '/buscar?q=terreno' },
]

export default function Home() {
  const navigate = useNavigate()
  const { me, db } = useApp()
  const [q, setQ] = useState('')
  const firstName = db.clients.find((c) => c.id === me.userId)?.name.split(' ')[0] ?? ''
  const ref = today()
  const next = db.consultations.filter((c) => c.date >= ref && (c.status === 'confirmada' || c.status === 'por-confirmar')).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  const nextLawyer = next && getLawyer(next.lawyerId)
  const openCases = db.cases.filter((c) => c.status !== 'Cerrado')
  const known = new Set(db.cases.map((c) => c.lawyerId))
  const recommended = lawyers.filter((l) => !known.has(l.id) && l.portrait).slice(0, 3)

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/buscar?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="page">
      <section className="hero-band">
        <Guilloche />
        <div className="hero-copy">
          <p className="hero-hi">Hola, {firstName}</p>
          <h1>¿Cuál es su problema?</h1>
          <form className="hero-search" onSubmit={onSearch} role="search">
            <MagnifyingGlass size={22} weight="bold" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escríbalo con sus palabras" aria-label="Escriba su problema" />
            <button className="btn btn-primary">Buscar</button>
          </form>
          <div className="quick" aria-label="Problemas frecuentes">
            {QUICK.map((x) => <Link key={x.label} to={x.to}>{x.label}</Link>)}
          </div>
        </div>
        <div className="hero-art">
          <Arch src={asset('/img/abogada-recorte.webp')} className="hero-arch" />
          {openCases[0] && (
            <Link to={`/casos/${openCases[0].id}`} className="hero-dossier">
              <span className="hero-dossier-tab">Su caso</span>
              <span className="hero-dossier-paper">
                <b>{openCases[0].title}</b>
                <CaseRoute status={openCases[0].status} compact />
                <small><CheckCircle size={16} weight="fill" /> {openCases[0].updates[0]?.title}</small>
              </span>
            </Link>
          )}
        </div>
      </section>

      <div className="home">
        <div className="home-main">
          <div className="section-head"><h2>Elija el tema</h2></div>
          <div className="topics stagger">
            {categories.map((c) => {
              const Icon = categoryIcons[c.id]
              return (
                <Link key={c.id} to={`/buscar?cat=${c.id}`} className="topic" style={{ backgroundImage: `url(${asset(TOPIC_PHOTO[c.id])})` }}>
                  <span className="topic-ic"><Icon size={22} weight="fill" /></span>
                  <b>{c.name.replace('Derecho de ', '').replace('Derecho ', '')}</b>
                </Link>
              )
            })}
            <Link to="/buscar" className="topic topic-all">
              <span className="topic-ic"><SquaresFour size={22} weight="fill" /></span>
              <b>Todos los abogados</b>
            </Link>
          </div>

          <div className="section-head"><h2>Abogados para usted</h2><Link to="/buscar">Ver todos <CaretRight size={14} weight="bold" /></Link></div>
          <div className="lawyer-tiles stagger">
            {recommended.map((l) => <LawyerTile key={l.id} lawyer={l} />)}
          </div>
        </div>

        <aside className="home-side">
          {next && nextLawyer ? (
            <section className="cita">
              <div className="cita-top">
                <span className="cita-date"><small>{weekday(next.date)}</small><b>{dayNumber(next.date)}</b><small>{monthShort(next.date)}</small></span>
                <div>
                  <span className="cita-until">{untilLabel(next.date, ref)}</span>
                  <h2>Su próxima consulta</h2>
                  <p><Clock size={18} weight="fill" /> {formatTime(next.time)}</p>
                  <p>{next.mode === 'En línea' ? <VideoCamera size={18} weight="fill" /> : <MapPin size={18} weight="fill" />} {next.mode === 'En línea' ? 'Por videollamada' : `En la oficina, ${nextLawyer.city}`}</p>
                </div>
              </div>
              <div className="cita-bottom">
                <div className="with-person"><Avatar name={nextLawyer.name} photo={nextLawyer.photo} size={44} /><span><b>{nextLawyer.name}</b><small className="muted">{next.status === 'confirmada' ? 'Consulta confirmada' : 'Espera la confirmación'}</small></span></div>
                <div className="cita-actions">
                  <Link to={`/mensajes?con=${next.lawyerId}`} className="btn btn-primary"><ChatCircleText size={18} weight="fill" /> Escribirle</Link>
                  <button className="btn btn-outline" onClick={() => downloadIcs(next, nextLawyer.name, next.mode === 'En línea' ? 'Videollamada de Next Legal' : `Oficina en ${nextLawyer.city}`)}><CalendarPlus size={18} weight="fill" /> A mi calendario</button>
                </div>
              </div>
            </section>
          ) : (
            <section className="panel">
              <h2>Agende su primera consulta</h2>
              <p className="muted">Elija un abogado, el día y la hora. Toma menos de dos minutos.</p>
              <Link to="/buscar" className="btn btn-primary btn-block">Buscar abogado</Link>
            </section>
          )}

          <section className="panel">
            <div className="section-head"><h2>Mis casos</h2>{openCases.length > 0 && <Link to="/casos">Ver todos</Link>}</div>
            {openCases.length === 0 ? <p className="muted">Aquí verá cada avance de su caso, paso a paso.</p> : (
              <ul className="case-list">
                {openCases.map((c) => (
                  <li key={c.id}>
                    <Link to={`/casos/${c.id}`} className="case-item case-route-item">
                      <span className="case-icon"><FolderOpen size={22} /></span>
                      <div>
                        <b>{c.title}</b>
                        <small className="muted">{c.updates[0]?.title}</small>
                        <CaseRoute status={c.status} compact />
                      </div>
                      <CaretRight className="muted" weight="bold" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
