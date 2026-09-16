-- ============================================================
--  BORRAR LOS DATOS DE PRUEBA
--  Pegar en Supabase → SQL Editor → Run.
--  Deja la base limpia y lista para cargar el torneo de verdad.
-- ============================================================

-- 1) Las 6 fechas de ejemplo (borra también sus participaciones y goles).
delete from public.partidos
where fecha in (
  '2026-06-01', '2026-06-08', '2026-06-15',
  '2026-06-22', '2026-06-29', '2026-07-06'
);

-- 2) Los jugadores de ejemplo.
--    Si ya agregaste jugadores de verdad, borrá de esta lista los que quieras conservar.
delete from public.jugadores
where nombre in (
  'Nico', 'Fede', 'Martín', 'Lucas', 'Pablo', 'Diego',
  'Seba', 'Juanma', 'Tomás', 'Gastón', 'Lea'
);
