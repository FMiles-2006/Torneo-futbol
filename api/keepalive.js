// Keep-alive: Vercel ejecuta esta función una vez por día (ver vercel.json → crons)
// y hace una consulta mínima a Supabase. Así el proyecto gratuito de Supabase
// nunca llega a los 7 días sin actividad y no se pausa.

export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    return res
      .status(500)
      .json({ ok: false, error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' })
  }

  try {
    const r = await fetch(`${url}/rest/v1/torneos?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    return res.status(r.ok ? 200 : 502).json({
      ok: r.ok,
      status: r.status,
      ts: new Date().toISOString(),
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message ? e.message : e) })
  }
}
