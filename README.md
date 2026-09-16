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

## 3. Cómo se calcula todo

- **Victoria = 3 puntos · Empate = 1 · Derrota = 0**, según el resultado del equipo en el que
  jugó cada uno.
- **Efectividad = puntos ÷ (partidos jugados × 3) × 100** → un porcentaje de 0 a 100.
- En la **tabla de efectividad** solo aparecen los jugadores que jugaron **al menos el 60 % de los
  partidos disputados hasta ese momento** (el mínimo se recalcula solo a medida que se juegan más
  partidos). Así nadie sale campeón por haber jugado un partido y ganarlo.
- **Desempate**: a igual efectividad, primero el que jugó más partidos.
- Los **invitados** quedan siempre afuera de puntos y estadísticas.

La vista pública tiene tres secciones: **Efectividad**, **Goles y figuras** y **Asistencia**
(esta última marca en verde a los que superan el 60 %).

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

La base viene con **11 jugadores y 3 partidos de ejemplo** para que veas las tablas funcionando.
Para dejarla limpia:

1. Entrá al **[SQL Editor de Supabase](https://supabase.com/dashboard/project/kxstlcnmjjdytmlwczio/sql/new)**.
2. Pegá el contenido de [`supabase/borrar-datos-prueba.sql`](supabase/borrar-datos-prueba.sql).
3. **Run**.

(También podés borrarlos a mano desde el panel: borrás los 3 partidos y desactivás/borrás los
jugadores.)

---

## 6. Detalles técnicos

**Stack:** React 18 + Vite (JavaScript) · Supabase (Postgres + Auth) · Vercel.

```
src/
  pages/Publico.jsx        vista pública (3 secciones)
  pages/Admin.jsx          panel admin + sesión
  components/              Login, PanelPartidos, PanelJugadores, PanelTorneo
  lib/stats.js             todo el cálculo de puntos, efectividad y asistencia
api/keepalive.mjs          ping diario a Supabase (cron de Vercel)
supabase/schema.sql        esquema + políticas RLS
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
