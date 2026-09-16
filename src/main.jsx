import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Publico from './pages/Publico.jsx'
import Admin from './pages/Admin.jsx'
import { configurado } from './supabaseClient.js'
import './styles.css'

function FaltaConfig() {
  return (
    <div className="contenedor">
      <div className="aviso error" style={{ marginTop: 32 }}>
        <b>Falta configurar Supabase.</b>
        <p style={{ margin: '8px 0 0' }}>
          Definí las variables de entorno <code>VITE_SUPABASE_URL</code> y{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> y volvé a desplegar.
        </p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {configurado ? (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Publico />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    ) : (
      <FaltaConfig />
    )}
  </React.StrictMode>
)
