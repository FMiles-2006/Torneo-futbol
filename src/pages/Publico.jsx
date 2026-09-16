import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import {
  calcularEstadisticas,
  formatearPorcentaje,
  MINIMO_ASISTENCIA,
} from '../lib/stats.js'

const SECCIONES = [
  { id: 'efectividad', titulo: 'Efectividad' },
  { id: 'goles', titulo: 'Goles y figuras' },
  { id: 'asistencia', titulo: 'Asistencia' },
]

export default function Publico() {
  const [seccion, setSeccion] = useState('efectividad')
  const [torneos, setTorneos] = useState([])
  const [torneoId, setTorneoId] = useState(null)
  const [jugadores, setJugadores] = useState([])
  const [partidos, setPartidos] = useState([])
  const [participaciones, setParticipaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Torneos + jugadores (una sola vez)
  useEffect(() => {
    let vivo = true
    ;(async () => {
      const [t, j] = await Promise.all([
        supabase.from('torneos').select('*').order('creado_en', { ascending: false }),
        supabase.from('jugadores').select('*').order('nombre'),
      ])
      if (!vivo) return
      if (t.error || j.error) {
        setError((t.error || j.error).message)
        setCargando(false)
        return
      }
      setTorneos(t.data || [])
      setJugadores(j.data || [])
      const activo = (t.data || []).find((x) => x.activo) || (t.data || [])[0]
      setTorneoId(activo ? activo.id : null)
      if (!activo) setCargando(false)
    })()
    return () => {
      vivo = false
    }
  }, [])

  // Partidos + participaciones del torneo elegido
  useEffect(() => {
    if (!torneoId) return
    let vivo = true
    setCargando(true)
    ;(async () => {
      const p = await supabase
        .from('partidos')
        .select('*')
        .eq('torneo_id', torneoId)
        .order('fecha', { ascending: false })
      if (!vivo) return
      if (p.error) {
        setError(p.error.message)
        setCargando(false)
        return
      }
      const lista = p.data || []
      setPartidos(lista)

      if (lista.length === 0) {
        setParticipaciones([])
        setCargando(false)
        return
      }
      const par = await supabase
        .from('participaciones')
        .select('*')
        .in(
          'partido_id',
          lista.map((x) => x.id)
        )
      if (!vivo) return
      if (par.error) setError(par.error.message)
      setParticipaciones(par.data || [])
      setCargando(false)
    })()
    return () => {
      vivo = false
    }
  }, [torneoId])

  const stats = useMemo(
    () => calcularEstadisticas(partidos, participaciones, jugadores),
    [partidos, participaciones, jugadores]
  )

  const torneo = torneos.find((t) => t.id === torneoId)
  const minimoPartidos = Math.ceil(stats.totalPartidos * MINIMO_ASISTENCIA)

  return (
    <>
      <header className="encabezado">
        <div className="encabezado-inner">
          <div>
            <h1>⚽ {torneo ? torneo.nombre : 'Torneo Fútbol 5'}</h1>
            <div className="sub">
              {stats.totalPartidos} {stats.totalPartidos === 1 ? 'partido jugado' : 'partidos jugados'}
              {torneo && !torneo.activo ? ' · torneo cerrado' : ''}
            </div>
          </div>
          <Link to="/admin" className="btn sec chico">
            Admin
          </Link>
        </div>
      </header>

      <div className="contenedor">
        {error && <div className="aviso error">{error}</div>}

        {torneos.length > 1 && (
          <div className="campo">
            <label htmlFor="sel-torneo">Torneo</label>
            <select
              id="sel-torneo"
              value={torneoId || ''}
              onChange={(e) => setTorneoId(e.target.value)}
            >
              {torneos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.activo ? '(en curso)' : '(cerrado)'}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="tabs">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              className={seccion === s.id ? 'activo' : ''}
              onClick={() => setSeccion(s.id)}
            >
              {s.titulo}
            </button>
          ))}
        </nav>

        {cargando ? (
          <div className="cargando">Cargando…</div>
        ) : stats.totalPartidos === 0 ? (
          <div className="card">
            <div className="vacio-msg">
              Todavía no se cargó ningún partido en este torneo.
            </div>
          </div>
        ) : (
          <>
            {seccion === 'efectividad' && (
              <TablaEfectividad stats={stats} minimoPartidos={minimoPartidos} />
            )}
            {seccion === 'goles' && <GolesYFiguras stats={stats} />}
            {seccion === 'asistencia' && (
              <TablaAsistencia stats={stats} minimoPartidos={minimoPartidos} />
            )}
          </>
        )}

        <p className="pie">
          Victoria 3 pts · Empate 1 pt · Derrota 0 pts · Los invitados no suman puntos.
        </p>
      </div>
    </>
  )
}

