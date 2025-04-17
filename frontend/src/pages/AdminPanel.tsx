import React, { useState, useEffect } from 'react';
// Importar iconos necesarios
import { SlidersHorizontal, DollarSign, Euro, RefreshCw, Info, Save, Calendar, Filter, Loader2 } from 'lucide-react';

// --- Interfaz Placeholder para un Perfil de Costos (la mantenemos por si se usa en otras tabs) ---
interface PerfilCostoCategoria {
  categoria: string;
  bufferTransporte?: number;
  tasaSeguro?: number;
  margenAdicional?: number;
  descuentoFabricante?: number;
}

// --- Componente AdminPanel --- 
export default function AdminPanel() {
  
  // --- Estados (mantenemos los actuales, aunque no todos se muestren en la nueva UI) ---
  const [tipoCambio, setTipoCambio] = useState<string>('1.12'); // Valor de la imagen
  const [bufferDolar, setBufferDolar] = useState<string>('1.8'); // Valor de la imagen
  const [tasaSeguroGlobal, setTasaSeguroGlobal] = useState<string>('1'); // Valor de la imagen
  const [bufferTransporteGlobal, setBufferTransporteGlobal] = useState<string>('5'); // Valor de la imagen
  const [margenTotalGeneral, setMargenTotalGeneral] = useState<string>('20'); // Valor de la imagen
  const [descuentoFabricanteGeneral, setDescuentoFabricanteGeneral] = useState<string>('5'); // Valor de la imagen
  const [fechaUltimaActualizacion, setFechaUltimaActualizacion] = useState<string>('14-04-2025'); // Valor de la imagen

  // Estados para la sección de divisas actualizadas
  const [dolarActualCLP, setDolarActualCLP] = useState<string | null>(null);
  const [euroActualCLP, setEuroActualCLP] = useState<string | null>(null);
  const [fechaActualizacionDivisas, setFechaActualizacionDivisas] = useState<string | null>(null);

  // Estado para filtros (mantener lógica si es necesario)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>(['Todas las categorías', 'Chipeadoras PTO', 'Chipeadoras Motor']); // Ejemplo
  const [categoriaSeleccionadaFiltro, setCategoriaSeleccionadaFiltro] = useState<string>('Todas las categorías');

  // --- Estados/Lógica para perfiles (comentados por ahora) ---
  // const [categoriaSeleccionadaPerfil, setCategoriaSeleccionadaPerfil] = useState<string>('');
  // const [perfilSeleccionado, setPerfilSeleccionado] = useState<Partial<PerfilCostoCategoria>>({});
  
  // --- Estilos reutilizables para la nueva UI ---
  const primaryTextColor = '#0ea5e9'; // Azul similar al de App.tsx
  const secondaryTextColor = '#64748b';
  const lightGrayBg = '#f8fafc';
  const borderColor = '#e5e7eb';

  const mainCardStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '24px' };
  const gridContainerStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' };
  const gridCardStyle: React.CSSProperties = { backgroundColor: lightGrayBg, borderRadius: '8px', padding: '20px', border: `1px solid ${borderColor}` };
  const gridCardTitleStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '16px' };
  const inputGroupStyle: React.CSSProperties = { marginBottom: '12px' };
  const labelStyle: React.CSSProperties = { display:'block', marginBottom: '4px', fontSize: '12px', color: secondaryTextColor, fontWeight: 500 };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: `1px solid ${borderColor}`, borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }; // Added box-sizing
  const inputDescriptionStyle: React.CSSProperties = { fontSize: '11px', color: '#94a3b8', marginTop: '4px' };
  const currencyDisplayStyle: React.CSSProperties = { backgroundColor: 'white', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '16px', textAlign: 'center' };
  const currencyValueStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' };
  const currencyDateStyle: React.CSSProperties = { fontSize: '11px', color: secondaryTextColor };
  const tabStyle: React.CSSProperties = { padding: '10px 16px', cursor: 'pointer', borderBottom: '2px solid transparent', color: secondaryTextColor, fontSize: '14px', fontWeight: 500 };
  const activeTabStyle: React.CSSProperties = { ...tabStyle, color: primaryTextColor, borderBottomColor: primaryTextColor };
  const buttonBaseStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' };
  const primaryButtonStyle: React.CSSProperties = { ...buttonBaseStyle, backgroundColor: primaryTextColor, color: 'white', borderColor: primaryTextColor };
  const secondaryButtonStyle: React.CSSProperties = { ...buttonBaseStyle, backgroundColor: 'white', color: '#334155', borderColor: borderColor };
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', background: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${secondaryTextColor.substring(1)}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E') no-repeat right 12px center`, backgroundSize: '10px' };

  // --- NUEVOS ESTADOS para la actualización de divisas ---
  const [isUpdatingCurrencies, setIsUpdatingCurrencies] = useState(false);
  const [currencyUpdateError, setCurrencyUpdateError] = useState<string | null>(null);
  // Estados para la carga/error INICIAL de divisas
  const [initialCurrencyLoading, setInitialCurrencyLoading] = useState(true);
  const [initialCurrencyError, setInitialCurrencyError] = useState<string | null>(null);
  // ------------------------------------------------------

  // --- Función Refactorizada para Obtener y Establecer Divisas --- 
  const fetchAndSetCurrencies = async (updateTimestamp?: Date) => {
    const webhookUrl = 'https://n8n-807184488368.southamerica-west1.run.app/webhook/8012d60e-8a29-4910-b385-6514edc3d912';
    console.log("Fetching currencies from webhook...");
    try {
      const response = await fetch(webhookUrl);
      if (!response.ok) {
        let errorMsg = `Error del servidor: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignorar */ }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      console.log("Webhook response:", data);

      if (data && data.Valor_Dolar !== undefined && data.Valor_Euro !== undefined) {
        // --- REDONDEAR VALORES ANTES DE ESTABLECER ESTADO ---
        const roundedDolar = Math.round(parseFloat(data.Valor_Dolar));
        const roundedEuro = Math.round(parseFloat(data.Valor_Euro));
        
        // Comprobar si el redondeo fue exitoso (no NaN)
        if (!isNaN(roundedDolar)) {
           setDolarActualCLP(String(roundedDolar)); 
        } else {
           console.warn('Valor_Dolar no es un número válido:', data.Valor_Dolar);
           setDolarActualCLP(null); // O mantener valor anterior / mostrar error
        }
        if (!isNaN(roundedEuro)) {
            setEuroActualCLP(String(roundedEuro));
        } else {
           console.warn('Valor_Euro no es un número válido:', data.Valor_Euro);
           setEuroActualCLP(null); // O mantener valor anterior / mostrar error
        }
        // ----------------------------------------------------

        // --- USAR EL TIMESTAMP PASADO (o el actual si no se pasó) PARA LA FECHA DE ACTUALIZACIÓN ---
        const displayTime = updateTimestamp || new Date(); 
        setFechaActualizacionDivisas(displayTime.toLocaleString('es-CL'));
        // ------------------------------------------------------------------------------------

        console.log("Frontend states updated with rounded values.");
        return true; // Indicar éxito
      } else {
        throw new Error('Respuesta del webhook incompleta.');
      }
    } catch (error) {
      console.error('Error fetching/setting currencies:', error);
      // Lanzar el error para que sea manejado por quien llama
      throw error instanceof Error ? error : new Error('Error desconocido al obtener divisas');
    }
  };
  // --------------------------------------------------------------

  // --- useEffect para carga inicial --- 
  useEffect(() => {
    const loadInitialData = async () => {
      setInitialCurrencyLoading(true);
      setInitialCurrencyError(null);
      const initialTimestamp = new Date(); // Captura la hora al iniciar la carga
      try {
        await fetchAndSetCurrencies(initialTimestamp); // Pasar el timestamp
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        setInitialCurrencyError(errorMsg.includes('fetch') ? 'Error de conexión inicial con el webhook.' : errorMsg);
      } finally {
        setInitialCurrencyLoading(false);
      }
    };
    loadInitialData();
  }, []); // Array vacío para ejecutar solo al montar
  // ----------------------------------

  // --- Handlers (mantener lógica placeholder) ---
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     setter(event.target.value);
  };
  const handleSaveAll = () => alert('Guardando todos los cambios...');
  
  // --- MODIFICAR handleActualizarDivisas para usar la función refactorizada ---
  const handleActualizarDivisas = async () => {
    const updateTime = new Date(); // <<< CAPTURAR HORA AQUÍ
    setIsUpdatingCurrencies(true);
    setCurrencyUpdateError(null);
    try {
      await fetchAndSetCurrencies(updateTime); // <<< PASAR HORA AQUÍ
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setCurrencyUpdateError(errorMsg.includes('fetch') ? 'Error de conexión con el webhook.' : errorMsg);
    } finally {
      setIsUpdatingCurrencies(false);
    }
  };
  // ------------------------------------------------------------------------

  // --- Estado para la pestaña activa (ejemplo) ---
  const [activeTab, setActiveTab] = useState('calculos');

  return (
    // Contenedor principal del panel con padding
    <div style={{ padding: '0 24px 24px 24px' }}> 
      
      {/* --- Cabecera con Título, Tabs y Botón Guardar --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>
          ADMIN
        </h1>
        
        {/* Mantener el botón Guardar */}
        <button style={primaryButtonStyle} onClick={handleSaveAll}>
          <Save size={16} /> Guardar Cambios
        </button>
      </div>

      {/* --- Contenido Principal (Ya no depende de activeTab) --- */}
      <div> 
         {/* Título y Filtro */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
           <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={20} /> Parámetros de Cálculo y Costos
           </h2>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: secondaryTextColor }}>Filtrar por Categoría:</label>
              <select 
                  style={{ ...selectStyle, minWidth: '180px' }} 
                  value={categoriaSeleccionadaFiltro} 
                  onChange={(e) => setCategoriaSeleccionadaFiltro(e.target.value)}
              >
                  {categoriasDisponibles.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))}
              </select>
           </div>
         </div>

         {/* Sección Valores Actuales de Divisas */}
         <div style={{ ...mainCardStyle, backgroundColor: lightGrayBg, border: `1px solid ${borderColor}`}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
               <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: 0 }}>Valores Actuales de Divisas</h3>
               <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <button 
                    style={{...secondaryButtonStyle, cursor: isUpdatingCurrencies ? 'not-allowed' : 'pointer'}}
                    onClick={handleActualizarDivisas} 
                    disabled={isUpdatingCurrencies}
                  >
                     {isUpdatingCurrencies ? (
                        <Loader2 size={14} className="animate-spin" />
                     ) : (
                        <RefreshCw size={14} />
                     )}
                     {isUpdatingCurrencies ? 'Actualizando...' : 'Actualizar Divisas'} 
                  </button>
                  {/* Mostrar fecha SÓLO si no hay error inicial y NO está cargando inicialmente */}
                  {!initialCurrencyLoading && !initialCurrencyError && fechaActualizacionDivisas && (
                    <span style={{ fontSize: '11px', color: secondaryTextColor }}>
                      <Info size={12} style={{verticalAlign: 'middle', marginRight: '4px'}} />
                      Última actualización: {fechaActualizacionDivisas}
                    </span>
                  )}
                  {currencyUpdateError && (
                     <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '12px' }}>
                        Error al actualizar: {currencyUpdateError}
                     </div>
                  )}
               </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom:'12px' }}>
               {/* --- Mostrar estado inicial o valores --- */}
               {initialCurrencyLoading ? (
                  <div style={{...currencyDisplayStyle, justifyContent:'center', alignItems:'center', display:'flex', height: '110px'}}><Loader2 className="animate-spin" size={24}/></div>
               ) : initialCurrencyError ? (
                  <div style={{...currencyDisplayStyle, justifyContent:'center', alignItems:'center', display:'flex', height: '110px', color:'#b91c1c', fontSize:'12px'}}>Error: {initialCurrencyError}</div>
               ) : (
                  <div style={currencyDisplayStyle}>
                     <DollarSign size={16} color={secondaryTextColor} style={{marginBottom: '8px'}}/>
                     <div style={currencyValueStyle}>{dolarActualCLP ?? '-'}</div>
                     <div style={{fontSize: '12px', color: '#334155', marginBottom:'4px'}}>Dólar Observado Actual (CLP)</div>
                     <div style={currencyDateStyle}>Valor del {fechaActualizacionDivisas ? new Date(fechaActualizacionDivisas.split(', ')[0].split('/').reverse().join('-')).toLocaleDateString('es-CL') : '-'}</div>
                  </div>
               )}
                {initialCurrencyLoading ? (
                  <div style={{...currencyDisplayStyle, justifyContent:'center', alignItems:'center', display:'flex', height: '110px'}}><Loader2 className="animate-spin" size={24}/></div>
               ) : initialCurrencyError ? (
                  <div style={{...currencyDisplayStyle, justifyContent:'center', alignItems:'center', display:'flex', height: '110px', color:'#b91c1c', fontSize:'12px'}}>Error: {initialCurrencyError}</div>
               ) : (
                  <div style={currencyDisplayStyle}>
                     <Euro size={16} color={secondaryTextColor} style={{marginBottom: '8px'}}/>
                     <div style={currencyValueStyle}>{euroActualCLP ?? '-'}</div>
                     <div style={{fontSize: '12px', color: '#334155', marginBottom:'4px'}}>Euro Observado Actual (CLP)</div>
                     <div style={currencyDateStyle}>Valor del {fechaActualizacionDivisas ? new Date(fechaActualizacionDivisas.split(', ')[0].split('/').reverse().join('-')).toLocaleDateString('es-CL') : '-'}</div>
                  </div>
               )}
               {/* ----------------------------------------- */}
            </div>
             <p style={{fontSize: '11px', color: secondaryTextColor, textAlign: 'center', margin: '12px 0 0 0'}}>
                <Info size={12} style={{verticalAlign: 'middle', marginRight: '4px'}}/>
                Los valores se actualizan automáticamente todos los días a las 12:00 PM. También puedes actualizar manualmente.
             </p>
         </div>

         {/* Grid para los parámetros */}
         <div style={gridContainerStyle}>
           {/* Card: Tipos de Cambio */}
           <div style={gridCardStyle}>
             <h3 style={gridCardTitleStyle}>Tipos de Cambio</h3>
             <div style={inputGroupStyle}>
               <label style={labelStyle}>Tipo de Cambio EUR/USD</label>
               <input type="number" style={inputStyle} value={tipoCambio} onChange={handleInputChange(setTipoCambio)} step="0.01" />
               <p style={inputDescriptionStyle}>Definible</p>
             </div>
             <div style={inputGroupStyle}>
               <label style={labelStyle}>Dólar Observado Actual (CLP)</label>
               <input 
                 type="number" 
                 style={{...inputStyle, backgroundColor: '#e5e7eb'}} 
                 value={dolarActualCLP ?? ''}
                 readOnly 
               />
               <p style={inputDescriptionStyle}>Fijo desde API</p>
             </div>
             <div style={inputGroupStyle}>
               <label style={labelStyle}>Buffer USD/CLP (%)</label>
               <input type="number" style={inputStyle} value={bufferDolar} onChange={handleInputChange(setBufferDolar)} step="0.1" />
               <p style={inputDescriptionStyle}>Definible</p>
             </div>
           </div>

           {/* Card: Transporte y Seguro */}
           <div style={gridCardStyle}>
             <h3 style={gridCardTitleStyle}>Transporte y Seguro</h3>
             <div style={inputGroupStyle}>
               <label style={labelStyle}>Buffer Transporte (%)</label>
               <input type="number" style={inputStyle} value={bufferTransporteGlobal} onChange={handleInputChange(setBufferTransporteGlobal)} step="0.5" />
               <p style={inputDescriptionStyle}>Definible</p>
             </div>
             <div style={inputGroupStyle}>
               <label style={labelStyle}>Tasa Seguro (%)</label>
               <input type="number" style={inputStyle} value={tasaSeguroGlobal} onChange={handleInputChange(setTasaSeguroGlobal)} step="0.1" />
               <p style={inputDescriptionStyle}>Definible</p>
             </div>
           </div>

           {/* Card: Otros Parámetros */}
           <div style={gridCardStyle}>
             <h3 style={gridCardTitleStyle}>Otros Parámetros</h3>
             <div style={inputGroupStyle}>
               <label style={labelStyle}>Margen Adicional Total (%)</label>
               <input type="number" style={inputStyle} value={margenTotalGeneral} onChange={handleInputChange(setMargenTotalGeneral)} step="0.5" />
               <p style={inputDescriptionStyle}>Definible</p>
             </div>
             <div style={inputGroupStyle}>
               <label style={labelStyle}>Descuento Fabricante (%)</label>
               <input type="number" style={inputStyle} value={descuentoFabricanteGeneral} onChange={handleInputChange(setDescuentoFabricanteGeneral)} step="0.5" />
               <p style={inputDescriptionStyle}>Definible</p>
             </div>
              <div style={inputGroupStyle}>
               <label style={labelStyle}>Fecha Última Actualización</label>
               {/* Usar input tipo date o un date picker component */}
               <input type="date" style={inputStyle} value={fechaUltimaActualizacion} onChange={handleInputChange(setFechaUltimaActualizacion)} />
               {/*<Calendar size={16} style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', color:'#9ca3af'}}/>*/} 
             </div>
           </div>
         </div>
         
         {/* --- Sección Perfiles por Categoría (Comentada temporalmente) --- */}
         {/* 
         <div style={mainCardStyle}>
           <h2 style={{...sectionTitleStyle, borderBottom: 'none'}}>Perfiles de Costos por Categoría</h2>
            // ... contenido anterior de perfiles ... 
         </div>
         */}
      </div>

      {/* >>> MOVER LA ETIQUETA STYLE AQUÍ (dentro del div principal) <<< */}
      <style>{`
         @keyframes spin { to { transform: rotate(360deg); } }
         .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
} 