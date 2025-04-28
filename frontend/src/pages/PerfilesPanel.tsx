import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Eye, Edit, Trash2, PlusCircle, Copy, DollarSign, Euro, RefreshCw, XCircle } from 'lucide-react'; // Import icons
import type { CostParams, CurrencyWebhookResponse } from '../types/costParams'; // Import CostParams & CurrencyWebhookResponse type
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { api } from '../services/api'; // Import api service
import { PricingOverrideData, CostosData } from '../types'; // Importar tipos necesarios

// Interface defining the structure of a Cost Profile
interface CostProfile {
  id: string; // Unique ID for the profile
  nombre: string; // User-defined name for the profile
  descripcion?: string; // Optional description
  fechaCreacion?: string; // Optional creation date/timestamp
  costos: Partial<CostosData>; // The saved cost parameters (can be partial)
}

// --- Interfaz para los datos del perfil desde la API (ajustar si es necesario) --- 
interface ProfileFromDB {
  _id: string;
  nombre_perfil?: string;
  categoryId?: string;
  costos: Partial<CostParams>;
  metadata?: { 
    createdAt?: string; 
    ultima_actualizacion?: string; 
  };
  // Añade otros campos que puedan venir y quieras usar
}

// --- Interfaz para el modal de visualización --- 
// ... (ViewingProfileData - puede ser igual a ProfileFromDB si no hay transformación)
interface ViewingProfileData extends ProfileFromDB {} // Simplificación

// --- NUEVO: Componente Modal simple --- 
interface ProfileViewModalProps {
  profileData: ViewingProfileData | null;
  onClose: () => void;
}