function claseP(i) {
  return i === 0 ? 'podio-1' : i === 1 ? 'podio-2' : i === 2 ? 'podio-3' : ''
}

function TablaEfectividad({ stats, minimoPartidos }) {
  return (
    <div className="card">
      <h2>Tabla de efectividad</h2>
      <p className="ayuda">
        Efectividad = puntos ÷ (partidos jugados × 3). Sólo entran los jugadores con al menos{' '}
        <b>{minimoPartidos}</b> de los {stats.totalPartidos} partidos disputados (60 %). Si hay
        empate en efectividad, va primero el que jugó más partidos.
      </p>

      {stats.efectividad.length === 0 ? (
        <div className="vacio-msg">
          Ningún jugador llega todavía al 60 % de asistencia.
        </div>
      ) : (
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>PJ</th>
                <th>G</th>
                <th>E</th>
                <th>P</th>
                <th>Pts</th>
                <th>Efec.</th>
              </tr>
            </thead>
            <tbody>
              {stats.efectividad.map((f, i) => (
                <tr key={f.jugadorId} className={claseP(i)}>
                  <td>{i + 1}</td>
                  <td>{f.nombre}</td>
                  <td>{f.pj}</td>
                  <td>{f.pg}</td>
                  <td>{f.pe}</td>
                  <td>{f.pp}</td>
                  <td>
                    <b>{f.pts}</b>
                  </td>
                  <td className="destacado">{formatearPorcentaje(f.efectividad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GolesYFiguras({ stats }) {
  return (
    <>
      <div className="card">
        <h2>Goleadores</h2>
        <p className="ayuda">Goles totales en el torneo.</p>
        {stats.goleadores.length === 0 ? (
          <div className="vacio-msg">Todavía no se cargaron goles.</div>
        ) : (
          <div className="tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugador</th>
                  <th>PJ</th>
                  <th>Goles</th>
                </tr>
              </thead>
              <tbody>
                {stats.goleadores.map((f, i) => (
                  <tr key={f.jugadorId} className={claseP(i)}>
                    <td>{i + 1}</td>
                    <td>{f.nombre}</td>
                    <td>{f.pj}</td>
                    <td className="destacado">
                      <b>{f.goles}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Figuras del partido</h2>
        <p className="ayuda">Cuántas veces fue elegido figura.</p>
        {stats.figuras.length === 0 ? (
          <div className="vacio-msg">Todavía no se eligieron figuras.</div>
        ) : (
          <div className="tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugador</th>
                  <th>PJ</th>
                  <th>Figuras</th>
                </tr>
              </thead>
              <tbody>
                {stats.figuras.map((f, i) => (
                  <tr key={f.jugadorId} className={claseP(i)}>
                    <td>{i + 1}</td>
                    <td>{f.nombre}</td>
                    <td>{f.pj}</td>
                    <td className="destacado">
                      <b>{f.figuras}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function TablaAsistencia({ stats, minimoPartidos }) {
  const habilitados = stats.asistencia.filter((f) => f.habilitado).length
  return (
    <div className="card">
      <h2>Asistencia</h2>
      <p className="ayuda">
        Sobre {stats.totalPartidos} partidos. En verde los que superan el 60 % (mínimo{' '}
        {minimoPartidos} partidos) y por lo tanto entran en la tabla de efectividad:{' '}
        <b>{habilitados}</b> de {stats.asistencia.length}.
      </p>
      <div className="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>PJ</th>
              <th>%</th>
              <th style={{ minWidth: 80 }}>&nbsp;</th>
              <th>Tabla</th>
            </tr>
          </thead>
          <tbody>
            {stats.asistencia.map((f, i) => (
              <tr key={f.jugadorId}>
                <td>{i + 1}</td>
                <td>{f.nombre}</td>
                <td>{f.pj}</td>
                <td>{formatearPorcentaje(f.asistencia)}</td>
                <td>
                  <div className={`barra${f.habilitado ? '' : ' baja'}`}>
                    <span style={{ width: `${Math.min(100, f.asistencia)}%` }} />
                  </div>
                </td>
                <td>
                  <span className={`chip ${f.habilitado ? 'ok' : 'no'}`}>
                    {f.habilitado ? 'Sí' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
