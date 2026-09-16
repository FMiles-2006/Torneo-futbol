// ============================================================
//  Cálculo de estadísticas del torneo.
//
//  Reglas:
//   - Victoria = 3 pts, Empate = 1 pt, Derrota = 0 pts.
//   - Los puntos se asignan según el resultado del equipo en el que jugó.
//   - Los INVITADOS (participaciones sin jugador_id) se ignoran por completo.
//   - Efectividad = puntos / (partidos jugados * 3) * 100.
// ============================================================

export const MINIMO_ASISTENCIA = 0.6 // 60 %
export const LARGO_FORMA = 5 // cuántos partidos muestra la columna Forma

/** Ordena partidos del más viejo al más nuevo. */
export function ordenCronologico(partidos) {
  return [...partidos].sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      String(a.creado_en || '').localeCompare(String(b.creado_en || ''))
  )
}

/** Resultado de un partido para el equipo indicado: 'G' | 'E' | 'P'. */
export function resultadoPara(resultadoPartido, equipo) {
  if (resultadoPartido === 'E') return 'E'
  return resultadoPartido === equipo ? 'G' : 'P'
}

function filaVacia(jugadorId, nombre) {
  return {
    jugadorId,
    nombre,
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    pts: 0,
    goles: 0,
    figuras: 0,
    historial: [], // ['G','P','E', ...] del más viejo al más nuevo
  }
}

/**
 * Racha actual: cuántos resultados iguales seguidos hay al final del historial.
 * Devuelve { tipo: 'G'|'E'|'P'|null, cantidad, texto }.
 */
export function calcularRacha(historial) {
  if (!historial.length) return { tipo: null, cantidad: 0, texto: '—' }

  const tipo = historial[historial.length - 1]
  let cantidad = 0
  for (let i = historial.length - 1; i >= 0 && historial[i] === tipo; i--) cantidad++

  const palabra = {
    G: cantidad === 1 ? 'victoria' : 'victorias',
    E: cantidad === 1 ? 'empate' : 'empates',
    P: cantidad === 1 ? 'derrota' : 'derrotas',
  }[tipo]

  return { tipo, cantidad, texto: `${cantidad} ${palabra}` }
}

/** Racha más larga de un resultado dado dentro del historial. */
export function rachaMasLarga(historial, tipo) {
  let mejor = 0
  let actual = 0
  for (const r of historial) {
    if (r === tipo) {
      actual++
      if (actual > mejor) mejor = actual
    } else {
      actual = 0
    }
  }
  return mejor
}

/**
 * @param {Array} partidos        partidos del torneo
 * @param {Array} participaciones participaciones de esos partidos
 * @param {Array} jugadores       lista oficial de jugadores
 */
export function calcularEstadisticas(partidos = [], participaciones = [], jugadores = []) {
  const totalPartidos = partidos.length
  const cronologico = ordenCronologico(partidos)

  const nombrePorId = new Map(jugadores.map((j) => [j.id, j.nombre]))
  const partidoPorId = new Map(partidos.map((p) => [p.id, p]))

  // participaciones agrupadas por partido, para recorrer en orden cronológico
  const porPartido = new Map()
  for (const par of participaciones) {
    if (!porPartido.has(par.partido_id)) porPartido.set(par.partido_id, [])
    porPartido.get(par.partido_id).push(par)
  }

  const tabla = new Map()
  const fila = (id) => {
    if (!tabla.has(id)) tabla.set(id, filaVacia(id, nombrePorId.get(id) || 'Jugador eliminado'))
    return tabla.get(id)
  }

  // Todos los jugadores activos arrancan en la tabla aunque no hayan jugado,
  // así aparecen en asistencia con 0.
  jugadores.filter((j) => j.activo).forEach((j) => fila(j.id))

  for (const partido of cronologico) {
    for (const par of porPartido.get(partido.id) || []) {
      if (!par.jugador_id) continue // invitado: no suma nada

      const f = fila(par.jugador_id)
      const r = resultadoPara(partido.resultado, par.equipo)

      f.pj += 1
      f.goles += par.goles || 0
      f.historial.push(r)

      if (r === 'G') {
        f.pg += 1
        f.pts += 3
      } else if (r === 'E') {
        f.pe += 1
        f.pts += 1
      } else {
        f.pp += 1
      }
    }
  }

  for (const p of partidos) {
    if (p.figura_jugador_id) fila(p.figura_jugador_id).figuras += 1
  }

  const filas = [...tabla.values()].map((f) => ({
    ...f,
    efectividad: f.pj > 0 ? (f.pts / (f.pj * 3)) * 100 : 0,
    asistencia: totalPartidos > 0 ? (f.pj / totalPartidos) * 100 : 0,
    golesPorPartido: f.pj > 0 ? f.goles / f.pj : 0,
    forma: f.historial.slice(-LARGO_FORMA),
    racha: calcularRacha(f.historial),
    mejorRachaG: rachaMasLarga(f.historial, 'G'),
    // Habilitado para la tabla de efectividad: jugó al menos el 60 %
    // del total de partidos disputados hasta el momento.
    habilitado: totalPartidos > 0 && f.pj >= totalPartidos * MINIMO_ASISTENCIA,
  }))

  // Sección 1 — Efectividad: sólo habilitados. Desempate: más partidos jugados.
  const efectividad = filas
    .filter((f) => f.habilitado)
    .sort((a, b) => b.efectividad - a.efectividad || b.pj - a.pj || a.nombre.localeCompare(b.nombre))

  // Sección 2 — Goleadores y figuras.
  const goleadores = filas
    .filter((f) => f.goles > 0)
    .sort(
      (a, b) =>
        b.goles - a.goles ||
        b.golesPorPartido - a.golesPorPartido ||
        a.nombre.localeCompare(b.nombre)
    )

  const figuras = filas
    .filter((f) => f.figuras > 0)
    .sort((a, b) => b.figuras - a.figuras || b.pj - a.pj || a.nombre.localeCompare(b.nombre))

  // Sección 3 — Asistencia: todos, de mayor a menor.
  const asistencia = [...filas].sort((a, b) => b.pj - a.pj || a.nombre.localeCompare(b.nombre))

  // Destacados para la franja superior.
  const maximoGoleador = goleadores[0] || null
  const candidatosRacha = filas
    .filter((f) => f.racha.tipo === 'G' && f.racha.cantidad >= 2)
    .sort((a, b) => b.racha.cantidad - a.racha.cantidad || b.pj - a.pj)

  // Si el que más goles hizo es también el de mejor racha, se muestra al
  // siguiente: repetir el mismo nombre dos veces no aporta nada.
  const enRacha =
    candidatosRacha.find((f) => !maximoGoleador || f.jugadorId !== maximoGoleador.jugadorId) ||
    null

  return {
    totalPartidos,
    partidoPorId,
    efectividad,
    goleadores,
    figuras,
    asistencia,
    filas,
    lider: efectividad[0] || null,
    maximoGoleador,
    enRacha,
  }
}

export function formatearPorcentaje(n, decimales = 1) {
  return `${n.toFixed(decimales)}%`
}

export function formatearPromedio(n) {
  return n.toFixed(2).replace('.', ',')
}

export function formatearFecha(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export function formatearFechaCorta(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}
