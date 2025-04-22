import React from 'react';
import type { Producto } from './EquiposPanel'; // Asumiendo que se necesita la interfaz Producto

interface DetallesEnvioPanelProps {
  productoPrincipal: Producto | null;
  opcionalesSeleccionados: Producto[];
  onVolver: () => void; // Función para volver al paso anterior (Detalles Carga)
  onSiguiente: () => void; // Función para ir al siguiente paso (Detalles Tributarios)
}

export default function DetallesEnvioPanel({
  productoPrincipal,
  opcionalesSeleccionados,
  onVolver,
  onSiguiente
}: DetallesEnvioPanelProps) {

  // --- Estilos (Placeholder - Copiar/Adaptar de otros paneles si es necesario) ---
  const containerStyle: React.CSSProperties = { padding: '24px', maxWidth: '1200px', margin: '0 auto' };
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' };
  const titleStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' };
  const buttonContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginTop: '32px' };
  const buttonStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 };
  const primaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#1e88e5', color: 'white' };
  const secondaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB' };

  return (
    <div style={containerStyle}>
      {/* --- Indicador de Pasos (Placeholder) --- */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
         <p style={{ color: '#666' }}>Paso 2 de 4: Detalles de Envío</p>
         {/* Aquí iría un componente visual de pasos si existe */}
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Detalles de Envío</h2>
        {/* --- Contenido del formulario de Envío --- */}
        <p>Aquí irán los campos para los detalles de envío...</p>
        <p>(Dirección, método de envío, etc.)</p>

         {/* Mostrar información del producto principal y opcionales si es relevante */}
         {productoPrincipal && (
           <div style={{ marginTop: '20px', fontSize: '13px', color: '#555' }}>
             <p>Producto: {productoPrincipal.nombre_del_producto}</p>
             <p>Opcionales: {opcionalesSeleccionados.length}</p>
           </div>
         )}
      </div>

      {/* --- Botones de Navegación --- */}
      <div style={buttonContainerStyle}>
        <button onClick={onVolver} style={secondaryButtonStyle}>
          &larr; Volver
        </button>
        <button onClick={onSiguiente} style={primaryButtonStyle}>
          Siguiente &rarr;
        </button>
      </div>
    </div>
  );
} 