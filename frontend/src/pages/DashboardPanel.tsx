import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, History, Search, Filter, Clock, Settings, RefreshCcw, Download, Calendar, FileText, Database, Rows } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Rows as RowsIcon } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Interfaces
interface Equipo {
  codigo: string;
  nombre: string;
  categoria: string;
  ultima_actualizacion: string;
  costo_fabrica_eur: number;
}

interface Configuracion {
  id: string;
  fecha: string;
  equipo_base: {
    codigo: string;
    nombre: string;
  };
  opcionales: Array<{
    codigo: string;
    nombre: string;
  }>;
  total_items: number;
}

// Componente principal
export default function DashboardPanel() {
  // Estados
  const [equiposDesactualizados, setEquiposDesactualizados] = useState<Equipo[]>([]);
  const [configuracionesRecientes, setConfiguracionesRecientes] = useState<Configuracion[]>([]);
  const [filtroConfiguracion, setFiltroConfiguracion] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [timeGranularity, setTimeGranularity] = useState('Mes');
  const [dataSource, setDataSource] = useState('Documentos');

  // Estilos
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    marginBottom: '24px'
  };

  const gridContainerStyle: React.CSSProperties = {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: '1fr 1fr',
    marginBottom: '24px'
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
    fontWeight: 600
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    color: '#4b5563'
  };

  const searchBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    flex: 1
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: 'white'
  };

  const warningStyle: React.CSSProperties = {
    color: '#f59e0b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const panelContainerStyle: React.CSSProperties = { /* Add padding if needed */ };
  const chartCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    marginBottom: '24px'
  };
  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  };
  const chartTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937'
  };
  const controlsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px'
  };
  const buttonGroupStyle: React.CSSProperties = {
    display: 'inline-flex',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #d1d5db'
  };
  const buttonGroupItemStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#374151'
  };
  const buttonGroupItemSelectedStyle: React.CSSProperties = {
    ...buttonGroupItemStyle,
    backgroundColor: '#3b82f6', // Blue background for selected
    color: 'white'
  };
  const chartContainerStyle: React.CSSProperties = {
    height: '400px', // Adjust height as needed
    position: 'relative'
  };
  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  };
  const primaryButtonStyle: React.CSSProperties = { 
    ...buttonStyle, 
    backgroundColor: '#3b82f6', 
    color: 'white', 
    borderColor: '#3b82f6' 
  };
  const successButtonStyle: React.CSSProperties = { 
    ...buttonStyle, 
    backgroundColor: '#22c55e', 
    color: 'white', 
    borderColor: '#22c55e' 
  };
  const headerActionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  };

  // Simulación de datos (reemplazar con llamadas a API reales)
  useEffect(() => {
    // Aquí irían las llamadas a la API para obtener los datos reales
    const mockEquiposDesactualizados: Equipo[] = [
      {
        codigo: 'CHIP-001',
        nombre: 'Chipeadora T-Rex 500',
        categoria: 'PTO',
        ultima_actualizacion: '2023-06-15',
        costo_fabrica_eur: 85000
      },
      {
        codigo: 'CHIP-002',
        nombre: 'Astilladora Industrial H-900',
        categoria: 'Industrial',
        ultima_actualizacion: '2023-08-20',
        costo_fabrica_eur: 150000
      }
    ];

    const mockConfiguraciones: Configuracion[] = [
      {
        id: 'CFG-001',
        fecha: '2024-05-20',
        equipo_base: {
          codigo: 'CHIP-001',
          nombre: 'Chipeadora T-Rex 500'
        },
        opcionales: [
          { codigo: 'OPC-001', nombre: 'Extension de tolva' },
          { codigo: 'OPC-002', nombre: 'Kit de mantenimiento' }
        ],
        total_items: 3
      }
    ];

    setEquiposDesactualizados(mockEquiposDesactualizados);
    setConfiguracionesRecientes(mockConfiguraciones);
  }, []);

  // Sample data structure (replace with actual data fetching)
  const sampleData = {
    labels: ['jun 2023', 'dic 2023', 'ene 2024', 'feb 2024', 'mar 2024', 'abr 2024', 'may 2024', 'jun 2024', 'jul 2024', 'ago 2024', 'sept 2024', 'oct 2024', 'nov 2024', 'dic 2024', 'mar 2025', 'abr 2025', 'jun 2025', 'jul 2025'],
    datasets: [
      {
        label: 'Cargos',
        data: [0, 0, 0, 150, 0, 50, 300, 680, 50, 0, 0, 50, 100, 0, 0, 0, 0, 0], // Example data
        borderColor: 'rgb(239, 68, 68)', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        label: 'Abonos',
        data: [0, 0, 100, 400, 0, 350, 0, 350, 0, 0, 150, 0, 0, 0, 0, 0, 0, 0], // Example data
        borderColor: 'rgb(34, 197, 94)', // Green
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        label: 'Balance Acumulado',
        data: [0, 0, -10, -50, -20, 100, 0, -500, -600, -600, -500, -650, -700, -700, -700, -700, -700, -700], // Example data
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const, // Place legend at the bottom
      },
      title: {
        display: false, // Title is handled outside the chart
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false, // Allow negative values
        ticks: {
          // Format Y-axis labels (e.g., 700M)
          callback: function(value: number | string) {
            if (typeof value === 'number') {
              return (value / 1000000).toFixed(1) + 'M';
            }
            return value;
          }
        }
      }
    }
  };

  return (
    <PageLayout>
      <div style={panelContainerStyle}>
        {/* Header: Title and Global Actions */}
        <div style={headerActionsStyle}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Dashboard</h1>
          <div style={controlsContainerStyle}>
            <button style={primaryButtonStyle}> 
              <RefreshCcw size={16} />
              Actualizar
            </button>
            <button style={successButtonStyle}>
              <Download size={16} />
              Descargar Informe
            </button>
          </div>
        </div>

        {/* Financial Movements Chart Card */}
        <div style={chartCardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={chartTitleStyle}>configuraciones</h2>
            <div style={controlsContainerStyle}>
              {/* Time Granularity Toggle */}
              <div style={buttonGroupStyle}>
                {['Mes', 'Trimestre', 'Año'].map(item => (
                  <button 
                    key={item}
                    style={timeGranularity === item ? buttonGroupItemSelectedStyle : buttonGroupItemStyle}
                    onClick={() => setTimeGranularity(item)}
                  >
                    {/* Consider adding icons like Calendar */}
                    {item}
                  </button>
                ))}
              </div>
              {/* Data Source Toggle */}
              <div style={buttonGroupStyle}>
                {['Documentos', 'SII', 'Cartolas'].map(item => (
                  <button 
                    key={item}
                    style={dataSource === item ? buttonGroupItemSelectedStyle : buttonGroupItemStyle}
                    onClick={() => setDataSource(item)}
                  >
                    {/* Consider adding icons like FileText, Database, Rows */}
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={chartContainerStyle}>
            <Line options={options} data={sampleData} />
          </div>
        </div>

        <div style={gridContainerStyle}>
          {/* Equipos que necesitan actualización */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#374151' }}>
                Equipos que Requieren Actualización
              </h2>
              <div style={warningStyle}>
                <AlertCircle size={18} />
                <span>Costos anteriores a 2024</span>
              </div>
            </div>
            
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Código</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Categoría</th>
                  <th style={thStyle}>Última Actualización</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equiposDesactualizados.map((equipo) => (
                  <tr key={equipo.codigo}>
                    <td style={tdStyle}>{equipo.codigo}</td>
                    <td style={tdStyle}>{equipo.nombre}</td>
                    <td style={tdStyle}>{equipo.categoria}</td>
                    <td style={tdStyle}>{equipo.ultima_actualizacion}</td>
                    <td style={tdStyle}>
                      <Link 
                        to={`/admin/costos?equipo=${equipo.codigo}`}
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        Actualizar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Configuraciones Previas */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
              Configuraciones Realizadas
            </h2>
            
            <div style={searchBarStyle}>
              <input
                type="text"
                placeholder="Buscar por código o nombre de equipo..."
                value={filtroConfiguracion}
                onChange={(e) => setFiltroConfiguracion(e.target.value)}
                style={inputStyle}
              />
              <select 
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={selectStyle}
              >
                <option value="todas">Todas las categorías</option>
                <option value="PTO">PTO</option>
                <option value="Industrial">Industrial</option>
                <option value="Motor">Motor</option>
              </select>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID Config.</th>
                  <th style={thStyle}>Equipo Base</th>
                  <th style={thStyle}>Items</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {configuracionesRecientes.map((config) => (
                  <tr key={config.id}>
                    <td style={tdStyle}>{config.id}</td>
                    <td style={tdStyle}>{config.equipo_base.nombre}</td>
                    <td style={tdStyle}>{config.total_items}</td>
                    <td style={tdStyle}>{config.fecha}</td>
                    <td style={tdStyle}>
                      <Link 
                        to={`/equipos?config=${config.id}`}
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        Reutilizar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 