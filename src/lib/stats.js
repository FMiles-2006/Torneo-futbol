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
    efectividad: 0,
    asistencia: 0,
    habilitado: false,
  }
}

/**
 * @param {Array} partidos        partidos del torneo
 * @param {Array} participaciones participaciones de esos partidos
 * @param {Array} jugadores       lista oficial de jugadores
 */
export function calcularEstadisticas(partidos = [], participaciones = [], jugadores = []) {
  const totalPartidos = partidos.length

  const nombrePorId = new Map(jugadores.map((j) => [j.id, j.nombre]))
  const resultadoPorPartido = new Map(partidos.map((p) => [p.id, p.resultado]))

  const tabla = new Map()
  const fila = (id) => {
    if (!tabla.has(id)) tabla.set(id, filaVacia(id, nombrePorId.get(id) || 'Jugador eliminado'))
    return tabla.get(id)
  }

  // Todos los jugadores activos arrancan en la tabla (aunque no hayan jugado),
  // así aparecen en la sección de asistencia con 0.
  jugadores.filter((j) => j.activo).forEach((j) => fila(j.id))

  for (const par of participaciones) {
    if (!par.jugador_id) continue // invitado: no suma nada
    const resultado = resultadoPorPartido.get(par.partido_id)
    if (!resultado) continue // participación de un partido de otro torneo

    const f = fila(par.jugador_id)
    f.pj += 1
    f.goles += par.goles || 0

    if (resultado === 'E') {
      f.pe += 1
      f.pts += 1
    } else if (resultado === par.equipo) {
      f.pg += 1
      f.pts += 3
    } else {
      f.pp += 1
    }
  }

  for (const p of partidos) {
    if (p.figura_jugador_id) fila(p.figura_jugador_id).figuras += 1
  }

  const filas = [...tabla.values()].map((f) => ({
    ...f,
    efectividad: f.pj > 0 ? (f.pts / (f.pj * 3)) * 100 : 0,
    asistencia: totalPartidos > 0 ? (f.pj / totalPartidos) * 100 : 0,
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
    .sort((a, b) => b.goles - a.goles || b.pj - a.pj || a.nombre.localeCompare(b.nombre))

  const figuras = filas
    .filter((f) => f.figuras > 0)
    .sort((a, b) => b.figuras - a.figuras || b.pj - a.pj || a.nombre.localeCompare(b.nombre))

  // Sección 3 — Asistencia: todos, de mayor a menor.
  const asistencia = [...filas].sort(
    (a, b) => b.pj - a.pj || a.nombre.localeCompare(b.nombre)
  )

  return { totalPartidos, efectividad, goleadores, figuras, asistencia, filas }
}

export function formatearPorcentaje(n) {
  return `${n.toFixed(1)}%`
}

export function formatearFecha(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}
