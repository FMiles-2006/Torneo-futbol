import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { formatearFecha } from '../lib/stats.js'

export default function PanelTorneo({ torneo, partidos, onCambio }) {
  const [nombre, setNombre] = useState(torneo ? torneo.nombre : '')
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [historial, setHistorial] = useState([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [trabajando, setTrabajando] = useState(false)

  useEffect(() => {
    setNombre(torneo ? torneo.nombre : '')
  }, [torneo])

  useEffect(() => {
    let vivo = true
    supabase
      .from('torneos')
      .select('*')
      .eq('activo', false)
      .order('cerrado_en', { ascending: false })
      .then(({ data }) => {
        if (vivo) setHistorial(data || [])
      })
    return () => {
      vivo = false
    }
  }, [torneo])

  async function renombrar(e) {
    e.preventDefault()
    const limpio = nombre.trim()
    if (!limpio || !torneo) return
    setTrabajando(true)
    setError('')
    setOk('')
    const { error } = await supabase
      .from('torneos')
      .update({ nombre: limpio })
      .eq('id', torneo.id)
    if (error) setError(error.message)
    else {
      setOk('Nombre actualizado.')
      await onCambio()
    }
    setTrabajando(false)
  }

  async function crearPrimero(e) {
    e.preventDefault()
    const limpio = nombreNuevo.trim()
    if (!limpio) return
    setTrabajando(true)
    setError('')
    const { error } = await supabase.from('torneos').insert({ nombre: limpio, activo: true })
    if (error) setError(error.message)
    else {
      setNombreNuevo('')
      await onCambio()
    }
    setTrabajando(false)
  }

  async function cerrarYAbrirNuevo(e) {
    e.preventDefault()
    const limpio = nombreNuevo.trim()
    if (!limpio || !torneo) return
    if (
      !window.confirm(
        `Se va a cerrar “${torneo.nombre}” (queda archivado con sus ${partidos.length} partidos) y se va a abrir “${limpio}” desde cero. ¿Confirmás?`
      )
    )
      return

    setTrabajando(true)
    setError('')
    setOk('')
    try {
      const cierre = await supabase
        .from('torneos')
        .update({ activo: false, cerrado_en: new Date().toISOString() })
        .eq('id', torneo.id)
      if (cierre.error) throw cierre.error

      const alta = await supabase.from('torneos').insert({ nombre: limpio, activo: true })
      if (alta.error) throw alta.error

      setNombreNuevo('')
      setOk('Torneo cerrado. Ya estás trabajando sobre el nuevo.')
      await onCambio()
    } catch (err) {
      setError(err.message || 'No se pudo cerrar el torneo.')
    } finally {
      setTrabajando(false)
    }
  }

  if (!torneo) {
    return (
      <div className="card">
        <h2>No hay torneo activo</h2>
        <p className="ayuda">Creá uno para empezar a cargar partidos.</p>
        {error && <div className="aviso error">{error}</div>}
        <form className="fila" onSubmit={crearPrimero}>
          <input
            type="text"
            placeholder="Nombre del torneo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            aria-label="Nombre del torneo"
          />
          <button className="btn" type="submit" disabled={trabajando || !nombreNuevo.trim()}>
            Crear
          </button>
        </form>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <h2>Torneo en curso</h2>
        <p className="ayuda">
          {partidos.length} {partidos.length === 1 ? 'partido cargado' : 'partidos cargados'}.
        </p>
        {error && <div className="aviso error">{error}</div>}
        {ok && <div className="aviso ok">{ok}</div>}
        <form className="fila" onSubmit={renombrar}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-label="Nombre del torneo"
          />
          <button className="btn sec" type="submit" disabled={trabajando || !nombre.trim()}>
            Renombrar
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Cerrar torneo y empezar uno nuevo</h2>
        <p className="ayuda">
          El torneo actual queda archivado con todo su historial (se puede seguir consultando
          desde la vista pública) y el nuevo arranca sin partidos. Los jugadores se mantienen.
        </p>
        <form onSubmit={cerrarYAbrirNuevo}>
          <div className="campo">
            <label htmlFor="nuevo-torneo">Nombre del torneo nuevo</label>
            <input
              id="nuevo-torneo"
              type="text"
              placeholder="Ej: Torneo Verano 2027"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
            />
          </div>
          <button
            className="btn peligro ancho"
            type="submit"
            disabled={trabajando || !nombreNuevo.trim()}
          >
            Cerrar “{torneo.nombre}” y abrir el nuevo
          </button>
        </form>
      </div>

      {historial.length > 0 && (
        <div className="card">
          <h2>Torneos archivados ({historial.length})</h2>
          {historial.map((t) => (
            <div className="jugador-fila" key={t.id}>
              <span className="nombre">{t.nombre}</span>
              <span className="chip">
                {t.cerrado_en ? `cerrado ${formatearFecha(t.cerrado_en.slice(0, 10))}` : 'cerrado'}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