const ProfileViewModal: React.FC<ProfileViewModalProps> = ({ profileData, onClose }) => {
  if (!profileData) return null;

  // Estilos básicos para el modal
  const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
  const modalContentStyle: React.CSSProperties = { background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
  const modalTitleStyle: React.CSSProperties = { marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 600, color: '#1e293b' };
  const preStyle: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '15px', fontSize: '13px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' };
  const closeButtonStyle: React.CSSProperties = { background: '#e5e7eb', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', marginTop: '20px', float: 'right' };

  return (
    <div style={modalOverlayStyle} onClick={onClose}> 
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> {/* Evitar cierre al hacer clic dentro */} 
        <h3 style={modalTitleStyle}>Detalles del Perfil: {profileData.nombre_perfil || profileData.categoryId || profileData._id}</h3>
        <h4>Costos Asociados:</h4>
        <pre style={preStyle}>{JSON.stringify(profileData.costos, null, 2)}</pre>
        <button onClick={onClose} style={closeButtonStyle}>Cerrar</button>
      </div>
    </div>
  );
};

export default function PerfilesPanel() {
  // Estado para los perfiles mapeados para el frontend
  const [profiles, setProfiles] = useState<CostProfile[]>([]); 
  const [loading, setLoading] = useState<boolean>(true); // Loading general
  const [error, setError] = useState<string | null>(null); // Error al cargar la lista de perfiles
  const navigate = useNavigate(); 

  // --- Estados Divisas (Traído de CostosAdminPanel) ---
  const [dolarActualCLP, setDolarActualCLP] = useState<string | null>(null);
  const [euroActualCLP, setEuroActualCLP] = useState<string | null>(null);
  const [fechaActualizacionDivisas, setFechaActualizacionDivisas] = useState<string | null>(null);
  const [isUpdatingCurrencies, setIsUpdatingCurrencies] = useState(false);
  const [currencyUpdateError, setCurrencyUpdateError] = useState<string | null>(null);
  const [initialCurrencyLoading, setInitialCurrencyLoading] = useState(true);

  // --- NUEVO: Estados para el modal de visualización --- 
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProfileData, setViewingProfileData] = useState<ViewingProfileData | null>(null);
  const [loadingViewProfile, setLoadingViewProfile] = useState<string | null>(null); // ID del perfil cargando
  const [errorViewProfile, setErrorViewProfile] = useState<string | null>(null);
  // --- NUEVO: Estados para eliminación --- 
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // --- Función API Divisas (Traída y adaptada de CostosAdminPanel) ---
  // Modificada para aceptar un parámetro opcional para actualizar la BD
  const fetchAndSetCurrencies = async (updateTimestamp?: Date, updateInDB: boolean = false) => {
    console.log(`[PerfilesPanel] Fetching currencies... (updateInDB: ${updateInDB})`); // Log si actualiza BD
    setIsUpdatingCurrencies(true);
    setInitialCurrencyLoading(true); 
    setCurrencyUpdateError(null);
    let dolarValue: number | null = null;
    let euroValue: number | null = null;

    try {
      const data: CurrencyWebhookResponse = await api.fetchCurrencies();
      
      // Procesar Dólar
      if (data && data.Valor_Dolar !== undefined) {
        const roundedDolar = Math.round(parseFloat(data.Valor_Dolar));
        if (!isNaN(roundedDolar)) {
          setDolarActualCLP(String(roundedDolar));
          dolarValue = roundedDolar;
        } else {
          console.warn('Valor_Dolar no válido:', data.Valor_Dolar);
          setDolarActualCLP(null);
        }
      } else {
        setDolarActualCLP(null);
        console.warn('Valor_Dolar no encontrado en la respuesta.');
      }

      // Procesar Euro
      if (data && data.Valor_Euro !== undefined) {
         const roundedEuro = Math.round(parseFloat(data.Valor_Euro));
         if (!isNaN(roundedEuro)) {
            setEuroActualCLP(String(roundedEuro));
            euroValue = roundedEuro;
         } else {
            console.warn('Valor_Euro no válido:', data.Valor_Euro);
            setEuroActualCLP(null);
         }
      } else {
        setEuroActualCLP(null);
        console.warn('Valor_Euro no encontrado en la respuesta.');
      }

      const displayTime = updateTimestamp || new Date();
      setFechaActualizacionDivisas(displayTime.toLocaleString('es-CL'));

      // --- Actualizar en BD SOLO si updateInDB es true y tenemos valores válidos ---
      if (updateInDB && dolarValue !== null && euroValue !== null) { 
        console.log(`[PerfilesPanel] Currency values obtained (D: ${dolarValue}, E: ${euroValue}). Attempting to update in DB...`);
        try {
          await api.updateCurrenciesInDB({ dolar_observado_actual: dolarValue, euro_observado_actual: euroValue });
          console.log('[PerfilesPanel] Currencies successfully updated in DB.');
        } catch (backendError) {
          console.error('[PerfilesPanel] Error updating currencies in backend:', backendError);
          // Propagar o manejar el error de actualización de BD
          throw backendError; // Re-lanzar para que el handler del botón lo muestre
        }
      } else if (updateInDB) {
           console.warn('[PerfilesPanel] No se actualizaron las divisas en la BD porque faltaba uno o ambos valores, aunque se solicitó.');
      } else {
           console.log('[PerfilesPanel] Se obtuvieron divisas pero no se solicitó actualización en BD.');
      }

      return true;
    } catch (error) {
      console.error('[PerfilesPanel] Error fetching/setting currencies:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setCurrencyUpdateError(errorMsg.includes('fetch') ? 'Error de conexión con webhook.' : errorMsg);
      setDolarActualCLP(null); // Clear value on error
      setEuroActualCLP(null); // Limpiar Euro en error
      // No lanzar error aquí para que el resto del panel pueda cargar
      return false;
    } finally {
        setIsUpdatingCurrencies(false);
        setInitialCurrencyLoading(false); 
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); 
      setError(null);
      console.log('[PerfilesPanel] Iniciando carga de datos iniciales (solo perfiles)...');
      try {
          // Especificar el tipo de retorno de la API
          const perfilesDesdeDB: PricingOverrideData[] = await api.fetchAllProfiles(); 
          console.log('[PerfilesPanel] Perfiles recibidos de la API:', perfilesDesdeDB);
          
          // Mapear los datos del backend a la estructura del frontend
          const perfilesMapeados: CostProfile[] = perfilesDesdeDB.map((dbProfile): CostProfile => {
             // Generar nombre: Usar categoryId o ID como fallback
             const nombreMostrado = dbProfile.categoryId ? `Categoría ${dbProfile.categoryId}` 
                                 : dbProfile._id === 'global' ? 'Global' 
                                 : `Perfil ${dbProfile._id.slice(-4)}`;
             // Formatear fecha de creación a string (si existe)
             let fechaFormateada: string | undefined = undefined;
             if (dbProfile.createdAt) {
                 try {
                     fechaFormateada = new Date(dbProfile.createdAt).toLocaleDateString('es-CL');
                 } catch (e) {
                     console.warn(`Fecha inválida para perfil ${dbProfile._id}: ${dbProfile.createdAt}`);
                 }
             }
             
             return {
                 id: dbProfile._id, 
                 nombre: nombreMostrado, 
                 descripcion: `Perfil para ${dbProfile.nivel} ${dbProfile.categoryId || dbProfile.productId || '-'}`, // Mejor descripción
                 fechaCreacion: fechaFormateada, 
                 // Asegurarse que costos sea Partial<CostosData>
                 // y manejar fecha_ultima_actualizacion_transporte_local si es necesario específicamente
                 costos: dbProfile.costos ? { 
                     ...dbProfile.costos,
                     // Convertir fecha a string si es Date y CostProfile la espera como string
                     // (Actualmente CostosData permite Date, así que no es estrictamente necesario aquí)
                     // fecha_ultima_actualizacion_transporte_local: dbProfile.costos.fecha_ultima_actualizacion_transporte_local instanceof Date 
                     //    ? dbProfile.costos.fecha_ultima_actualizacion_transporte_local.toISOString().split('T')[0]
                     //    : dbProfile.costos.fecha_ultima_actualizacion_transporte_local || undefined
                 } : {}
             };
          });
          console.log('[PerfilesPanel] Perfiles mapeados para el frontend:', perfilesMapeados);
          setProfiles(perfilesMapeados);

      } catch (profileError) {
          console.error("[PerfilesPanel] Error loading profiles from API:", profileError);
          setError(profileError instanceof Error ? profileError.message : "Error desconocido al cargar perfiles.");
          setProfiles([]);
      }
      setLoading(false);
      console.log('[PerfilesPanel] Carga inicial de perfiles completada.');
    };

    // --- Cargar también las divisas iniciales SIN actualizarlas en BD --- 
    const fetchInitialCurrencies = async () => {
      setInitialCurrencyLoading(true);
      setCurrencyUpdateError(null);
      try {
          console.log('[PerfilesPanel] Fetching initial currency values (no DB update)...');
          // Llamar SIN el segundo argumento (o explícitamente false)
          await fetchAndSetCurrencies(); 
      } catch (err) {
          // El error ya se maneja dentro de fetchAndSetCurrencies
          console.error('[PerfilesPanel] Error fetching initial currencies:', err);
      } finally {
          setInitialCurrencyLoading(false);
      }
    };
    
    loadData();
    fetchInitialCurrencies();

  }, []);

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

  // Estilos para Divisas (Traídos de CostosAdminPanel)
  const currencyDisplayStyle: React.CSSProperties = { backgroundColor: 'white', border: `1px solid #e5e7eb`, borderRadius: '8px', padding: '16px', textAlign: 'center' };
  const currencyValueStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' };
  const primaryTextColor = '#0ea5e9';
  const secondaryTextColor = '#64748b';
  const borderColor = '#e5e7eb';

  // --- Placeholder Handlers --- 
  const handleCreateNewProfile = () => {
    console.log('Crear Nuevo Perfil clickeado');
    // --- Guardar estado en sessionStorage ANTES de navegar --- 
    try {
      sessionStorage.setItem('showCostosLink', 'true');
      console.log('sessionStorage showCostosLink establecido a true');
    } catch (storageError) {
      console.error('Error al escribir en sessionStorage:', storageError);
      // Considerar mostrar un error al usuario si el almacenamiento es crítico
    }
    // Navegar a la página de costos
    navigate('/admin/costos'); 
  };
  
  // --- ACTUALIZAR handleViewProfile --- 
  const handleViewProfile = async (profileId: string) => {
    console.log(`Ver Perfil ${profileId} clickeado`);
    setLoadingViewProfile(profileId);
    setErrorViewProfile(null);
    setViewingProfileData(null);
    setIsViewModalOpen(false);
    try {
      const data = await api.fetchProfileData(profileId);
      if (data && data.costos) {
         // Asumiendo que la respuesta tiene una estructura como { _id: ..., costos: {...}, ... }
         // Necesitamos ajustar la interfaz ViewingProfileData si la estructura real difiere
         setViewingProfileData(data as ViewingProfileData); 
         setIsViewModalOpen(true);
      } else {
         console.error('Respuesta de API no contiene datos de costos o es nula', data);
         throw new Error('No se encontraron datos válidos para este perfil.');
      }
    } catch (err) {
       console.error(`Error al obtener datos del perfil ${profileId}:`, err);
       setErrorViewProfile(err instanceof Error ? err.message : 'Error desconocido al cargar el perfil.');
       // Opcional: Mostrar alerta al usuario
       alert(`Error al cargar el perfil: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
       setLoadingViewProfile(null);
    }
  };
  
  const handleEditProfile = (id: string) => {
    console.log(`Navegando a la edición del perfil: ${id}`);
    navigate(`/perfiles/${id}/editar`); // <-- Navegar a la ruta de edición
  };
  const handleDeleteProfile = async (profileId: string) => {
    // Usar el nombre del perfil para la confirmación si está disponible
    const profileToDelete = profiles.find(p => p.id === profileId);
    const profileName = profileToDelete?.nombre || profileId;
    
    if (window.confirm(`¿Está seguro que desea eliminar el perfil "${profileName}"? Esta acción no se puede deshacer.`)) {
      setDeletingProfileId(profileId);
      setDeleteError(null);
      console.log(`Intentando eliminar perfil con ID: ${profileId}`);
      try {
        await api.deleteProfile(profileId);
        console.log(`Perfil ${profileId} eliminado exitosamente desde la API.`);
        // Actualizar el estado local eliminando el perfil
        setProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
        // Opcional: Mostrar mensaje de éxito
        // alert('Perfil eliminado correctamente.'); 
      } catch (err) {
        console.error(`Error al eliminar el perfil ${profileId}:`, err);
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido al eliminar.';
        setDeleteError(errorMsg);
        // Mostrar alerta al usuario
        alert(`Error al eliminar el perfil: ${errorMsg}`);
      } finally {
        setDeletingProfileId(null);
      }
    }
  };
  const handleActualizarDivisas = async () => { 
      // Mostrar feedback de carga inmediatamente
      setIsUpdatingCurrencies(true);
      setCurrencyUpdateError(null);
      try {
          // Llamar con updateInDB = true
          const success = await fetchAndSetCurrencies(new Date(), true); 
          if (!success) {
              // Si fetchAndSetCurrencies devuelve false (por error de fetch), establecer un error genérico si no hay uno específico
              if (!currencyUpdateError) {
                  setCurrencyUpdateError('Error al actualizar divisas desde el webhook.');
              }
          }
      } catch (error) {
          // Capturar errores lanzados desde fetchAndSetCurrencies (ej: error de actualización de BD)
          console.error('[PerfilesPanel] Error en handleActualizarDivisas:', error);
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
           setCurrencyUpdateError(errorMsg.includes('fetch') ? 'Error de conexión.' : errorMsg);
      } finally {
          // Asegurarse que el estado de carga se desactive incluso si hay error
          setIsUpdatingCurrencies(false); 
      }
  };

  return (
    <div style={panelStyle}>
      {/* --- Sección Divisas (Dólar y Euro) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', marginBottom: '24px', alignItems: 'start' }}> {/* 3 columnas */} 
        
        {/* Columna Dólar */} 
        {(initialCurrencyLoading || isUpdatingCurrencies) ? (
           <div style={{...currencyDisplayStyle, textAlign: 'center', color: secondaryTextColor, gridColumn: 'span 2' /* Ocupar 2 columnas mientras carga */ }}>
              <Loader2 size={18} className="animate-spin inline-block mr-2"/> Cargando divisas...
            </div>
         ) : currencyUpdateError ? (
           <div style={{...currencyDisplayStyle, textAlign: 'center', color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fecaca', gridColumn: 'span 2' /* Ocupar 2 columnas en error */ }}>
             <XCircle size={18} className="inline-block mr-2"/> {currencyUpdateError}
            </div>
         ) : (
            <>
             {/* Tarjeta Dólar */} 
             {dolarActualCLP !== null ? (
                 <div style={currencyDisplayStyle}>
                     <div style={{ ...currencyValueStyle, color: primaryTextColor }}>
                         <DollarSign size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
                         {dolarActualCLP}
                     </div>
                     <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>Dólar Observado Actual (CLP)</div>
                     {fechaActualizacionDivisas && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Última act: {fechaActualizacionDivisas}</div>}
                 </div>
             ) : (
                 <div style={{...currencyDisplayStyle, textAlign: 'center', color: secondaryTextColor }}>
                     Dólar no disponible.
                 </div>
             )}

             {/* Tarjeta Euro */} 
             {euroActualCLP !== null ? (
                 <div style={currencyDisplayStyle}>
                     <div style={{ ...currencyValueStyle, color: primaryTextColor }}>
                         <Euro size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
                         {euroActualCLP}
                     </div>
                     <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>Euro Observado Actual (CLP)</div>
                     {fechaActualizacionDivisas && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Última act: {fechaActualizacionDivisas}</div>}
                 </div>
             ) : (
                 <div style={{...currencyDisplayStyle, textAlign: 'center', color: secondaryTextColor }}>
                     Euro no disponible.
                 </div>
             )}
            </>
         )}

        {/* Columna Botón Actualizar (solo si no hay error inicial grave) */} 
        {!(initialCurrencyLoading && !isUpdatingCurrencies && currencyUpdateError) && (
            <button 
                onClick={handleActualizarDivisas} 
                style={{...secondaryButtonStyle, alignSelf: 'center' /* Centrar verticalmente */}} 
                disabled={isUpdatingCurrencies || initialCurrencyLoading}
                title="Actualizar valor Dólar/Euro desde Webhook"
            >
                <RefreshCw size={16} className={(isUpdatingCurrencies || initialCurrencyLoading) ? 'animate-spin' : ''} />
                {(isUpdatingCurrencies || initialCurrencyLoading) ? 'Actualizando...' : 'Actualizar'}
            </button>
        )}
      </div>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Perfiles</h1>
        <button onClick={handleCreateNewProfile} style={primaryButtonStyle} title="Crear nuevo perfil basado en costos actuales">
          <PlusCircle size={16} />
          Crear Nuevo Perfil
        </button>
      </div>

      {/* --- Estado de Carga/Error para la LISTA de perfiles --- */}
      {loading && !error && (
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
          No se encontraron perfiles guardados en la base de datos.
        </div>
      )}

      {/* --- Grid de Perfiles (Renderiza desde el estado 'profiles') --- */}
      {!loading && !error && profiles.length > 0 && (
        <div style={gridStyle}>
          {profiles.map((profile) => (
            <div key={profile.id} style={cardStyle}>
              <div> 
                <h2 style={cardTitleStyle}>{profile.nombre}</h2> {/* Usar profile.nombre */} 
                {profile.fechaCreacion && (
                    <p style={cardDateStyle}>
                       {/* Intentar formatear la fecha */} 
                       Creado: {(() => {
                           try {
                               return new Date(profile.fechaCreacion!).toLocaleDateString('es-CL');
                           } catch { return 'Fecha inválida'; }
                       })()}
                    </p>
                )}
                {/* Usar descripción generada o añadir una si viene de la BD */}
                {profile.descripcion && (
                  <p style={cardDescriptionStyle}>{profile.descripcion}</p>
                )}
                 {!profile.descripcion && <div style={{minHeight: '30px'}}></div>}
              </div>
              <div style={cardActionsStyle}>
                {/* Botón Ver Perfil */}
                <button 
                   onClick={() => handleViewProfile(profile.id)} 
                   style={iconButtonStyle} 
                   title="Ver Detalles"
                   disabled={loadingViewProfile === profile.id} 
                >
                  {loadingViewProfile === profile.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                </button>
                {/* Botón Editar Perfil (ahora funcional) */}
                <button 
                   onClick={() => handleEditProfile(profile.id)} // Llama a la nueva función
                   style={iconButtonStyle} 
                   title="Editar Perfil"
                >
                  <Edit size={16} />
                </button>
                {/* Botón Eliminar */}
                <button 
                   onClick={() => handleDeleteProfile(profile.id)} 
                   style={{...iconButtonStyle, color: '#dc2626'}} 
                   title="Eliminar Perfil"
                   disabled={deletingProfileId === profile.id} 
                >
                  {deletingProfileId === profile.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* --- Renderizar el Modal --- */} 
      <ProfileViewModal 
         profileData={viewingProfileData} 
         onClose={() => setIsViewModalOpen(false)} 
      />
      
      {/* --- Mostrar Error de Carga de Perfil (Opcional) --- */} 
      {errorViewProfile && (
          <div style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>
             Error al cargar perfil: {errorViewProfile}
          </div>
      )}
      
      {/* --- Mostrar Error de Eliminación (Opcional) --- */} 
      {deleteError && (
          <div style={{ color: 'red', marginTop: '15px', textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px' }}>
             Error al eliminar perfil: {deleteError}
          </div>
      )}
    </div>
  );
} 