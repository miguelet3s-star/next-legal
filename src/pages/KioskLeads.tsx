import { DownloadSimple, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { clearLeads, leadsToCsv, listLeads } from '../lib/leads'

/** Pantalla interna para el equipo del kiosko: ver y exportar registros. */
export default function KioskLeads() {
  const [leads, setLeads] = useState(listLeads)

  const download = () => {
    const blob = new Blob(['﻿' + leadsToCsv(leads)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `next-legal-registros-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const clear = () => {
    if (!confirm('¿Borrar todos los registros de este dispositivo? Descarga el CSV antes.')) return
    clearLeads()
    setLeads([])
  }

  return (
    <div className="page" style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1 className="page-title">Registros del kiosko ({leads.length})</h1>
      <p className="muted">Guardados solo en este dispositivo. Descarga el CSV al cerrar el evento.</p>
      <div className="row" style={{ justifyContent: 'flex-start', gap: 12 }}>
        <button className="btn btn-primary" onClick={download} disabled={!leads.length}><DownloadSimple size={18} /> Descargar CSV</button>
        <button className="btn btn-outline" onClick={clear} disabled={!leads.length}><Trash size={18} /> Borrar</button>
      </div>
      <div className="panel" style={{ overflowX: 'auto' }}>
        {leads.length === 0 ? <p className="muted">Aún no hay registros.</p> : (
          <table className="table">
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Correo</th><th>Tipo</th><th>Tema o áreas</th></tr></thead>
            <tbody>
              {[...leads].reverse().map((l) => (
                <tr key={l.id}><td>{new Date(l.createdAt).toLocaleString('es-HN')}</td><td>{l.name}</td><td>{l.email || l.phone}</td><td>{l.role}</td><td>{l.need}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
