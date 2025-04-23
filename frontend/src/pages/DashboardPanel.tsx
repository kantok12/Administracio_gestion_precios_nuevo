import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { ArrowRight, TrendingUp, FileText, DollarSign, BarChart, PieChart, Clock } from 'lucide-react'; // Example icons

// --- Interfaces para Datos Inventados ---
interface ConfiguracionReciente {
  id: string;
  fecha: string;
  producto: string;
  categoria: string;
  costoFabricaEUR: number;
  costoFinalCLP: number;
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
}

interface CostoPromedioCategoria {
  categoria: string;
  costoPromedioCLP: number;
}

// --- Datos Inventados ---
const kpisInventados = {
  totalConfiguraciones: 78,
  valorPromedioCLP: 185500000,
  tasaAceptacion: 0.45, // 45%
  tiempoPromedioConfig: 2, // en días
};

const tendenciaInventada = [
  { dia: 'Lun', cantidad: 5 },
  { dia: 'Mar', cantidad: 8 },
  { dia: 'Mié', cantidad: 6 },
  { dia: 'Jue', cantidad: 10 },
  { dia: 'Vie', cantidad: 7 },
  { dia: 'Sáb', cantidad: 3 },
  { dia: 'Dom', cantidad: 2 },
];

const distribucionEstadosInventada = {
  pendiente: 35,
  aceptada: 35, // 45% de 78 aprox
  rechazada: 8,
};

const recientesInventadas: ConfiguracionReciente[] = [
  { id: 'CFG-078', fecha: '2024-05-23', producto: 'Chipeadora A530L', categoria: 'Motor', costoFabricaEUR: 98000, costoFinalCLP: 195106078, estado: 'Pendiente' },
  { id: 'CFG-077', fecha: '2024-05-23', producto: 'Chipeadora T-Rex', categoria: 'PTO', costoFabricaEUR: 85000, costoFinalCLP: 152300500, estado: 'Aceptada' },
  { id: 'CFG-076', fecha: '2024-05-22', producto: 'Astilladora H-900', categoria: 'Industrial', costoFabricaEUR: 150000, costoFinalCLP: 310000000, estado: 'Rechazada' },
  { id: 'CFG-075', fecha: '2024-05-21', producto: 'Chipeadora T-Rex', categoria: 'PTO', costoFabricaEUR: 84500, costoFinalCLP: 151000000, estado: 'Aceptada' },
  { id: 'CFG-074', fecha: '2024-05-20', producto: 'Chipeadora Z-Max', categoria: 'PTO', costoFabricaEUR: 79000, costoFinalCLP: 148500000, estado: 'Pendiente' },
];

const costosPromedioInventados: CostoPromedioCategoria[] = [
  { categoria: 'Motor', costoPromedioCLP: 196800000 },
  { categoria: 'PTO', costoPromedioCLP: 150500000 },
  { categoria: 'Industrial', costoPromedioCLP: 310000000 },
  { categoria: 'Otros', costoPromedioCLP: 95000000 },
];

