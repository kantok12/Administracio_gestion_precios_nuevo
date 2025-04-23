import React from 'react';
import { UploadCloud, FileText } from 'lucide-react'; // Importar iconos

export default function CargaEquiposPanel() {

  // Estilos (puedes refinar esto más tarde)
  const panelStyle: React.CSSProperties = {
    // Removido padding aquí para confiar en el padding de App.tsx
    // padding: '24px', 
  };
  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '24px',
  };
  const placeholderContainerStyle: React.CSSProperties = {
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    color: '#64748b',
  };
  const iconStyle: React.CSSProperties = {
    marginBottom: '16px',
    color: '#94a3b8',
  };
  const textStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '24px',
  };
  const buttonPlaceholderStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#e2e8f0',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
  };

  return (
    <div style={panelStyle}>
      <h1 style={titleStyle}>Carga Masiva de Equipos</h1>

      <div style={placeholderContainerStyle}>
        <UploadCloud size={48} style={iconStyle} />
        <p style={textStyle}>
          Esta sección permitirá cargar múltiples equipos a la base de datos 
          mediante un archivo (por ejemplo, formato CSV o Excel).
          <br />
          La funcionalidad de carga masiva está en desarrollo.
        </p>
        {/* Placeholder para el botón/área de carga */}
        <button style={buttonPlaceholderStyle} disabled>
          <FileText size={16} style={{ marginRight: '8px' }} />
          Seleccionar archivo...
        </button>
      </div>
    </div>
  );
} 