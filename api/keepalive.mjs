// Keep-alive: Vercel ejecuta esta función una vez por día (ver vercel.json → crons)
// y hace una consulta mínima a Supabase. Así el proyecto gratuito de Supabase
// nunca llega a los 7 días sin actividad y no se pausa.
//
// Se usa la API cruda de Node (res.statusCode / res.end) en lugar de los helpers
// res.status().json(), que no están disponibles en este runtime.

export default async function handler(req, res) {
  const responder = (status, body) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    return responder(500, {
      ok: false,
      error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY',
    })
  }

  try {
    const r = await fetch(`${url}/rest/v1/torneos?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    return responder(r.ok ? 200 : 502, {
      ok: r.ok,
      status: r.status,
      ts: new Date().toISOString(),
    })
  } catch (e) {
    return responder(500, { ok: false, error: String(e && e.message ? e.message : e) })
  }
}
