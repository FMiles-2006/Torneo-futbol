import { Avatar, puesto, clasePodio } from './Piezas.jsx'
import { formatearPromedio } from '../lib/stats.js'

export default function SeccionGoles({ stats }) {
  const { goleadores, figuras } = stats
  const totalGoles = goleadores.reduce((s, f) => s + f.goles, 0)

  return (
    <>
      <div className="bloque">
        <div className="bloque-cab">
          <h2>Goleadores</h2>
          <span className="conteo">{totalGoles} goles</span>
        </div>

        {goleadores.length === 0 ? (
          <div className="vacio-msg">Todavía no se cargaron goles.</div>
        ) : (
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th className="c-puesto">#</th>
                  <th className="c-jugador">Jugador</th>
                  <th>PJ</th>
                  <th>Goles</th>
                  <th>Prom.</th>
                </tr>
              </thead>
              <tbody>
                {goleadores.map((f, i) => (
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
                    <td className={i === 0 ? 'principal' : 'destacada'}>{f.goles}</td>
                    <td className="num apagado">{formatearPromedio(f.golesPorPartido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="nota">
          <b>Prom.</b> es el promedio de goles por partido jugado.
        </p>
      </div>

      <div className="bloque">
        <div className="bloque-cab">
          <h2>Figuras</h2>
          <span className="conteo">{figuras.length} jugadores</span>
        </div>

        {figuras.length === 0 ? (
          <div className="vacio-msg">
            Todavía no se eligió ninguna figura. Es opcional al cargar cada partido.
          </div>
        ) : (
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th className="c-puesto">#</th>
                  <th className="c-jugador">Jugador</th>
                  <th>PJ</th>
                  <th>Figuras</th>
                </tr>
              </thead>
              <tbody>
                {figuras.map((f, i) => (
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
                    <td className={i === 0 ? 'principal' : 'destacada'}>{f.figuras}</td>
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
