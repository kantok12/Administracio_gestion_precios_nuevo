import React, { useState, useEffect } from 'react';
import type { Producto } from './EquiposPanel';

// --- Interfaz para el resultado del cálculo --- 
interface PricingCalculationResult {
  inputsUsed: { [key: string]: any }; // Deberíamos definir esto más estrictamente
  calculations: { [key: string]: any };
}

// --- Interfaz de Props ---
interface DetallesEnvioPanelProps {
  productoPrincipal: Producto | null;
  opcionalesSeleccionados: Producto[];
  onVolver: () => void;
  onSiguiente: () => void;
  pricingResult: PricingCalculationResult | null;
  isLoading: boolean;
  error: string | null;
}

// --- Stepper Componente (sin cambios) ---
const Stepper = ({ pasoActual }: { pasoActual: number }) => {
  // ... (código del stepper) ...
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

// --- Helpers de Formato (NUEVOS y mejorados) ---
const formatCurrency = (value: number | undefined | null, currency: 'CLP' | 'USD' | 'EUR') => {
  if (value === undefined || value === null || isNaN(value)) return '-';
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
    maximumFractionDigits: currency === 'CLP' ? 0 : 2,
  };
  const locale = currency === 'CLP' ? 'es-CL' : 'de-DE'; 
  return new Intl.NumberFormat(locale, options).format(value);
};

const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return '-';
  // Multiplicar por 100 y añadir "%"
  return `${(value * 100).toFixed(1)}%`; 
};

const formatNumber = (value: number | undefined | null, decimals = 0) => {
   if (value === undefined || value === null || isNaN(value)) return '-';
   return value.toFixed(decimals);
};

const formatDate = (value: string | undefined | null) => {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return date.toLocaleDateString();
};

// --- ASEGURARSE DE QUE ESTA DEFINICIÓN ESTÉ AQUÍ ---
const costLabelsAndFormatters: { [key: string]: { label: string; format: (val: any) => string } } = {
  tipo_cambio_eur_usd: { label: "Tipo Cambio EUR/USD:", format: (val) => formatNumber(val, 4) },
  buffer_eur_usd: { label: "Buffer EUR/USD (%):", format: formatPercent },
  dolar_observado_actual: { label: "Dólar Observado Actual:", format: (val) => formatCurrency(val, 'CLP') },
  buffer_usd_clp: { label: "Buffer USD/CLP (%):", format: formatPercent },
  tasa_seguro: { label: "Tasa Seguro (%):", format: formatPercent },
  margen_adicional_total: { label: "Margen Total (%):", format: formatPercent },
  costo_fabrica_original_eur: { label: "Costo Fábrica Original (EUR):", format: (val) => formatCurrency(val, 'EUR') },
  descuento_fabricante: { label: "Descuento Fabricante (%):", format: formatPercent },
  factor_actualizacion_anual: { label: "Factor Actualización Anual (%):", format: formatPercent },
  transporte_local_eur: { label: "Transporte Local (EUR):", format: (val) => formatCurrency(val, 'EUR') },
  gasto_importacion_eur: { label: "Gasto Importación (EUR):", format: (val) => formatCurrency(val, 'EUR') },
  flete_maritimo_usd: { label: "Flete Marítimo (USD):", format: (val) => formatCurrency(val, 'USD') },
  recargos_destino_usd: { label: "Recargos Destino (USD):", format: (val) => formatCurrency(val, 'USD') },
  honorarios_agente_aduana_usd: { label: "Honorarios Agente Aduana (USD):", format: (val) => formatCurrency(val, 'USD') },
  gastos_portuarios_otros_usd: { label: "Gastos Portuarios/Otros (USD):", format: (val) => formatCurrency(val, 'USD') },
  transporte_nacional_clp: { label: "Transporte Nacional (CLP):", format: (val) => formatCurrency(val, 'CLP') },
  derecho_ad_valorem: { label: "Derecho Ad Valorem (%):", format: formatPercent },
  iva: { label: "IVA (%):", format: formatPercent },
  buffer_transporte: { label: "Buffer Transporte (%):", format: formatPercent },
  fecha_ultima_actualizacion_transporte_local: { label: "Fecha Últ. Act. Transp.:", format: formatDate }
};
// -------------------------------------------------------------

// --- Fin Helpers ---

