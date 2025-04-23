import React from 'react';
import PageLayout from '../components/PageLayout';

// --- Componente PlaceholderPanel (Página de Destino) ---
export default function PlaceholderPanel() {
  return (
    <PageLayout>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
        Panel Placeholder
      </h1>
      <p style={{ color: '#374151' }}>
        Esta es la página de destino. El panel lateral debería seguir visible.
        El contenido principal está mayormente vacío como se solicitó.
      </p>
      {/* Aquí podrías añadir más contenido si fuera necesario */}
    </PageLayout>
  );
} 