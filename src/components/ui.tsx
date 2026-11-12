import { Bank, Briefcase, Buildings, FileText, Gavel, House, MapPin, Scales, SealCheck, Star, UsersThree } from '@phosphor-icons/react'
import type { Icon as PhIcon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import type { CategoryId, Lawyer } from '../data/mock'
import { categories } from '../data/mock'

/** Escudo con una "N" cuyo último trazo es una marca de verificación. */
export function LogoMark({ className = 'logo-mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 56" aria-hidden="true">
      <path d="M24 2.5 4.5 9.2V27c0 12.6 8.3 22.6 19.5 26.6C35.2 49.6 43.5 39.6 43.5 27V9.2L24 2.5Z" fill="var(--blue)" />
      <path d="M24 2.5V53.6C35.2 49.6 43.5 39.6 43.5 27V9.2L24 2.5Z" fill="#000" opacity=".14" />
      <path d="M15 37V18.5l11 16.5 8.5-15" fill="none" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Logo provisional: se reemplaza cuando lleguen los logos oficiales. */
export function Logo({ size = 'md', tagline = true, light = false }: { size?: 'sm' | 'md' | 'lg'; tagline?: boolean; light?: boolean }) {
  return (
    <div className={`logo logo-${size} ${light ? 'logo-light' : ''}`}>
      <LogoMark />

      <div>
        <div className="logo-word">Next Legal</div>
        {tagline && <div className="logo-tag">Identidad legal, confianza real</div>}
      </div>
    </div>
  )
}

export function Avatar({ name, size = 56, verified = false, photo }: { name: string; size?: number; verified?: boolean; photo?: string }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('')
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 30%))` }}>
      {photo ? <img src={photo} alt={name} className="avatar-img" /> : initials}
      {verified && <SealCheck weight="fill" className="avatar-check" size={Math.max(16, size * 0.28)} aria-label="Verificado" />}
    </div>
  )
}

export const categoryIcons: Record<CategoryId, PhIcon> = {
  laboral: Briefcase,
  civil: Scales,
  familia: UsersThree,
  penal: Gavel,
  mercantil: Buildings,
  tramites: FileText,
  inmuebles: House,
}

export function CategoryGrid({ limit }: { limit?: number }) {
  const list = limit ? categories.slice(0, limit) : categories
  return (
    <div className="cat-grid">
      {list.map((c) => {
        const Icon = categoryIcons[c.id]
        return (
          <Link key={c.id} to={`/buscar?cat=${c.id}`} className="cat-card">
            <span className="cat-icon"><Icon size={26} /></span>
            <span>{c.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="stars"><Star weight="fill" className="star" /> <b>{rating.toFixed(1)}</b> <span className="muted">({reviews})</span></span>
  )
}

export function categoryName(id: CategoryId) {
  return categories.find((c) => c.id === id)?.name ?? ''
}

export function LawyerCard({ lawyer }: { lawyer: Lawyer }) {
  return (
    <Link to={`/abogado/${lawyer.id}`} className="lawyer-card">
      <Avatar name={lawyer.name} photo={lawyer.photo} size={96} verified />
      <h3>{lawyer.name}</h3>
      <p className="muted">{categoryName(lawyer.category)}</p>
      <Stars rating={lawyer.rating} reviews={lawyer.reviews} />
      <p className="muted small with-ic"><MapPin weight="fill" /> {lawyer.city}, Honduras</p>
      <span className="chip chip-verified"><SealCheck size={14} /> Abogado verificado</span>
    </Link>
  )
}

export function EmptyState({ icon: Icon = Bank, title, text }: { icon?: PhIcon; title: string; text: string }) {
  return (
    <div className="empty">
      <Icon size={40} />
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  )
}
