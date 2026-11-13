import type { Consultation } from './db'

const stamp = (date: string, time: string, addMinutes = 0) => {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + addMinutes
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.replace(/-/g, '')}T${p(Math.floor(total / 60))}${p(total % 60)}00`
}

const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')

/** Cita de 60 minutos en formato de calendario (.ics), en la hora local del dispositivo. */
export function consultationIcs(c: Consultation, withName: string, place: string): string {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Next Legal//Consultas//ES', 'BEGIN:VEVENT',
    `UID:${c.id}@nextlegal`,
    `DTSTART:${stamp(c.date, c.time)}`,
    `DTEND:${stamp(c.date, c.time, 60)}`,
    `SUMMARY:${esc(`Consulta con ${withName}`)}`,
    `LOCATION:${esc(place)}`,
    `DESCRIPTION:${esc(c.topic || 'Consulta agendada en Next Legal')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(c: Consultation, withName: string, place: string) {
  const url = URL.createObjectURL(new Blob([consultationIcs(c, withName, place)], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `consulta-${c.date}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
