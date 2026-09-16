import { useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function PanelJugadores({ jugadores, onCambio }) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [nombreEdit, setNombreEdit] = useState('')

  const activos = jugadores.filter((j) => j.activo)
  const inactivos = jugadores.filter((j) => !j.activo)

  async function agregar(e) {
    e.preventDefault()
    const limpio = nombre.trim()
    if (!limpio) return
    setGuardando(true)
    setError('')
    const { error } = await supabase.from('jugadores').insert({ nombre: limpio })
    if (error) {
      setError(
        error.code === '23505' ? 'Ya existe un jugador con ese nombre.' : error.message
      )
    } else {
      setNombre('')
      await onCambio()
    }
    setGuardando(false)
  }

  async function guardarNombre(id) {
    const limpio = nombreEdit.trim()
    if (!limpio) return
    setError('')
    const { error } = await supabase.from('jugadores').update({ nombre: limpio }).eq('id', id)
    if (error) {
      setError(error.code === '23505' ? 'Ya existe un jugador con ese nombre.' : error.message)
      return
    }
    setEditandoId(null)
    await onCambio()
  }

  async function alternarActivo(j) {
    setError('')
    const { error } = await supabase
      .from('jugadores')
      .update({ activo: !j.activo })
      .eq('id', j.id)
    if (error) setError(error.message)
    else await onCambio()
  }

  return (
    <>
      <div className="card">
        <h2>Agregar jugador</h2>
        <p className="ayuda">Escribí el nombre y tocá Agregar.</p>
        {error && <div className="aviso error">{error}</div>}
        <form className="fila" onSubmit={agregar}>
          <input
            type="text"
            placeholder="Nombre del jugador"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-label="Nombre del jugador"
          />
          <button className="btn" type="submit" disabled={guardando || !nombre.trim()}>
            Agregar
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Jugadores activos ({activos.length})</h2>
        <p className="ayuda">
          Desactivar un jugador lo saca de la lista para cargar partidos, pero conserva su
          historial.
        </p>
        {activos.length === 0 ? (
          <div className="vacio-msg">Todavía no hay jugadores.</div>
        ) : (
          activos.map((j) => (
            <FilaJugador
              key={j.id}
              jugador={j}
              editando={editandoId === j.id}
              nombreEdit={nombreEdit}
              setNombreEdit={setNombreEdit}
              onEditar={() => {
                setEditandoId(j.id)
                setNombreEdit(j.nombre)
              }}
              onCancelar={() => setEditandoId(null)}
              onGuardar={() => guardarNombre(j.id)}
              onAlternar={() => alternarActivo(j)}
            />
          ))
        )}
      </div>

      {inactivos.length > 0 && (
        <div className="card">
          <h2>Desactivados ({inactivos.length})</h2>
          {inactivos.map((j) => (
            <FilaJugador
              key={j.id}
              jugador={j}
              editando={editandoId === j.id}
              nombreEdit={nombreEdit}
              setNombreEdit={setNombreEdit}
              onEditar={() => {
                setEditandoId(j.id)
                setNombreEdit(j.nombre)
              }}
              onCancelar={() => setEditandoId(null)}
              onGuardar={() => guardarNombre(j.id)}
              onAlternar={() => alternarActivo(j)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function FilaJugador({
  jugador,
  editando,
  nombreEdit,
  setNombreEdit,
  onEditar,
  onCancelar,
  onGuardar,
  onAlternar,
}) {
  if (editando) {
    return (
      <div className="jugador-fila">
        <input
          type="text"
          value={nombreEdit}
          onChange={(e) => setNombreEdit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onGuardar()}
          autoFocus
        />
        <button className="btn chico" onClick={onGuardar}>
          Guardar
        </button>
        <button className="btn sec chico" onClick={onCancelar}>
          ✕
        </button>
      </div>
    )
  }
  return (
    <div className={`jugador-fila${jugador.activo ? '' : ' inactivo'}`}>
      <span className="nombre">{jugador.nombre}</span>
      <div className="acciones">
        <button className="btn sec chico" onClick={onEditar}>
          Editar
        </button>
        <button className="btn sec chico" onClick={onAlternar}>
          {jugador.activo ? 'Desactivar' : 'Reactivar'}
        </button>
      </div>
    </div>
  )
}
