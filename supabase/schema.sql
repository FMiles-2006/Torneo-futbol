-- ============================================================
--  TORNEO DE FÚTBOL 5 INDIVIDUAL — Esquema completo
--  Pegar todo esto en Supabase → SQL Editor → Run
--  Es idempotente: se puede ejecutar más de una vez sin romper nada.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- TORNEOS
-- ------------------------------------------------------------
create table if not exists public.torneos (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now(),
  cerrado_en timestamptz
);

-- Solo puede haber UN torneo activo a la vez.
create unique index if not exists torneos_un_solo_activo
  on public.torneos (activo)
  where activo;

-- ------------------------------------------------------------
-- JUGADORES (lista oficial, compartida entre torneos)
-- ------------------------------------------------------------
create table if not exists public.jugadores (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  activo    boolean not null default true,
  creado_en timestamptz not null default now()
);

create unique index if not exists jugadores_nombre_unico
  on public.jugadores (lower(nombre));

-- ------------------------------------------------------------
-- PARTIDOS
--   resultado: 'A' gana equipo A | 'B' gana equipo B | 'E' empate
-- ------------------------------------------------------------
create table if not exists public.partidos (
  id                uuid primary key default gen_random_uuid(),
  torneo_id         uuid not null references public.torneos(id) on delete cascade,
  fecha             date not null,
  resultado         text not null check (resultado in ('A', 'B', 'E')),
  figura_jugador_id uuid references public.jugadores(id) on delete set null,
  creado_en         timestamptz not null default now()
);

create index if not exists partidos_torneo_fecha_idx
  on public.partidos (torneo_id, fecha desc);

-- ------------------------------------------------------------
-- PARTICIPACIONES (quién jugó, en qué equipo, cuántos goles hizo)
--   jugador_id      -> jugador oficial  (suma puntos y estadísticas)
--   invitado_nombre -> invitado suelto  (NO suma nada, sólo queda registrado)
--   Siempre uno de los dos, nunca los dos ni ninguno.
-- ------------------------------------------------------------
create table if not exists public.participaciones (
  id              uuid primary key default gen_random_uuid(),
  partido_id      uuid not null references public.partidos(id) on delete cascade,
  jugador_id      uuid references public.jugadores(id) on delete cascade,
  invitado_nombre text,
  equipo          text not null check (equipo in ('A', 'B')),
  goles           integer not null default 0 check (goles >= 0),
  constraint participacion_jugador_o_invitado check (
    (jugador_id is not null and invitado_nombre is null)
    or
    (jugador_id is null and invitado_nombre is not null)
  )
);

create unique index if not exists participaciones_jugador_unico_por_partido
  on public.participaciones (partido_id, jugador_id)
  where jugador_id is not null;

create index if not exists participaciones_partido_idx
  on public.participaciones (partido_id);

-- ============================================================
--  SEGURIDAD (RLS)
--  Lectura: pública (cualquiera con el link).
--  Escritura: sólo usuarios autenticados (los admins).
-- ============================================================
alter table public.torneos          enable row level security;
alter table public.jugadores        enable row level security;
alter table public.partidos         enable row level security;
alter table public.participaciones  enable row level security;

-- torneos
drop policy if exists "torneos lectura publica"  on public.torneos;
drop policy if exists "torneos escritura admins" on public.torneos;
create policy "torneos lectura publica"  on public.torneos
  for select to anon, authenticated using (true);
create policy "torneos escritura admins" on public.torneos
  for all to authenticated using (true) with check (true);

-- jugadores
drop policy if exists "jugadores lectura publica"  on public.jugadores;
drop policy if exists "jugadores escritura admins" on public.jugadores;
create policy "jugadores lectura publica"  on public.jugadores
  for select to anon, authenticated using (true);
create policy "jugadores escritura admins" on public.jugadores
  for all to authenticated using (true) with check (true);

-- partidos
drop policy if exists "partidos lectura publica"  on public.partidos;
drop policy if exists "partidos escritura admins" on public.partidos;
create policy "partidos lectura publica"  on public.partidos
  for select to anon, authenticated using (true);
create policy "partidos escritura admins" on public.partidos
  for all to authenticated using (true) with check (true);

-- participaciones
drop policy if exists "participaciones lectura publica"  on public.participaciones;
drop policy if exists "participaciones escritura admins" on public.participaciones;
create policy "participaciones lectura publica"  on public.participaciones
  for select to anon, authenticated using (true);
create policy "participaciones escritura admins" on public.participaciones
  for all to authenticated using (true) with check (true);

-- ============================================================
--  TORNEO INICIAL
-- ============================================================
insert into public.torneos (nombre, activo)
select 'Torneo 2026', true
where not exists (select 1 from public.torneos where activo);
