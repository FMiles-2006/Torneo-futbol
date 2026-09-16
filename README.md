# ⚽ Torneo de Fútbol 5 — individual

Web para llevar un torneo de fútbol 5 **sin equipos fijos**: hay una lista de jugadores, en cada
partido se arman dos equipos mezclados y lo que se acumula es el **rendimiento personal** de cada
jugador.

---

## 🔗 Links

| | |
|---|---|
| **Vista pública** (compartir este) | https://torneo-futbol5-gamma.vercel.app |
| **Panel de administración** | https://torneo-futbol5-gamma.vercel.app/admin |
| Panel de Supabase (base de datos) | https://supabase.com/dashboard/project/kxstlcnmjjdytmlwczio |
| Panel de Vercel (hosting) | https://vercel.com/torneo2/torneo-futbol5 |

La vista pública no pide login: cualquiera con el link entra y **solo mira**.

---

## 1. Crear tu usuario admin (hacelo una sola vez)

La app no tiene registro abierto: los admins se crean desde Supabase.

1. Entrá a **[Authentication → Users](https://supabase.com/dashboard/project/kxstlcnmjjdytmlwczio/auth/users)**.
2. Botón **Add user → Create new user**.
3. Poné tu **email** y la **contraseña** que quieras.
4. Dejá tildado **Auto Confirm User** (si no, te pide confirmar por mail).
5. **Create user**.

Listo: entrás en https://torneo-futbol5-gamma.vercel.app/admin con ese email y contraseña.

> **Para agregar más administradores** repetí exactamente estos mismos pasos con otro email.
> No hay roles ni jerarquías: todo usuario que exista en Authentication es admin y puede
> cargar, editar y borrar.

---

## 2. Cómo cargar un partido

En el panel, pestaña **Partidos**:

1. **Fecha** del partido.
2. **Jugadores**: al lado de cada nombre hay dos botones, `A` y `B`. Tocás uno y el jugador queda
   en ese equipo. Si tocás el mismo botón otra vez, lo sacás del partido.
   Arriba se ve en vivo cómo va quedando cada equipo.
3. **Invitados** (opcional): escribís el nombre, elegís equipo y tocás `+`.
   El invitado queda registrado en ese partido pero **no suma puntos ni aparece en ninguna tabla**,
   y tampoco se agrega a la lista oficial de jugadores.
4. **Resultado**: `Gana A` / `Empate` / `Gana B`.
5. **Goles** (opcional): con los botones `−` / `+` al lado de cada jugador que jugó.
6. **Figura del partido** (opcional): un solo jugador, del desplegable.
7. **Guardar partido**.

Abajo quedan listados todos los partidos, con **Editar** y **Borrar**.

### Jugadores

Pestaña **Jugadores**: escribís el nombre, tocás **Agregar** y listo. También podés renombrar o
**Desactivar** (el jugador deja de aparecer para cargar partidos pero conserva todo su historial).

---

## 3. Qué muestra la vista pública

Cuatro secciones:

| Sección | Qué trae |
|---|---|
| **Posiciones** | Tabla por efectividad, con PJ · G · E · P · Pts · Efec. y la columna **Forma** (los últimos 5 resultados en círculos verde/gris/rojo). Arriba, una franja con el goleador y el jugador con la racha más larga en curso. |
| **Goles y figuras** | Goleadores con total y **promedio de gol por partido**, y el ranking de figuras. |
| **Asistencia** | Partidos jugados y % sobre el total, con barra y marca de quién llega al 60 %. |
| **Cara a cara** | Comparación entre dos jugadores: el récord **enfrentados** (ganó uno / empates / ganó el otro), el rendimiento **del mismo lado**, las métricas lado a lado y el listado de todos los partidos que compartieron con su resultado. |

### Las reglas

- **Victoria = 3 puntos · Empate = 1 · Derrota = 0**, según el resultado del equipo en el que
  jugó cada uno.
- **Efectividad = puntos ÷ (partidos jugados × 3) × 100** → un porcentaje de 0 a 100.
- En la **tabla de posiciones** solo aparecen los jugadores que jugaron **al menos el 60 % de los
  partidos disputados hasta ese momento** (el mínimo se recalcula solo a medida que se juegan más
  partidos). Así nadie sale campeón por haber jugado un partido y ganarlo. Los que no llegan
  siguen apareciendo en Asistencia.
- **Desempate**: a igual efectividad, primero el que jugó más partidos.
- Los **invitados** quedan siempre afuera de puntos y estadísticas.

---

## 4. Cerrar el torneo y empezar uno nuevo

Panel → pestaña **Torneo** → *Cerrar torneo y empezar uno nuevo*:

1. Escribís el nombre del torneo nuevo.
2. Confirmás.

El torneo actual queda **archivado con todo su historial** y el nuevo arranca sin partidos.
**Los jugadores se mantienen.** En la vista pública aparece un desplegable para consultar también
los torneos cerrados.

---

## 5. Borrar los datos de prueba

La base tiene **11 jugadores y 6 fechas de ejemplo** (junio–julio 2026) para que se vean las
tablas, las rachas y el cara a cara funcionando. Para dejarla limpia:

1. Entrá al **[SQL Editor de Supabase](https://supabase.com/dashboard/project/kxstlcnmjjdytmlwczio/sql/new)**.
2. Pegá el contenido de [`supabase/borrar-datos-prueba.sql`](supabase/borrar-datos-prueba.sql).
3. **Run**.

Si querés volver a cargarlos, el script inverso es
[`supabase/datos-de-prueba.sql`](supabase/datos-de-prueba.sql).

---

## 6. Detalles técnicos

**Stack:** React 18 + Vite (JavaScript) · Supabase (Postgres + Auth) · Vercel.

**Tipografía:** Barlow Condensed (títulos y números) + Manrope (texto), vía Google Fonts.

```
src/
  pages/Publico.jsx          vista pública, carga de datos y navegación
  pages/Admin.jsx            panel admin + sesión
  components/
    SeccionPosiciones.jsx    tabla principal con Forma
    SeccionGoles.jsx         goleadores (con promedio) y figuras
    SeccionAsistencia.jsx    asistencia y corte del 60 %
    SeccionComparar.jsx      cara a cara entre dos jugadores
    Piezas.jsx               avatar por iniciales y círculos de forma
    Login / PanelPartidos / PanelJugadores / PanelTorneo
  lib/stats.js               puntos, efectividad, asistencia, rachas, promedios
  lib/comparar.js            cruce entre dos jugadores (juntos / enfrentados)
  styles.css                 sistema visual completo
api/keepalive.mjs            ping diario a Supabase (cron de Vercel)
supabase/schema.sql          esquema + políticas RLS
supabase/datos-de-prueba.sql
supabase/borrar-datos-prueba.sql
```

**Seguridad (RLS):** cualquiera puede **leer**; solo usuarios autenticados pueden
**escribir, editar y borrar**. Verificado: una escritura anónima devuelve `401`.

**Variables de entorno** (ya configuradas en Vercel para production, preview y development):

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://kxstlcnmjjdytmlwczio.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | la *publishable key* del proyecto (es pública por diseño) |

**Keep-alive:** `vercel.json` define un cron diario a las 12:00 UTC que pega en `/api/keepalive`,
que a su vez hace una consulta mínima a Supabase. Así el proyecto gratuito nunca llega a los
7 días de inactividad que lo pausarían.

### Trabajar en local

```bash
npm install
npm run dev
```

Necesitás un archivo `.env` (ya está creado) con las dos variables de arriba.

### Volver a desplegar

```bash
vercel deploy --prod -y
```
