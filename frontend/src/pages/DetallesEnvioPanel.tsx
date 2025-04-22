import React from 'react';
import type { Producto } from './EquiposPanel'; // Asumiendo que se necesita la interfaz Producto

interface DetallesEnvioPanelProps {
  productoPrincipal: Producto | null;
  opcionalesSeleccionados: Producto[];
  onVolver: () => void; // Función para volver al paso anterior (Detalles Carga)
  onSiguiente: () => void; // Función para ir al siguiente paso (Detalles Tributarios)
}

// --- COPIADO: Componente Stepper simple (se puede mejorar/refactorizar a un archivo común) ---
const Stepper = ({ pasoActual }: { pasoActual: number }) => {
  const pasos = ['Detalles de la Carga', 'Detalles de Envío', 'Detalles Tributarios', 'Detalles Usuario'];
  const stepStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' };
  const numberStyle: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e9ecef', color: '#495057', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '8px', border: '2px solid transparent' };
  const activeNumberStyle: React.CSSProperties = { ...numberStyle, backgroundColor: '#1e88e5', color: 'white' };
  const textStyle: React.CSSProperties = { fontSize: '13px', color: '#6c757d' };
  const activeTextStyle: React.CSSProperties = { ...textStyle, color: '#1e88e5', fontWeight: 500 };
  const lineStyle: React.CSSProperties = { position: 'absolute', top: '16px', left: '50%', right: '-50%', height: '2px', backgroundColor: '#e9ecef', zIndex: -1 };

  return (
    <div style={{ display: 'flex', marginBottom: '32px', marginTop:'16px', padding: '0 10%' }}>
      {pasos.map((nombre, index) => (
        <React.Fragment key={index}>
          <div style={stepStyle}>
             <div style={index + 1 === pasoActual ? activeNumberStyle : numberStyle}>{index + 1}</div>
             <div style={index + 1 === pasoActual ? activeTextStyle : textStyle}>{nombre}</div>
          </div>
          {index < pasos.length - 1 && (
             <div style={{ flex: 1, position: 'relative' }}>
                <div style={lineStyle}></div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
// --- FIN COPIADO: Stepper ---

export default function DetallesEnvioPanel({
  productoPrincipal,
  opcionalesSeleccionados,
  onVolver,
  onSiguiente
}: DetallesEnvioPanelProps) {

  // --- COPIADO: Estilos de DetallesCargaPanel ---
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' };
  // const sectionTitleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }; // Se puede añadir si se estructura con títulos
  // const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }; // Para tablas si son necesarias
  // const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 500, color: '#6c757d', backgroundColor: '#f8f9fa' };
  // const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #eef2f7', color: '#495057' };
  const footerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' };
  const buttonStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 500 };
  const primaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#1e88e5', color: 'white', borderColor: '#1e88e5' };
  const secondaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: 'white', color: '#6c757d', border: '1px solid #dee2e6' };
  // Nuevo estilo para el título principal del panel, similar al h2 de DetallesCargaPanel
  const panelTitleStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 600, color: '#343a40', margin: 0, marginBottom: '16px' };
  // --- FIN COPIADO: Estilos ---

  return (
    <div style={{ padding: '24px' }}> {/* Contenedor principal similar */} 
      <Stepper pasoActual={2} /> {/* Indicador en Paso 2 */} 

      <div style={cardStyle}> {/* Card blanco */} 
        <h2 style={panelTitleStyle}> {/* Título del panel */} 
           Detalles de Envío
        </h2>
        
        {/* --- Contenido Específico del Panel de Envío --- */}
        <div>
          <p>Aquí irán los campos y la lógica para los detalles de envío.</p>
          <p>(Ej: Dirección de entrega, Método de envío, Contacto, etc.)</p>
          {/* Puedes empezar a añadir inputs y selects aquí */}
        </div>
        {/* ----------------------------------------------- */}

         {/* Podrías mostrar un resumen del producto/opcionales si es útil */}
         {productoPrincipal && (
           <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '13px', color: '#555' }}>
             <p><strong>Producto Principal:</strong> {productoPrincipal.nombre_del_producto}</p>
             <p><strong>Opcionales Seleccionados:</strong> {opcionalesSeleccionados.length}</p>
           </div>
         )}
      </div>

      {/* --- COPIADO: Footer de navegación --- */}
      <div style={footerStyle}>
        <button style={secondaryButtonStyle} onClick={onVolver}>
          &larr; Volver
        </button>
        <button style={primaryButtonStyle} onClick={onSiguiente}>
          Siguiente &rarr;
        </button>
      </div>
      {/* --- FIN COPIADO: Footer --- */}
    </div>
  );
} 