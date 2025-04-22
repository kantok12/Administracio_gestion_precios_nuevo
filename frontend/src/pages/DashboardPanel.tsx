import React from 'react';
import { TrendingUp, FileText, DollarSign, Users } from 'lucide-react'; // Importar iconos

// --- Interfaz para datos de cotización de ejemplo ---
interface CotizacionEjemplo {
  id: string;
  fecha: string;
  productoNombre: string;
  cliente?: string; // Opcional
  totalCLP: number;
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
}

// --- Datos inventados ---
const cotizacionesInventadas: CotizacionEjemplo[] = [
  { id: 'QTZ-001', fecha: '2024-05-21', productoNombre: 'Chipeadora Motor A530L', cliente: 'Constructora XYZ', totalCLP: 195106078, estado: 'Aceptada' },
  { id: 'QTZ-002', fecha: '2024-05-20', productoNombre: 'Chipeadora PTO T-Rex', cliente: 'Agrícola Los Andes', totalCLP: 152300500, estado: 'Pendiente' },
  { id: 'QTZ-003', fecha: '2024-05-19', productoNombre: 'Chipeadora Motor A530L', cliente: 'Municipalidad Ejemplo', totalCLP: 198500000, estado: 'Pendiente' },
  { id: 'QTZ-004', fecha: '2024-05-18', productoNombre: 'Astilladora Industrial H-900', totalCLP: 310000000, estado: 'Rechazada' },
  { id: 'QTZ-005', fecha: '2024-05-17', productoNombre: 'Chipeadora PTO T-Rex', cliente: 'Forestal Sur', totalCLP: 151000000, estado: 'Aceptada' },
];

// --- Componente DashboardPanel ---
export default function DashboardPanel() {

  // --- Estilos ---
  const cardStyle: React.CSSProperties = { 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      height: '100%' // Para que las tarjetas tengan misma altura
  };
  const cardTitleStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 500, color: '#64748b', marginBottom: '8px' };
  const cardValueStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 600, color: '#1e293b' };
  const cardIconStyle: React.CSSProperties = { color: '#38bdf8', alignSelf: 'flex-end'}; // Icono azul claro a la derecha
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '24px', fontSize: '13px' };
  const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', backgroundColor: '#f9fafb' };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' };
  const statusBadgeStyle = (estado: CotizacionEjemplo['estado']): React.CSSProperties => ({
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 500,
      color: 'white',
      backgroundColor: estado === 'Aceptada' ? '#10b981' : (estado === 'Pendiente' ? '#f59e0b' : '#ef4444'),
  });
  // --- Fin Estilos ---

  // Cálculos simples de ejemplo
  const cotizacionesTotales = cotizacionesInventadas.length;
  const valorTotalAceptado = cotizacionesInventadas
    .filter(c => c.estado === 'Aceptada')
    .reduce((sum, c) => sum + c.totalCLP, 0);
  const clientesUnicos = new Set(cotizacionesInventadas.map(c => c.cliente).filter(Boolean)).size;

  const formatCLP = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>Dashboard</h1>

      {/* --- Sección de Tarjetas Resumen --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={cardStyle}>
           <div>
              <div style={cardTitleStyle}>Cotizaciones Recientes</div>
              <div style={cardValueStyle}>{cotizacionesTotales}</div>
           </div>
           <FileText size={28} style={cardIconStyle} />
        </div>
        <div style={cardStyle}>
           <div>
              <div style={cardTitleStyle}>Valor Total Aceptado</div>
              <div style={cardValueStyle}>{formatCLP(valorTotalAceptado)}</div>
           </div>
           <DollarSign size={28} style={cardIconStyle} />
        </div>
        <div style={cardStyle}>
           <div>
              <div style={cardTitleStyle}>Clientes Únicos</div>
              <div style={cardValueStyle}>{clientesUnicos}</div>
           </div>
           <Users size={28} style={cardIconStyle} />
        </div>
        {/* Se podrían añadir más tarjetas */}
         <div style={cardStyle}>
           <div>
              <div style={cardTitleStyle}>Tasa de Aceptación</div>
              <div style={cardValueStyle}>{(cotizacionesInventadas.filter(c=>c.estado === 'Aceptada').length / cotizacionesTotales * 100).toFixed(0)}%</div>
           </div>
           <TrendingUp size={28} style={cardIconStyle} />
        </div>
      </div>
      {/* --- Fin Tarjetas --- */}

      {/* --- Tabla de Cotizaciones Recientes --- */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
         <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>Últimas Cotizaciones</h2>
         <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Producto Principal</th>
                  <th style={thStyle}>Cliente</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Total CLP</th>
                  <th style={thStyle}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cotizacionesInventadas.map((cot) => (
                  <tr key={cot.id} style={{backgroundColor: 'white'}}>
                    <td style={tdStyle}>{cot.id}</td>
                    <td style={tdStyle}>{cot.fecha}</td>
                    <td style={tdStyle}>{cot.productoNombre}</td>
                    <td style={tdStyle}>{cot.cliente || '-'}</td>
                    <td style={{...tdStyle, textAlign: 'right'}}>{formatCLP(cot.totalCLP)}</td>
                    <td style={tdStyle}><span style={statusBadgeStyle(cot.estado)}>{cot.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
       {/* --- Fin Tabla --- */}

    </div>
  );
} 