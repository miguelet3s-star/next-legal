import type { Cents } from '../lib/money'
import { asset } from '../lib/asset'

export type CategoryId = 'laboral' | 'civil' | 'familia' | 'penal' | 'mercantil' | 'tramites' | 'inmuebles'

export interface Category {
  id: CategoryId
  name: string
}

export const categories: Category[] = [
  { id: 'laboral', name: 'Derecho Laboral' },
  { id: 'civil', name: 'Derecho Civil' },
  { id: 'familia', name: 'Derecho de Familia' },
  { id: 'penal', name: 'Derecho Penal' },
  { id: 'mercantil', name: 'Derecho Mercantil' },
  { id: 'tramites', name: 'Trámites y Documentos' },
  { id: 'inmuebles', name: 'Propiedad e Inmuebles' },
]

export interface Lawyer {
  id: string
  name: string
  category: CategoryId
  rating: number
  reviews: number
  city: string
  online: boolean
  modes: ('En línea' | 'Presencial')[]
  years: number
  casesSolved: number
  successRate: number
  specialties: string[]
  bio: string
  consultationPrice: Cents
  photo?: string
  /** Recorte de cuerpo (webp con transparencia) para fichas destacadas. */
  portrait?: string
  /** En qué le ayuda, en palabras sencillas. */
  helps?: string[]
  /** Número de colegiación (ficticio en el prototipo). */
  bar: string
}

