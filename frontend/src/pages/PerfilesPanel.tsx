import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Loader2, AlertTriangle, Eye, Edit, Trash2, PlusCircle, XCircle, RefreshCw, DollarSign, Euro, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CostoPerfilData } from '../types';
import {
    Modal, 
    Box, 
    Button, 
    TextField, 
    Typography, 
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    Paper,
    Tooltip,
    Alert,
    Divider,
    Stack,
    FormControl,
    InputLabel,
    OutlinedInput,
    InputAdornment,
    Select,
    MenuItem,
    SelectChangeEvent
} from '@mui/material';
import PerfilEditForm from './PerfilEditForm';
import axios, { AxiosError } from 'axios';

// Helper para formatear moneda CLP (con signo $)
const formatCLP = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '--';
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numberValue)) return '--';
  // Mantener el signo $ 
  return `$ ${Math.round(numberValue).toLocaleString('es-CL')}`;
};

// Helper para formatear tipo de cambio
const formatExchangeRate = (value: number | null | undefined): string => {
   if (value === null || value === undefined || !isFinite(value)) return '--';
   return value.toFixed(2); // 2 decimales
};

// Helper para formatear otras monedas (usado en resultados)
const formatGenericCurrency = (value: number | null | undefined, currency: 'USD' | 'EUR', digits = 2): string => {
  if (value === null || value === undefined || isNaN(value)) return '--';
  const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
  };
  // Usar 'en-US' o similar para formato estándar, ajustar si se prefiere 'es-CL' con símbolo
  return value.toLocaleString('en-US', options);
};

// Helper para formatear porcentajes (usado en resultados)
const formatPercentDisplay = (value: number | null | undefined, digits = 1): string => {
   if (value === null || value === undefined || isNaN(value)) return '--';
   return `${(value * 100).toFixed(digits)}%`;
};

// --- Tipos para Calculadora ---
interface PruebaInputs {
    ano_cotizacion: number | string;
    ano_en_curso: number | string;
    costo_fabrica_original_eur: number | string;
    descuento_pct: number | string; // Input as % (e.g., 10)
    buffer_eur_usd_pct: number | string; // Input as % (e.g., 5)
    costos_origen_eur: number | string;
    flete_maritimo_usd: number | string;
    recargos_destino_usd: number | string;
    tasa_seguro_pct: number | string; // Input as % (e.g., 1)
    honorarios_agente_aduana_usd: number | string;
    gastos_portuarios_otros_usd: number | string;
    transporte_nacional_clp: number | string;
    buffer_usd_clp_pct: number | string; // Input as % (e.g., 3)
    margen_adicional_pct: number | string; // Input as % (e.g., 20)
    derecho_advalorem_pct: number | string;
    iva_pct: number | string;
    descuento_cliente_pct: number | string; // Añadido
}

// Interfaz para agrupar resultados (refleja la respuesta del backend)
interface GroupedPruebaResults {
    costo_producto: {
        factor_actualizacion?: number;
        costo_fabrica_actualizado_eur_exw?: number;
        costo_fabrica_actualizado_eur?: number;
        tipo_cambio_eur_usd_aplicado?: number;
        costo_final_fabrica_usd_exw?: number;
    };
    logistica_seguro: {
        costos_origen_usd?: number;
        costo_total_flete_manejos_usd?: number;
        base_para_seguro_usd?: number;
        prima_seguro_usd?: number;
        total_transporte_seguro_exw_usd?: number;
    };
    importacion: {
        valor_cif_usd?: number;
        derecho_advalorem_usd?: number;
        base_iva_usd?: number;
        iva_usd?: number; // IVA Importación
        total_costos_importacion_duty_fees_usd?: number;
    };
    landed_cost: {
        transporte_nacional_usd?: number;
        precio_neto_compra_base_usd_landed?: number;
    };
    conversion_margen: {
        tipo_cambio_usd_clp_aplicado?: number;
        precio_neto_compra_base_clp?: number;
        margen_clp?: number;
        precio_venta_neto_clp?: number;
    };
    precios_cliente: {
        precio_neto_venta_final_clp?: number;
        iva_venta_clp?: number; // IVA Venta
        precio_venta_total_cliente_clp?: number;
    };
}

interface PruebaApiValues {
    tipo_cambio_usd_clp_actual?: number;
    tipo_cambio_eur_usd_actual?: number;
}

