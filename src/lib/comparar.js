// ============================================================
//  Cara a cara entre dos jugadores.
//
//  Separa los partidos que compartieron en dos grupos:
//   - ENFRENTADOS: jugaron en equipos distintos. Se lleva el récord
//     de quién ganó más veces.
//   - JUNTOS: jugaron en el mismo equipo. Se lleva el rendimiento
//     del dúo (puntos y efectividad jugando del mismo lado).
// ============================================================

import { ordenCronologico, resultadoPara } from './stats.js'

function vacio() {
  return { pj: 0, pg: 0, pe: 0, pp: 0, pts: 0 }
}

function sumar(acc, r) {
  acc.pj += 1
  if (r === 'G') {
    acc.pg += 1
    acc.pts += 3
  } else if (r === 'E') {
    acc.pe += 1
    acc.pts += 1
  } else {
    acc.pp += 1
  }
}

function efectividad(acc) {
  return acc.pj > 0 ? (acc.pts / (acc.pj * 3)) * 100 : 0
}

/**
 * @param {string} idA
 * @param {string} idB
 * @param {Array}  partidos
 * @param {Array}  participaciones
 */
export function compararJugadores(idA, idB, partidos = [], participaciones = []) {
  const porPartido = new Map()
  for (const par of participaciones) {
    if (!par.jugador_id) continue
    if (par.jugador_id !== idA && par.jugador_id !== idB) continue
    if (!porPartido.has(par.partido_id)) porPartido.set(par.partido_id, {})
    porPartido.get(par.partido_id)[par.jugador_id] = par
  }

  const enfrentados = { pj: 0, ganoA: 0, ganoB: 0, empates: 0 }
  const juntos = vacio()
  const compartidos = []

  // Del más nuevo al más viejo para mostrar, pero recorremos cronológico
  // para que el listado quede coherente si algún día se usa para rachas.
  for (const partido of ordenCronologico(partidos)) {
    const par = porPartido.get(partido.id)
    if (!par) continue

    const pA = par[idA]
    const pB = par[idB]
    if (!pA || !pB) continue // sólo jugó uno de los dos

    const rA = resultadoPara(partido.resultado, pA.equipo)
    const rB = resultadoPara(partido.resultado, pB.equipo)
    const mismoEquipo = pA.equipo === pB.equipo

    if (mismoEquipo) {
      sumar(juntos, rA)
    } else {
      enfrentados.pj += 1
      if (rA === 'G') enfrentados.ganoA += 1
      else if (rB === 'G') enfrentados.ganoB += 1
      else enfrentados.empates += 1
    }

    compartidos.push({
      partido,
      mismoEquipo,
      equipoA: pA.equipo,
      equipoB: pB.equipo,
      resultadoA: rA,
      resultadoB: rB,
      golesA: pA.goles || 0,
      golesB: pB.goles || 0,
    })
  }

  compartidos.reverse() // el más reciente primero

  return {
    enfrentados,
    juntos: { ...juntos, efectividad: efectividad(juntos) },
    compartidos,
    totalCompartidos: compartidos.length,
  }
}
