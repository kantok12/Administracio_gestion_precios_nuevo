import React, { useState, useEffect } from 'react';
// Importar iconos necesarios
import { SlidersHorizontal, DollarSign, Euro, RefreshCw, Info, Save, Calendar, Filter, Loader2, CheckCircle, XCircle } from 'lucide-react';

// --- Interfaz Placeholder para un Perfil de Costos (la mantenemos por si se usa en otras tabs) ---
interface PerfilCostoCategoria {
  categoria: string;
  bufferTransporte?: number;
  tasaSeguro?: number;
  margenAdicional?: number;
  descuentoFabricante?: number;
}

// Interfaz placeholder (asumiendo que el webhook devuelve algo así)
interface CostParamsWebhookResponse {
  _id?: string;
  categoryId?: string;
  costos?: {
    margen_adicional_total?: number;
    buffer_eur_usd?: number;
    buffer_usd_clp?: number; // Mapea a bufferDolar
    buffer_dolar?: number; // <<< AÑADIR PROPIEDAD OPCIONAL PARA FALLBACK
    tasa_seguro?: number;
    tasa_seguro_categoria?: number; // Mapea a tasaSeguroGlobal
    tipo_cambio_eur_usd?: number; // Mapea a tipoCambio
    dolar_observado_actual?: number;
    buffer_transporte?: number; // Mapea a bufferTransporteGlobal
    descuento_fabricante?: number; // Mapea a descuentoFabricanteGeneral
  };
  // Otros campos posibles
}

