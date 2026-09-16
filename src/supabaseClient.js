import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configurado = Boolean(url && anonKey)

// Si faltan las variables de entorno no queremos que la app explote:
// mostramos un cartel explicativo en pantalla (ver App.jsx).
export const supabase = configurado ? createClient(url, anonKey) : null
