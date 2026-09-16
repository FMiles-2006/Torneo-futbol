import { useEffect, useMemo, useState } from 'react'
import { Avatar } from './Piezas.jsx'
import { compararJugadores } from '../lib/comparar.js'
import { formatearPorcentaje, formatearPromedio, formatearFechaCorta } from '../lib/stats.js'

const METRICAS = [
  { etq: 'Jugados', leer: (f) => f.pj, fmt: (v) => v },
  { etq: 'Efectividad', leer: (f) => f.efectividad, fmt: (v) => formatearPorcentaje(v) },
  { etq: 'Puntos', leer: (f) => f.pts, fmt: (v) => v },
  { etq: 'Goles', leer: (f) => f.goles, fmt: (v) => v },
  { etq: 'Gol/partido', leer: (f) => f.golesPorPartido, fmt: (v) => formatearPromedio(v) },
  { etq: 'Figuras', leer: (f) => f.figuras, fmt: (v) => v },
  { etq: 'Mejor racha', leer: (f) => f.mejorRachaG, fmt: (v) => `${v}V` },
]

export default function SeccionComparar({ stats, partidos, participaciones }) {
  const candidatos = useMemo(
    () => [...stats.filas].filter((f) => f.pj > 0).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [stats.filas]
  )

  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  // Arranca comparando a los dos primeros de la tabla, para que la sección
  // muestre algo útil apenas se entra.
  useEffect(() => {
    if (idA || idB) return
    const [p1, p2] = stats.efectividad
    if (p1 && p2) {
      setIdA(p1.jugadorId)
      setIdB(p2.jugadorId)
    } else if (candidatos.length >= 2) {
      setIdA(candidatos[0].jugadorId)
      setIdB(candidatos[1].jugadorId)
    }
  }, [stats.efectividad, candidatos, idA, idB])

  const fA = candidatos.find((f) => f.jugadorId === idA) || null
  const fB = candidatos.find((f) => f.jugadorId === idB) || null

  const duelo = useMemo(() => {
    if (!fA || !fB || fA.jugadorId === fB.jugadorId) return null
    return compararJugadores(fA.jugadorId, fB.jugadorId, partidos, participaciones)
  }, [fA, fB, partidos, participaciones])

  if (candidatos.length < 2) {
    return (
      <div className="bloque">
        <div className="bloque-cab">
          <h2>Cara a cara</h2>
        </div>
        <div className="vacio-msg">
          Hacen falta al menos dos jugadores con partidos jugados para comparar.
        </div>
      </div>
    )
  }

  return (
    <div className="bloque">
      <div className="bloque-cab">
        <h2>Cara a cara</h2>
        {duelo && (
          <span className="conteo">
            {duelo.totalCompartidos} {duelo.totalCompartidos === 1 ? 'cruce' : 'cruces'}
          </span>
        )}
      </div>

      <div className="vs-selects">
        <div>
          <label htmlFor="jug-a">Jugador</label>
          <select id="jug-a" value={idA} onChange={(e) => setIdA(e.target.value)}>
            {candidatos.map((f) => (
              <option key={f.jugadorId} value={f.jugadorId}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
        <span className="vs-letra">VS</span>
        <div>
          <label htmlFor="jug-b">Jugador</label>
          <select id="jug-b" value={idB} onChange={(e) => setIdB(e.target.value)}>
            {candidatos.map((f) => (
              <option key={f.jugadorId} value={f.jugadorId}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!fA || !fB ? null : fA.jugadorId === fB.jugadorId ? (
        <div className="vacio-msg">Elegí dos jugadores distintos.</div>
      ) : (
        <>
          <div className="vs-cab">
            <div className="vs-lado">
              <Avatar nombre={fA.nombre} grande />
              <span className="nom">{fA.nombre}</span>
            </div>
            <div className="vs-marcador">
              <span className="a">{duelo.enfrentados.ganoA}</span>
              <span className="guion">–</span>
              <span className="n">{duelo.enfrentados.empates}</span>
              <span className="guion">–</span>
              <span className="b">{duelo.enfrentados.ganoB}</span>
            </div>
            <div className="vs-lado">
              <Avatar nombre={fB.nombre} grande />
              <span className="nom">{fB.nombre}</span>
            </div>
          </div>

          <div className="vs-resumen">
            <div className="vs-caja">
              <h4>Enfrentados</h4>
              <div className="dato num">{duelo.enfrentados.pj}</div>
              <div className="pie-dato">
                {duelo.enfrentados.pj === 0
                  ? 'Nunca jugaron en equipos rivales'
                  : duelo.enfrentados.ganoA === duelo.enfrentados.ganoB
                    ? 'Están igualados'
                    : `Gana ${
                        duelo.enfrentados.ganoA > duelo.enfrentados.ganoB ? fA.nombre : fB.nombre
                      }`}
              </div>
            </div>
            <div className="vs-caja juntos">
              <h4>Del mismo lado</h4>
              <div className="dato num">{duelo.juntos.pj}</div>
              <div className="pie-dato">
                {duelo.juntos.pj === 0
                  ? 'Nunca jugaron en el mismo equipo'
                  : `${duelo.juntos.pg}G ${duelo.juntos.pe}E ${duelo.juntos.pp}P · ${formatearPorcentaje(
                      duelo.juntos.efectividad
                    )}`}
              </div>
            </div>
          </div>

          <div className="vs-tabla">
            {METRICAS.map((m) => {
              const a = m.leer(fA)
              const b = m.leer(fB)
              return (
                <div className="vs-fila" key={m.etq}>
                  <span className={`val izq ${a > b ? 'gana' : a < b ? 'pierde' : ''}`}>
                    {m.fmt(a)}
                  </span>
                  <span className="etq">{m.etq}</span>
                  <span className={`val der ${b > a ? 'gana' : b < a ? 'pierde' : ''}`}>
                    {m.fmt(b)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="bloque-cab" style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: '1.15rem' }}>Partidos compartidos</h2>
          </div>

          {duelo.compartidos.length === 0 ? (
            <div className="vacio-msg">Todavía no coincidieron en ningún partido.</div>
          ) : (
            duelo.compartidos.map((c) => (
              <div className="vs-partido" key={c.partido.id}>
                <span className="fecha">{formatearFechaCorta(c.partido.fecha)}</span>
                <span className={`chip ${c.mismoEquipo ? 'si' : 'azul'}`}>
                  {c.mismoEquipo ? 'Juntos' : 'En contra'}
                </span>
                <span className="detalle">{describir(c, fA.nombre, fB.nombre)}</span>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}

function describir(c, nombreA, nombreB) {
  const goles = []
  if (c.golesA > 0) goles.push(`${nombreA} ${c.golesA}`)
  if (c.golesB > 0) goles.push(`${nombreB} ${c.golesB}`)
  const sufijo = goles.length ? ` · ⚽ ${goles.join(', ')}` : ''

  if (c.mismoEquipo) {
    const txt =
      c.resultadoA === 'G' ? 'Ganaron' : c.resultadoA === 'E' ? 'Empataron' : 'Perdieron'
    return (
      <>
        <b>{txt}</b> jugando los dos en el equipo {c.equipoA}
        {sufijo}
      </>
    )
  }

  if (c.resultadoA === 'E') {
    return (
      <>
        <b>Empate</b> — {nombreA} en {c.equipoA}, {nombreB} en {c.equipoB}
        {sufijo}
      </>
    )
  }

  const ganador = c.resultadoA === 'G' ? nombreA : nombreB
  return (
    <>
      Ganó <b>{ganador}</b> — {nombreA} en {c.equipoA}, {nombreB} en {c.equipoB}
      {sufijo}
    </>
  )
}
