import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Loader2, AlertTriangle, Eye, Edit, Trash2, PlusCircle, XCircle, RefreshCw, DollarSign, Euro } from 'lucide-react';
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
    Divider
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
          
          // Usar el nombre ingresado
          const defaultProfileData = {
              nombre: newProfileName.trim(), 
              descripcion: '',
              activo: true, 
              descuento_fabrica_pct: 0,
              factor_actualizacion_anual: 1, 
              costo_origen_transporte_eur: 0,
              costo_origen_gastos_export_eur: 0,
              flete_maritimo_usd: 0,
              recargos_destino_usd: 0,
              tasa_seguro_pct: 0,
              honorarios_agente_aduana_usd: 0,
              gastos_portuarios_otros_usd: 0,
              derecho_advalorem_pct: 0.06, 
              transporte_nacional_clp: 0,
              buffer_eur_usd_pct: 0,
              buffer_usd_clp_pct: 0,
              margen_total_pct: 0,
              iva_pct: 0.19, 
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
           <Button
               variant="contained"
               startIcon={<PlusCircle size={18} />}
               onClick={handleOpenCreateModal}
               style={{ backgroundColor: '#10B981', color: 'white' }}
            >
               Crear Perfil
           </Button>
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
          {perfiles.map((perfil) => (
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
    <Dialog open={isOpen} onClose={onClose} aria-labelledby="view-profile-dialog-title" maxWidth="sm" fullWidth>
      <DialogTitle id="view-profile-dialog-title">
        Detalles del Perfil
        <Button onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><XCircle size={20} /></Button>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        {!error && !profileData && <Box sx={{ textAlign: 'center', p: 3 }}><CircularProgress /></Box>}
        
        {profileData && (
            <Box>
                <Typography variant="body1" gutterBottom><strong>ID:</strong> {profileData._id}</Typography>
                <Typography variant="body1" gutterBottom><strong>Nombre:</strong> {profileData.nombre}</Typography>
                <Typography variant="body1" gutterBottom><strong>Descripción:</strong> {profileData.descripcion || 'N/A'}</Typography>
                <Typography variant="body1" gutterBottom><strong>Activo:</strong> {profileData.activo ? 'Sí' : 'No'}</Typography>
                <Divider sx={{ my: 1.5 }}/>
                <Typography variant="subtitle1" gutterBottom>Parámetros:</Typography>
                <Grid container spacing={1}>
                    <Grid item xs={6}><Typography variant="body2">Descuento Fábrica:</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2" align="right">{formatPercent(profileData.descuento_fabrica_pct)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2">Margen Total:</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2" align="right">{formatPercent(profileData.margen_total_pct)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2">IVA:</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2" align="right">{formatPercent(profileData.iva_pct)}</Typography></Grid>
                </Grid>
                <Divider sx={{ my: 1.5 }}/>
                <Typography variant="caption" display="block">Creado: {profileData.createdAt ? new Date(profileData.createdAt).toLocaleString('es-CL') : 'N/A'}</Typography>
                <Typography variant="caption" display="block">Actualizado: {profileData.updatedAt ? new Date(profileData.updatedAt).toLocaleString('es-CL') : 'N/A'}</Typography>
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