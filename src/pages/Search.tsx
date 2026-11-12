import { CaretRight, MagnifyingGlassMinus, MapPin } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { CategoryId } from '../data/mock'
import { categories, lawyers } from '../data/mock'
import { Avatar, EmptyState, Stars, categoryName } from '../components/ui'

type Mode = 'Todos' | 'En línea' | 'Presencial'

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export default function Search() {
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') as CategoryId | null
  const q = params.get('q') ?? ''
  const [mode, setMode] = useState<Mode>('Todos')

  const results = useMemo(() => {
    const nq = normalize(q)
    return lawyers.filter((l) => {
      if (cat && l.category !== cat) return false
      if (mode !== 'Todos' && !l.modes.includes(mode)) return false
      if (!nq) return true
      const hay = normalize([l.name, l.city, categoryName(l.category), ...l.specialties].join(' '))
      return hay.includes(nq)
    })
  }, [cat, q, mode])

  const label = cat ? categoryName(cat) : q ? `“${q}”` : 'Todos los abogados'

  return (
    <div className="page narrow">
      <p className="muted">Mostrando resultados para:</p>
      <h1 className="page-title">{label}</h1>

      <div className="filters">
        <select value={cat ?? ''} onChange={(e) => setParams(e.target.value ? { cat: e.target.value } : {})} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="segmented" role="tablist">
          {(['Todos', 'En línea', 'Presencial'] as Mode[]).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState icon={MagnifyingGlassMinus} title="Sin resultados" text="Prueba otra categoría o cambia los filtros." />
      ) : (
        <ul className="result-list">
          {results.map((l) => (
            <li key={l.id}>
              <Link to={`/abogado/${l.id}`} className="result">
                <Avatar name={l.name} photo={l.photo} size={64} verified />
                <div className="result-body">
                  <b>{l.name}</b>
                  <small className="muted">{categoryName(l.category)}</small>
                  <span className="result-meta"><Stars rating={l.rating} reviews={l.reviews} /> <span className="muted small with-ic"><MapPin weight="fill" /> {l.city}</span></span>
                  {l.online && <span className="online">● En línea</span>}
                </div>
                <CaretRight className="muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
