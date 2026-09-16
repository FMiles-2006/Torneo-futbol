import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { calcularEstadisticas, MINIMO_ASISTENCIA } from '../lib/stats.js'
import SeccionPosiciones from '../components/SeccionPosiciones.jsx'
import SeccionGoles from '../components/SeccionGoles.jsx'
import SeccionAsistencia from '../components/SeccionAsistencia.jsx'
import SeccionComparar from '../components/SeccionComparar.jsx'

const SECCIONES = [
  { id: 'posiciones', titulo: 'Posiciones' },
  { id: 'goles', titulo: 'Goles y figuras' },
  { id: 'asistencia', titulo: 'Asistencia' },
  { id: 'comparar', titulo: 'Cara a cara' },
]

export default function Publico() {
  const [seccion, setSeccion] = useState('posiciones')
  const [torneos, setTorneos] = useState([])
  const [torneoId, setTorneoId] = useState(null)
  const [jugadores, setJugadores] = useState([])
  const [partidos, setPartidos] = useState([])
  const [participaciones, setParticipaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

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
  const ultima = partidos[0]

  return (
    <>
      <header className="marca">
        <div className="marca-inner">
          <div style={{ minWidth: 0 }}>
            <div className="kicker">
              {torneo && !torneo.activo ? (
                <>Torneo cerrado</>
              ) : (
                <>
                  Torneo <b>en curso</b>
                </>
              )}
            </div>
            <h1>{torneo ? torneo.nombre : 'Torneo Fútbol 5'}</h1>
            <div className="bajada">
              <span className="num">{stats.totalPartidos}</span>{' '}
              {stats.totalPartidos === 1 ? 'fecha' : 'fechas'}
              <span className="sep">·</span>
              <span className="num">{jugadores.filter((j) => j.activo).length}</span> jugadores
              {ultima && (
                <>
                  <span className="sep">·</span>últ. {ultima.fecha.slice(8, 10)}/
                  {ultima.fecha.slice(5, 7)}
                </>
              )}
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
          <div className="campo" style={{ marginTop: 18, marginBottom: 0 }}>
            <label htmlFor="sel-torneo">Ver otro torneo</label>
            <select
              id="sel-torneo"
              value={torneoId || ''}
              onChange={(e) => setTorneoId(e.target.value)}
            >
              {torneos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.activo ? '· en curso' : '· cerrado'}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="secciones">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              className={seccion === s.id ? 'activo' : ''}
              onClick={() => setSeccion(s.id)}
              aria-current={seccion === s.id ? 'page' : undefined}
            >
              {s.titulo}
            </button>
          ))}
        </nav>

        {cargando ? (
          <div className="cargando">Cargando…</div>
        ) : stats.totalPartidos === 0 ? (
          <div className="vacio-msg">
            Todavía no se jugó ninguna fecha de este torneo.
            <br />
            Cuando el admin cargue el primer partido, acá aparecen las tablas.
          </div>
        ) : (
          <>
            {seccion === 'posiciones' && (
              <SeccionPosiciones stats={stats} minimoPartidos={minimoPartidos} />
            )}
            {seccion === 'goles' && <SeccionGoles stats={stats} />}
            {seccion === 'asistencia' && (
              <SeccionAsistencia stats={stats} minimoPartidos={minimoPartidos} />
            )}
            {seccion === 'comparar' && (
              <SeccionComparar
                stats={stats}
                partidos={partidos}
                participaciones={participaciones}
              />
            )}
          </>
        )}

        <p className="pie">
          Victoria 3 pts · Empate 1 pt · Derrota 0 pts. Los puntos se asignan según el resultado
          del equipo en el que jugó cada uno. Los invitados no suman.
        </p>
      </div>
    </>
  )
}