export const lawyers: Lawyer[] = [
  {
    id: 'andrea-castillo', bar: '07318', photo: asset('/img/abogados/andrea-castillo-cara.jpg'), portrait: asset('/img/abogados/andrea-castillo.webp'),
    name: 'Andrea Castillo', category: 'laboral', rating: 4.9, reviews: 142,
    city: 'Tegucigalpa', online: true, modes: ['En línea', 'Presencial'], years: 9, casesSolved: 236, successRate: 97,
    specialties: ['Despidos injustificados', 'Prestaciones laborales', 'Acoso laboral', 'Reintegro'],
    helps: ['Si lo despidieron sin pagarle', 'Si le deben vacaciones o décimo', 'Si sufre acoso en el trabajo'],
    bio: 'Defiende a trabajadores que fueron despedidos o a quienes no les pagaron lo justo.',
    consultationPrice: 100_000,
  },
  {
    id: 'roberto-zelaya', bar: '02114', photo: asset('/img/abogados/roberto-zelaya-cara.jpg'), portrait: asset('/img/abogados/roberto-zelaya.webp'),
    name: 'Roberto Zelaya', category: 'penal', rating: 4.8, reviews: 211,
    city: 'Tegucigalpa', online: true, modes: ['En línea', 'Presencial'], years: 24, casesSolved: 540, successRate: 92,
    specialties: ['Defensa penal', 'Audiencias', 'Medidas cautelares'],
    helps: ['Si lo acusan de un delito', 'Si detuvieron a un familiar', 'Si necesita ir a una audiencia'],
    bio: 'Más de 20 años defendiendo personas en juicios penales en todo el país.',
    consultationPrice: 150_000,
  },
  {
    id: 'valeria-paz', bar: '09126', photo: asset('/img/abogados/valeria-paz-cara.jpg'), portrait: asset('/img/abogados/valeria-paz.webp'),
    name: 'Valeria Paz', category: 'familia', rating: 4.9, reviews: 97,
    city: 'San Pedro Sula', online: true, modes: ['En línea', 'Presencial'], years: 6, casesSolved: 158, successRate: 96,
    specialties: ['Pensión alimenticia', 'Divorcio', 'Custodia de hijos'],
    helps: ['Si el papá o la mamá no da pensión', 'Si se quiere divorciar', 'Si necesita la custodia de sus hijos'],
    bio: 'Ayuda a familias a resolver pensiones, divorcios y custodia sin pleitos innecesarios.',
    consultationPrice: 80_000,
  },
  {
    id: 'daniel-rivera', bar: '08857', photo: asset('/img/abogados/daniel-rivera-cara.jpg'), portrait: asset('/img/abogados/daniel-rivera.webp'),
    name: 'Daniel Rivera', category: 'civil', rating: 4.8, reviews: 76,
    city: 'San Pedro Sula', online: true, modes: ['En línea', 'Presencial'], years: 8, casesSolved: 190, successRate: 94,
    specialties: ['Cobro de deudas', 'Contratos', 'Compra y venta de terrenos'],
    helps: ['Si alguien le debe dinero', 'Si va a firmar un contrato', 'Si va a comprar o vender un terreno'],
    bio: 'Le ayuda a cobrar lo que le deben y a firmar contratos sin sorpresas.',
    consultationPrice: 90_000,
  },
  {
    id: 'maria-fernanda-lopez', bar: '08421', photo: asset('/img/l-mafer.jpg'), name: 'María Fernanda López', category: 'laboral', rating: 4.9, reviews: 128,
    city: 'Tegucigalpa', online: true, modes: ['En línea', 'Presencial'], years: 5, casesSolved: 128, successRate: 98,
    specialties: ['Despidos injustificados', 'Contratos laborales', 'Acoso laboral', 'Salarios e indemnizaciones'],
    bio: 'Abogada especializada en Derecho Laboral con más de 5 años de experiencia protegiendo los derechos de trabajadores y empleadores.',
    consultationPrice: 100_000,
  },
  {
    id: 'carlos-armando-ruiz', bar: '06137', photo: asset('/img/l-carlosr.jpg'), name: 'Carlos Armando Ruiz', category: 'laboral', rating: 4.8, reviews: 96,
    city: 'San Pedro Sula', online: true, modes: ['En línea'], years: 8, casesSolved: 210, successRate: 95,
    specialties: ['Contratos laborales', 'Negociación colectiva', 'Seguridad social'],
    bio: 'Asesor de empresas y trabajadores en conflictos laborales y negociación colectiva.',
    consultationPrice: 120_000,
  },
  {
    id: 'jessica-martinez', bar: '09884', photo: asset('/img/l-jessica.jpg'), name: 'Jessica Martínez', category: 'laboral', rating: 4.9, reviews: 74,
    city: 'San Pedro Sula', online: true, modes: ['En línea', 'Presencial'], years: 4, casesSolved: 86, successRate: 96,
    specialties: ['Despidos injustificados', 'Acoso laboral'],
    bio: 'Defensora de los derechos laborales con enfoque en acoso y discriminación en el trabajo.',
    consultationPrice: 90_000,
  },
  {
    id: 'luis-redondo', bar: '04512', photo: asset('/img/l-luis.jpg'), name: 'Luis Redondo', category: 'laboral', rating: 4.7, reviews: 63,
    city: 'Tegucigalpa', online: false, modes: ['Presencial'], years: 10, casesSolved: 302, successRate: 93,
    specialties: ['Salarios e indemnizaciones', 'Juicios laborales'],
    bio: 'Litigante con una década de experiencia en juzgados de trabajo.',
    consultationPrice: 80_000,
  },
  {
    id: 'carlos-mejia', bar: '07205', photo: asset('/img/l-carlos.jpg'), name: 'Carlos Mejía', category: 'civil', rating: 4.8, reviews: 96,
    city: 'San Pedro Sula', online: true, modes: ['En línea', 'Presencial'], years: 7, casesSolved: 150, successRate: 94,
    specialties: ['Contratos', 'Cobro de deudas', 'Responsabilidad civil'],
    bio: 'Especialista en contratos civiles y recuperación de deudas.',
    consultationPrice: 100_000,
  },
  {
    id: 'daniela-funez', bar: '07763', photo: asset('/img/l-daniela.jpg'), name: 'Daniela Fúnez', category: 'familia', rating: 4.9, reviews: 112,
    city: 'San Pedro Sula', online: true, modes: ['En línea', 'Presencial'], years: 6, casesSolved: 140, successRate: 97,
    specialties: ['Divorcios', 'Pensión alimenticia', 'Custodia'],
    bio: 'Acompaña a familias en procesos de divorcio, custodia y pensiones con trato humano.',
    consultationPrice: 95_000,
  },
]

export function getLawyer(id: string): Lawyer | undefined {
  return lawyers.find((l) => l.id === id)
}
