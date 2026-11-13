import { CheckCircle, Clock, MagnifyingGlassMinus, MapPin } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { CategoryId } from '../data/mock'
import { categories, lawyers } from '../data/mock'
import { EmptyState, Stars, categoryName } from '../components/ui'
import { LawyerArch } from '../components/visual'
import { useApp } from '../lib/app'
import { asset } from '../lib/asset'
import { nextFreeSlot } from '../lib/db'
import { formatTime, relativeDay, today } from '../lib/dates'
import { effectiveSettings, modesLabel } from '../lib/lawyers'
import { formatLempiras } from '../lib/money'
import { getDb } from '../lib/store'
import { TOPIC_PHOTO } from './topics'

type ModeFilter = 'Todos' | 'En línea' | 'Presencial'

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export default function Search() {
  const { db } = useApp()
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') as CategoryId | null
  const q = params.get('q') ?? ''
  const [mode, setMode] = useState<ModeFilter>('Todos')
  const ref = today()

  const results = useMemo(() => {
    const words = normalize(q).split(/\s+/).filter((w) => w.length > 2)
    return lawyers.filter((l) => {
      if (cat && l.category !== cat) return false
      const modes = db.settings[l.id]?.modes ?? l.modes
      if (mode !== 'Todos' && !modes.includes(mode)) return false
      if (words.length === 0) return true
      const hay = normalize([l.name, l.city, categoryName(l.category), ...l.specialties, ...(l.helps ?? [])].join(' '))
      return words.some((w) => hay.includes(w))
    })
  }, [cat, q, mode, db.settings])

  const label = cat ? categoryName(cat) : q ? `“${q}”` : 'Todos los abogados'

  return (
    <div className="page">
      <header className={`search-head ${cat ? 'has-photo' : ''}`} style={cat ? { backgroundImage: `linear-gradient(90deg, rgba(14,31,71,.96) 40%, rgba(14,31,71,.35)), url(${asset(TOPIC_PHOTO[cat])})` } : undefined}>
        <p>Abogados para</p>
        <h1>{label}</h1>
        <span>{results.length === 1 ? '1 abogado disponible' : `${results.length} abogados disponibles`}</span>
      </header>

      <div className="filters">
        <div className="topic-chips" role="group" aria-label="Tema">
          <button aria-pressed={!cat} className={cat ? '' : 'active'} onClick={() => setParams({})}>Todos</button>
          {categories.map((c) => <button key={c.id} aria-pressed={cat === c.id} className={cat === c.id ? 'active' : ''} onClick={() => setParams({ cat: c.id })}>{c.name.replace('Derecho de ', '').replace('Derecho ', '')}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Forma de atención">
          {(['Todos', 'En línea', 'Presencial'] as ModeFilter[]).map((m) => (
            <button key={m} aria-pressed={mode === m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState icon={MagnifyingGlassMinus} title="No encontramos abogados para esa búsqueda" text="Pruebe con otra palabra o elija un tema de la lista.">
          <button className="btn btn-outline" onClick={() => { setParams({}); setMode('Todos') }}>Ver todos los abogados</button>
        </EmptyState>
      ) : (
        <ul className="lawyer-results stagger">
          {results.map((l) => {
            const s = effectiveSettings(db, l)
            const free = s.acceptsNew ? nextFreeSlot(getDb(), l.id, s, ref) : null
            return (
              <li key={l.id} className="lawyer-result">
                <Link to={`/abogado/${l.id}`} className="lawyer-result-photo" aria-label={`Ver el perfil de ${l.name}`}><LawyerArch lawyer={l} /></Link>
                <div className="lawyer-result-body">
                  <h2><Link to={`/abogado/${l.id}`}>{l.name}</Link></h2>
                  <p className="muted">{categoryName(l.category)} · {l.years} años de experiencia</p>
                  <span className="result-meta"><Stars rating={l.rating} reviews={l.reviews} /> <span className="muted small with-ic"><MapPin weight="fill" size={15} /> {l.city} · {modesLabel(s.modes)}</span></span>
                  {l.helps ? (
                    <ul className="helps small">{l.helps.slice(0, 2).map((h) => <li key={h}><CheckCircle weight="fill" size={17} /> {h}</li>)}</ul>
                  ) : <p className="small">{s.bio}</p>}
                </div>
                <div className="lawyer-result-side">
                  <span><b>{formatLempiras(s.price)}</b><small className="muted">la consulta de 60 minutos</small></span>
                  {free ? <p className="free-slot"><Clock size={16} weight="fill" /> Libre {relativeDay(free.date, ref).toLowerCase()}, {formatTime(free.time)}</p> : <p className="muted small">Agenda llena por ahora</p>}
                  <div className="lawyer-result-actions">
                    {free && <Link to={`/agendar/${l.id}`} className="btn btn-primary">Agendar</Link>}
                    <Link to={`/abogado/${l.id}`} className="btn btn-outline">Ver perfil</Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