// --- Helper de Formato ---
const formatCLP = (value: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
};
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(0)}%`;
};

// --- Componente Dashboard ---
export default function DashboardPanel() {

  // --- Estilos (similares a AdminPanel para consistencia) ---
  const primaryTextColor = '#0ea5e9';
  const secondaryTextColor = '#64748b';
  const lightGrayBg = '#f8fafc';
  const borderColor = '#e5e7eb';
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' };
  const cardTitleStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 500, color: secondaryTextColor, marginBottom: '8px' };
  const cardValueStyle: React.CSSProperties = { fontSize: '22px', fontWeight: 600, color: '#1e293b' };
  const cardIconStyle: React.CSSProperties = { color: primaryTextColor, alignSelf: 'flex-end' };
  const gridContainerStyle: React.CSSProperties = { display: 'grid', gap: '20px' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '13px' };
  const thStyle: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${borderColor}`, fontWeight: 600, color: '#374151', backgroundColor: lightGrayBg };
  const tdStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: `1px solid ${borderColor}`, color: '#4b5563' };
  const statusBadgeStyle = (estado: ConfiguracionReciente['estado']): React.CSSProperties => ({
    display: 'inline-block', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, color: 'white',
    backgroundColor: estado === 'Aceptada' ? '#10b981' : (estado === 'Pendiente' ? '#f59e0b' : '#ef4444'),
  });
  const chartPlaceholderStyle: React.CSSProperties = { backgroundColor: lightGrayBg, border: `1px dashed ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: secondaryTextColor, fontStyle: 'italic', padding: '20px', borderRadius: '6px', minHeight: '150px' };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>
        Dashboard de Cotizaciones y Costos
      </h1>

      {/* --- KPIs --- */}
      <div style={{ ...gridContainerStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '24px' }}>
        <div style={cardStyle}>
          <div>
            <div style={cardTitleStyle}>Cotizaciones Totales</div>
            <div style={cardValueStyle}>{kpisInventados.totalConfiguraciones}</div>
          </div>
          <FileText size={24} style={cardIconStyle} />
        </div>
        <div style={cardStyle}>
          <div>
            <div style={cardTitleStyle}>Valor Promedio (CLP)</div>
            <div style={cardValueStyle}>{formatCLP(kpisInventados.valorPromedioCLP)}</div>
          </div>
          <DollarSign size={24} style={cardIconStyle} />
        </div>
        <div style={cardStyle}>
          <div>
            <div style={cardTitleStyle}>Tasa Aceptación</div>
            <div style={cardValueStyle}>{formatPercent(kpisInventados.tasaAceptacion)}</div>
          </div>
          <TrendingUp size={24} style={cardIconStyle} />
        </div>
        <div style={cardStyle}>
          <div>
            <div style={cardTitleStyle}>Tiempo Prom. (Días)</div>
            <div style={cardValueStyle}>{kpisInventados.tiempoPromedioConfig}</div>
          </div>
          <Clock size={24} style={cardIconStyle} />
        </div>
      </div>

      {/* --- Gráficos --- */}
      <div style={{ ...gridContainerStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '24px' }}>
        {/* Gráfico de Tendencia (Placeholder) */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Tendencia Semanal</h3>
          <div style={chartPlaceholderStyle}>
            <BarChart size={18} style={{ marginRight: '8px' }} /> (Gráfico de Barras: Cotizaciones/Día)
          </div>
        </div>

        {/* Gráfico de Distribución (Placeholder) */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Distribución por Estado</h3>
          <div style={chartPlaceholderStyle}>
             <PieChart size={18} style={{ marginRight: '8px' }} /> (Gráfico de Dona: Pendiente / Aceptada / Rechazada)
          </div>
        </div>
      </div>

      {/* --- Comparativa y Recientes --- */}
      <div style={{ ...gridContainerStyle, gridTemplateColumns: '1.5fr 1fr', marginBottom: '24px' }}>
         {/* Tabla Recientes */}
         <div style={cardStyle}>
           <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Actividad Reciente</h3>
           <div style={{ overflowX: 'auto' }}>
             <table style={tableStyle}>
               <thead>
                 <tr>
                   <th style={thStyle}>ID</th>
                   <th style={thStyle}>Fecha</th>
                   <th style={thStyle}>Producto</th>
                   <th style={{...thStyle, textAlign: 'right'}}>Costo Final (CLP)</th>
                   <th style={thStyle}>Estado</th>
                 </tr>
               </thead>
               <tbody>
                 {recientesInventadas.map((cfg) => (
                   <tr key={cfg.id}>
                     <td style={tdStyle}>{cfg.id}</td>
                     <td style={tdStyle}>{cfg.fecha}</td>
                     <td style={tdStyle}>{cfg.producto}</td>
                     <td style={{...tdStyle, textAlign: 'right'}}>{formatCLP(cfg.costoFinalCLP)}</td>
                     <td style={tdStyle}><span style={statusBadgeStyle(cfg.estado)}>{cfg.estado}</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>

         {/* Comparativa Costos (Placeholder) */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Costo Promedio por Categoría</h3>
           <div style={chartPlaceholderStyle}>
             <BarChart size={18} style={{ marginRight: '8px' }} /> (Gráfico Barras Horizontales: Categoría vs Costo CLP)
           </div>
        </div>
      </div>

    </div>
  );
} 