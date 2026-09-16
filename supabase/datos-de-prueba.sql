-- ============================================================
--  DATOS DE PRUEBA — 6 fechas de ejemplo
--  Sirven para ver posiciones, goleadores, figuras, asistencia,
--  rachas y el cara a cara funcionando con datos reales.
--  Para borrarlos: ejecutar supabase/borrar-datos-prueba.sql
-- ============================================================

insert into public.jugadores (nombre) values
  ('Nico'), ('Fede'), ('Martín'), ('Lucas'), ('Pablo'), ('Diego'),
  ('Seba'), ('Juanma'), ('Tomás'), ('Gastón'), ('Lea')
on conflict (lower(nombre)) do nothing;
do $$
declare
  v_torneo uuid;
  v_p uuid;
begin
  select id into v_torneo from public.torneos where activo limit 1;

  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-06-01', 'A', (select id from public.jugadores where nombre='Nico'))
  returning id into v_p;
  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_p, j.id, x.e, x.g from (values
    ('Nico','A',2),('Fede','A',0),('Martín','A',0),('Lucas','A',1),('Pablo','A',0),
    ('Diego','B',1),('Seba','B',0),('Juanma','B',0),('Tomás','B',0),('Gastón','B',0)
  ) as x(n,e,g) join public.jugadores j on j.nombre=x.n;

  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-06-08', 'B', (select id from public.jugadores where nombre='Lucas'))
  returning id into v_p;
  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_p, j.id, x.e, x.g from (values
    ('Nico','A',0),('Diego','A',0),('Seba','A',1),('Tomás','A',0),('Lea','A',0),
    ('Fede','B',0),('Martín','B',1),('Lucas','B',2),('Pablo','B',0),('Juanma','B',0)
  ) as x(n,e,g) join public.jugadores j on j.nombre=x.n;

  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-06-15', 'E', (select id from public.jugadores where nombre='Martín'))
  returning id into v_p;
  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_p, j.id, x.e, x.g from (values
    ('Nico','A',0),('Martín','A',2),('Seba','A',0),('Juanma','A',0),('Gastón','A',0),
    ('Fede','B',2),('Lucas','B',0),('Pablo','B',0),('Diego','B',0),('Tomás','B',0)
  ) as x(n,e,g) join public.jugadores j on j.nombre=x.n;

  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-06-22', 'A', (select id from public.jugadores where nombre='Lucas'))
  returning id into v_p;
  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_p, j.id, x.e, x.g from (values
    ('Nico','A',1),('Lucas','A',2),('Diego','A',0),('Juanma','A',0),('Gastón','A',0),
    ('Fede','B',1),('Martín','B',0),('Seba','B',0),('Pablo','B',0),('Tomás','B',0)
  ) as x(n,e,g) join public.jugadores j on j.nombre=x.n;

  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-06-29', 'B', (select id from public.jugadores where nombre='Diego'))
  returning id into v_p;
  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_p, j.id, x.e, x.g from (values
    ('Fede','A',0),('Martín','A',1),('Pablo','A',0),('Tomás','A',0),('Gastón','A',0),
    ('Nico','B',0),('Lucas','B',1),('Diego','B',2),('Seba','B',0),('Juanma','B',0)
  ) as x(n,e,g) join public.jugadores j on j.nombre=x.n;

  insert into public.partidos (torneo_id, fecha, resultado, figura_jugador_id)
  values (v_torneo, '2026-07-06', 'A', (select id from public.jugadores where nombre='Nico'))
  returning id into v_p;
  insert into public.participaciones (partido_id, jugador_id, equipo, goles)
  select v_p, j.id, x.e, x.g from (values
    ('Nico','A',1),('Martín','A',0),('Lucas','A',2),('Seba','A',0),('Tomás','A',0),
    ('Fede','B',1),('Pablo','B',0),('Diego','B',0),('Juanma','B',0),('Gastón','B',0)
  ) as x(n,e,g) join public.jugadores j on j.nombre=x.n;
  insert into public.participaciones (partido_id, invitado_nombre, equipo, goles)
  values (v_p, 'Rodri', 'B', 0);
end $$;
