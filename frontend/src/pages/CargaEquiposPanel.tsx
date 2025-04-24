import React, { useState } from 'react';
import { UploadCloud, FileText, Download, Plus, X } from 'lucide-react';

export default function CargaEquiposPanel() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    Codigo_Producto: '',
    nombre_del_producto: '',
    modelo: '',
    categoria: '',
    largo_cm: '',
    ancho_cm: '',
    alto_cm: '',
    peso_kg: '',
    linea_de_producto: '',
    marca: '',
    combustible: '',
    hp: '',
    clasificacion_easysystems: '',
    codigo_ea: '',
    proveedor: '',
    procedencia: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el equipo');
      }

      const result = await response.json();
      alert('Equipo creado exitosamente');
      // Reset form and close modal
      setFormData({
        Codigo_Producto: '',
        nombre_del_producto: '',
        modelo: '',
        categoria: '',
        largo_cm: '',
        ancho_cm: '',
        alto_cm: '',
        peso_kg: '',
        linea_de_producto: '',
        marca: '',
        combustible: '',
        hp: '',
        clasificacion_easysystems: '',
        codigo_ea: '',
        proveedor: '',
        procedencia: ''
      });
      setShowModal(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Error desconocido al crear el equipo');
      }
    }
  };

  const handleDownloadTemplate = () => {
    // Create a link element
    const link = document.createElement('a');
    link.href = '/api/download-template';
    link.download = 'Plantilla_Carga_Equipos.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const panelStyle: React.CSSProperties = {
    // Removido padding aquí para confiar en el padding de App.tsx
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '24px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  };

  const uploadZoneStyle: React.CSSProperties = {
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    marginBottom: '24px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '16px',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#475569',
    marginBottom: '16px',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    gap: '8px',
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e2e8f0',
    color: '#94a3b8',
    cursor: 'not-allowed',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    marginBottom: '24px',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontWeight: 600,
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '24px'
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  };

  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#475569',
    width: '100%',
    maxWidth: '280px'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#334155'
  };

  // Modal styles
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: showModal ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const modalCloseButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
  };

  const actionButtonsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  return (
    <div style={panelStyle}>
      <h1 style={titleStyle}>Carga de Equipos</h1>

      {/* Action Buttons */}
      <div style={actionButtonsStyle}>
        <div></div>
        <button 
          style={buttonStyle} 
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} />
          Agregar Equipo Individual
        </button>
      </div>

      {/* Modal para carga individual */}
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <button 
            style={modalCloseButtonStyle} 
            onClick={() => setShowModal(false)}
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>

          <h2 style={subtitleStyle}>Carga Individual de Equipo</h2>
          <p style={descriptionStyle}>
            Complete el formulario para agregar un equipo de forma individual.
          </p>
          
          <form style={formStyle} onSubmit={handleSubmit}>
            {/* Sección: Información General */}
            <h3 style={{ marginTop: '16px', marginBottom: '12px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>Información General</h3>
            <div style={inputGroupStyle}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Código de Producto *</label>
                <input type="text" name="Codigo_Producto" value={formData.Codigo_Producto} onChange={handleInputChange} style={inputStyle} required />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Nombre del Producto *</label>
                <input type="text" name="nombre_del_producto" value={formData.nombre_del_producto} onChange={handleInputChange} style={inputStyle} required />
              </div>
            </div>
            <div style={inputGroupStyle}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Modelo *</label>
                <input type="text" name="modelo" value={formData.modelo} onChange={handleInputChange} style={inputStyle} required />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Categoría *</label>
                <input type="text" name="categoria" value={formData.categoria} onChange={handleInputChange} style={inputStyle} required />
              </div>
            </div>

            {/* Sección: Dimensiones */}
            <h3 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>Dimensiones</h3>
            <div style={inputGroupStyle}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Largo (cm) *</label>
                <input type="number" name="largo_cm" value={formData.largo_cm} onChange={handleInputChange} style={inputStyle} required />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Ancho (cm) *</label>
                <input type="number" name="ancho_cm" value={formData.ancho_cm} onChange={handleInputChange} style={inputStyle} required />
              </div>
            </div>
            <div style={inputGroupStyle}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Alto (cm) *</label>
                <input type="number" name="alto_cm" value={formData.alto_cm} onChange={handleInputChange} style={inputStyle} required />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Peso (kg) *</label>
                <input type="number" name="peso_kg" value={formData.peso_kg} onChange={handleInputChange} style={inputStyle} required />
              </div>
            </div>

            {/* Sección: Especificaciones Técnicas */}
            <h3 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '16px', fontWeight: 600, color: '#334155' }}>Especificaciones Técnicas</h3>
            <div style={inputGroupStyle}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Línea de Producto *</label>
                <input type="text" name="linea_de_producto" value={formData.linea_de_producto} onChange={handleInputChange} style={inputStyle} required />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Marca</label>
                <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>
            <div style={inputGroupStyle}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Combustible *</label>
                <input type="text" name="combustible" value={formData.combustible} onChange={handleInputChange} style={inputStyle} required />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>HP *</label>
                <input type="number" name="hp" value={formData.hp} onChange={handleInputChange} style={inputStyle} required />
              </div>
            </div>
            <div style={inputGroupStyle}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Clasificación EasySystems *</label>
                <input type="text" name="clasificacion_easysystems" value={formData.clasificacion_easysystems} onChange={handleInputChange} style={inputStyle} required />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Código EA *</label>
                <input type="text" name="codigo_ea" value={formData.codigo_ea} onChange={handleInputChange} style={inputStyle} required />
              </div>
            </div>
            <div style={inputGroupStyle}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Proveedor *</label>
                <input type="text" name="proveedor" value={formData.proveedor} onChange={handleInputChange} style={inputStyle} required />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>Procedencia *</label>
                <input type="text" name="procedencia" value={formData.procedencia} onChange={handleInputChange} style={inputStyle} required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" 
                style={{...buttonStyle, backgroundColor: '#94a3b8', marginRight: '12px'}} 
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" style={buttonStyle}>
                <Plus size={16} />
                Agregar Equipo
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sección de Carga Masiva */}
      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={subtitleStyle}>Carga de Equipos Base</h2>
          <p style={descriptionStyle}>
            Utilice una plantilla Excel con las siguientes columnas. Todos los campos son obligatorios a menos que se indique lo contrario.
          </p>
          
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Columna</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Ejemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Codigo_Producto</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Código único del producto</td>
                <td style={tdStyle}>"61529"</td>
              </tr>
              <tr>
                <td style={tdStyle}>nombre_del_producto</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Nombre completo del producto</td>
                <td style={tdStyle}>"Chipeadora Motor A530L - 35 HP K"</td>
              </tr>
              <tr>
                <td style={tdStyle}>modelo</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Modelo específico</td>
                <td style={tdStyle}>"A530L - 35 HP K - Chasis 80km/h"</td>
              </tr>
              <tr>
                <td style={tdStyle}>categoria</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Categoría del equipo</td>
                <td style={tdStyle}>"Chipeadora Motor"</td>
              </tr>
              <tr>
                <td style={tdStyle}>largo_cm</td>
                <td style={tdStyle}>Número</td>
                <td style={tdStyle}>Largo en centímetros</td>
                <td style={tdStyle}>3400</td>
              </tr>
              <tr>
                <td style={tdStyle}>ancho_cm</td>
                <td style={tdStyle}>Número</td>
                <td style={tdStyle}>Ancho en centímetros</td>
                <td style={tdStyle}>1380</td>
              </tr>
              <tr>
                <td style={tdStyle}>alto_cm</td>
                <td style={tdStyle}>Número</td>
                <td style={tdStyle}>Alto en centímetros</td>
                <td style={tdStyle}>2200</td>
              </tr>
              <tr>
                <td style={tdStyle}>peso_kg</td>
                <td style={tdStyle}>Número</td>
                <td style={tdStyle}>Peso en kilogramos</td>
                <td style={tdStyle}>1800</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{...subtitleStyle, fontSize: '16px'}}>Especificaciones Técnicas</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Columna</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Ejemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>linea_de_producto</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Código de línea</td>
                <td style={tdStyle}>"CH"</td>
              </tr>
              <tr>
                <td style={tdStyle}>marca</td>
                <td style={tdStyle}>Texto (Opcional)</td>
                <td style={tdStyle}>Marca del equipo</td>
                <td style={tdStyle}>"Jensen"</td>
              </tr>
              <tr>
                <td style={tdStyle}>combustible</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Tipo de combustible</td>
                <td style={tdStyle}>"Diesel"</td>
              </tr>
              <tr>
                <td style={tdStyle}>hp</td>
                <td style={tdStyle}>Número</td>
                <td style={tdStyle}>Potencia en HP</td>
                <td style={tdStyle}>35</td>
              </tr>
              <tr>
                <td style={tdStyle}>clasificacion_easysystems</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Clasificación del sistema</td>
                <td style={tdStyle}>"1. Chipeadora Equipo"</td>
              </tr>
              <tr>
                <td style={tdStyle}>codigo_ea</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Código EA</td>
                <td style={tdStyle}>"CHm530L-d35R-15"</td>
              </tr>
              <tr>
                <td style={tdStyle}>proveedor</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>Nombre del proveedor</td>
                <td style={tdStyle}>"Jensen"</td>
              </tr>
              <tr>
                <td style={tdStyle}>procedencia</td>
                <td style={tdStyle}>Texto</td>
                <td style={tdStyle}>País de origen</td>
                <td style={tdStyle}>"Alemania"</td>
              </tr>
            </tbody>
          </table>

          <div style={uploadZoneStyle}>
            <UploadCloud size={48} style={{ marginBottom: '16px', color: '#94a3b8' }} />
            <p style={{...descriptionStyle, marginBottom: '24px'}}>
              Arrastre aquí su archivo Excel o haga clic para seleccionarlo.
              <br />
              Formatos soportados: .xlsx, .xls
            </p>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
              <button style={buttonStyle} onClick={handleDownloadTemplate}>
                <Download size={16} />
                Descargar Plantilla
              </button>
              <button style={disabledButtonStyle} disabled>
                <FileText size={16} />
                Seleccionar Archivo
              </button>
            </div>
          </div>

          <div style={{fontSize: '13px', color: '#64748b'}}>
            <strong>Notas importantes:</strong>
            <ul style={{marginTop: '8px', lineHeight: '1.5'}}>
              <li>Los archivos no deben exceder 10MB</li>
              <li>Todas las fechas deben estar en formato YYYY-MM-DD</li>
              <li>Los números decimales deben usar punto como separador</li>
              <li>Los campos vacíos deben dejarse en blanco, no usar "N/A" o "null"</li>
              <li>Las dimensiones deben ser números enteros</li>
              <li>Los códigos de producto deben ser únicos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 