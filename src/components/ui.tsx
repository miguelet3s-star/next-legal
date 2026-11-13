import { Briefcase, Buildings, CheckCircle, FileArrowUp, FilePdf, FileImage, FileText, Gavel, House, Scales, SealCheck, Star, UsersThree } from '@phosphor-icons/react'
import type { Icon as PhIcon } from '@phosphor-icons/react'
import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { CategoryId, Lawyer } from '../data/mock'
import { categories } from '../data/mock'
import { newId, useApp } from '../lib/app'
import type { CaseStatus, CaseUpdate, ConsultationStatus, Doc } from '../lib/db'
import { addDoc } from '../lib/db'
import type { IsoDate } from '../lib/dates'
import { dayNumber, formatShort, formatTime, monthShort, relativeShort, today } from '../lib/dates'
import { docUrls, update } from '../lib/store'
import { toast } from '../lib/toast'

// ---------- Piezas básicas ----------

export function Avatar({ name, size = 56, verified = false, photo }: { name: string; size?: number; verified?: boolean; photo?: string }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('')
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${hue} 45% 40%), hsl(${(hue + 40) % 360} 50% 28%))` }}>
      {photo ? <img src={photo} alt="" className="avatar-img" /> : initials}
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

export function CategoryGrid() {
  return (
    <div className="cat-grid">
      {categories.map((c) => {
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
  return <span className="stars"><Star weight="fill" className="star" size={16} /> <b>{rating.toFixed(1)}</b> <span className="muted">({reviews})</span></span>
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
      <p className="muted small">{lawyer.city}</p>
    </Link>
  )
}

export function EmptyState({ icon: Icon = FileText, title, text, children }: { icon?: PhIcon; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon size={30} /></span>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
      {children}
    </div>
  )
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children}
    </header>
  )
}

export function StatusChip({ status }: { status: CaseStatus }) {
  const cls = { 'En progreso': 'chip-blue', 'En revisión': 'chip-soft', Pendiente: 'chip-amber', Cerrado: 'chip-green' }[status]
  return <span className={`chip ${cls}`}>{status}</span>
}

const CONSULT_LABEL: Record<ConsultationStatus, [string, string]> = {
  'por-confirmar': ['Por confirmar', 'chip-amber'],
  confirmada: ['Confirmada', 'chip-blue'],
  realizada: ['Realizada', 'chip-green'],
  cancelada: ['Cancelada', 'chip-soft'],
}

export function ConsultChip({ status }: { status: ConsultationStatus }) {
  const [label, cls] = CONSULT_LABEL[status]
  return <span className={`chip ${cls}`}>{label}</span>
}

/** Hoja de calendario: día grande y mes. */
export function DateBlock({ date }: { date: IsoDate }) {
  return (
    <span className="date-block" aria-label={formatShort(date)}>
      <b>{dayNumber(date)}</b>
      <small>{monthShort(date)}</small>
    </span>
  )
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="switch-row">
      <span><b>{label}</b>{hint && <small className="muted">{hint}</small>}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  )
}

// ---------- Expediente ----------

/** Carpeta del expediente: pestaña con el número y hoja con el contenido. */
export function Folder({ tab, children }: { tab: string; children: ReactNode }) {
  return (
    <section className="folder">
      <span className="folder-tab">{tab}</span>
      <div className="folder-paper">{children}</div>
    </section>
  )
}

export function Timeline({ updates }: { updates: CaseUpdate[] }) {
  const ref = today()
  return (
    <ol className="timeline">
      {updates.map((u, i) => {
        const [date, time] = u.at.split('T')
        return (
          <li key={u.id} className={i === 0 ? 'current' : ''}>
            <span className="tl-date">{relativeShort(date, ref)}<br />{formatTime(time)}</span>
            <span className="tl-dot"><CheckCircle size={20} weight={i === 0 ? 'fill' : 'duotone'} /></span>
            <div className="tl-body"><b>{u.title}</b><p>{u.detail}</p></div>
          </li>
        )
      })}
    </ol>
  )
}

function docIcon(name: string): PhIcon {
  if (/\.pdf$/i.test(name)) return FilePdf
  if (/\.(jpe?g|png|webp|heic)$/i.test(name)) return FileImage
  return FileText
}

function formatSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`
}

const MAX_FILE_MB = 15

/** Lista de documentos; con `caseId` permite subir uno nuevo a ese expediente. */
export function DocList({ docs, caseId, caseLabel }: { docs: Doc[]; caseId?: string; caseLabel?: (id: string) => string }) {
  const { me } = useApp()
  const input = useRef<HTMLInputElement>(null)

  const onFile = (file: File | undefined) => {
    if (!file || !caseId) return
    if (file.size > MAX_FILE_MB * 1024 * 1024) { alert(`El archivo pesa más de ${MAX_FILE_MB} MB. Elija uno más liviano.`); return }
    const id = newId()
    docUrls.set(id, URL.createObjectURL(file))
    update((db) => addDoc(db, me, { id, caseId, name: file.name.slice(0, 120), sizeKb: file.size / 1024, uploadedBy: me.role, date: today() }))
    toast('Documento subido')
  }

  return (
    <div className="doc-list">
      {caseId && (
        <>
          <input ref={input} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
          <button className="doc-drop" onClick={() => input.current?.click()}>
            <span className="round-ic"><FileArrowUp size={24} /></span>
            <span><b>Subir un documento</b><small className="muted">PDF, foto o Word de hasta {MAX_FILE_MB} MB</small></span>
          </button>
        </>
      )}
      {docs.length === 0 && !caseId && <EmptyState title="Aún no hay documentos" text="Cuando usted o su abogado suban un documento, aparecerá aquí." />}
      <ul>
        {docs.map((d) => {
          const Icon = docIcon(d.name)
          const url = docUrls.get(d.id)
          const mine = d.uploadedBy === me.role
          const who = mine ? 'Lo subió usted' : me.role === 'cliente' ? 'Lo subió su abogado' : 'Lo subió el cliente'
          const body = (
            <>
              <span className="round-ic"><Icon size={24} /></span>
              <span className="doc-body"><b>{d.name}</b><small className="muted">{caseLabel ? `${caseLabel(d.caseId)} · ` : ''}{who} el {formatShort(d.date)} · {formatSize(d.sizeKb)}</small></span>
            </>
          )
          return <li key={d.id}>{url ? <a href={url} target="_blank" rel="noreferrer" className="doc">{body}</a> : <div className="doc">{body}</div>}</li>
        })}
      </ul>
    </div>
  )
}
