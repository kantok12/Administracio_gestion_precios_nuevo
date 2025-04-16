import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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
    const root = createRoot(rootElement);
    console.log('Root creado con éxito');
    
    root.render(
      <React.StrictMode>
        <App />
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
  }
} else {
  console.error('No se encontró el elemento root');
  
  // Crear elemento root si no existe
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  
  console.log('Elemento root creado dinámicamente');
  
  const root = createRoot(newRoot);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
