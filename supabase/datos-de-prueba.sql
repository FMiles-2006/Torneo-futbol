-- ============================================================
--  DATOS DE PRUEBA (3 partidos de ejemplo)
--  Sirven para ver las tablas funcionando.
--  Para borrarlos: ejecutar supabase/borrar-datos-prueba.sql
-- ============================================================

insert into public.jugadores (nombre) values
  ('Nico'), ('Fede'), ('Martín'), ('Lucas'), ('Pablo'), ('Diego'),
  ('Seba'), ('Juanma'), ('Tomás'), ('Gastón'), ('Lea')
on conflict (lower(nombre)) do nothing;

do $$
declare
  v_torneo uuid;
  v_partido uuid;
begin
  select id into v_torneo from public.torneos where activo limit 1;

  -- ---------- PARTIDO 1 : gana A ----------
  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-08-26', 'A',
          (select id from public.jugadores where nombre = 'Nico'))
  returning id into v_partido;

  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_partido, j.id, x.equipo, x.goles
  from (values
      ('Nico','A',2), ('Fede','A',0), ('Martín','A',0), ('Lucas','A',1), ('Pablo','A',0),
      ('Diego','B',1), ('Seba','B',0), ('Juanma','B',0), ('Tomás','B',0), ('Lea','B',0)
  ) as x(nombre, equipo, goles)
  join public.jugadores j on j.nombre = x.nombre;

  -- ---------- PARTIDO 2 : empate ----------
  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-09-02', 'E',
          (select id from public.jugadores where nombre = 'Seba'))
  returning id into v_partido;

  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_partido, j.id, x.equipo, x.goles
  from (values
      ('Nico','A',1), ('Diego','A',0), ('Lucas','A',0), ('Seba','A',2), ('Gastón','A',0),
      ('Fede','B',2), ('Martín','B',1), ('Pablo','B',0), ('Juanma','B',0), ('Tomás','B',0)
  ) as x(nombre, equipo, goles)
  join public.jugadores j on j.nombre = x.nombre;

  -- ---------- PARTIDO 3 : gana B (con un invitado) ----------
  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-09-09', 'B',
          (select id from public.jugadores where nombre = 'Lucas'))
  returning id into v_partido;

  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_partido, j.id, x.equipo, x.goles
  from (values
      ('Nico','A',0), ('Fede','A',1), ('Seba','A',0), ('Tomás','A',0), ('Gastón','A',0),
      ('Martín','B',1), ('Lucas','B',2), ('Diego','B',0), ('Juanma','B',0)
  ) as x(nombre, equipo, goles)
  join public.jugadores j on j.nombre = x.nombre;

  -- Invitado: juega, queda registrado, pero NO suma puntos ni estadísticas.
  insert into public.participaciones (partido_id, invitado_nombre, equipo, goles)
  values (v_partido, 'Rodri', 'B', 0);
end $$;
