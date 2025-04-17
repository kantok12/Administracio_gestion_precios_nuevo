import React, { useState } from 'react';

// --- Interfaz Placeholder para un Perfil de Costos ---
interface PerfilCostoCategoria {
  categoria: string;
  bufferTransporte?: number;
  tasaSeguro?: number;
  margenAdicional?: number;
  descuentoFabricante?: number;
}

// --- Componente AdminPanel ---
export default function AdminPanel() {
  
  // --- Estados Placeholder (se conectarán a datos reales) ---
  const [tipoCambio, setTipoCambio] = useState<string>('1.08'); // Ejemplo
  const [dolarObservado, setDolarObservado] = useState<string>('980'); // Ejemplo
  const [bufferDolar, setBufferDolar] = useState<string>('2'); // Ejemplo %
  const [tasaSeguroGlobal, setTasaSeguroGlobal] = useState<string>('0.5'); // Ejemplo %
  const [bufferTransporteGlobal, setBufferTransporteGlobal] = useState<string>('5'); // Ejemplo %
  const [margenTotalGeneral, setMargenTotalGeneral] = useState<string>('15'); // Ejemplo %
  const [descuentoFabricanteGeneral, setDescuentoFabricanteGeneral] = useState<string>('10'); // Ejemplo %
  
  const [fechaActualizacionTasas, setFechaActualizacionTasas] = useState<string>('15/07/2024 10:30'); // Ejemplo
  const [fechaActualizacionMargenes, setFechaActualizacionMargenes] = useState<string>('14/07/2024 16:00'); // Ejemplo

  // Estado para perfiles por categoría
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>(['Chipeadoras PTO', 'Chipeadoras Motor', 'Accesorios', 'Repuestos']); // Ejemplo
  const [categoriaSeleccionadaPerfil, setCategoriaSeleccionadaPerfil] = useState<string>('');
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<Partial<PerfilCostoCategoria>>({}); // Usar Partial para edición

  // --- Estilos (consistentes con el resto de la app) ---
  const cardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' };
  const sectionTitleStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#343a40', margin: '0 0 16px 0', borderBottom: '1px solid #eef2f7', paddingBottom: '8px' };
  const inputGroupStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '16px' };
  const labelStyle: React.CSSProperties = { width: '200px', minWidth: '200px', fontSize: '13px', color: '#495057', fontWeight: 500 };
  const inputStyle: React.CSSProperties = { flexGrow: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' };
  const buttonStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500 };
  const primaryButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#1e88e5', color: 'white', borderColor: '#1e88e5' };
  const lastUpdateStyle: React.CSSProperties = { fontSize: '11px', color: '#6c757d', marginLeft: '16px'};
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', background: 'url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E\') no-repeat right 12px center', backgroundSize: '10px' };


  // --- Handlers Placeholder ---
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<any>>, key?: keyof PerfilCostoCategoria) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     const value = event.target.value;
     if (key && setter === setPerfilSeleccionado) {
        // Actualizar perfil específico
        setter((prev: any) => ({...prev, [key]: value}));
     } else {
        // Actualizar estado general
        setter(value);
     }
  };
  
  const handleGuardarTasas = () => alert('Guardando Tasas Globales...');
  const handleGuardarMargenes = () => alert('Guardando Márgenes Generales...');
  const handleGuardarPerfilCategoria = () => alert(`Guardando perfil para ${categoriaSeleccionadaPerfil}...`);
  
  const handleSeleccionarCategoria = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cat = e.target.value;
      setCategoriaSeleccionadaPerfil(cat);
      // Aquí iría la lógica para cargar el perfil existente de 'cat'
      // Ejemplo: 
      if (cat === 'Chipeadoras Motor') {
         setPerfilSeleccionado({ bufferTransporte: 7, tasaSeguro: 0.6, margenAdicional: 18, descuentoFabricante: 8});
      } else {
         setPerfilSeleccionado({}); // Resetear o cargar otro perfil
      }
  };


  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        Panel de Administración
      </h1>

      {/* --- Tarjeta: Tipos de Cambio y Tasas --- */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Tipos de Cambio y Tasas Globales</h2>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Tipo Cambio EUR/USD:</label>
          <input type="number" style={inputStyle} value={tipoCambio} onChange={handleInputChange(setTipoCambio)} step="0.01" />
           <span style={lastUpdateStyle}>Últ. Act: {fechaActualizacionTasas}</span>
        </div>
         <div style={inputGroupStyle}>
          <label style={labelStyle}>Dólar Observado (CLP):</label>
          <input type="number" style={inputStyle} value={dolarObservado} onChange={handleInputChange(setDolarObservado)} />
          <span style={lastUpdateStyle}>Últ. Act: {fechaActualizacionTasas}</span>
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Buffer Dólar (%):</label>
          <input type="number" style={inputStyle} value={bufferDolar} onChange={handleInputChange(setBufferDolar)} step="0.1" />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Tasa Seguro (%):</label>
          <input type="number" style={inputStyle} value={tasaSeguroGlobal} onChange={handleInputChange(setTasaSeguroGlobal)} step="0.1" />
        </div>
         <div style={inputGroupStyle}>
          <label style={labelStyle}>BUFFER Transporte (%):</label>
          <input type="number" style={inputStyle} value={bufferTransporteGlobal} onChange={handleInputChange(setBufferTransporteGlobal)} step="0.5" />
        </div>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
           <button style={primaryButtonStyle} onClick={handleGuardarTasas}>Guardar Cambios Tasas</button>
        </div>
      </div>

      {/* --- Tarjeta: Márgenes y Descuentos Generales --- */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Márgenes y Descuentos Generales</h2>
         <p style={{fontSize: '12px', color: '#6c757d', marginTop: '-10px', marginBottom: '15px'}}>
            Estos valores se aplicarán por defecto si no existe un perfil específico para la categoría.
         </p>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>% Adicional Total (Margen):</label>
          <input type="number" style={inputStyle} value={margenTotalGeneral} onChange={handleInputChange(setMargenTotalGeneral)} step="0.5" />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Descuento Fabricante (%):</label>
          <input type="number" style={inputStyle} value={descuentoFabricanteGeneral} onChange={handleInputChange(setDescuentoFabricanteGeneral)} step="0.5" />
        </div>
         <div style={{ textAlign: 'right', marginTop: '20px' }}>
           <span style={{ ...lastUpdateStyle, marginRight: 'auto', float: 'left', lineHeight: '35px'}}>Últ. Act: {fechaActualizacionMargenes}</span>
           <button style={primaryButtonStyle} onClick={handleGuardarMargenes}>Guardar Cambios Generales</button>
        </div>
      </div>

      {/* --- Tarjeta: Perfiles por Categoría --- */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Perfiles de Costos por Categoría</h2>
        <div style={inputGroupStyle}>
           <label style={labelStyle}>Seleccionar Categoría:</label>
           <select 
              style={selectStyle} 
              value={categoriaSeleccionadaPerfil} 
              onChange={handleSeleccionarCategoria}
           >
              <option value="">-- Seleccione una categoría --</option>
              {categoriasDisponibles.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
              ))}
           </select>
        </div>

        {/* Mostrar campos de perfil si se ha seleccionado una categoría */}
        {categoriaSeleccionadaPerfil && (
           <div style={{ borderTop: '1px solid #eef2f7', marginTop: '20px', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '15px', color: '#495057' }}>
                 Editar Perfil para: {categoriaSeleccionadaPerfil}
              </h3>
               <div style={inputGroupStyle}>
                 <label style={labelStyle}>BUFFER Transporte (%):</label>
                 <input type="number" style={inputStyle} value={perfilSeleccionado.bufferTransporte ?? ''} onChange={handleInputChange(setPerfilSeleccionado, 'bufferTransporte')} placeholder="Usar global" step="0.5" />
               </div>
               <div style={inputGroupStyle}>
                 <label style={labelStyle}>Tasa Seguro (%):</label>
                 <input type="number" style={inputStyle} value={perfilSeleccionado.tasaSeguro ?? ''} onChange={handleInputChange(setPerfilSeleccionado, 'tasaSeguro')} placeholder="Usar global" step="0.1" />
               </div>
               <div style={inputGroupStyle}>
                 <label style={labelStyle}>% Adicional Total (Margen):</label>
                 <input type="number" style={inputStyle} value={perfilSeleccionado.margenAdicional ?? ''} onChange={handleInputChange(setPerfilSeleccionado, 'margenAdicional')} placeholder="Usar global" step="0.5" />
               </div>
               <div style={inputGroupStyle}>
                 <label style={labelStyle}>Descuento Fabricante (%):</label>
                 <input type="number" style={inputStyle} value={perfilSeleccionado.descuentoFabricante ?? ''} onChange={handleInputChange(setPerfilSeleccionado, 'descuentoFabricante')} placeholder="Usar global" step="0.5" />
               </div>
               <div style={{ textAlign: 'right', marginTop: '20px' }}>
                 <button style={primaryButtonStyle} onClick={handleGuardarPerfilCategoria}>Guardar Perfil Categoría</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
} 