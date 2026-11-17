import { asset } from '../lib/asset'

/** Personas del equipo que no figuran como abogados: su rol clave en Next Legal. */
export interface Miembro {
  name: string
  role: string
  /** Una línea sobre lo que hace por las personas que usan Next Legal. */
  does: string
  photo?: string
}

export const equipo: Miembro[] = [
  { name: 'Miguel Reyes', role: 'Analista de Datos', does: 'Convierte lo que pasa en la plataforma en decisiones claras.', photo: asset('/img/equipo/miguel-reyes.jpg') },
  { name: 'Andrés Mora', role: 'Analista de Producto', does: 'Cuida que cada pantalla sea sencilla y resuelva el problema de la persona.' },
  { name: 'Fernanda Rodas', role: 'Asesora de Alianzas', does: 'Suma colegios, instituciones y aliados que respaldan a la red.' },
  { name: 'Marcela Mejía', role: 'Relaciones Públicas', does: 'Da a conocer Next Legal y mantiene la relación con la comunidad.', photo: asset('/img/equipo/marcela-mejia.jpg') },
]

/** Enlaces públicos de Next Legal (los mismos que llevan los QR de acrílicos, flyer y video). */
export const ENLACES = {
  instagram: 'https://www.instagram.com/nextlegalhn/',
  instagramUsuario: '@nextlegalhn',
  encuesta: 'https://forms.gle/wK3WDjRJYFCfWh4z8',
}
