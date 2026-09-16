import { Avatar, Forma, puesto } from './Piezas.jsx'
import { formatearPorcentaje } from '../lib/stats.js'

export default function SeccionAsistencia({ stats, minimoPartidos }) {
  const { asistencia, totalPartidos } = stats
  const habilitados = asistencia.filter((f) => f.habilitado).length

  return (
    <div className="bloque">
      <div className="bloque-cab">
        <h2>Asistencia</h2>
        <span className="conteo">
          {habilitados} de {asistencia.length} en tabla
        </span>
      </div>

      <p className="nota">
        Sobre <b>{totalPartidos}</b> partidos. Los que llegan a <b>{minimoPartidos}</b> (60 %)
        entran en la tabla de posiciones; el resto queda afuera hasta que sumen fechas.
      </p>

      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <th className="c-puesto">#</th>
              <th className="c-jugador">Jugador</th>
              <th>PJ</th>
              <th>%</th>
              <th style={{ minWidth: 76 }} aria-label="Proporción" />
              <th>Tabla</th>
              <th style={{ textAlign: 'left', paddingLeft: 14 }}>Forma</th>
            </tr>
          </thead>
          <tbody>
            {asistencia.map((f, i) => (
              <tr
                key={f.jugadorId}
                className="entra"
                style={{ animationDelay: `${Math.min(i, 14) * 24}ms` }}
              >
                <td className="c-puesto">{puesto(i)}</td>
                <td className="c-jugador">
                  <span className="jugador-celda">
                    <Avatar nombre={f.nombre} />
                    <span className={`nom${f.habilitado ? '' : ' apagado'}`}>{f.nombre}</span>
                  </span>
                </td>
                <td className="num apagado">{f.pj}</td>
                <td className="destacada">{formatearPorcentaje(f.asistencia, 0)}</td>
                <td>
                  <span className={`barra${f.habilitado ? '' : ' baja'}`}>
                    <span style={{ width: `${Math.min(100, f.asistencia)}%` }} />
                  </span>
                </td>
                <td>
                  <span className={`chip ${f.habilitado ? 'si' : 'no'}`}>
                    {f.habilitado ? 'Sí' : 'No'}
                  </span>
                </td>
                <td style={{ textAlign: 'left', paddingLeft: 14 }}>
                  <Forma resultados={f.forma} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