export default function PerfilesPanel() {
  // Estados usando el nuevo tipo
  const [perfiles, setPerfiles] = useState<CostoPerfilData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<CostoPerfilData | null>(null); 
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false); 
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null); 
  const navigate = useNavigate(); 

  // Estados relacionados con la carga/eliminación de perfiles específicos
  const [loadingViewProfile, setLoadingViewProfile] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // --- Estados para el modal de creación ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // --- Estados para Divisas ---
  const [dolarValue, setDolarValue] = useState<{ value: number | null, fecha: string | null, last_update: string | null } | null>(null);
  const [euroValue, setEuroValue] = useState<{ value: number | null, fecha: string | null, last_update: string | null } | null>(null);
  const [loadingCurrencies, setLoadingCurrencies] = useState<boolean>(true);
  const [errorCurrencies, setErrorCurrencies] = useState<string | null>(null);

  // --- Estado para el modal de prueba ---
  const [isPruebaModalOpen, setIsPruebaModalOpen] = useState<boolean>(false);

  // --- Estados para Calculadora de Prueba ---
  const defaultPruebaInputs: PruebaInputs = {
      ano_cotizacion: new Date().getFullYear(),
      ano_en_curso: new Date().getFullYear(),
      costo_fabrica_original_eur: '',
      descuento_pct: '0',
      buffer_eur_usd_pct: '0',
      costos_origen_eur: '0',
      flete_maritimo_usd: '0',
      recargos_destino_usd: '0',
      tasa_seguro_pct: '0',
      honorarios_agente_aduana_usd: '0',
      gastos_portuarios_otros_usd: '0',
      transporte_nacional_clp: '0',
      buffer_usd_clp_pct: '0',
      margen_adicional_pct: '0',
      derecho_advalorem_pct: '6',
      iva_pct: '19',
      descuento_cliente_pct: '0', // Default para nuevo campo
  };
  const [pruebaInputs, setPruebaInputs] = useState<PruebaInputs>(defaultPruebaInputs);
  const [pruebaResults, setPruebaResults] = useState<GroupedPruebaResults | null>(null); // Cambiado tipo
  const [pruebaApiValues, setPruebaApiValues] = useState<PruebaApiValues | null>(null);
  const [isCalculatingPrueba, setIsCalculatingPrueba] = useState<boolean>(false);
  const [pruebaError, setPruebaError] = useState<string | null>(null);
  const [selectedProfileIdForPrueba, setSelectedProfileIdForPrueba] = useState<string>('');

  // --- Función para cargar perfiles ---
  const loadPerfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[PerfilesPanel] Cargando perfiles...');
      const fetchedPerfiles = await api.fetchAllProfiles(); 
      setPerfiles(fetchedPerfiles);
      console.log(`[PerfilesPanel] ${fetchedPerfiles.length} perfiles cargados.`);
    } catch (err) {
      console.error('[PerfilesPanel] Error cargando perfiles:', err);
      setError('Error al cargar los perfiles. Intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCurrencyData = useCallback(async () => {
    setLoadingCurrencies(true);
    setErrorCurrencies(null);
    try {
      console.log('[PerfilesPanel] Cargando valores de divisas...');
      const [dolarRes, euroRes] = await Promise.all([
        api.getDollarValue().catch((err: any) => ({ error: true, data: err })),
        api.getEuroValue().catch((err: any) => ({ error: true, data: err }))
      ]);

      let fetchError = false;

      if (dolarRes && !dolarRes.error) {
        setDolarValue({ ...dolarRes, value: parseFloat(dolarRes.value) }); // Convertir a número
      } else {
        console.error('[PerfilesPanel] Error cargando valor Dólar:', dolarRes?.data);
        setErrorCurrencies('Error al cargar valor Dólar.');
        fetchError = true;
      }

      if (euroRes && !euroRes.error) {
         setEuroValue({ ...euroRes, value: parseFloat(euroRes.value) }); // Convertir a número
      } else {
         console.error('[PerfilesPanel] Error cargando valor Euro:', euroRes?.data);
         // Añadir al mensaje de error si ya había uno
         setErrorCurrencies(prev => prev ? `${prev} Error al cargar valor Euro.` : 'Error al cargar valor Euro.');
         fetchError = true;
      }

      if (!fetchError) {
         console.log('[PerfilesPanel] Valores de divisas cargados.');
      }

    } catch (err: any) {
      console.error('[PerfilesPanel] Error general cargando divisas:', err);
      setErrorCurrencies('Error inesperado al cargar divisas.');
    } finally {
      setLoadingCurrencies(false);
    }
  }, []);

  useEffect(() => {
    loadPerfiles();
    loadCurrencyData();
  }, [loadPerfiles, loadCurrencyData]);

  // --- Handlers para Modales y Acciones ---
  const handleViewProfile = async (profileId: string) => {
    setLoadingViewProfile(profileId);
    setViewError(null);
    try {
        const profileDataFromApi = await api.fetchProfileData(profileId);
        if (profileDataFromApi) {
            setViewingProfile(profileDataFromApi); 
            setIsViewModalOpen(true);
        } else {
            setViewError('No se pudo encontrar el perfil seleccionado.');
        }
    } catch (err) {
        setViewError('Error al cargar los detalles del perfil.');
    } finally {
        setLoadingViewProfile(null);
    }
  };
  
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingProfile(null);
  };

  const handleOpenEditModal = (profileId: string) => {
    setEditingProfileId(profileId);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingProfileId(null);
    setIsEditModalOpen(false);
    loadPerfiles();
  };

  const handleDeleteProfile = async (profileId: string) => {
      const profileToDelete = perfiles.find(p => p._id === profileId);
      const profileName = profileToDelete?.nombre || profileId; 
      
      if (window.confirm(`¿Está seguro que desea eliminar el perfil "${profileName}"? Esta acción no se puede deshacer.`)) {
          setDeletingProfileId(profileId);
          setDeleteError(null);
          try {
              console.log(`[PerfilesPanel] Eliminando perfil ID: ${profileId}`);
              await api.deleteProfile(profileId); 
              console.log(`Perfil ${profileId} eliminado exitosamente desde la API.`);
              setPerfiles(prevPerfiles => prevPerfiles.filter(p => p._id !== profileId));
          } catch (err) {
              console.error(`[PerfilesPanel] Error deleting profile ${profileId}:`, err);
              setDeleteError('No se pudo eliminar el perfil. Verifique la consola para más detalles.');
          } finally {
              setDeletingProfileId(null);
          }
      }
  };
  
  // --- Funciones para el Modal de Creación ---
  const handleOpenCreateModal = () => {
    setNewProfileName(''); // Limpiar nombre al abrir
    setCreateError(null); // Limpiar errores previos
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (isCreatingProfile) return; // No cerrar si está creando
    setIsCreateModalOpen(false);
  };

  const handleNewProfileNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewProfileName(event.target.value);
  };
  
  // --- Modificada función handleCreateProfile (se llama desde el modal) ---
  const handleConfirmCreateProfile = async () => {
      if (!newProfileName.trim()) {
          setCreateError('El nombre del perfil no puede estar vacío.');
          return;
      }

      setIsCreatingProfile(true);
      setCreateError(null);
      try {
          console.log(`[PerfilesPanel] Creando nuevo perfil con nombre: ${newProfileName}`);
          
          // Actualizar defaultProfileData con la nueva estructura
          const defaultProfileData = {
              nombre: newProfileName.trim(), 
              descripcion: '',
              activo: true, 
              // Logistica y seguro
              costo_logistica_origen_eur: 0,
              flete_maritimo_usd: 0,
              recargos_destino_usd: 0,
              prima_seguro_usd: 0,
              tasa_seguro_pct: 0,
              transporte_nacional_clp: 0,
              // Costos de Importación
              costo_agente_aduana_usd: 0,
              gastos_portuarios_otros_usd: 0,
              derecho_advalorem_pct: 0.06, // Mantener default del backend
              // Conversión a CLP y Margen
              margen_adicional_pct: 0,
              buffer_usd_clp_pct: 0,
              buffer_eur_usd_pct: 0,
              iva_pct: 0.19, // Mantener default del backend
              // Precios para Cliente
              descuento_fabrica_pct: 0,
              descuento_cliente_pct: 0,
          };

          const newProfile = await api.createProfile(defaultProfileData);
          console.log('[PerfilesPanel] Nuevo perfil creado:', newProfile);

          if (newProfile && newProfile._id) {
              setIsCreateModalOpen(false); // Cerrar modal
              navigate(`/perfiles/${newProfile._id}/editar`); // Redirigir
          } else {
              console.error('[PerfilesPanel] La respuesta de creación no contiene un ID:', newProfile);
              setCreateError('Error: No se recibió el ID del nuevo perfil.');
          }
      } catch (err: any) {
          console.error('[PerfilesPanel] Error creando perfil:', err);
          const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Error al crear el perfil. Intente de nuevo.';
          // Mostrar error específico de duplicado si es el caso
          if (errorMessage.includes('E11000')) {
             setCreateError('Error: Ya existe un perfil con ese nombre.');
          } else {
             setCreateError(`Error al crear el perfil: ${errorMessage}`);
          }
      } finally {
          setIsCreatingProfile(false);
      }
  };

  // --- Handlers para Modal Prueba ---
  const handleOpenPruebaModal = () => {
    setPruebaResults(null);
    setPruebaError(null);
    setPruebaApiValues(null);
    setSelectedProfileIdForPrueba('');
    setPruebaInputs(defaultPruebaInputs);
    setIsPruebaModalOpen(true);
  };

  const handleClosePruebaModal = () => {
    if (isCalculatingPrueba) return;
    setIsPruebaModalOpen(false);
  };

  const handlePruebaInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setPruebaInputs(prev => ({
        ...prev,
        [name]: value,
    }));
  };

  // --- Handler para Selección de Perfil en Prueba ---
  const handleProfileSelectForPrueba = (event: SelectChangeEvent<string>) => {
      const profileId = event.target.value as string;
      setSelectedProfileIdForPrueba(profileId);
      setPruebaResults(null);
      setPruebaApiValues(null);
      setPruebaError(null);

      if (profileId) {
          const selectedProfile = perfiles.find(p => p._id === profileId);
          if (selectedProfile) {
              setPruebaInputs(prev => ({
                  ...prev,
                  descuento_pct: ((selectedProfile.descuento_fabrica_pct ?? 0) * 100).toString(),
                  buffer_eur_usd_pct: ((selectedProfile.buffer_eur_usd_pct ?? 0) * 100).toString(),
                  costos_origen_eur: (selectedProfile.costo_logistica_origen_eur ?? 0).toString(),
                  flete_maritimo_usd: (selectedProfile.flete_maritimo_usd ?? 0).toString(),
                  recargos_destino_usd: (selectedProfile.recargos_destino_usd ?? 0).toString(),
                  tasa_seguro_pct: ((selectedProfile.tasa_seguro_pct ?? 0) * 100).toString(),
                  honorarios_agente_aduana_usd: (selectedProfile.costo_agente_aduana_usd ?? 0).toString(),
                  gastos_portuarios_otros_usd: (selectedProfile.gastos_portuarios_otros_usd ?? 0).toString(),
                  transporte_nacional_clp: (selectedProfile.transporte_nacional_clp ?? 0).toString(),
                  buffer_usd_clp_pct: ((selectedProfile.buffer_usd_clp_pct ?? 0) * 100).toString(),
                  margen_adicional_pct: ((selectedProfile.margen_adicional_pct ?? 0) * 100).toString(),
                  derecho_advalorem_pct: ((selectedProfile.derecho_advalorem_pct ?? 0.06) * 100).toString(),
                  iva_pct: ((selectedProfile.iva_pct ?? 0.19) * 100).toString(),
                  descuento_cliente_pct: ((selectedProfile.descuento_cliente_pct ?? 0) * 100).toString(), // Añadir nuevo campo
              }));
          } else {
              setPruebaInputs(prev => ({ ...defaultPruebaInputs, ano_cotizacion: prev.ano_cotizacion, ano_en_curso: prev.ano_en_curso, costo_fabrica_original_eur: prev.costo_fabrica_original_eur }));
          }
      } else {
          setPruebaInputs(prev => ({ ...defaultPruebaInputs, ano_cotizacion: prev.ano_cotizacion, ano_en_curso: prev.ano_en_curso, costo_fabrica_original_eur: prev.costo_fabrica_original_eur }));
      }
  };

  // --- Handler para Calcular Prueba (Ajustado para enviar tasas de cambio) ---
  const handleCalculatePrueba = async () => {
      setIsCalculatingPrueba(true);
      setPruebaError(null);
      setPruebaResults(null);
      setPruebaApiValues(null);

      const usdClpRate = dolarValue?.value;
      const currentEurUsdRate = (dolarValue?.value && euroValue?.value && dolarValue.value !== 0)
          ? euroValue.value / dolarValue.value
          : null;

      if (usdClpRate === null || usdClpRate === undefined || usdClpRate <= 0) {
          setPruebaError("No se pudo obtener una tasa USD/CLP válida. Intente recargar las divisas.");
          setIsCalculatingPrueba(false);
          return;
      }
      if (currentEurUsdRate === null || currentEurUsdRate === undefined || !isFinite(currentEurUsdRate) || currentEurUsdRate <= 0) {
           setPruebaError("No se pudo obtener/calcular una tasa EUR/USD válida. Intente recargar las divisas.");
           setIsCalculatingPrueba(false);
           return;
      }

      let payload: any = {};
      let hasManualInputError = false;

      const anoCotizacionNum = parseFloat(pruebaInputs.ano_cotizacion as string);
      const anoEnCursoNum = parseFloat(pruebaInputs.ano_en_curso as string);
      const costoFabricaOriginalNum = parseFloat(pruebaInputs.costo_fabrica_original_eur as string);

      if (isNaN(anoCotizacionNum)) { setPruebaError("Año cotización inválido."); hasManualInputError = true; }
      if (isNaN(anoEnCursoNum)) { setPruebaError("Año en curso inválido."); hasManualInputError = true; }
      if (isNaN(costoFabricaOriginalNum)) { setPruebaError("Costo Fábrica Original inválido."); hasManualInputError = true; }
       if (anoEnCursoNum > anoCotizacionNum) { setPruebaError("Año en curso no puede ser mayor a Año cotización."); hasManualInputError = true; }

      if (hasManualInputError) {
          setIsCalculatingPrueba(false);
          return;
      }

      payload = {
          ano_cotizacion: anoCotizacionNum,
          ano_en_curso: anoEnCursoNum,
          costo_fabrica_original_eur: costoFabricaOriginalNum,
          tipo_cambio_usd_clp_actual: usdClpRate,
          tipo_cambio_eur_usd_actual: currentEurUsdRate
      };

      if (selectedProfileIdForPrueba) {
          payload.profileId = selectedProfileIdForPrueba;
      } else {
          const numberInputs: Record<string, number> = {};
          let inputError = false;
          const keysToValidateAndSend = [
              'descuento_pct', 'buffer_eur_usd_pct', 'costos_origen_eur', 'flete_maritimo_usd',
              'recargos_destino_usd', 'tasa_seguro_pct', 'honorarios_agente_aduana_usd',
              'gastos_portuarios_otros_usd', 'transporte_nacional_clp', 'buffer_usd_clp_pct',
              'margen_adicional_pct', 'derecho_advalorem_pct', 'iva_pct',
              'descuento_cliente_pct' // Añadir nueva clave a validar y enviar
          ];

          for (const key of keysToValidateAndSend) {
               const value = pruebaInputs[key as keyof PruebaInputs];
               const numValue = parseFloat(value as string);
               if (isNaN(numValue)) {
                   setPruebaError(`Valor inválido para ${key.replace(/_/g, ' ')} en modo manual.`);
                   inputError = true;
                   break;
               }
               if (key.endsWith('_pct')) {
                   numberInputs[key] = numValue / 100;
               } else {
                   numberInputs[key] = numValue;
               }
           }

           if (inputError) {
               setIsCalculatingPrueba(false);
               return;
           }
           payload = { ...payload, ...numberInputs };
       }

      try {
          console.log("Enviando payload a /calcular-prueba:", payload);
          const response = await axios.post<{ results: GroupedPruebaResults }>('/api/costo-perfiles/calcular-prueba', payload);

          if (response.data && response.data.results) {
              setPruebaResults(response.data.results);
              setPruebaApiValues({
                   tipo_cambio_usd_clp_actual: usdClpRate,
                   tipo_cambio_eur_usd_actual: currentEurUsdRate
              });
          } else {
              throw new Error("La respuesta del servidor no contiene resultados válidos.");
          }
      } catch (err: any) {
          console.error("Error calculando prueba:", err);
          const message = err.response?.data?.message || err.message || "Error desconocido al calcular.";
          setPruebaError(message);
      } finally {
          setIsCalculatingPrueba(false);
      }
  };

  // --- Calcular tipo de cambio --- 
  const eurUsdRate = (dolarValue?.value && euroValue?.value && dolarValue.value !== 0)
     ? euroValue.value / dolarValue.value
     : null;

  // --- Styles (definiciones de estilo omitidas por brevedad) ---
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' };
  const cardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'white' };
  const cardTitleStyle: React.CSSProperties = { fontSize: '16px', fontWeight: '600', marginBottom: '5px' };
  const cardDateStyle: React.CSSProperties = { fontSize: '12px', color: '#64748b', marginBottom: '10px' };
  const cardDescriptionStyle: React.CSSProperties = { fontSize: '14px', color: '#475569', marginBottom: '15px', minHeight: '30px' };
  const cardActionsStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: 'auto' };
  const iconButtonStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#475569' };
  const loadingErrorStyle: React.CSSProperties = { textAlign: 'center', padding: '30px', color: '#64748b' };
  const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 600,
    bgcolor: 'background.paper',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: 24,
    p: 4,
    maxHeight: '85vh',
    overflowY: 'auto',
  };
  const currencyBoxStyle: React.CSSProperties = { padding: '15px', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' };
  const currencyItemStyle: React.CSSProperties = { textAlign: 'center' };
  const currencyValueStyle: React.CSSProperties = { fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const currencyValueStyleSecondary: React.CSSProperties = { ...currencyValueStyle, fontSize: '18px', color: '#4b5563' };
  const currencyLabelStyle: React.CSSProperties = { fontSize: '12px', color: '#64748b', marginTop: '4px' };

  // Helper para renderizar sección de resultados
  const renderResultSection = (title: string, results: Record<string, number | undefined> | undefined, sectionLabels: Record<string, string>) => {
      if (!results || Object.keys(results).length === 0) return null;
      return (
          <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>{title}</Typography>
              <Grid container spacing={0.5}> {/* Menos espacio entre líneas de resultado */} 
                  {Object.entries(results).map(([key, value]) => {
                      const label = sectionLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let formattedValue = '--';
                      if (typeof value === 'number') {
                          if (key.endsWith('_eur')) formattedValue = formatGenericCurrency(value, 'EUR');
                          else if (key.endsWith('_usd')) formattedValue = formatGenericCurrency(value, 'USD');
                          else if (key.endsWith('_clp')) formattedValue = formatCLP(value);
                          else if (key.includes('_pct') || key.startsWith('tasa_') || key.startsWith('factor_')) formattedValue = formatPercentDisplay(value, 3);
                          else if (key.includes('tipo_cambio')) formattedValue = value.toFixed(4); // Más decimales para TC
                          else formattedValue = value.toLocaleString('es-CL', { maximumFractionDigits: 2 });
                      }
                      return (
                          <React.Fragment key={key}>
                              <Grid item xs={7}><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{label}:</Typography></Grid>
                              <Grid item xs={5}><Typography variant="body2" align="right" sx={{ fontWeight: '500', fontSize: '0.8rem' }}>{formattedValue}</Typography></Grid>
                          </React.Fragment>
                      );
                  })}
              </Grid>
              <Divider sx={{ my: 1 }} />
          </Box>
      );
  };

  // Labels para resultados (para mejor visualización)
  const resultLabels = {
      costo_producto: {
          factor_actualizacion: "Factor Actualización",
          costo_fabrica_actualizado_eur_exw: "Costo Fáb. Act. EUR (EXW)",
          costo_fabrica_actualizado_eur: "Costo Fáb. Act. EUR (Neto Desc.)",
          tipo_cambio_eur_usd_aplicado: "TC EUR/USD Aplicado",
          costo_final_fabrica_usd_exw: "Costo Final Fáb. USD (EXW)",
      },
      logistica_seguro: {
          costos_origen_usd: "Costos Origen (USD)",
          costo_total_flete_manejos_usd: "Costo Total Flete y Manejos (USD)",
          base_para_seguro_usd: "Base Seguro (USD)",
          prima_seguro_usd: "Prima Seguro (USD)",
          total_transporte_seguro_exw_usd: "Total Transporte y Seguro (USD)",
      },
      importacion: {
          valor_cif_usd: "Valor CIF (USD)",
          derecho_advalorem_usd: "Derecho AdValorem (USD)",
          base_iva_usd: "Base IVA Importación (USD)",
          iva_usd: "IVA Importación (USD)",
          total_costos_importacion_duty_fees_usd: "Total Costos Imp. (Duty+Fees) (USD)",
      },
      landed_cost: {
          transporte_nacional_usd: "Transporte Nac. (USD)",
          precio_neto_compra_base_usd_landed: "Precio Neto Compra Base (USD Landed)",
      },
      conversion_margen: {
          tipo_cambio_usd_clp_aplicado: "TC USD/CLP Aplicado",
          precio_neto_compra_base_clp: "Precio Neto Compra Base (CLP)",
          margen_clp: "Margen (CLP)",
          precio_venta_neto_clp: "Precio Venta Neto (CLP)",
      },
      precios_cliente: {
          precio_neto_venta_final_clp: "Precio Neto Venta Final (CLP)",
          iva_venta_clp: "IVA Venta (CLP)",
          precio_venta_total_cliente_clp: "Precio Venta Total Cliente (CLP)",
      },
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
       {/* --- Sección Indicadores de Divisas --- */}
       <Paper elevation={0} sx={currencyBoxStyle}>
         <Grid container spacing={2} alignItems="center">
           {loadingCurrencies && (
             <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50px' }}>
               <CircularProgress size={24} />
               <Typography variant="body2" sx={{ ml: 1 }}>Cargando divisas...</Typography>
             </Grid>
           )}
           {errorCurrencies && !loadingCurrencies && (
              <Grid item xs={12}>
                 <Alert severity="warning" action={
                    <Tooltip title="Recargar divisas">
                       <Button color="inherit" size="small" onClick={loadCurrencyData}>
                          <RefreshCw size={16} />
                       </Button>
                    </Tooltip>
                 }>{errorCurrencies}</Alert>
              </Grid>
           )}
           {!loadingCurrencies && !errorCurrencies && (
             <>
               <Grid item xs={12} sm={4} sx={currencyItemStyle}>
                   <Typography sx={currencyValueStyleSecondary}>{formatCLP(dolarValue?.value)}</Typography>
                   <Typography sx={currencyLabelStyle}>Dólar Observado (CLP)</Typography>
               </Grid>
               <Grid item xs={12} sm={4} sx={currencyItemStyle}>
                  <Typography sx={currencyValueStyle}>{formatExchangeRate(eurUsdRate)}</Typography>
                  <Typography sx={currencyLabelStyle}>Tipo Cambio EUR/USD</Typography>
               </Grid>
               <Grid item xs={12} sm={4} sx={currencyItemStyle}>
                   <Typography sx={currencyValueStyleSecondary}>{formatCLP(euroValue?.value)}</Typography>
                   <Typography sx={currencyLabelStyle}>Euro Observado (CLP)</Typography>
               </Grid>
             </>
           )}
         </Grid>
       </Paper>

      {/* --- Sección Título y Crear --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
           <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Gestión de Perfiles de Costos</h1>
           <Stack direction="row" spacing={2}>
             <Button
               variant="contained"
               color="success"
               startIcon={<PlusCircle size={18} />}
               onClick={handleOpenCreateModal}
               disabled={isCreatingProfile}
             >
               Crear Perfil
             </Button>
             <Button
               variant="outlined"
               color="secondary"
               onClick={handleOpenPruebaModal}
             >
               Prueba
             </Button>
           </Stack>
       </div>

      {/* --- Mensaje Global de Error/Carga Perfiles --- */}
       {isLoading && !error && (
          <div style={loadingErrorStyle}>
              <Loader2 size={24} className="animate-spin" style={{ marginBottom: '12px' }}/>
              Cargando perfiles...
          </div>
      )}
       {error && (
          <div style={{...loadingErrorStyle, color: '#DC2626'}}>
              <AlertTriangle size={24} style={{ marginBottom: '12px' }}/>
              {error}
          </div>
      )}

      {/* --- Lista de Perfiles --- */}
       {!isLoading && !error && perfiles.length === 0 && (
          <div style={loadingErrorStyle}>No se encontraron perfiles. Crea uno nuevo para empezar.</div>
       )}
       {!isLoading && !error && perfiles.length > 0 && (
        <div style={gridStyle}>
          {perfiles.map((perfil: CostoPerfilData) => (
            <div key={perfil._id} style={cardStyle}>
              <div> 
                <h2 style={cardTitleStyle}>{perfil.nombre || perfil._id}</h2> 
                {perfil.createdAt && (
                    <p style={cardDateStyle}>
                        Creado: {(() => {
                            try {
                                return new Date(perfil.createdAt).toLocaleDateString('es-CL');
                            } catch { return 'Fecha inválida'; }
                        })()}
                    </p>
                )}
                {perfil.descripcion && (
                  <p style={cardDescriptionStyle}>{perfil.descripcion}</p>
                )}
                {!perfil.descripcion && <div style={{minHeight: '30px'}}></div>} 
              </div>
              <div style={cardActionsStyle}>
                <button 
                  onClick={() => handleViewProfile(perfil._id)} 
                  style={iconButtonStyle} 
                  title="Ver Detalles"
                  disabled={loadingViewProfile === perfil._id} 
                >
                  {loadingViewProfile === perfil._id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                </button>
                <button 
                  onClick={() => handleOpenEditModal(perfil._id)} 
                  style={iconButtonStyle} 
                  title="Editar Perfil"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteProfile(perfil._id)} 
                  style={{...iconButtonStyle, color: '#dc2626'}} 
                  title="Eliminar Perfil"
                  disabled={deletingProfileId === perfil._id} 
                >
                  {deletingProfileId === perfil._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
              {deleteError && deletingProfileId === perfil._id && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '5px' }}>{deleteError}</p>
              )}
            </div>
          ))}
        </div>
      )}

       {/* --- Modales (Crear, Ver, Editar) --- */}
       <Dialog open={isCreateModalOpen} onClose={handleCloseCreateModal} aria-labelledby="create-profile-dialog-title">
         <DialogTitle id="create-profile-dialog-title">Crear Nuevo Perfil de Costo</DialogTitle>
         <DialogContent>
           <DialogContentText sx={{ mb: 2 }}>
             Ingresa un nombre único para el nuevo perfil.
           </DialogContentText>
           <TextField
             autoFocus
             required
             margin="dense"
             id="name"
             label="Nombre del Perfil"
             type="text"
             fullWidth
             variant="outlined"
             value={newProfileName}
             onChange={handleNewProfileNameChange}
             error={!!createError}
             helperText={createError}
             disabled={isCreatingProfile}
           />
         </DialogContent>
         <DialogActions sx={{ p: '16px 24px' }}>
           <Button onClick={handleCloseCreateModal} disabled={isCreatingProfile} color="secondary">Cancelar</Button>
           <Button 
             onClick={handleConfirmCreateProfile} 
             disabled={isCreatingProfile || !newProfileName.trim()}
             variant="contained"
             startIcon={isCreatingProfile ? <CircularProgress size={20} color="inherit" /> : null}
           >
             {isCreatingProfile ? 'Creando...' : 'Crear'}
           </Button>
         </DialogActions>
       </Dialog>

       <ViewProfileModal 
           isOpen={isViewModalOpen} 
           onClose={handleCloseViewModal} 
           profileData={viewingProfile}
           error={viewError}
       />
       
       {isEditModalOpen && editingProfileId && (
           <Modal open={isEditModalOpen} onClose={handleCloseEditModal} aria-labelledby="edit-profile-modal-title">
               <Box sx={modalStyle}>
                   <h2 id="edit-profile-modal-title">Editar Perfil</h2>
                   <PerfilEditForm profileId={editingProfileId} onSaveSuccess={handleCloseEditModal} onCancel={handleCloseEditModal} />
               </Box>
           </Modal>
       )}

       {/* --- Modal de Prueba (Reestructurado) --- */}
       <Modal
         open={isPruebaModalOpen}
         onClose={handleClosePruebaModal}
         aria-labelledby="prueba-modal-title"
       >
         <Box sx={{
             position: 'absolute',
             top: '50%',
             left: '50%',
             transform: 'translate(-50%, -50%)',
             width: '90%',
             maxWidth: 800,
             maxHeight: '90vh',
             overflowY: 'auto',
             bgcolor: 'background.paper',
             border: '1px solid #ccc',
             borderRadius: '8px',
             boxShadow: 24,
             p: 3,
         }}>
           <Typography id="prueba-modal-title" variant="h6" component="h2" gutterBottom>
             Calculadora de Prueba de Costos
           </Typography>

           {/* --- Selector de Perfil --- */}
           <Grid container spacing={2} sx={{ mb: 2}}>
             <Grid item xs={12} sm={6}>
                 <FormControl fullWidth size="small" variant="outlined">
                     <InputLabel id="select-profile-label">Usar Perfil Existente</InputLabel>
                     <Select
                         labelId="select-profile-label"
                         id="select-profile-prueba"
                         value={selectedProfileIdForPrueba}
                         label="Usar Perfil Existente"
                         onChange={handleProfileSelectForPrueba}
                         disabled={isCalculatingPrueba}
                     >
                         <MenuItem value=""><em>-- Entrada Manual --</em></MenuItem>
                         {perfiles.map((perfil: CostoPerfilData) => (
                             <MenuItem key={perfil._id} value={perfil._id}>{perfil.nombre}</MenuItem>
                         ))}
                     </Select>
                 </FormControl>
             </Grid>
             {/* Podríamos mostrar aquí las divisas actuales */}
             <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                 <Typography variant="body2" sx={{ mr: 2 }}>
                     USD/CLP: {formatCLP(dolarValue?.value)}
                 </Typography>
                 <Typography variant="body2">
                     EUR/USD: {formatExchangeRate(eurUsdRate)}
                 </Typography>
             </Grid>
           </Grid>
           <Divider sx={{ my: 2 }} />

           {/* --- Inputs Manuales Esenciales --- */}
           <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
               Datos Base (Siempre Manuales)
           </Typography>
           <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                   <TextField label="Año de Cotización" name="ano_cotizacion" type="number" value={pruebaInputs.ano_cotizacion} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" disabled={isCalculatingPrueba} />
                </Grid>
                <Grid item xs={12} sm={4}>
                   <TextField label="Año en Curso" name="ano_en_curso" type="number" value={pruebaInputs.ano_en_curso} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" disabled={isCalculatingPrueba} />
                </Grid>
                 <Grid item xs={12} sm={4}>
                   <TextField label="Costo Fábrica Original (EUR)" name="costo_fabrica_original_eur" type="number" value={pruebaInputs.costo_fabrica_original_eur} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} disabled={isCalculatingPrueba} />
                </Grid>
           </Grid>
           <Divider sx={{ my: 2 }} />

           {/* --- Sección: Precios para Cliente --- */}
           <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                🧾 Precios para Cliente {selectedProfileIdForPrueba ? '(Desde Perfil)' : '(Manual)'}
           </Typography>
           <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                    <TextField label="Desc. Fábrica (%)" name="descuento_pct" type="number" value={pruebaInputs.descuento_pct} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Ej: 10 para 10%" disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="Desc. Cliente (%)" name="descuento_cliente_pct" type="number" value={pruebaInputs.descuento_cliente_pct} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Ej: 5 para 5%" disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
           </Grid>
           <Divider sx={{ my: 2 }} />

           {/* --- Sección: Logística y Seguro --- */}
           <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
               🚢 Logística y Seguro {selectedProfileIdForPrueba ? '(Desde Perfil)' : '(Manual)'}
           </Typography>
           <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                   <TextField label="Costo Origen (EUR)" name="costos_origen_eur" type="number" value={pruebaInputs.costos_origen_eur} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Flete Marítimo (USD)" name="flete_maritimo_usd" type="number" value={pruebaInputs.flete_maritimo_usd} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Recargos Destino (USD)" name="recargos_destino_usd" type="number" value={pruebaInputs.recargos_destino_usd} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Tasa Seguro (%)" name="tasa_seguro_pct" type="number" value={pruebaInputs.tasa_seguro_pct} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Ej: 1 para 1%" disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                 <Grid item xs={12} sm={4}>
                   <TextField label="Transporte Nac. (CLP)" name="transporte_nacional_clp" type="number" value={pruebaInputs.transporte_nacional_clp} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
           </Grid>
           <Divider sx={{ my: 2 }} />

           {/* --- Sección: Costos de Importación --- */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                🧾 Costos de Importación {selectedProfileIdForPrueba ? '(Desde Perfil)' : '(Manual)'}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <TextField label="Costo Ag. Aduana (USD)" name="honorarios_agente_aduana_usd" type="number" value={pruebaInputs.honorarios_agente_aduana_usd} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Gastos Puerto/Otros (USD)" name="gastos_portuarios_otros_usd" type="number" value={pruebaInputs.gastos_portuarios_otros_usd} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Derecho AdValorem (%)" name="derecho_advalorem_pct" type="number" value={pruebaInputs.derecho_advalorem_pct} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Ej: 6 para 6%" disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />

            {/* --- Sección: Conversión a CLP y Margen --- */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                💸 Conversión a CLP y Margen {selectedProfileIdForPrueba ? '(Desde Perfil)' : '(Manual)'}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <TextField label="Buffer EUR/USD (%)" name="buffer_eur_usd_pct" type="number" value={pruebaInputs.buffer_eur_usd_pct} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Ej: 5 para 5%" disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Buffer USD/CLP (%)" name="buffer_usd_clp_pct" type="number" value={pruebaInputs.buffer_usd_clp_pct} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Ej: 3 para 3%" disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="IVA (%)" name="iva_pct" type="number" value={pruebaInputs.iva_pct} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Ej: 19 para 19%" disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
                 <Grid item xs={12} sm={6}> {/* Más ancho para este */} 
                    <TextField label="% Adicional Total (Margen)" name="margen_adicional_pct" type="number" value={pruebaInputs.margen_adicional_pct} onChange={handlePruebaInputChange} fullWidth variant="outlined" size="small" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText="Ej: 20 para 20%" disabled={isCalculatingPrueba || !!selectedProfileIdForPrueba} />
                </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />

            {/* --- Botón Calcular y Feedback --- */}
            <Box sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
               <Button
                   variant="contained"
                   color="primary"
                   onClick={handleCalculatePrueba}
                   disabled={isCalculatingPrueba}
                   startIcon={isCalculatingPrueba ? <CircularProgress size={20} color="inherit" /> : <Calculator size={18} />}
               >
                   {isCalculatingPrueba ? 'Calculando...' : 'Calcular'}
               </Button>
               {pruebaError && <Alert severity="error" sx={{ flexGrow: 1 }}>{pruebaError}</Alert>}
           </Box>


           {/* --- Sección de Resultados --- */}
           {(pruebaResults || pruebaApiValues) && <Divider sx={{ my: 2 }} />}

           {pruebaApiValues && (
               <Box sx={{ mb: 2 }}>
                   <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Valores API Usados</Typography>
                    <Grid container spacing={1}>
                       <Grid item xs={6}><Typography variant="body2">TC USD/CLP Actual:</Typography></Grid>
                       <Grid item xs={6}><Typography variant="body2" align="right">{formatCLP(pruebaApiValues.tipo_cambio_usd_clp_actual)}</Typography></Grid>
                       <Grid item xs={6}><Typography variant="body2">TC EUR/USD Actual:</Typography></Grid>
                       <Grid item xs={6}><Typography variant="body2" align="right">{formatExchangeRate(pruebaApiValues.tipo_cambio_eur_usd_actual)}</Typography></Grid>
                    </Grid>
               </Box>
           )}

           {pruebaResults && (
               <Box>
                   <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 1 }}>Resultados Calculados</Typography>
                   {renderResultSection("Costo de Producto", pruebaResults.costo_producto, resultLabels.costo_producto)}
                   {renderResultSection("Logística y Seguro", pruebaResults.logistica_seguro, resultLabels.logistica_seguro)}
                   {renderResultSection("Importación", pruebaResults.importacion, resultLabels.importacion)}
                   {renderResultSection("Costo Puesto en Bodega (Landed Cost)", pruebaResults.landed_cost, resultLabels.landed_cost)}
                   {renderResultSection("Conversión a CLP y Margen", pruebaResults.conversion_margen, resultLabels.conversion_margen)}
                   {renderResultSection("Precios para Cliente", pruebaResults.precios_cliente, resultLabels.precios_cliente)}
               </Box>
           )}

           {/* --- Botón Cerrar --- */}
           <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleClosePruebaModal} disabled={isCalculatingPrueba}>Cerrar</Button>
           </Box>
         </Box>
       </Modal>

    </div>
  );
}