// --- Componente AdminPanel --- 
export default function AdminPanel() {
  
  // --- Estados del formulario con valores iniciales por defecto ---
  const [tipoCambio, setTipoCambio] = useState<string>('1.12'); 
  const [bufferDolar, setBufferDolar] = useState<string>('1.8'); 
  const [tasaSeguroGlobal, setTasaSeguroGlobal] = useState<string>('1'); 
  const [bufferTransporteGlobal, setBufferTransporteGlobal] = useState<string>('5'); 
  const [margenTotalGeneral, setMargenTotalGeneral] = useState<string>('20'); 
  const [descuentoFabricanteGeneral, setDescuentoFabricanteGeneral] = useState<string>('5'); 
  const [fechaUltimaActualizacion, setFechaUltimaActualizacion] = useState<string>('2025-04-14');

  // Estados para la sección de divisas actualizadas
  const [dolarActualCLP, setDolarActualCLP] = useState<string | null>(null);
  const [euroActualCLP, setEuroActualCLP] = useState<string | null>(null);
  const [fechaActualizacionDivisas, setFechaActualizacionDivisas] = useState<string | null>(null);

  // Estado para filtros (mantener lógica si es necesario)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>(['Todas las categorías', 'Chipeadoras Motor', 'Chipeadoras PTO']); // Ejemplo
  const [categoriaSeleccionadaParaAplicar, setCategoriaSeleccionadaParaAplicar] = useState<string>('Todas las categorías');

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

  // --- NUEVOS ESTADOS para aplicar parámetros a categoría ---
  const [isApplyingCategorySettings, setIsApplyingCategorySettings] = useState(false);
  const [applyCategorySettingsError, setApplyCategorySettingsError] = useState<string | null>(null);
  const [applyCategorySettingsSuccess, setApplyCategorySettingsSuccess] = useState<string | null>(null);
  // ---------------------------------------------------------

  // --- NUEVOS ESTADOS para Carga Inicial de Parámetros de Costo ---
  const [initialCostParamsLoading, setInitialCostParamsLoading] = useState(false); // Ya no cargamos al inicio
  const [initialCostParamsError, setInitialCostParamsError] = useState<string | null>(null);
  // ------------------------------------------------------------------

  // --- NUEVOS ESTADOS para Carga de Parámetros por Categoría ---
  const [isLoadingCategoryParams, setIsLoadingCategoryParams] = useState(false);
  const [loadCategoryParamsError, setLoadCategoryParamsError] = useState<string | null>(null);
  // -----------------------------------------------------------

  // --- NUEVOS ESTADOS PARA GUARDAR PARÁMETROS GLOBALES --- 
  const [isSavingGlobalParams, setIsSavingGlobalParams] = useState(false);
  const [saveGlobalParamsError, setSaveGlobalParamsError] = useState<string | null>(null);
  const [saveGlobalParamsSuccess, setSaveGlobalParamsSuccess] = useState<string | null>(null);
  // -------------------------------------------------------

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
      console.log("Webhook currency response:", data);

      if (data && data.Valor_Dolar !== undefined && data.Valor_Euro !== undefined) {
        const roundedDolar = Math.round(parseFloat(data.Valor_Dolar));
        const roundedEuro = Math.round(parseFloat(data.Valor_Euro));
        
        let dolarSuccessfullySet = false;
        let euroSuccessfullySet = false;

        if (!isNaN(roundedDolar)) {
           setDolarActualCLP(String(roundedDolar)); 
           dolarSuccessfullySet = true; 
        } else {
           console.warn('Valor_Dolar no es un número válido:', data.Valor_Dolar);
           setDolarActualCLP(null); 
        }
        if (!isNaN(roundedEuro)) {
            setEuroActualCLP(String(roundedEuro));
            euroSuccessfullySet = true;
        } else {
           console.warn('Valor_Euro no es un número válido:', data.Valor_Euro);
           setEuroActualCLP(null); 
        }
        
        const displayTime = updateTimestamp || new Date(); 
        setFechaActualizacionDivisas(displayTime.toLocaleString('es-CL'));

        // --- >>> LLAMAR AL BACKEND PARA ACTUALIZAR DÓLAR Y EURO EN MONGO <<< --- 
        if (dolarSuccessfullySet && euroSuccessfullySet) {
          console.log(`[Frontend] Currency values updated (D: ${roundedDolar}, E: ${roundedEuro}). Attempting to update in DB via backend...`);
          try {
            const updateResponse = await fetch('http://localhost:5001/api/pricing-overrides/update-currencies', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                dolar_observado_actual: roundedDolar, 
                euro_observado_actual: roundedEuro
              })
            });
            const updateResult = await updateResponse.json();
            if (!updateResponse.ok) {
              console.error('[Frontend] Error response from backend updating currencies:', updateResult);
            } else {
              console.log('[Frontend] Backend confirmed currency update:', updateResult);
            }
          } catch (backendError) {
            console.error('[Frontend] Network error calling backend to update currencies:', backendError);
          }
        } else {
            console.warn('[Frontend] Skipping backend currency update because one or both values were invalid.')
        }
        // --- >>> FIN DE LA LLAMADA AL BACKEND <<< ---

        console.log("Frontend currency states updated with rounded values.");
        return true; 
      } else {
        throw new Error('Respuesta del webhook de divisas incompleta.');
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

  // --- NUEVA FUNCIÓN PARA CARGAR PARÁMETROS AL CAMBIAR CATEGORÍA ---
  const fetchAndApplyCategoryParams = async (categoria: string) => {
    if (categoria !== 'Chipeadoras Motor' && categoria !== 'Chipeadoras PTO') {
      setLoadCategoryParamsError(null); // Limpiar errores si no es chipeadora
      // Opcional: Resetear a valores globales/default si se selecciona otra categoría
      // setTipoCambio('1.12'); setBufferDolar('1.8'); ... etc
      return; 
    }

    setIsLoadingCategoryParams(true);
    setLoadCategoryParamsError(null);
    console.log(`Fetching parameters for category type: ${categoria}`);
    
    try {
      // --- MODIFICAR URL PARA INCLUIR CATEGORÍA --- 
      const encodedCategory = encodeURIComponent(categoria);
      const response = await fetch(`http://localhost:5001/api/pricing-overrides/webhook?category=${encodedCategory}`); // Usa el endpoint del backend con query param
      // -------------------------------------------
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }
      const data: CostParamsWebhookResponse = await response.json();
      console.log(`Parameters received (for ${categoria}):`, data);

      // Actualizar estados del formulario con los datos recibidos
      if (data.costos) {
        // Mapeo cuidadoso basado en la respuesta esperada del webhook
        if (data.costos.margen_adicional_total !== undefined) setMargenTotalGeneral(String(data.costos.margen_adicional_total));
        if (data.costos.buffer_usd_clp !== undefined) setBufferDolar(String(data.costos.buffer_usd_clp));
        else if (data.costos.buffer_dolar !== undefined) setBufferDolar(String(data.costos.buffer_dolar)); // Fallback
        if (data.costos.tasa_seguro_categoria !== undefined) setTasaSeguroGlobal(String(data.costos.tasa_seguro_categoria));
        else if (data.costos.tasa_seguro !== undefined) setTasaSeguroGlobal(String(data.costos.tasa_seguro)); // Fallback
        if (data.costos.tipo_cambio_eur_usd !== undefined) setTipoCambio(String(data.costos.tipo_cambio_eur_usd));
        if (data.costos.buffer_transporte !== undefined) setBufferTransporteGlobal(String(data.costos.buffer_transporte));
        if (data.costos.descuento_fabricante !== undefined) setDescuentoFabricanteGeneral(String(data.costos.descuento_fabricante));
      }
       // Limpiar error si la carga fue exitosa
       setLoadCategoryParamsError(null);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al cargar parámetros.';
      console.error(`Error fetching parameters for ${categoria}:`, error);
      setLoadCategoryParamsError(errorMsg.includes('fetch') ? `Error de conexión cargando parámetros para ${categoria}.` : errorMsg);
    } finally {
      setIsLoadingCategoryParams(false);
    }
  };
  // ------------------------------------------------------------------

  // --- HANDLER PARA EL CAMBIO DEL DROPDOWN --- 
  const handleCategoriaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaCategoria = event.target.value;
    setCategoriaSeleccionadaParaAplicar(nuevaCategoria);
    // Llamar a la función para cargar datos si es una categoría Chipeadora
    fetchAndApplyCategoryParams(nuevaCategoria); 
  };
  // -------------------------------------------

  // --- Handlers (mantener lógica placeholder) ---
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     // Limpiar mensajes de éxito/error al cambiar cualquier input
     setSaveGlobalParamsSuccess(null);
     setSaveGlobalParamsError(null);
     setter(event.target.value);
  };

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

  // --- NUEVA FUNCIÓN para aplicar parámetros a una categoría --- 
  const aplicarParametrosACategoria = async (categoria: string) => {
    if (categoria === 'Todas las categorías') return; // No hacer nada para 'Todas'

    setIsApplyingCategorySettings(true);
    setApplyCategorySettingsError(null);
    setApplyCategorySettingsSuccess(null);
    console.log(`Aplicando parámetros a la categoría: ${categoria}`);

    // Endpoint placeholder - ¡¡DEBES CREAR ESTE ENDPOINT EN TU BACKEND!!
    const endpoint = `/api/category-settings/${encodeURIComponent(categoria)}`; 
    const settings = {
      bufferTransporte: bufferTransporteGlobal,
      tasaSeguro: tasaSeguroGlobal,
      margenAdicional: margenTotalGeneral,
      descuentoFabricante: descuentoFabricanteGeneral,
      // Añade aquí cualquier otro parámetro que deba guardarse por categoría
    };

    try {
      const response = await fetch(endpoint, {
        method: 'PUT', // o 'POST', según tu diseño de API
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        let errorMsg = `Error del servidor: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignorar error al parsear json */ }
        throw new Error(errorMsg);
      }

      // Éxito
      const successMsg = `Parámetros aplicados a '${categoria}' correctamente.`;
      console.log(successMsg);
      setApplyCategorySettingsSuccess(successMsg);
      // Limpiar mensaje de éxito después de unos segundos
      setTimeout(() => setApplyCategorySettingsSuccess(null), 5000);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al aplicar parámetros.';
      console.error("Error al aplicar parámetros a categoría:", error);
      setApplyCategorySettingsError(errorMsg.includes('fetch') ? `Error de conexión al intentar aplicar parámetros a '${categoria}'.` : errorMsg);
      // Limpiar mensaje de error después de unos segundos
      setTimeout(() => setApplyCategorySettingsError(null), 8000);
    } finally {
      setIsApplyingCategorySettings(false);
    }
  };
  // ----------------------------------------------------------

  // --- MODIFICAR handleSaveAll --- 
  const handleSaveAll = async () => {
    console.log('Attempting to save global parameters...');
    setIsSavingGlobalParams(true);
    setSaveGlobalParamsError(null);
    setSaveGlobalParamsSuccess(null);

    // 1. Recopilar y Mapear datos COMPLETOS del estado del formulario
    //    (Excepto buffer_eur_usd que no tiene estado asociado)
    const payload = {
      margen_adicional_total: parseFloat(margenTotalGeneral) / 100 || 0, 
      // buffer_eur_usd: ??? // No hay estado para este valor en el frontend
      buffer_usd_clp: parseFloat(bufferDolar) / 100 || 0,          
      tasa_seguro: parseFloat(tasaSeguroGlobal) / 100 || 0,         
      tipo_cambio_eur_usd: parseFloat(tipoCambio) || 0,
      dolar_observado_actual: parseFloat(dolarActualCLP ?? '0') || 0, // <<< INCLUIR ESTE VALOR
      buffer_transporte: parseFloat(bufferTransporteGlobal) / 100 || 0, 
      descuento_fabricante: parseFloat(descuentoFabricanteGeneral) / 100 || 0, 
      // fecha_actualizacion: fechaUltimaActualizacion // Omitir por ahora, no en schema backend
    };

    console.log('Payload to send to backend (Complete):', payload);

    try {
      const response = await fetch('http://localhost:5001/api/pricing-overrides/update-global', {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) // Enviar el payload completo
      });

      const result = await response.json(); // Intenta parsear siempre

      if (!response.ok) {
        // Error desde el backend/N8N
        const errorMsg = result.message || 'Error desconocido desde el servidor.';
        console.error('Error saving global params:', result);
        setSaveGlobalParamsError(errorMsg + (result.detalle_n8n ? ` (Detalle N8N: ${JSON.stringify(result.detalle_n8n)})` : ''));
      } else {
        // Éxito
        console.log('Global params saved successfully:', result);
        setSaveGlobalParamsSuccess(result.message || 'Parámetros guardados exitosamente.');
        // Opcional: Limpiar mensaje de éxito después de un tiempo
        setTimeout(() => setSaveGlobalParamsSuccess(null), 5000);
      }

    } catch (error) {
      // Error de red o fetch
      console.error('Network error saving global params:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido de red.';
      setSaveGlobalParamsError(`Error de conexión: ${errorMsg}`);
    } finally {
      setIsSavingGlobalParams(false);
    }
  };
  // ---------------------------

  // --- Estado para la pestaña activa (ejemplo) ---
  const [activeTab, setActiveTab] = useState('calculos');

  return (
    // Contenedor principal del panel con padding
    <div style={{ padding: '0 24px 24px 24px' }}> 
      
      {/* --- Cabecera con Título, Tabs y Botón Guardar --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>
          ADMINISTRACIÓN PARÁMETROS GLOBALES
        </h1>
        
        {/* --- ACTUALIZAR BOTÓN GUARDAR --- */}
        <button 
          style={{...primaryButtonStyle, cursor: isSavingGlobalParams ? 'not-allowed' : 'pointer'}}
          onClick={handleSaveAll}
          disabled={isSavingGlobalParams}
        >
          {isSavingGlobalParams ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSavingGlobalParams ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        {/* ------------------------------ */} 
      </div>

      {/* --- MENSAJES DE FEEDBACK PARA GUARDADO --- */} 
      {saveGlobalParamsSuccess && (
        <div style={{ marginBottom: '16px', padding: '10px 15px', backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> {saveGlobalParamsSuccess}
        </div>
      )}
      {saveGlobalParamsError && (
        <div style={{ marginBottom: '16px', padding: '10px 15px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} /> Error al guardar: {saveGlobalParamsError}
        </div>
      )}
      {/* ---------------------------------------- */} 

      {/* --- Contenido Principal (Ya no depende de activeTab) --- */}
      <div> 
         {/* Título y Dropdown Categoría */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
           <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={20} /> Parámetros de Cálculo y Costos
           </h2>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: secondaryTextColor }}>Aplicar Parámetros a:</label>
              <select 
                  style={{ ...selectStyle, minWidth: '180px' }} 
                  value={categoriaSeleccionadaParaAplicar} 
                  onChange={handleCategoriaChange}
                  disabled={isLoadingCategoryParams}
              >
                  {categoriasDisponibles.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))}
              </select>
              {isLoadingCategoryParams && <Loader2 size={16} className="animate-spin" color={primaryTextColor}/>}
              {loadCategoryParamsError && <XCircle size={16} color="#ef4444" />}
           </div>
         </div>

         {/* Mensajes Éxito/Error Guardar */}
         {initialCostParamsError && (
           <div style={{ marginBottom: '16px', padding: '10px 15px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <XCircle size={18} /> Error cargando parámetros iniciales: {initialCostParamsError}
           </div>
         )}

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
         {initialCostParamsLoading ? (
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', padding: '50px', color: '#64748b'}}>
                <Loader2 className="animate-spin" size={24} style={{marginRight: '10px'}} /> Cargando parámetros...
            </div>
         ) : (
            <div style={gridContainerStyle}>
             {/* Cards con los inputs (Tipo Cambio, Transporte, Otros) */}
             {/* Los inputs usarán los estados (tipoCambio, bufferDolar, etc.) que ahora se actualizan desde el webhook */}
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
                    value={dolarActualCLP ?? ''} // Este viene de las divisas
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
                  <input type="date" style={inputStyle} value={fechaUltimaActualizacion} onChange={handleInputChange(setFechaUltimaActualizacion)} />
                </div>
              </div>
           </div>
         )}
      </div>

      {/* >>> MOVER LA ETIQUETA STYLE AQUÍ (dentro del div principal) <<< */}
      <style>{`
         @keyframes spin { to { transform: rotate(360deg); } }
         .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
} 