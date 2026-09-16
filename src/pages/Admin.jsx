import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import Login from '../components/Login.jsx'
import PanelPartidos from '../components/PanelPartidos.jsx'
import PanelJugadores from '../components/PanelJugadores.jsx'
import PanelTorneo from '../components/PanelTorneo.jsx'

const PESTANAS = [
  { id: 'partidos', titulo: 'Partidos' },
  { id: 'jugadores', titulo: 'Jugadores' },
  { id: 'torneo', titulo: 'Torneo' },
]

export default function Admin() {
  const [sesion, setSesion] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [pestana, setPestana] = useState('partidos')

  const [torneo, setTorneo] = useState(null)
  const [jugadores, setJugadores] = useState([])
  const [partidos, setPartidos] = useState([])
  const [participaciones, setParticipaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      setVerificando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const recargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [t, j] = await Promise.all([
        supabase.from('torneos').select('*').eq('activo', true).maybeSingle(),
        supabase.from('jugadores').select('*').order('nombre'),
      ])
      if (t.error) throw t.error
      if (j.error) throw j.error

      setTorneo(t.data || null)
      setJugadores(j.data || [])

      if (!t.data) {
        setPartidos([])
        setParticipaciones([])
        return
      }

      const p = await supabase
        .from('partidos')
        .select('*')
        .eq('torneo_id', t.data.id)
        .order('fecha', { ascending: false })
        .order('creado_en', { ascending: false })
      if (p.error) throw p.error
      setPartidos(p.data || [])

      if ((p.data || []).length === 0) {
        setParticipaciones([])
        return
      }
      const par = await supabase
        .from('participaciones')
        .select('*')
        .in(
          'partido_id',
          p.data.map((x) => x.id)
        )
      if (par.error) throw par.error
      setParticipaciones(par.data || [])
    } catch (e) {
      setError(e.message || 'Error al cargar los datos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (sesion) recargar()
  }, [sesion, recargar])

  if (verificando) return <div className="cargando">Cargando…</div>
  if (!sesion) return <Login />

  return (
    <>
      <header className="encabezado">
        <div className="encabezado-inner">
          <div>
            <h1>Panel de administración</h1>
            <div className="sub">{torneo ? torneo.nombre : 'Sin torneo activo'}</div>
          </div>
          <div className="acciones">
            <Link to="/" className="btn sec chico">
              Ver público
            </Link>
            <button className="btn sec chico" onClick={() => supabase.auth.signOut()}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="contenedor">
        {error && <div className="aviso error">{error}</div>}

        <nav className="tabs">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              className={pestana === p.id ? 'activo' : ''}
              onClick={() => setPestana(p.id)}
            >
              {p.titulo}
            </button>
          ))}
        </nav>

        {cargando ? (
          <div className="cargando">Cargando…</div>
        ) : !torneo ? (
          <PanelTorneo torneo={null} partidos={[]} onCambio={recargar} />
        ) : (
          <>
            {pestana === 'partidos' && (
              <PanelPartidos
                torneo={torneo}
                jugadores={jugadores}
                partidos={partidos}
                participaciones={participaciones}
                onCambio={recargar}
              />
            )}
            {pestana === 'jugadores' && (
              <PanelJugadores jugadores={jugadores} onCambio={recargar} />
            )}
            {pestana === 'torneo' && (
              <PanelTorneo torneo={torneo} partidos={partidos} onCambio={recargar} />
            )}
          </>
        )}
      </div>
    </>
  )
}
