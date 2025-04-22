import React, { useState, useEffect } from 'react';
// Importar iconos necesarios
import { SlidersHorizontal, DollarSign, Euro, RefreshCw, Info, Save, Calendar, Filter, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { CostParams, CurrencyWebhookResponse, CostParamsWebhookResponse } from '../types/costParams';
import DashboardPanel from './DashboardPanel';

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
  // Función de mapeo de categorías (mover al principio del componente)
  const getCategoryId = (categoria: string) => {
    switch (categoria) {
      case 'Chipeadoras':
        return 'categoria_chipeadora';
      case 'Chipeadoras Motor':
        return 'chipeadora_motor';
      case 'Chipeadoras PTO':
        return 'chipeadora_pto';
      case 'Global':
        return 'global';
      default:
        return categoria.toLowerCase().replace(/ /g, '_');
    }
  };
  
  // --- Estados para parámetros básicos (que ya teníamos) ---
  const [tipoCambio, setTipoCambio] = useState<string>('1.12'); 
  const [bufferDolar, setBufferDolar] = useState<string>('1.8'); 
  const [tasaSeguroGlobal, setTasaSeguroGlobal] = useState<string>('1'); 
  const [bufferTransporteGlobal, setBufferTransporteGlobal] = useState<string>('5'); 
  const [margenTotalGeneral, setMargenTotalGeneral] = useState<string>('20'); 
  const [descuentoFabricanteGeneral, setDescuentoFabricanteGeneral] = useState<string>('5'); 
  const [fechaUltimaActualizacion, setFechaUltimaActualizacion] = useState<string>('2025-04-14');

  // --- NUEVOS Estados para parámetros adicionales ---
  const [costoFabricaOriginalEUR, setCostoFabricaOriginalEUR] = useState<string>('100000');
  const [transporteLocalEUR, setTransporteLocalEUR] = useState<string>('800');
  const [gastoImportacionEUR, setGastoImportacionEUR] = useState<string>('400');
  const [fleteMaritimosUSD, setFleteMaritimosUSD] = useState<string>('3500');
  const [recargosDestinoUSD, setRecargosDestinoUSD] = useState<string>('500');
  const [honorariosAgenteAduanaUSD, setHonorariosAgenteAduanaUSD] = useState<string>('600');
  const [gastosPortuariosOtrosUSD, setGastosPortuariosOtrosUSD] = useState<string>('200');
  const [transporteNacionalCLP, setTransporteNacionalCLP] = useState<string>('950000');
  const [factorActualizacionAnual, setFactorActualizacionAnual] = useState<string>('5');
  const [derechoAdValorem, setDerechoAdValorem] = useState<string>('6');
  const [iva, setIva] = useState<string>('19');
  const [bufferEurUsd, setBufferEurUsd] = useState<string>('2');
  // -------------------------------------------------

  // Estados para la sección de divisas actualizadas
  const [dolarActualCLP, setDolarActualCLP] = useState<string | null>(null);
  const [euroActualCLP, setEuroActualCLP] = useState<string | null>(null);
  const [fechaActualizacionDivisas, setFechaActualizacionDivisas] = useState<string | null>(null);

  // Estado para filtros (mantener lógica si es necesario)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([
    'Global',
    'Chipeadoras',
    'Chipeadoras Motor',
    'Chipeadoras PTO'
  ]);
  const [categoriaSeleccionadaParaAplicar, setCategoriaSeleccionadaParaAplicar] = useState<string>('Global');

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

  // --- ESTADOS PARA CARGA INICIAL PARÁMETROS (AHORA DESDE DB) ---
  const [initialCostParamsLoading, setInitialCostParamsLoading] = useState(true); // Empezar cargando
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
    console.log("[Frontend] Fetching currencies from webhook...");
    try {
      const data: CurrencyWebhookResponse = await api.fetchCurrencies();
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

        // Actualizar divisas en el backend
        if (dolarSuccessfullySet && euroSuccessfullySet) {
          console.log(`[Frontend] Currency values updated (D: ${roundedDolar}, E: ${roundedEuro}). Attempting to update in DB...`);
          try {
            const updateResult = await api.updateCurrenciesInDB({ 
              dolar_observado_actual: roundedDolar, 
              euro_observado_actual: roundedEuro 
            });
            console.log('[Frontend] Backend confirmed currency update:', updateResult);
          } catch (backendError) {
            console.error('[Frontend] Error updating currencies in backend:', backendError);
          }
        }

        console.log("Frontend currency states updated with rounded values.");
        return true; 
      } else {
        throw new Error('Respuesta del webhook de divisas incompleta.');
      }
    } catch (error) {
      console.error('Error fetching/setting currencies:', error);
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

  // --- FUNCIÓN PARA CARGAR PARÁMETROS GLOBALES ---
  const fetchInitialGlobalParams = async () => {
    setInitialCostParamsLoading(true);
    setInitialCostParamsError(null);
    console.log('[Frontend] Fetching initial global cost parameters from DB...');
    try {
      const data = await api.fetchGlobalParams();
      
      if (!data) {
        console.log('[Frontend] Global override document not found in DB. Using default form values.');
        return;
      }
      
      console.log('[Frontend] Initial global parameters received from DB:', data);

      if (data && data.costos) {
        const costos = data.costos;
        
        // --- Parámetros básicos ---
        if (costos.tipo_cambio_eur_usd !== undefined) setTipoCambio(String(costos.tipo_cambio_eur_usd));
        if (costos.buffer_usd_clp !== undefined) setBufferDolar(String(costos.buffer_usd_clp * 100));
        if (costos.tasa_seguro !== undefined) setTasaSeguroGlobal(String(costos.tasa_seguro * 100));
        if (costos.buffer_transporte !== undefined) setBufferTransporteGlobal(String(costos.buffer_transporte * 100));
        if (costos.margen_adicional_total !== undefined) setMargenTotalGeneral(String(costos.margen_adicional_total * 100));
        if (costos.descuento_fabricante !== undefined) setDescuentoFabricanteGeneral(String(costos.descuento_fabricante * 100));
        if (costos.buffer_eur_usd !== undefined) setBufferEurUsd(String(costos.buffer_eur_usd * 100));
        
        // --- Parámetros adicionales ---
        if (costos.costo_fabrica_original_eur !== undefined) setCostoFabricaOriginalEUR(String(costos.costo_fabrica_original_eur));
        if (costos.transporte_local_eur !== undefined) setTransporteLocalEUR(String(costos.transporte_local_eur));
        if (costos.gasto_importacion_eur !== undefined) setGastoImportacionEUR(String(costos.gasto_importacion_eur));
        if (costos.flete_maritimo_usd !== undefined) setFleteMaritimosUSD(String(costos.flete_maritimo_usd));
        if (costos.recargos_destino_usd !== undefined) setRecargosDestinoUSD(String(costos.recargos_destino_usd));
        if (costos.honorarios_agente_aduana_usd !== undefined) setHonorariosAgenteAduanaUSD(String(costos.honorarios_agente_aduana_usd));
        if (costos.gastos_portuarios_otros_usd !== undefined) setGastosPortuariosOtrosUSD(String(costos.gastos_portuarios_otros_usd));
        if (costos.transporte_nacional_clp !== undefined) setTransporteNacionalCLP(String(costos.transporte_nacional_clp));
        if (costos.factor_actualizacion_anual !== undefined) setFactorActualizacionAnual(String(costos.factor_actualizacion_anual * 100));
        if (costos.derecho_ad_valorem !== undefined) setDerechoAdValorem(String(costos.derecho_ad_valorem * 100));
        if (costos.iva !== undefined) setIva(String(costos.iva * 100));
        
        if (costos.fecha_ultima_actualizacion_transporte_local) 
          setFechaUltimaActualizacion(costos.fecha_ultima_actualizacion_transporte_local);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al cargar parámetros iniciales.';
      console.error('[Frontend] Error fetching initial global parameters:', error);
      setInitialCostParamsError(errorMsg.includes('fetch') ? 'Error de conexión cargando parámetros iniciales.' : errorMsg);
    } finally {
      setInitialCostParamsLoading(false);
    }
  };

  // --- EFECTO PARA CARGAR PARÁMETROS GLOBALES AL MONTAR ---
  useEffect(() => {
    console.log('[Frontend] Component mounted, fetching initial global parameters...');
    fetchInitialGlobalParams();
  }, []); // Array vacío para ejecutar solo al montar

  // --- NUEVA FUNCIÓN PARA CARGAR PARÁMETROS AL CAMBIAR CATEGORÍA ---
  const fetchAndApplyCategoryParams = async (categoria: string) => {
    if (categoria === 'Global') {
      fetchInitialGlobalParams();
      return;
    }

    setIsLoadingCategoryParams(true);
    setLoadCategoryParamsError(null);
    console.log(`[Frontend] Fetching parameters for category: ${categoria}`);
    
    try {
      const categoryId = getCategoryId(categoria);
      console.log(`[Frontend] Fetching parameters for category ID: ${categoryId}`);
      
      const data = await api.fetchCategoryParams(categoryId);
      
      if (!data) {
        console.log('[Frontend] Category override document not found in DB. Using global values.');
        fetchInitialGlobalParams();
        return;
      }
      
      console.log(`[Frontend] Parameters received for category ${categoria}:`, data);

      if (data.costos) {
        const costos = data.costos;
        
        // Aplicar los valores recibidos a los estados
        if (costos.tipo_cambio_eur_usd !== undefined) setTipoCambio(String(costos.tipo_cambio_eur_usd));
        if (costos.buffer_usd_clp !== undefined) setBufferDolar(String(costos.buffer_usd_clp * 100));
        if (costos.buffer_eur_usd !== undefined) setBufferEurUsd(String(costos.buffer_eur_usd * 100));
        if (costos.tasa_seguro !== undefined) setTasaSeguroGlobal(String(costos.tasa_seguro * 100));
        if (costos.margen_adicional_total !== undefined) setMargenTotalGeneral(String(costos.margen_adicional_total * 100));
        if (costos.buffer_transporte !== undefined) setBufferTransporteGlobal(String(costos.buffer_transporte * 100));
        if (costos.descuento_fabricante !== undefined) setDescuentoFabricanteGeneral(String(costos.descuento_fabricante * 100));
        
        if (costos.costo_fabrica_original_eur !== undefined) setCostoFabricaOriginalEUR(String(costos.costo_fabrica_original_eur));
        if (costos.transporte_local_eur !== undefined) setTransporteLocalEUR(String(costos.transporte_local_eur));
        if (costos.gasto_importacion_eur !== undefined) setGastoImportacionEUR(String(costos.gasto_importacion_eur));
        if (costos.flete_maritimo_usd !== undefined) setFleteMaritimosUSD(String(costos.flete_maritimo_usd));
        if (costos.recargos_destino_usd !== undefined) setRecargosDestinoUSD(String(costos.recargos_destino_usd));
        if (costos.honorarios_agente_aduana_usd !== undefined) setHonorariosAgenteAduanaUSD(String(costos.honorarios_agente_aduana_usd));
        if (costos.gastos_portuarios_otros_usd !== undefined) setGastosPortuariosOtrosUSD(String(costos.gastos_portuarios_otros_usd));
        if (costos.transporte_nacional_clp !== undefined) setTransporteNacionalCLP(String(costos.transporte_nacional_clp));
        if (costos.factor_actualizacion_anual !== undefined) setFactorActualizacionAnual(String(costos.factor_actualizacion_anual * 100));
        if (costos.derecho_ad_valorem !== undefined) setDerechoAdValorem(String(costos.derecho_ad_valorem * 100));
        if (costos.iva !== undefined) setIva(String(costos.iva * 100));
        
        if (costos.fecha_ultima_actualizacion_transporte_local) 
          setFechaUltimaActualizacion(costos.fecha_ultima_actualizacion_transporte_local);
      }
    } catch (error) {
      console.error('[Frontend] Error fetching category parameters:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al cargar parámetros de categoría';
      setLoadCategoryParamsError(errorMsg);
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
    if (categoria === 'Global') return; // No hacer nada para 'Global'

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
    console.log('[Frontend] Starting save operation...');
    setIsSavingGlobalParams(true);
    setSaveGlobalParamsError(null);
    setSaveGlobalParamsSuccess(null);

    try {
      const categoryId = getCategoryId(categoriaSeleccionadaParaAplicar);
      console.log(`[Frontend] Saving parameters for category: ${categoriaSeleccionadaParaAplicar} (ID: ${categoryId})`);

      const params = {
        costos: {
          tipo_cambio_eur_usd: parseFloat(tipoCambio),
          buffer_usd_clp: parseFloat(bufferDolar) / 100,
          buffer_eur_usd: parseFloat(bufferEurUsd) / 100,
          tasa_seguro: parseFloat(tasaSeguroGlobal) / 100,
          margen_adicional_total: parseFloat(margenTotalGeneral) / 100,
          buffer_transporte: parseFloat(bufferTransporteGlobal) / 100,
          descuento_fabricante: parseFloat(descuentoFabricanteGeneral) / 100,
          costo_fabrica_original_eur: parseFloat(costoFabricaOriginalEUR),
          transporte_local_eur: parseFloat(transporteLocalEUR),
          gasto_importacion_eur: parseFloat(gastoImportacionEUR),
          flete_maritimo_usd: parseFloat(fleteMaritimosUSD),
          recargos_destino_usd: parseFloat(recargosDestinoUSD),
          honorarios_agente_aduana_usd: parseFloat(honorariosAgenteAduanaUSD),
          gastos_portuarios_otros_usd: parseFloat(gastosPortuariosOtrosUSD),
          transporte_nacional_clp: parseFloat(transporteNacionalCLP),
          factor_actualizacion_anual: parseFloat(factorActualizacionAnual) / 100,
          derecho_ad_valorem: parseFloat(derechoAdValorem) / 100,
          iva: parseFloat(iva) / 100,
          fecha_ultima_actualizacion_transporte_local: fechaUltimaActualizacion,
          dolar_observado_actual: dolarActualCLP ? parseFloat(dolarActualCLP) : undefined
        }
      };

      let result;
      if (categoriaSeleccionadaParaAplicar === 'Global') {
        result = await api.updateGlobalParams(params);
      } else {
        result = await api.updateCategoryParams(categoryId, params);
      }

      console.log(`[Frontend] Parameters saved successfully for ${categoriaSeleccionadaParaAplicar}:`, result);
      setSaveGlobalParamsSuccess(`Parámetros guardados exitosamente para ${categoriaSeleccionadaParaAplicar}`);
      
      // Limpiar el mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSaveGlobalParamsSuccess(null);
      }, 5000);

    } catch (error) {
      console.error('[Frontend] Error saving parameters:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al guardar parámetros';
      setSaveGlobalParamsError(errorMsg);
      
      // Limpiar el mensaje de error después de 5 segundos
      setTimeout(() => {
        setSaveGlobalParamsError(null);
      }, 5000);
    } finally {
      setIsSavingGlobalParams(false);
    }
  };
  // ---------------------------

  // --- Estado para la pestaña activa (ejemplo) ---
  const [activeTab, setActiveTab] = useState('calculos');

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b' }}>Panel de Administración de Costos</h1>
      </div>

      {/* Sección Valores Actuales de Divisas (Arriba) */}
      <div style={{ marginBottom: '24px' }}> {/* Contenedor para la sección de divisas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Valores Actuales de Divisas</h2>
             <button 
               onClick={handleActualizarDivisas}
               style={isUpdatingCurrencies ? { ...secondaryButtonStyle, cursor: 'not-allowed' } : secondaryButtonStyle}
               disabled={isUpdatingCurrencies}
             >
               {isUpdatingCurrencies ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
               Actualizar Divisas
             </button>
          </div>

          {/* Grid para las 2 tarjetas de divisas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
             {/* Tarjeta Dólar */}
             <div style={currencyDisplayStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                   <DollarSign size={20} style={{ color: primaryTextColor }} />
                   <div style={currencyValueStyle}>{initialCurrencyLoading ? '...' : dolarActualCLP ?? '-'}</div>
                </div>
                <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>Dólar Observado Actual (CLP)</div>
             </div>

             {/* Tarjeta Euro */}
             <div style={currencyDisplayStyle}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Euro size={20} style={{ color: primaryTextColor }} />
                    <div style={currencyValueStyle}>{initialCurrencyLoading ? '...' : euroActualCLP ?? '-'}</div>
                 </div>
                <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>Euro Observado Actual (CLP)</div>
             </div>
          </div>

           {currencyUpdateError && (
             <div style={{ fontSize: '12px', color: 'red', textAlign: 'center', marginTop: '12px' }}>Error al actualizar: {currencyUpdateError}</div>
           )}

           <div style={{ fontSize: '11px', color: secondaryTextColor, textAlign: 'center', marginTop: '12px' }}>
            {initialCurrencyLoading ? (
              <span>&nbsp;</span> // Espacio mientras carga para mantener altura
            ) : fechaActualizacionDivisas ? (
              <>
                <Info size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Última actualización: {fechaActualizacionDivisas}
              </>
            ) : initialCurrencyError ? (
              <span style={{color: 'red'}}>Error al obtener última actualización.</span>
            ) : (
              <span>&nbsp;</span> // Espacio si no hay fecha ni error
            )}
           </div>
      </div>
      {/* --- Fin Sección Divisas --- */}


      {/* Sección Parámetros (Debajo) */}
      <div>
          {/* Mensaje de Carga/Error de Parámetros Iniciales */}
          {initialCostParamsLoading && (
             <div style={{ padding: '20px', textAlign: 'center', color: secondaryTextColor }}>Cargando parámetros globales...</div>
           )} 
           {initialCostParamsError && (
             <div style={{ padding: '20px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', textAlign: 'center' }}>Error al cargar parámetros: {initialCostParamsError}</div>
           )}

          {/* Contenedor Grid para el resto de las tarjetas */}
          {!initialCostParamsLoading && !initialCostParamsError && (
             <div style={gridContainerStyle}>
                {/* Tarjeta Tipo de Cambio y Buffers */}
                <div style={gridCardStyle}>
                  <h3 style={gridCardTitleStyle}>Tipo de Cambio y Buffers</h3>
                   <div style={inputGroupStyle}>
                      <label htmlFor="tipoCambio" style={labelStyle}>Tipo de Cambio EUR/USD:</label>
                      <input id="tipoCambio" type="number" style={inputStyle} value={tipoCambio} onChange={handleInputChange(setTipoCambio)} placeholder="Ej: 1.1" />
                      <p style={inputDescriptionStyle}>Tipo de cambio actual entre Euro y Dólar</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="bufferEurUsd" style={labelStyle}>Buffer EUR/USD (%):</label>
                      <input id="bufferEurUsd" type="number" style={inputStyle} value={bufferEurUsd} onChange={handleInputChange(setBufferEurUsd)} placeholder="Ej: 2"/>
                      <p style={inputDescriptionStyle}>Margen adicional para tipo cambio EUR/USD</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="bufferDolar" style={labelStyle}>Buffer USD/CLP (%):</label>
                      <input id="bufferDolar" type="number" style={inputStyle} value={bufferDolar} onChange={handleInputChange(setBufferDolar)} placeholder="Ej: 1.8" />
                      <p style={inputDescriptionStyle}>Margen adicional para Dólar Observado</p>
                   </div>
                </div>

                {/* Tarjeta Parámetros de Margen y Seguro */}
                <div style={gridCardStyle}>
                  <h3 style={gridCardTitleStyle}>Parámetros de Margen y Seguro</h3>
                   <div style={inputGroupStyle}>
                      <label htmlFor="margenTotalGeneral" style={labelStyle}>Margen Total General (%):</label>
                      <input id="margenTotalGeneral" type="number" style={inputStyle} value={margenTotalGeneral} onChange={handleInputChange(setMargenTotalGeneral)} placeholder="Ej: 35"/>
                      <p style={inputDescriptionStyle}>Porcentaje de margen adicional</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="tasaSeguroGlobal" style={labelStyle}>Tasa de Seguro Global (%):</label>
                      <input id="tasaSeguroGlobal" type="number" style={inputStyle} value={tasaSeguroGlobal} onChange={handleInputChange(setTasaSeguroGlobal)} placeholder="Ej: 0.6" />
                      <p style={inputDescriptionStyle}>Porcentaje aplicado para calcular seguro</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="descuentoFabricanteGeneral" style={labelStyle}>Descuento Fabricante (%):</label>
                      <input id="descuentoFabricanteGeneral" type="number" style={inputStyle} value={descuentoFabricanteGeneral} onChange={handleInputChange(setDescuentoFabricanteGeneral)} placeholder="Ej: 10"/>
                      <p style={inputDescriptionStyle}>Descuento base sobre costo fábrica</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="factorActualizacionAnual" style={labelStyle}>Factor Actualización Anual (%):</label>
                      <input id="factorActualizacionAnual" type="number" style={inputStyle} value={factorActualizacionAnual} onChange={handleInputChange(setFactorActualizacionAnual)} placeholder="Ej: 5" />
                      <p style={inputDescriptionStyle}>Incremento anual sobre costo fábrica</p>
                   </div>
                </div>

                {/* Tarjeta Parámetros de Transporte */}
                <div style={gridCardStyle}>
                  <h3 style={gridCardTitleStyle}>Parámetros de Transporte</h3>
                   <div style={inputGroupStyle}>
                      <label htmlFor="bufferTransporteGlobal" style={labelStyle}>Buffer Transporte (%):</label>
                      <input id="bufferTransporteGlobal" type="number" style={inputStyle} value={bufferTransporteGlobal} onChange={handleInputChange(setBufferTransporteGlobal)} placeholder="Ej: 0"/>
                      <p style={inputDescriptionStyle}>Margen adicional para costos de transporte</p>
                   </div>
                    <div style={inputGroupStyle}>
                      <label htmlFor="transporteLocalEUR" style={labelStyle}>Transporte Local (EUR):</label>
                      <input id="transporteLocalEUR" type="number" style={inputStyle} value={transporteLocalEUR} onChange={handleInputChange(setTransporteLocalEUR)} placeholder="Ej: 800"/>
                      <p style={inputDescriptionStyle}>Costo de transporte local en origen</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="transporteNacionalCLP" style={labelStyle}>Transporte Nacional (CLP):</label>
                      <input id="transporteNacionalCLP" type="number" style={inputStyle} value={transporteNacionalCLP} onChange={handleInputChange(setTransporteNacionalCLP)} placeholder="Ej: 950000"/>
                      <p style={inputDescriptionStyle}>Costo de transporte nacional en destino</p>
                   </div>
                  <div style={inputGroupStyle}>
                    <label htmlFor="fechaUltimaActualizacion" style={labelStyle}>Fecha Última Actualización Tarifas:</label>
                    <input id="fechaUltimaActualizacion" type="date" style={inputStyle} value={fechaUltimaActualizacion} onChange={handleInputChange(setFechaUltimaActualizacion)}/>
                    <p style={inputDescriptionStyle}>Fecha de última actualización de tarifas</p>
                  </div>
                </div>

                {/* Tarjeta Costos Adicionales (EUR) */}
                <div style={gridCardStyle}>
                  <h3 style={gridCardTitleStyle}>Costos Adicionales (EUR)</h3>
                   <div style={inputGroupStyle}>
                      <label htmlFor="costoFabricaOriginalEUR" style={labelStyle}>Costo Fábrica Original (EUR):</label>
                      <input id="costoFabricaOriginalEUR" type="number" style={inputStyle} value={costoFabricaOriginalEUR} onChange={handleInputChange(setCostoFabricaOriginalEUR)} placeholder="Ej: 100000" />
                      <p style={inputDescriptionStyle}>Costo base de fábrica en Euros</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="gastoImportacionEUR" style={labelStyle}>Gasto Importación (EUR):</label>
                      <input id="gastoImportacionEUR" type="number" style={inputStyle} value={gastoImportacionEUR} onChange={handleInputChange(setGastoImportacionEUR)} placeholder="Ej: 400" />
                      <p style={inputDescriptionStyle}>Gastos de importación en Euros (Origen)</p>
                   </div>
                </div>

                {/* Tarjeta Costos Adicionales (USD) */}
                 <div style={gridCardStyle}>
                  <h3 style={gridCardTitleStyle}>Costos Adicionales (USD)</h3>
                   <div style={inputGroupStyle}>
                      <label htmlFor="fleteMaritimosUSD" style={labelStyle}>Flete Marítimo (USD):</label>
                      <input id="fleteMaritimosUSD" type="number" style={inputStyle} value={fleteMaritimosUSD} onChange={handleInputChange(setFleteMaritimosUSD)} placeholder="Ej: 2500"/>
                      <p style={inputDescriptionStyle}>Costo de flete marítimo en USD</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="recargosDestinoUSD" style={labelStyle}>Recargos Destino (USD):</label>
                      <input id="recargosDestinoUSD" type="number" style={inputStyle} value={recargosDestinoUSD} onChange={handleInputChange(setRecargosDestinoUSD)} placeholder="Ej: 500" />
                      <p style={inputDescriptionStyle}>Recargos en destino en USD</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="honorariosAgenteAduanaUSD" style={labelStyle}>Honorarios Agente Aduana (USD):</label>
                      <input id="honorariosAgenteAduanaUSD" type="number" style={inputStyle} value={honorariosAgenteAduanaUSD} onChange={handleInputChange(setHonorariosAgenteAduanaUSD)} placeholder="Ej: 600"/>
                      <p style={inputDescriptionStyle}>Honorarios del agente de aduana</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="gastosPortuariosOtrosUSD" style={labelStyle}>Gastos Portuarios/Otros (USD):</label>
                      <input id="gastosPortuariosOtrosUSD" type="number" style={inputStyle} value={gastosPortuariosOtrosUSD} onChange={handleInputChange(setGastosPortuariosOtrosUSD)} placeholder="Ej: 200" />
                      <p style={inputDescriptionStyle}>Otros gastos portuarios en USD</p>
                   </div>
                </div>
                
                 {/* Tarjeta Impuestos */}
                <div style={gridCardStyle}>
                  <h3 style={gridCardTitleStyle}>Impuestos</h3>
                   <div style={inputGroupStyle}>
                      <label htmlFor="derechoAdValorem" style={labelStyle}>Derecho Ad Valorem (%):</label>
                      <input id="derechoAdValorem" type="number" style={inputStyle} value={derechoAdValorem} onChange={handleInputChange(setDerechoAdValorem)} placeholder="Ej: 6"/>
                      <p style={inputDescriptionStyle}>Impuesto aduanero (0 si aplica TLC)</p>
                   </div>
                   <div style={inputGroupStyle}>
                      <label htmlFor="iva" style={labelStyle}>IVA (%):</label>
                      <input id="iva" type="number" style={inputStyle} value={iva} onChange={handleInputChange(setIva)} placeholder="Ej: 19"/>
                      <p style={inputDescriptionStyle}>Impuesto al Valor Agregado</p>
                   </div>
                </div>
             </div>
          )}
      </div>
      {/* --- Fin Sección Parámetros --- */}

      {/* Sección Guardar Cambios Globales */}
      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${borderColor}`, textAlign: 'right' }}>
        {saveGlobalParamsSuccess && (
             <div style={{ marginBottom: '16px', color: '#16a34a', textAlign: 'left' }}>
                 <CheckCircle size={14} style={{ marginRight: '4px' }} /> {saveGlobalParamsSuccess}
             </div>
         )}
         {saveGlobalParamsError && (
             <div style={{ marginBottom: '16px', color: '#dc2626', textAlign: 'left' }}>
                 <XCircle size={14} style={{ marginRight: '4px' }} /> Error: {saveGlobalParamsError}
             </div>
         )}
          <button 
              onClick={handleSaveAll} 
              style={isSavingGlobalParams ? {...primaryButtonStyle, opacity: 0.6, cursor: 'not-allowed'} : primaryButtonStyle}
              disabled={isSavingGlobalParams}
          >
            {isSavingGlobalParams ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
             Guardar Cambios Globales
          </button>
      </div>

    </div> // Fin del div principal del return
  );
} 