interface ViewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: CostoPerfilData | null;
  error: string | null;
}

const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ isOpen, onClose, profileData, error }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} aria-labelledby="view-profile-dialog-title" maxWidth="md" fullWidth>
      <DialogTitle id="view-profile-dialog-title">
        Detalles del Perfil
        <Button onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><XCircle size={20} /></Button>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        {!error && !profileData && <Box sx={{ textAlign: 'center', p: 3 }}><CircularProgress /></Box>}
        
        {profileData && (
            <Box>
                <Typography variant="h6" gutterBottom>Datos Generales</Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={8}><Typography><strong>Nombre:</strong> {profileData.nombre}</Typography></Grid>
                    <Grid item xs={12} sm={4}><Typography><strong>Activo:</strong> {profileData.activo ? 'Sí' : 'No'}</Typography></Grid>
                    <Grid item xs={12}><Typography><strong>Descripción:</strong> {profileData.descripcion || 'N/A'}</Typography></Grid>
                </Grid>
                <Divider />

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Logistica y seguro</Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={4}><Typography>Costo Origen (EUR):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatCurrency(profileData.costo_logistica_origen_eur, 'EUR')}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Flete Marítimo (USD):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatCurrency(profileData.flete_maritimo_usd, 'USD')}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Recargos Destino (USD):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatCurrency(profileData.recargos_destino_usd, 'USD')}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Prima Seguro (USD):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatCurrency(profileData.prima_seguro_usd, 'USD')}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Tasa Seguro (%):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatPercent(profileData.tasa_seguro_pct)}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Transporte Nac. (CLP):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatCLP(profileData.transporte_nacional_clp)}</Typography></Grid>
                </Grid>
                 <Divider />

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Costos de Importación</Typography>
                 <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={4}><Typography>Costo Ag. Aduana (USD):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatCurrency(profileData.costo_agente_aduana_usd, 'USD')}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Gastos Puerto/Otros (USD):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatCurrency(profileData.gastos_portuarios_otros_usd, 'USD')}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Derecho AdValorem (%):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatPercent(profileData.derecho_advalorem_pct)}</Typography></Grid>
                 </Grid>
                 <Divider />

                 <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Conversión a CLP y Margen</Typography>
                 <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={4}><Typography>% Adicional Total:</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatPercent(profileData.margen_adicional_pct)}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Buffer USD/CLP (%):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatPercent(profileData.buffer_usd_clp_pct)}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Buffer EUR/USD (%):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatPercent(profileData.buffer_eur_usd_pct)}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>IVA (%):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatPercent(profileData.iva_pct)}</Typography></Grid>
                 </Grid>
                 <Divider />

                 <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Precios para Cliente</Typography>
                 <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={4}><Typography>Desc. Fábrica (%):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatPercent(profileData.descuento_fabrica_pct)}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography>Desc. Cliente (%):</Typography></Grid>
                    <Grid item xs={6} sm={8}><Typography align="right">{formatPercent(profileData.descuento_cliente_pct)}</Typography></Grid>
                 </Grid>
                 <Divider />

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                     <Typography variant="caption" display="block">Creado: {profileData.createdAt ? new Date(profileData.createdAt).toLocaleString('es-CL') : 'N/A'}</Typography>
                     <Typography variant="caption" display="block">Actualizado: {profileData.updatedAt ? new Date(profileData.updatedAt).toLocaleString('es-CL') : 'N/A'}</Typography>
                </Box>
            </Box>
        )}
      </DialogContent>
       <DialogActions>
         <Button onClick={onClose} color="primary">Cerrar</Button>
       </DialogActions>
    </Dialog>
  );
};

// Helper para formatear porcentajes (necesario para ViewProfileModal)
const formatPercent = (value: number | null | undefined): string => {
   if (value === null || value === undefined) return '--';
   return `${(value * 100).toFixed(1)}%`;
};

// Helper para formatear otras monedas (necesario para ViewProfileModal)
const formatCurrency = (value: number | null | undefined, currency: 'USD' | 'EUR'): string => {
  if (value === null || value === undefined) return '--';
  // Especificar el tipo explícito para las opciones
  const options: Intl.NumberFormatOptions = {
      style: 'currency', // Tipo específico
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
  };
  return value.toLocaleString('es-CL', options); // Usar localización chilena pero con código de moneda
}; 