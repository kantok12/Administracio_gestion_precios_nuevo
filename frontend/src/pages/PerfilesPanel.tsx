import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Eye, Edit, Trash2, PlusCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api'; 
import { CostoPerfilData } from '../types'; 
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import PerfilEditForm from './PerfilEditForm';

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

  // --- Nuevos estados para la creación ---
  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  useEffect(() => {
    loadPerfiles();
  }, [loadPerfiles]);

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
  
  const handleCreateProfile = async () => {
      setIsCreatingProfile(true);
      setCreateError(null);
      try {
          console.log('[PerfilesPanel] Creando nuevo perfil...');

          // Objeto con todos los campos requeridos y valores por defecto del backend
          const defaultProfileData = {
              nombre: 'Nuevo Perfil (Editar)',
              descripcion: '', // Valor por defecto para campo opcional
              activo: true, // Coincide con el default del backend
              descuento_fabrica_pct: 0,
              factor_actualizacion_anual: 1, // Coincide con el default del backend
              costo_origen_transporte_eur: 0,
              costo_origen_gastos_export_eur: 0,
              flete_maritimo_usd: 0,
              recargos_destino_usd: 0,
              tasa_seguro_pct: 0,
              honorarios_agente_aduana_usd: 0,
              gastos_portuarios_otros_usd: 0,
              derecho_advalorem_pct: 0.06, // Coincide con el default del backend
              transporte_nacional_clp: 0,
              buffer_eur_usd_pct: 0,
              buffer_usd_clp_pct: 0,
              margen_total_pct: 0,
              iva_pct: 0.19, // Coincide con el default del backend
          };

          // Llamada a la API para crear un perfil con datos por defecto
          const newProfile = await api.createProfile(defaultProfileData);

          console.log('[PerfilesPanel] Nuevo perfil creado:', newProfile);

          if (newProfile && newProfile._id) {
              // Navegar a la página de edición del nuevo perfil
              navigate(`/perfiles/${newProfile._id}/editar`);
          } else {
              console.error('[PerfilesPanel] La respuesta de creación no contiene un ID:', newProfile);
              setCreateError('Error: No se recibió el ID del nuevo perfil.');
          }
      } catch (err: any) {
          console.error('[PerfilesPanel] Error creando perfil:', err);
          // Intentar mostrar un mensaje más detallado del error 400 si está disponible
          const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Error al crear el perfil. Intente de nuevo.';
          setCreateError(`Error al crear el perfil: ${errorMessage}`);
      } finally {
          setIsCreatingProfile(false);
      }
  };

  // --- Styles (definiciones de estilo omitidas por brevedad) ---
  const gridStyle: React.CSSProperties = { /* ... */ };
  const cardStyle: React.CSSProperties = { /* ... */ };
  const cardTitleStyle: React.CSSProperties = { /* ... */ };
  const cardDateStyle: React.CSSProperties = { /* ... */ };
  const cardDescriptionStyle: React.CSSProperties = { /* ... */ };
  const cardActionsStyle: React.CSSProperties = { /* ... */ };
  const iconButtonStyle: React.CSSProperties = { /* ... */ };
  const loadingErrorStyle: React.CSSProperties = { /* ... */ };
  const modalStyle: React.CSSProperties = { /* ... */ };


  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
           <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Gestión de Perfiles de Costos</h1>
           <button
               onClick={handleCreateProfile}
               style={{...iconButtonStyle, padding: '8px 12px', background: isCreatingProfile ? '#9CA3AF' : '#10B981', color: 'white', borderRadius: '4px', cursor: isCreatingProfile ? 'not-allowed' : 'pointer' }}
               disabled={isCreatingProfile}
           >
               {isCreatingProfile ? (
                   <Loader2 size={18} className="animate-spin" style={{ marginRight: '5px' }} />
               ) : (
                   <PlusCircle size={18} style={{ marginRight: '5px' }} />
               )}
               {isCreatingProfile ? 'Creando...' : 'Crear Perfil'}
           </button>
       </div>

       {/* Mensaje de error durante la creación */}
       {createError && (
           <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '10px', borderRadius: '4px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
               <AlertTriangle size={18} style={{ marginRight: '8px' }} />
               {createError}
           </div>
       )}

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

      {!isLoading && !error && perfiles.length === 0 && (
          <div style={loadingErrorStyle}>No se encontraron perfiles.</div>
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
      
      <ViewProfileModal 
          isOpen={isViewModalOpen} 
          onClose={handleCloseViewModal} 
          profileData={viewingProfile}
          error={viewError}
      />
      
      {isEditModalOpen && editingProfileId && (
          <Modal open={isEditModalOpen} onClose={handleCloseEditModal} aria-labelledby="edit-profile-modal-title">
              <Box sx={{ 
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                  width: 400, bgcolor: 'background.paper', border: '2px solid #000', 
                  boxShadow: 24, p: 4 
              }}> 
                  <h2 id="edit-profile-modal-title">Editar Perfil</h2>
                  <p><i>(Formulario de edición se mostrará aquí - Componente PerfilEditForm necesita ajuste)</i></p>
                  <button onClick={handleCloseEditModal}>Cerrar</button> 
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
    <Modal open={isOpen} onClose={onClose} aria-labelledby="view-profile-modal-title">
      <Box sx={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          width: '90%', maxWidth: '600px', bgcolor: 'background.paper', 
          border: '1px solid #ccc', borderRadius: '8px', boxShadow: 24, p: 4, 
          maxHeight: '85vh', overflowY: 'auto' 
      }}> 
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 id="view-profile-modal-title">Detalles del Perfil</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={20} /></button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!error && !profileData && <p>Cargando detalles...</p>}
        
        {profileData && (
            <div>
                <p><strong>ID:</strong> {profileData._id}</p>
                <p><strong>Nombre:</strong> {profileData.nombre}</p>
                <p><strong>Descripción:</strong> {profileData.descripcion || 'N/A'}</p>
                <p><strong>Activo:</strong> {profileData.activo ? 'Sí' : 'No'}</p>
                <hr style={{ margin: '10px 0' }}/>
                <h4>Parámetros:</h4>
                <p>Descuento Fábrica (%): {profileData.descuento_fabrica_pct * 100}%</p>
                <p>Margen Total (%): {profileData.margen_total_pct * 100}%</p>
                <hr style={{ margin: '10px 0' }}/>
                <p><strong>Creado:</strong> {profileData.createdAt ? (() => {
                    try {
                        return new Date(profileData.createdAt).toLocaleDateString('es-CL');
                    } catch { return 'Fecha inválida'; }
                })() : 'N/A'}</p>
                <p><i>Actualizado: {profileData.updatedAt ? (() => {
                   try {
                       return new Date(profileData.updatedAt).toLocaleString('es-CL');
                   } catch { return 'Fecha inválida'; }
               })() : 'N/A'}</i></p>
            </div>
        )}
      </Box>
    </Modal>
  );
}; 