export default function DetallesEnvioPanel({
  productoPrincipal,
  opcionalesSeleccionados,
  onVolver,
  onSiguiente,
  pricingResult,
  isLoading,
  error
}: DetallesEnvioPanelProps) {

  // --- NUEVO: Estados para obtener los costos globales ---
  const [globalCostsData, setGlobalCostsData] = useState<any>(null);
  const [globalCostsLoading, setGlobalCostsLoading] = useState<boolean>(true);
  const [globalCostsError, setGlobalCostsError] = useState<string | null>(null);
  // ----------------------------------------------------

  // --- NUEVO: useEffect para llamar a /api/overrides/global ---
  useEffect(() => {
    const fetchGlobalOverrides = async () => {
      setGlobalCostsLoading(true);
      setGlobalCostsError(null);
      try {
        const response = await fetch('http://localhost:5001/api/overrides/global');
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.costos) {
          setGlobalCostsData(data.costos); // Guardar solo el objeto costos
        } else {
          throw new Error("Formato de respuesta inesperado de /api/overrides/global");
        }
      } catch (err: any) {
        console.error("Error fetching global overrides:", err);
        setGlobalCostsError(err.message || "Error desconocido al obtener overrides globales.");
        setGlobalCostsData(null);
      } finally {
        setGlobalCostsLoading(false);
      }
    };

    fetchGlobalOverrides();
  }, []); // El array vacío [] asegura que se ejecute solo una vez al montar
  // -----------------------------------------------------------

  // --- Estilos (como los teníamos antes, MÁS COMPLETOS) ---
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' };
  const footerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' };
  const buttonStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 500 };
  const primaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#1e88e5', color: 'white', borderColor: '#1e88e5' };
  const secondaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: 'white', color: '#6c757d', border: '1px solid #dee2e6' };
  const panelTitleStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 600, color: '#343a40', margin: 0, marginBottom: '16px' };
  // Estilos específicos para las secciones de resultados (más detallados)
  const sectionStyle: React.CSSProperties = { marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' };
  const sectionTitleStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#495057', marginBottom: '16px' }; // Aumentado margen inferior
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px 24px' }; // Columnas más anchas y más espacio horizontal
  const itemStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }; // Aumentado padding
  const labelStyle: React.CSSProperties = { color: '#6c757d', marginRight: '10px', whiteSpace: 'nowrap' }; // Aumentado margen
  const valueStyle: React.CSSProperties = { color: '#343a40', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word'}; // Permitir salto de línea
  const loadingStyle: React.CSSProperties = { textAlign: 'center', padding: '40px', color: '#6c757d' };
  const errorStyle: React.CSSProperties = { textAlign: 'center', padding: '20px', color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' };
  const finalPriceStyle: React.CSSProperties = { ...itemStyle, backgroundColor: '#e3f2fd', marginTop: '16px', gridColumn: '1 / -1' }; // Ocupa todo el ancho
  const finalLabelStyle: React.CSSProperties = { ...labelStyle, color: '#1e88e5', fontWeight: 600, fontSize: '14px' }; // Más grande
  const finalValueStyle: React.CSSProperties = { ...valueStyle, color: '#1e88e5', fontWeight: 600, fontSize: '15px' }; // Más grande
  const preStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', border: '1px solid #eee', padding: '15px', borderRadius: '4px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' };
  // --- Fin Estilos ---

  // Extraer datos para facilitar acceso
  const inputs = pricingResult?.inputsUsed;
  const calcs = pricingResult?.calculations;

  // !!! --- AÑADIDO PARA DEPURACIÓN --- !!!
  React.useEffect(() => {
    console.log('>>> DetallesEnvioPanel - Received pricingResult:', pricingResult);
    console.log('>>> DetallesEnvioPanel - Extracted inputs:', inputs);
    console.log('>>> DetallesEnvioPanel - Extracted calcs:', calcs);
  }, [pricingResult, inputs, calcs]); // Se ejecuta cuando cambian estos valores
  // !!! ------------------------------ !!!

  return (
    <div style={{ padding: '24px' }}> 
      <Stepper pasoActual={2} /> 

      <div style={cardStyle}> 
        <h2 style={panelTitleStyle}> 
           Parámetros Globales Cargados (Desde /api/overrides/global)
        </h2>
        
        {/* --- MODIFICADO: Sección para mostrar datos formateados --- */}
        <div> 
          {globalCostsLoading && (
             <div style={loadingStyle}>Cargando datos globales...</div>
          )}

          {globalCostsError && (
             <div style={errorStyle}>
               <strong>Error al cargar datos globales:</strong> {globalCostsError}
             </div>
          )}

          {/* --- ESTA es la parte que debe reemplazar al <pre> --- */}
          {!globalCostsLoading && !globalCostsError && globalCostsData && (
            <> {/* Usar Fragment para agrupar título y grid */}
              <h3 style={sectionTitleStyle}>
                Detalle de Costos Globales:
              </h3>
              <div style={gridStyle}>
                {/* Iterar sobre las claves definidas en nuestro mapeo */}
                {Object.keys(costLabelsAndFormatters).map((key) => {
                  // Obtener la info de la etiqueta y el formateador
                  const { label, format } = costLabelsAndFormatters[key];
                  // Obtener el valor del objeto de datos
                  const value = globalCostsData[key]; 
                  
                  // Renderizar solo si la clave existe en los datos (o mostrar guión)
                  return (
                    <div key={key} style={itemStyle}>
                      <span style={labelStyle}>{label}</span>
                      {/* Aplicar el formateador */}
                      <span style={valueStyle}>{format(value)}</span> 
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {/* --- Fin de la sección que reemplaza --- */}
          
           {!globalCostsLoading && !globalCostsError && !globalCostsData && (
             <p style={{ color: '#6c757d', fontStyle: 'italic', textAlign:'center', marginTop: '20px' }}>No se recibieron datos globales o el formato es incorrecto.</p>
           )}
        </div>
        {/* -------------------------------------------------------- */}

         {/* Resumen del producto/opcionales */}
         {productoPrincipal && (
           <div style={{ ...sectionStyle, borderTop: pricingResult ? '1px solid #eee' : 'none', marginTop: '16px' }}>
             <p style={{fontSize: '13px', color: '#555', marginBottom: '4px'}}><strong>Producto Principal:</strong> {productoPrincipal.nombre_del_producto}</p>
             <p style={{fontSize: '13px', color: '#555', margin: 0}}><strong>Opcionales Seleccionados:</strong> {opcionalesSeleccionados.length}</p>
           </div>
         )}
      </div>

      {/* Footer de navegación */}
      <div style={footerStyle}>
        <button style={secondaryButtonStyle} onClick={onVolver} disabled={globalCostsLoading}>
          &larr; Volver
        </button>
        <button 
          style={primaryButtonStyle} 
          onClick={onSiguiente} 
          disabled={globalCostsLoading || !!globalCostsError}
        >
          Siguiente &rarr;
        </button>
      </div>
    </div>
  );
} 