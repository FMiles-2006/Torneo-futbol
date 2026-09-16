// Piezas visuales chicas que se repiten en toda la app.

import { LARGO_FORMA } from '../lib/stats.js'

/** Color estable a partir del nombre: el mismo jugador siempre tiene el mismo. */
function tonoDe(nombre = '') {
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) % 360
  return h
}

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}

export function Avatar({ nombre, grande = false }) {
  const h = tonoDe(nombre)
  return (
    <span
      className={`avatar${grande ? ' g' : ''}`}
      style={{ background: `hsl(${h} 62% 68%)` }}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  )
}

const LARGO = { G: 'Ganó', E: 'Empató', P: 'Perdió' }

/** Últimos resultados, del más viejo al más nuevo. */
export function Forma({ resultados = [], relleno = true }) {
  const faltan = relleno ? Math.max(0, LARGO_FORMA - resultados.length) : 0
  const texto = resultados.length
    ? resultados.map((r) => LARGO[r]).join(', ')
    : 'Sin partidos'

  return (
    <span className="forma" role="img" aria-label={`Últimos resultados: ${texto}`}>
      {Array.from({ length: faltan }).map((_, i) => (
        <i key={`v${i}`} className="vacio" aria-hidden="true" />
      ))}
      {resultados.map((r, i) => (
        <i key={i} className={r} aria-hidden="true">
          {r}
        </i>
      ))}
    </span>
  )
}

/** Puesto con dos dígitos, al estilo de las tablas de liga. */
export function puesto(i) {
  return String(i + 1).padStart(2, '0')
}

export function clasePodio(i) {
  return i === 0 ? 'p1' : i === 1 ? 'p2' : i === 2 ? 'p3' : ''
}
