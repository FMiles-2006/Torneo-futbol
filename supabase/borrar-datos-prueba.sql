-- ============================================================
--  BORRAR LOS DATOS DE PRUEBA
--  Pegar en Supabase → SQL Editor → Run.
--  Deja la base limpia y lista para cargar el torneo de verdad.
-- ============================================================

-- 1) Los 3 partidos de ejemplo (borra también sus participaciones y goles).
delete from public.partidos
where fecha in ('2026-08-26', '2026-09-02', '2026-09-09');

-- 2) Los jugadores de ejemplo.
delete from public.jugadores
where nombre in (
  'Nico', 'Fede', 'Martín', 'Lucas', 'Pablo', 'Diego',
  'Seba', 'Juanma', 'Tomás', 'Gastón', 'Lea'
);
