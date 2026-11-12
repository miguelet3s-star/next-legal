/** Ruta a un archivo de /public respetando la base del sitio (p. ej. /next-legal/ en GitHub Pages). */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
export const asset = (p: string) => BASE + p
