import { useMemo, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { formatearFecha } from '../lib/stats.js'

function hoyLocal() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const nuevoId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random()).slice(2)

export default function PanelPartidos({
  torneo,
  jugadores,
  partidos,
  participaciones,
  onCambio,
}) {
  const [editandoId, setEditandoId] = useState(null)
  const [fecha, setFecha] = useState(hoyLocal())
  const [asignaciones, setAsignaciones] = useState({}) // jugadorId -> 'A' | 'B'
  const [invitados, setInvitados] = useState([]) // { id, nombre, equipo }
  const [invitadoNombre, setInvitadoNombre] = useState('')
  const [invitadoEquipo, setInvitadoEquipo] = useState('A')
  const [resultado, setResultado] = useState('')
  const [goles, setGoles] = useState({}) // jugadorId -> n
  const [figuraId, setFiguraId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const activos = useMemo(() => jugadores.filter((j) => j.activo), [jugadores])
  const nombrePorId = useMemo(
    () => new Map(jugadores.map((j) => [j.id, j.nombre])),
    [jugadores]
  )

  const seleccionados = useMemo(
    () =>
      Object.entries(asignaciones)
        .filter(([, eq]) => eq === 'A' || eq === 'B')
        .map(([id, eq]) => ({ id, equipo: eq, nombre: nombrePorId.get(id) || '' }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [asignaciones, nombrePorId]
  )

  const equipoA = seleccionados.filter((s) => s.equipo === 'A')
  const equipoB = seleccionados.filter((s) => s.equipo === 'B')
  const invitadosA = invitados.filter((i) => i.equipo === 'A')
  const invitadosB = invitados.filter((i) => i.equipo === 'B')

  function limpiar() {
    setEditandoId(null)
    setFecha(hoyLocal())
    setAsignaciones({})
    setInvitados([])
    setInvitadoNombre('')
    setInvitadoEquipo('A')
    setResultado('')
    setGoles({})
    setFiguraId('')
    setError('')
  }

  function alternarEquipo(jugadorId, equipo) {
    // Tocar el mismo botón dos veces saca al jugador del partido.
    const quitar = asignaciones[jugadorId] === equipo

    setAsignaciones((prev) => {
      const sig = { ...prev }
      if (quitar) delete sig[jugadorId]
      else sig[jugadorId] = equipo
      return sig
    })

    if (quitar) {
      setGoles((g) => {
        const ng = { ...g }
        delete ng[jugadorId]
        return ng
      })
      setFiguraId((f) => (f === jugadorId ? '' : f))
    }
  }

  function agregarInvitado(e) {
    e.preventDefault()
    const limpio = invitadoNombre.trim()
    if (!limpio) return
    setInvitados((prev) => [...prev, { id: nuevoId(), nombre: limpio, equipo: invitadoEquipo }])
    setInvitadoNombre('')
  }

  function cambiarGoles(jugadorId, delta) {
    setGoles((g) => {
      const valor = Math.max(0, (g[jugadorId] || 0) + delta)
      const ng = { ...g }
      if (valor === 0) delete ng[jugadorId]
      else ng[jugadorId] = valor
      return ng
    })
  }

  function cargarParaEditar(partido) {
    const pars = participaciones.filter((p) => p.partido_id === partido.id)
    const asg = {}
    const gol = {}
    const inv = []
    for (const p of pars) {
      if (p.jugador_id) {
        asg[p.jugador_id] = p.equipo
        if (p.goles > 0) gol[p.jugador_id] = p.goles
      } else {
        inv.push({ id: nuevoId(), nombre: p.invitado_nombre, equipo: p.equipo })
      }
    }
    setEditandoId(partido.id)
    setFecha(partido.fecha)
    setAsignaciones(asg)
    setGoles(gol)
    setInvitados(inv)
    setResultado(partido.resultado)
    setFiguraId(partido.figura_jugador_id || '')
    setError('')
    setOk('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardar(e) {
    e.preventDefault()
    setError('')
    setOk('')

    if (!fecha) return setError('Elegí la fecha del partido.')
    if (!resultado) return setError('Elegí el resultado del partido.')
    if (equipoA.length + invitadosA.length === 0)
      return setError('El equipo A no tiene jugadores.')
    if (equipoB.length + invitadosB.length === 0)
      return setError('El equipo B no tiene jugadores.')

    const filas = [
      ...seleccionados.map((s) => ({
        jugador_id: s.id,
        invitado_nombre: null,
        equipo: s.equipo,
        goles: goles[s.id] || 0,
      })),
      ...invitados.map((i) => ({
        jugador_id: null,
        invitado_nombre: i.nombre,
        equipo: i.equipo,
        goles: 0,
      })),
    ]

    setGuardando(true)
    try {
      let partidoId = editandoId

      if (editandoId) {
        const { error } = await supabase
          .from('partidos')
          .update({
            fecha,
            resultado,
            figura_jugador_id: figuraId || null,
          })
          .eq('id', editandoId)
        if (error) throw error

        const del = await supabase
          .from('participaciones')
          .delete()
          .eq('partido_id', editandoId)
        if (del.error) throw del.error
      } else {
        const { data, error } = await supabase
          .from('partidos')
          .insert({
            torneo_id: torneo.id,
            fecha,
            resultado,
            figura_jugador_id: figuraId || null,
          })
          .select('id')
          .single()
        if (error) throw error
        partidoId = data.id
      }

      const ins = await supabase
        .from('participaciones')
        .insert(filas.map((f) => ({ ...f, partido_id: partidoId })))
      if (ins.error) throw ins.error

      setOk(editandoId ? 'Partido actualizado.' : 'Partido guardado.')
      limpiar()
      await onCambio()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el partido.')
    } finally {
      setGuardando(false)
    }
  }

  async function borrar(partido) {
    if (
      !window.confirm(
        `¿Borrar el partido del ${formatearFecha(partido.fecha)}? Esta acción no se puede deshacer.`
      )
    )
      return
    const { error } = await supabase.from('partidos').delete().eq('id', partido.id)
    if (error) setError(error.message)
    else {
      if (editandoId === partido.id) limpiar()
      await onCambio()
    }
  }

  return (
    <>
      <div className="card">
        <h2>{editandoId ? 'Editar partido' : 'Cargar partido'}</h2>
        <p className="ayuda">
          Marcá quién jugó en cada equipo, elegí el resultado y guardá. Goles y figura son
          opcionales.
        </p>

        {error && <div className="aviso error">{error}</div>}
        {ok && <div className="aviso ok">{ok}</div>}

        <form onSubmit={guardar}>
          <div className="campo">
            <label htmlFor="fecha">Fecha</label>
            <input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          <div className="resumen-equipos">
            <div className="resumen-equipo a">
              <h4>Equipo A ({equipoA.length + invitadosA.length})</h4>
              {equipoA.length + invitadosA.length === 0 ? (
                <div className="vacio">Nadie todavía</div>
              ) : (
                <ul>
                  {equipoA.map((s) => (
                    <li key={s.id}>{s.nombre}</li>
                  ))}
                  {invitadosA.map((i) => (
                    <li key={i.id}>{i.nombre} (inv.)</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="resumen-equipo b">
              <h4>Equipo B ({equipoB.length + invitadosB.length})</h4>
              {equipoB.length + invitadosB.length === 0 ? (
                <div className="vacio">Nadie todavía</div>
              ) : (
                <ul>
                  {equipoB.map((s) => (
                    <li key={s.id}>{s.nombre}</li>
                  ))}
                  {invitadosB.map((i) => (
                    <li key={i.id}>{i.nombre} (inv.)</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <label>Jugadores</label>
          {activos.length === 0 ? (
            <div className="vacio-msg">
              No hay jugadores activos. Agregalos en la pestaña “Jugadores”.
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {activos.map((j) => {
                const eq = asignaciones[j.id]
                return (
                  <div className="jugador-fila" key={j.id}>
                    <span className="nombre">{j.nombre}</span>
                    <div className="equipo-btns">
                      <button
                        type="button"
                        className={`equipo-btn${eq === 'A' ? ' sel-a' : ''}`}
                        onClick={() => alternarEquipo(j.id, 'A')}
                        aria-label={`${j.nombre} al equipo A`}
                      >
                        A
                      </button>
                      <button
                        type="button"
                        className={`equipo-btn${eq === 'B' ? ' sel-b' : ''}`}
                        onClick={() => alternarEquipo(j.id, 'B')}
                        aria-label={`${j.nombre} al equipo B`}
                      >
                        B
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <label>Invitados</label>
          <p className="ayuda" style={{ marginTop: -2 }}>
            No se agregan a la lista oficial y no suman puntos ni estadísticas.
          </p>
          <div className="fila" style={{ marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Nombre del invitado"
              value={invitadoNombre}
              onChange={(e) => setInvitadoNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') agregarInvitado(e)
              }}
              aria-label="Nombre del invitado"
            />
            <select
              value={invitadoEquipo}
              onChange={(e) => setInvitadoEquipo(e.target.value)}
              style={{ width: 70 }}
              aria-label="Equipo del invitado"
            >
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
            <button
              type="button"
              className="btn"
              onClick={agregarInvitado}
              disabled={!invitadoNombre.trim()}
            >
              +
            </button>
          </div>
          {invitados.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {invitados.map((i) => (
                <div className="jugador-fila" key={i.id}>
                  <span className="nombre">
                    {i.nombre} <span className="chip">Equipo {i.equipo}</span>
                  </span>
                  <button
                    type="button"
                    className="btn sec chico"
                    onClick={() => setInvitados((prev) => prev.filter((x) => x.id !== i.id))}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          <hr className="separador" />

          <div className="campo">
            <label>Resultado</label>
            <div className="resultado-opciones">
              <button
                type="button"
                className={resultado === 'A' ? 'activo' : ''}
                onClick={() => setResultado('A')}
              >
                Gana A
              </button>
              <button
                type="button"
                className={resultado === 'E' ? 'activo' : ''}
                onClick={() => setResultado('E')}
              >
                Empate
              </button>
              <button
                type="button"
                className={resultado === 'B' ? 'activo' : ''}
                onClick={() => setResultado('B')}
              >
                Gana B
              </button>
            </div>
          </div>

          {seleccionados.length > 0 && (
            <>
              <label>Goles (opcional)</label>
              <div style={{ marginBottom: 16 }}>
                {seleccionados.map((s) => (
                  <div className="gol-fila" key={s.id}>
                    <span className="nombre">
                      {s.nombre} <span className="chip">{s.equipo}</span>
                    </span>
                    <div className="stepper">
                      <button type="button" onClick={() => cambiarGoles(s.id, -1)}>
                        −
                      </button>
                      <span className="valor">{goles[s.id] || 0}</span>
                      <button type="button" onClick={() => cambiarGoles(s.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="campo">
                <label htmlFor="figura">Figura del partido (opcional)</label>
                <select
                  id="figura"
                  value={figuraId}
                  onChange={(e) => setFiguraId(e.target.value)}
                >
                  <option value="">— Sin figura —</option>
                  {seleccionados.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="fila">
            <button className="btn ancho" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Guardar partido'}
            </button>
            {editandoId && (
              <button type="button" className="btn sec" onClick={limpiar}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Partidos cargados ({partidos.length})</h2>
        {partidos.length === 0 ? (
          <div className="vacio-msg">Todavía no cargaste ningún partido.</div>
        ) : (
          partidos.map((p) => (
            <ItemPartido
              key={p.id}
              partido={p}
              participaciones={participaciones.filter((x) => x.partido_id === p.id)}
              nombrePorId={nombrePorId}
              onEditar={() => cargarParaEditar(p)}
              onBorrar={() => borrar(p)}
            />
          ))
        )}
      </div>
    </>
  )
}

function ItemPartido({ partido, participaciones, nombrePorId, onEditar, onBorrar }) {
  const nombre = (p) => (p.jugador_id ? nombrePorId.get(p.jugador_id) || '—' : `${p.invitado_nombre} (inv.)`)
  const listar = (eq) =>
    participaciones
      .filter((p) => p.equipo === eq)
      .map((p) => {
        const g = p.jugador_id && p.goles > 0 ? ` ⚽${p.goles}` : ''
        return nombre(p) + g
      })
      .join(', ') || '—'

  const etiqueta =
    partido.resultado === 'A' ? 'Ganó A' : partido.resultado === 'B' ? 'Ganó B' : 'Empate'

  return (
    <div className="partido-item">
      <div className="partido-cab">
        <div>
          <div className="fecha">{formatearFecha(partido.fecha)}</div>
          <span className="chip ok">{etiqueta}</span>{' '}
          {partido.figura_jugador_id && (
            <span className="chip">★ {nombrePorId.get(partido.figura_jugador_id) || '—'}</span>
          )}
        </div>
        <div className="acciones">
          <button className="btn sec chico" onClick={onEditar}>
            Editar
          </button>
          <button className="btn peligro chico" onClick={onBorrar}>
            Borrar
          </button>
        </div>
      </div>
      <div className="partido-equipos">
        <div>
          <b>A:</b> {listar('A')}
        </div>
        <div>
          <b>B:</b> {listar('B')}
        </div>
      </div>
    </div>
  )
}
