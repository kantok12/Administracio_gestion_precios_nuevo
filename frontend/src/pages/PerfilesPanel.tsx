import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Eye, Edit, Trash2, PlusCircle, Copy } from 'lucide-react'; // Import icons
import type { CostParams } from '../types/costParams'; // Import CostParams type

// Interface defining the structure of a Cost Profile
interface CostProfile {
  id: string; // Unique ID for the profile
  nombre: string; // User-defined name for the profile
  descripcion?: string; // Optional description
  fechaCreacion?: string; // Optional creation date/timestamp
  costos: Partial<CostParams>; // The saved cost parameters (can be partial)
}

// Mock Data for demonstration
const mockProfiles: CostProfile[] = [
  {
    id: 'profile_1',
    nombre: 'Perfil Estándar Q1 2024',
    descripcion: 'Configuración base para chipeadoras motorizadas.',
    fechaCreacion: '2024-03-15T10:00:00Z',
    costos: {
      margen_adicional_total: 0.35,
      tasa_seguro: 0.01,
      tipo_cambio_eur_usd: 1.09,
      buffer_usd_clp: 0.02
    }
  },
  {
    id: 'profile_2',
    nombre: 'Oferta Especial Invierno',
    fechaCreacion: '2024-05-01T14:30:00Z',
    costos: {
      margen_adicional_total: 0.28,
      descuento_fabricante: 0.05,
      tipo_cambio_eur_usd: 1.08,
    }
  },
  {
    id: 'profile_3',
    nombre: 'Configuración PTO Básico',
    descripcion: 'Solo parámetros esenciales para equipos PTO.',
    fechaCreacion: '2024-04-10T09:15:00Z',
    costos: {
      margen_adicional_total: 0.30,
      tasa_seguro: 0.008,
      flete_maritimo_usd: 3200,
    }
  }
];

// Placeholder API function (replace with real API call)
const fetchCostProfiles = async (): Promise<CostProfile[]> => {
  console.log("[PerfilesPanel] Fetching cost profiles (using mock data)...", mockProfiles);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real scenario, you would fetch from your backend endpoint
  // e.g., const response = await fetch('/api/cost-profiles');
  // if (!response.ok) throw new Error('Failed to fetch profiles');
  // return await response.json();
  
  // Return mock data for now
  return mockProfiles;
};

export default function PerfilesPanel() {
  const [profiles, setProfiles] = useState<CostProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCostProfiles();
        setProfiles(data);
      } catch (err) {
        console.error("Error loading cost profiles:", err);
        setError(err instanceof Error ? err.message : "Error desconocido al cargar perfiles.");
        setProfiles([]); // Clear profiles on error
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []); // Run only on component mount

  // --- Styles (consistent with other panels) ---
  const panelStyle: React.CSSProperties = {
    // padding: '24px', // Relying on App.tsx padding
  };
  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '16px',
  };
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };
   const buttonStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' };
   const primaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#0ea5e9', color: 'white', borderColor: '#0ea5e9' };
   const secondaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: 'white', color: '#334155', borderColor: '#e5e7eb' };
   const iconButtonStyle: React.CSSProperties = { ...secondaryButtonStyle, padding: '6px', gap: '0px' }; // Smaller padding for icon-only buttons
   const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // Responsive grid
    gap: '20px',
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };
  const cardTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '4px',
  };
  const cardDescriptionStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '12px',
    flexGrow: 1, // Allow description to take space
    lineHeight: 1.5,
  };
  const cardDateStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '16px',
  };
  const cardActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
    marginTop: 'auto', // Push actions to the bottom
  };
  const loadingErrorStyle: React.CSSProperties = { 
    textAlign: 'center', 
    padding: '40px', 
    color: '#64748b', 
    backgroundColor:'#f8fafc', 
    border: '1px dashed #e2e8f0', 
    borderRadius: '8px' 
  };

  // --- Placeholder Handlers --- 
  const handleCreateNewProfile = () => {
    // Future: Capture current state from AdminPanel/Costos and save as new profile
    alert('Funcionalidad "Crear Nuevo Perfil" no implementada.');
  };
  const handleViewProfile = (id: string) => {
    alert(`Funcionalidad "Ver Perfil ${id}" no implementada.`);
  };
  const handleEditProfile = (id: string) => {
    alert(`Funcionalidad "Editar Perfil ${id}" no implementada.`);
  };
  const handleDeleteProfile = (id: string) => {
    if (window.confirm(`¿Está seguro que desea eliminar el perfil ${id}?`)) {
      // Future: Call API to delete
      alert(`Funcionalidad "Eliminar Perfil ${id}" no implementada.`);
    }
  };
  const handleApplyProfile = (id: string) => {
     // Future: Load profile costs into AdminPanel/Costos state
     alert(`Funcionalidad "Aplicar Perfil ${id}" no implementada.`);
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Administración de Perfiles de Costos</h1>
        <button onClick={handleCreateNewProfile} style={primaryButtonStyle} title="Crear nuevo perfil basado en costos actuales (no implementado)">
          <PlusCircle size={16} />
          Crear Nuevo Perfil
        </button>
      </div>

      {loading && (
        <div style={loadingErrorStyle}>
          <Loader2 size={24} className="animate-spin" style={{ marginBottom: '12px' }}/>
          Cargando perfiles...
        </div>
      )}

      {error && (
        <div style={{ ...loadingErrorStyle, color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
           <AlertTriangle size={24} style={{ marginBottom: '12px' }}/>
           Error al cargar perfiles: {error}
        </div>
      )}

      {!loading && !error && profiles.length === 0 && (
        <div style={loadingErrorStyle}>
          No se encontraron perfiles guardados.
        </div>
      )}

      {!loading && !error && profiles.length > 0 && (
        <div style={gridStyle}>
          {profiles.map((profile) => (
            <div key={profile.id} style={cardStyle}>
              <div> {/* Top section for content */} 
                <h2 style={cardTitleStyle}>{profile.nombre}</h2>
                {profile.fechaCreacion && (
                    <p style={cardDateStyle}>
                        Creado: {new Date(profile.fechaCreacion).toLocaleDateString('es-CL')}
                    </p>
                )}
                {profile.descripcion && (
                  <p style={cardDescriptionStyle}>{profile.descripcion}</p>
                )}
                 {!profile.descripcion && <div style={{minHeight: '30px'}}></div> /* Add empty space if no description */}
              </div>
              <div style={cardActionsStyle}>
                 <button onClick={() => handleApplyProfile(profile.id)} style={primaryButtonStyle} title="Aplicar este perfil a Costos (no implementado)">
                    Aplicar
                 </button>
                <button onClick={() => handleViewProfile(profile.id)} style={iconButtonStyle} title="Ver Detalles (no implementado)">
                  <Eye size={16} />
                </button>
                 <button onClick={() => handleEditProfile(profile.id)} style={iconButtonStyle} title="Editar Perfil (no implementado)">
                  <Edit size={16} />
                </button>
                 <button onClick={() => handleDeleteProfile(profile.id)} style={{...iconButtonStyle, color: '#dc2626'}} title="Eliminar Perfil (no implementado)">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 