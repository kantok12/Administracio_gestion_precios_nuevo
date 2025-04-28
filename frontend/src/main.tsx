import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Outlet, NavLink } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import EquiposPanel from './pages/EquiposPanel'
import AdminPanel from './pages/AdminPanel'
import CostosAdminPanel from './pages/CostosAdminPanel'
import PerfilesPanel from './pages/PerfilesPanel'
import PerfilEditForm from './pages/PerfilEditForm'
import CargaEquiposPanel from './pages/CargaEquiposPanel'
import DashboardPanel from './pages/DashboardPanel'
import PlaceholderPanel from './pages/PlaceholderPanel'
import DetallesEnvioPanel from './pages/DetallesEnvioPanel'

// Forzar modo claro
document.documentElement.setAttribute('data-color-mode', 'light');
document.documentElement.style.backgroundColor = '#ffffff';
document.documentElement.style.color = '#000000';
document.body.style.backgroundColor = '#ffffff';
document.body.style.color = '#000000';

// Logs para depuración
console.log('Iniciando aplicación...');

const rootElement = document.getElementById('root');
console.log('Elemento root encontrado:', rootElement);

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('Root creado con éxito');
    
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<EquiposPanel />} />
              <Route path="equipos" element={<EquiposPanel />} />
              <Route path="admin" element={<AdminPanel />}>
                <Route index element={<PerfilesPanel />} />
                <Route path="costos" element={<CostosAdminPanel />} />
                <Route path="perfiles" element={<PerfilesPanel />} />
                <Route path="carga-equipos" element={<CargaEquiposPanel />} />
              </Route>
              <Route path="/perfiles/:id/editar" element={<PerfilEditForm />} />
              <Route path="dashboard" element={<DashboardPanel />} />
              <Route path="placeholder" element={<PlaceholderPanel />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </React.StrictMode>
    );
    
    console.log('Aplicación renderizada');
  } catch (error) {
    console.error('Error al renderizar la aplicación:', error);
    
    // Intento de recuperación
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Error al cargar la aplicación</h1>
        <p>Por favor, intente recargar la página.</p>
        <button onclick="window.location.reload()">Recargar</button>
      </div>
    `;
    
    // Código de renderizado duplicado en el catch (asegúrate que también incluya la nueva ruta si es relevante para el fallback)
    const root = ReactDOM.createRoot(rootElement); 
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<EquiposPanel />} />
              <Route path="equipos" element={<EquiposPanel />} />
              <Route path="admin" element={<AdminPanel />}>
                <Route index element={<PerfilesPanel />} />
                <Route path="costos" element={<CostosAdminPanel />} />
                <Route path="perfiles" element={<PerfilesPanel />} />
                <Route path="carga-equipos" element={<CargaEquiposPanel />} />
              </Route>
              <Route path="/perfiles/:id/editar" element={<PerfilEditForm />} />
              <Route path="dashboard" element={<DashboardPanel />} />
              <Route path="placeholder" element={<PlaceholderPanel />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </React.StrictMode>
    );
  }
} else {
  console.error('No se encontró el elemento root');
  
  // Crear elemento root si no existe
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  
  console.log('Elemento root creado dinámicamente');
  
  const root = ReactDOM.createRoot(newRoot);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<EquiposPanel />} />
            <Route path="equipos" element={<EquiposPanel />} />
            <Route path="admin" element={<AdminPanel />}>
              <Route index element={<PerfilesPanel />} />
              <Route path="costos" element={<CostosAdminPanel />} />
              <Route path="perfiles" element={<PerfilesPanel />} />
              <Route path="carga-equipos" element={<CargaEquiposPanel />} />
            </Route>
            <Route path="/perfiles/:id/editar" element={<PerfilEditForm />} />
            <Route path="dashboard" element={<DashboardPanel />} />
            <Route path="placeholder" element={<PlaceholderPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}
