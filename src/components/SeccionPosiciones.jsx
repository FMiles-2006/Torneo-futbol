import { Avatar, Forma, puesto, clasePodio } from './Piezas.jsx'
import { formatearPorcentaje } from '../lib/stats.js'

export default function SeccionPosiciones({ stats, minimoPartidos }) {
  const { efectividad, maximoGoleador, enRacha, totalPartidos } = stats

  return (
    <div className="bloque">
      <div className="bloque-cab">
        <h2>Posiciones</h2>
        <span className="conteo">
          {efectividad.length} en tabla
        </span>
      </div>

      {(maximoGoleador || enRacha) && (
        <div className="franja">
          {maximoGoleador && (
            <div className="franja-item">
              <span className="etq">Goleador</span>
              <span className="val">
                <Avatar nombre={maximoGoleador.nombre} />
                {maximoGoleador.nombre}
                <b className="num">{maximoGoleador.goles}</b>
              </span>
            </div>
          )}
          {enRacha && (
            <div className="franja-item">
              <span className="etq">En racha</span>
              <span className="val">
                <Avatar nombre={enRacha.nombre} />
                {enRacha.nombre}
                <b className="num">{enRacha.racha.cantidad}<small>V</small></b>
              </span>
            </div>
          )}
        </div>
      )}

      <p className="nota">
        Efectividad = puntos ÷ (partidos jugados × 3). Entran los jugadores con al menos{' '}
        <b>{minimoPartidos} de {totalPartidos}</b> partidos (60 %). A igual efectividad, primero
        el que jugó más.
      </p>

      {efectividad.length === 0 ? (
        <div className="vacio-msg">Ningún jugador llega todavía al 60 % de asistencia.</div>
      ) : (
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th className="c-puesto">#</th>
                <th className="c-jugador">Jugador</th>
                <th>PJ</th>
                <th>G</th>
                <th>E</th>
                <th>P</th>
                <th>Pts</th>
                <th>Efec.</th>
                <th style={{ textAlign: 'left', paddingLeft: 14 }}>Forma</th>
              </tr>
            </thead>
            <tbody>
              {efectividad.map((f, i) => (
                <tr
                  key={f.jugadorId}
                  className={`${clasePodio(i)} entra`}
                  style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
                >
                  <td className="c-puesto">{puesto(i)}</td>
                  <td className="c-jugador">
                    <span className="jugador-celda">
                      <Avatar nombre={f.nombre} />
                      <span className="nom">{f.nombre}</span>
                    </span>
                  </td>
                  <td className="num apagado">{f.pj}</td>
                  <td className="num">{f.pg}</td>
                  <td className="num">{f.pe}</td>
                  <td className="num">{f.pp}</td>
                  <td className="destacada">{f.pts}</td>
                  <td className={i === 0 ? 'principal' : 'destacada'}>
                    {formatearPorcentaje(f.efectividad)}
                  </td>
                  <td style={{ textAlign: 'left', paddingLeft: 14 }}>
                    <Forma resultados={f.forma} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
