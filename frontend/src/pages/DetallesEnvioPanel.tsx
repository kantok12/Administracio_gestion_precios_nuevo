import React from 'react';
import type { Producto } from './EquiposPanel'; // Asumiendo que se necesita la interfaz Producto

// --- NUEVA Interfaz para el resultado del cálculo --- 
// (Basada en la respuesta del backend pricingController.js)
interface PricingCalculationResult {
  inputsUsed: { [key: string]: any };
  calculations: { [key: string]: any };
}

// --- ACTUALIZADA Interfaz de Props ---
interface DetallesEnvioPanelProps {
  productoPrincipal: Producto | null;
  opcionalesSeleccionados: Producto[];
  onVolver: () => void; // Función para volver al paso anterior (Detalles Carga)
  onSiguiente: () => void; // Función para ir al siguiente paso (Detalles Tributarios)
  // --- Nuevas props para el cálculo ---
  pricingResult: PricingCalculationResult | null;
  isLoading: boolean;
  error: string | null;
  // -----------------------------------
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
  onSiguiente,
  // --- Recibir nuevas props ---
  pricingResult,
  isLoading,
  error
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
  const resultsSectionStyle: React.CSSProperties = { marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' };
  const resultsTitleStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#495057', marginBottom: '12px' };
  const resultsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' };
  const resultItemStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', padding: '8px 12px', borderRadius: '4px', fontSize: '13px' };
  const resultLabelStyle: React.CSSProperties = { color: '#6c757d', marginRight: '8px' };
  const resultValueStyle: React.CSSProperties = { color: '#343a40', fontWeight: 500 };
  const loadingStyle: React.CSSProperties = { textAlign: 'center', padding: '40px', color: '#6c757d' };
  const errorStyle: React.CSSProperties = { textAlign: 'center', padding: '20px', color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' };
  // --- FIN COPIADO: Estilos ---

  // Helper para formatear números como moneda
  const formatCurrency = (value: number | undefined | null, currency: 'CLP' | 'USD' | 'EUR') => {
    if (value === undefined || value === null || isNaN(value)) return '-';
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'CLP' ? 0 : 2,
      maximumFractionDigits: currency === 'CLP' ? 0 : 2,
    };
    // Usar 'es-CL' para CLP y 'en-US' o 'de-DE' para USD/EUR para separadores correctos
    const locale = currency === 'CLP' ? 'es-CL' : 'de-DE'; 
    return new Intl.NumberFormat(locale, options).format(value);
  };

  return (
    <div style={{ padding: '24px' }}> {/* Contenedor principal similar */} 
      <Stepper pasoActual={2} /> {/* Indicador en Paso 2 */} 

      <div style={cardStyle}> {/* Card blanco */} 
        <h2 style={panelTitleStyle}> {/* Título del panel */} 
           Detalles de Envío
        </h2>
        
        {/* --- Contenido Específico del Panel de Envío --- */}
        <div>
          <p style={{ color: '#6c757d' }}>Completa la información requerida para el envío.</p>
          {/* Aquí iría el formulario de envío real */}
          <div style={{ height: '100px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', marginTop: '16px' }}>
             (Formulario de Dirección de Envío, etc.)
          </div>
        </div>
        {/* ----------------------------------------------- */}

        {/* --- NUEVO: Sección para Mostrar Resultados del Cálculo --- */}
        <div style={resultsSectionStyle}>
          <h3 style={resultsTitleStyle}>Resumen de Costos y Precios Calculados</h3>
          
          {isLoading && (
             <div style={loadingStyle}>Calculando precios...</div>
          )}

          {error && (
             <div style={errorStyle}>
               <strong>Error al calcular precios:</strong> {error}
             </div>
          )}

          {!isLoading && !error && pricingResult && (
             <div style={resultsGridStyle}>
                {/* Mostrar algunos resultados clave */}
                <div style={resultItemStyle}>
                   <span style={resultLabelStyle}>Landed Cost (USD):</span>
                   <span style={resultValueStyle}>{formatCurrency(pricingResult.calculations?.landedCostUSD, 'USD')}</span>
                </div>
                <div style={resultItemStyle}>
                   <span style={resultLabelStyle}>Landed Cost (CLP):</span>
                   <span style={resultValueStyle}>{formatCurrency(pricingResult.calculations?.landedCostCLP, 'CLP')}</span>
                </div>
                <div style={resultItemStyle}>
                   <span style={resultLabelStyle}>Precio Venta Neto (CLP):</span>
                   <span style={resultValueStyle}>{formatCurrency(pricingResult.calculations?.netSalePriceCLP, 'CLP')}</span>
                </div>
                 <div style={resultItemStyle}>
                   <span style={resultLabelStyle}>IVA Venta (CLP):</span>
                   <span style={resultValueStyle}>{formatCurrency(pricingResult.calculations?.saleIvaAmountCLP, 'CLP')}</span>
                </div>
                <div style={{...resultItemStyle, backgroundColor: '#e3f2fd'}}> {/* Resaltar final */} 
                   <span style={{...resultLabelStyle, color: '#1e88e5'}}>Precio Venta Total (CLP):</span>
                   <span style={{...resultValueStyle, color: '#1e88e5'}}>{formatCurrency(pricingResult.calculations?.finalSalePriceCLP, 'CLP')}</span>
                </div>
                {/* Podrías añadir más campos aquí si es necesario, ej. CIF, Margen */} 
             </div>
          )}
          
           {!isLoading && !error && !pricingResult && (
             <p style={{ color: '#6c757d', fontStyle: 'italic', textAlign:'center' }}>No se han calculado los precios aún.</p>
           )}
        </div>
        {/* -------------------------------------------------------- */}

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
        <button style={secondaryButtonStyle} onClick={onVolver} disabled={isLoading}> {/* Deshabilitar si está cargando */}
          &larr; Volver
        </button>
        <button 
          style={primaryButtonStyle} 
          onClick={onSiguiente} 
          disabled={isLoading || !!error || !pricingResult} // Deshabilitar si carga, hay error o no hay resultado
        >
          Siguiente &rarr;
        </button>
      </div>
      {/* --- FIN COPIADO: Footer --- */}
    </div>
  );
} 