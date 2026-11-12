import { useId } from 'react'

/**
 * Logotipo de Next Legal trazado sobre las medidas del logo original del cliente
 * (272×168 px): "Next" 110 px de ancho, "Legal" 125 px, arco de x=54 a x=204
 * con su parte más gruesa cerca de x=180. Solo cambia la paleta: el morado pasa a azul.
 */
export function BrandLogo({ tone = 'dark', animated = true, className = '' }: { tone?: 'dark' | 'light'; animated?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '')
  const next = tone === 'light' ? '#ffffff' : '#0e1f47'
  const font = "'Manrope Variable', Manrope, system-ui, sans-serif"
  return (
    <svg className={`brand-logo ${animated ? 'is-animated' : ''} ${className}`} viewBox="13 40 242 86" role="img" aria-label="Next Legal">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={tone === 'light' ? '#5b8cff' : '#1e5bff'} />
          <stop offset="1" stopColor={tone === 'light' ? '#3fd0ee' : '#139cc0'} />
        </linearGradient>
        <linearGradient id={`shine-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`legal-${id}`}>
          <text x="127" y="112" fontSize="53" fontWeight="800" fontFamily={font} textLength="125" lengthAdjust="spacingAndGlyphs">Legal</text>
        </clipPath>
      </defs>
      <path className="brand-arc" d="M54 62 C 90 44, 140 36, 204 55 C 196 58, 186 62, 178 61 C 150 52, 100 50, 54 62 Z" fill={`url(#g-${id})`} />
      <text x="15" y="112" fontSize="53" fontWeight="800" fontFamily={font} fill={next} textLength="110" lengthAdjust="spacingAndGlyphs">Next</text>
      <text x="127" y="112" fontSize="53" fontWeight="800" fontFamily={font} fill={`url(#g-${id})`} textLength="125" lengthAdjust="spacingAndGlyphs">Legal</text>
      <g clipPath={`url(#legal-${id})`}>
        <rect className="brand-shine" x="60" y="60" width="50" height="70" fill={`url(#shine-${id})`} />
      </g>
    </svg>
  )
}
