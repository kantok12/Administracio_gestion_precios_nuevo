import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PricingOverrideData } from '../types'; // Types from the types folder
import { getPerfilById, updatePerfil } from '../services/perfilService.ts'; // Service functions - trying with .ts extension

// Helper function to format date for display (optional)
const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    // Format as YYYY-MM-DD for date input
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return ''; // Return empty if date is invalid
  }
};


const PerfilEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get profile ID from URL
  const navigate = useNavigate();
  const [perfilData, setPerfilData] = useState<PricingOverrideData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!id) {
        setError('No se proporcionó un ID de perfil.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        console.log(`[PerfilEditForm] Fetching profile with ID: ${id}`);
        // Replace with your actual API call function
        const data = await getPerfilById(id); 
        console.log(`[PerfilEditForm] Profile data received:`, data);
        // Initialize costos if it's missing or empty
        setPerfilData({ ...data, costos: data.costos || {} });
      } catch (err: any) {
        console.error('[PerfilEditForm] Error fetching profile:', err);
        setError(err.message || 'Error al cargar los datos del perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [id]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    
    // Determine the correct value type (number or string)
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;

    if (perfilData) {
      // Handle nested 'costos' fields
      if (name.startsWith('costos.')) {
        const costField = name.split('.')[1];
        setPerfilData({
          ...perfilData,
          costos: {
            ...perfilData.costos,
            [costField]: parsedValue,
          },
        });
      } else if (name === 'fecha_ultima_actualizacion_transporte_local') {
          // Special handling for date - ensure it goes into costos
           setPerfilData({
             ...perfilData,
             costos: {
               ...perfilData.costos,
               fecha_ultima_actualizacion_transporte_local: value || null, // Store as string or null
             },
           });
      } else {
         // Handle top-level fields (like _id, nivel - though usually not editable)
         // This example prevents editing _id and nivel
         if (name !== '_id' && name !== 'nivel') {
             // setPerfilData({ ...perfilData, [name]: parsedValue }); 
             // ^-- If other top-level fields were editable
         }
      }
    }
  };
  
  // Specific handler for date changes
  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
     const { name, value } = event.target;
     if (perfilData && name === 'costos.fecha_ultima_actualizacion_transporte_local') {
         setPerfilData({
           ...perfilData,
           costos: {
             ...perfilData.costos,
             // Store date as string YYYY-MM-DD or null if cleared
             fecha_ultima_actualizacion_transporte_local: value ? value : null, 
           },
         });
     }
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !perfilData) {
      setError('No hay datos de perfil para guardar.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      console.log('[PerfilEditForm] Attempting to update profile:', id, perfilData);
      // Prepare data payload, potentially cleaning or validating
      const payload: Partial<PricingOverrideData> = {
        costos: perfilData.costos,
        // Include other fields if they are meant to be updatable
        // metadata might be updated automatically on backend
      };
      
      // Replace with your actual API update function
      await updatePerfil(id, payload); 
      console.log('[PerfilEditForm] Profile updated successfully');
      // Optionally show a success message before navigating
      alert('Perfil actualizado exitosamente!'); // Replace with snackbar/toast if preferred
      navigate('/admin/perfiles'); // Navigate back to the profiles list or wherever appropriate
    } catch (err: any) {
      console.error('[PerfilEditForm] Error updating profile:', err);
      setError(err.response?.data?.message || err.message || 'Error al guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderTextField = (name: string, label: string, type: string = 'number', required: boolean = false, adornment?: string) => {
      const fieldName = name.startsWith('costos.') ? name.split('.')[1] : name;
      const value = name.startsWith('costos.') 
          ? perfilData?.costos?.[fieldName as keyof typeof perfilData.costos] ?? '' 
          : perfilData?.[fieldName as keyof PricingOverrideData] ?? '';

      // Format percentage fields (assuming they are stored as decimals 0-1)
      const displayValue = (type === 'number' && typeof value === 'number' && (name.includes('buffer_') || name.includes('tasa_') || name.includes('descuento_') || name.includes('factor_') || name.includes('derecho_') || name.includes('iva'))) 
        ? value * 100 
        : value;
        
      // Adjust step for percentage inputs
      const step = (type === 'number' && (name.includes('buffer_') || name.includes('tasa_') || name.includes('descuento_') || name.includes('factor_') || name.includes('derecho_') || name.includes('iva'))) 
        ? '0.1' 
        : 'any'; // Default step for other numbers

      return (
          <TextField
              fullWidth
              variant="outlined"
              margin="normal"
              label={label}
              name={name}
              type={type === 'percentage' ? 'number' : type} // Use number type for percentages
              value={displayValue}
              onChange={handleInputChange}
              required={required}
              InputProps={adornment ? {
                   endAdornment: <InputAdornment position="end">{adornment}</InputAdornment>,
              } : undefined}
              InputLabelProps={{
                   shrink: true, // Keep label floated for pre-filled values
              }}
               inputProps={{
                 step: step // Allow decimals for number inputs
               }}
          />
      );
  };
  

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !perfilData) { // Show error only if data couldn't be loaded at all
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)} // Go back
            sx={{ mt: 2 }}
        >
            Volver
        </Button>
      </Container>
    );
  }
  
  if (!perfilData) {
       // This case might happen if loading finished but data is still null without an error (unlikely with current logic)
       return <Container><Typography>No se encontraron datos para este perfil.</Typography></Container>;
   }


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
       <Typography variant="h4" gutterBottom>
         Editar Perfil: {perfilData._id === 'global' ? 'Global' : perfilData._id}
       </Typography>
       <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Display Non-Editable Info */}
           <Box sx={{ mb: 3 }}>
               <Typography variant="h6">Información del Perfil</Typography>
               <TextField label="ID Perfil" value={perfilData._id} margin="normal" fullWidth disabled InputLabelProps={{ shrink: true }} />
               <TextField label="Nivel" value={perfilData.nivel} margin="normal" fullWidth disabled InputLabelProps={{ shrink: true }}/>
               {perfilData.nivel === 'categoria' && perfilData.categoryId &&
                   <TextField label="ID Categoría" value={perfilData.categoryId} margin="normal" fullWidth disabled InputLabelProps={{ shrink: true }}/>
               }
               {perfilData.nivel === 'producto' && perfilData.productId &&
                   <TextField label="ID Producto" value={perfilData.productId} margin="normal" fullWidth disabled InputLabelProps={{ shrink: true }}/>
               }
           </Box>

           <Divider sx={{ my: 3 }} />

          {/* Costos Section */}
          <Typography variant="h6" gutterBottom>Parámetros de Costos</Typography>

          <Grid container spacing={2}>
             {/* Tipo de Cambio y Buffers */}
             <Grid item xs={12} sm={6} md={4}>
                 <Typography variant="subtitle1" gutterBottom>Tipo de Cambio y Buffers</Typography>
                 {renderTextField("costos.tipo_cambio_eur_usd", "Tipo de Cambio EUR/USD")}
                 {renderTextField("costos.buffer_eur_usd", "Buffer EUR/USD (%)", 'number', false, '%')}
                 {renderTextField("costos.dolar_observado_actual", "Dólar Observado Actual (CLP)")}
                 {renderTextField("costos.buffer_usd_clp", "Buffer USD/CLP (%)", 'number', false, '%')}
             </Grid>

             {/* Parámetros de Margen y Seguro */}
             <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle1" gutterBottom>Parámetros de Margen y Seguro</Typography>
                  {renderTextField("costos.margen_adicional_total", "Margen Total (%)", 'number', false, '%')}
                  {renderTextField("costos.tasa_seguro", "Tasa de Seguro (%)", 'number', false, '%')}
                  {renderTextField("costos.descuento_fabricante", "Descuento Fabricante (%)", 'number', false, '%')}
                  {renderTextField("costos.factor_actualizacion_anual", "Factor Actualización Anual (%)", 'number', false, '%')}
             </Grid>
             
             {/* Parámetros de Transporte */}
            <Grid item xs={12} sm={6} md={4}>
                 <Typography variant="subtitle1" gutterBottom>Parámetros de Transporte</Typography>
                 {renderTextField("costos.buffer_transporte", "Buffer Transporte (%)", 'number', false, '%')}
                 {renderTextField("costos.transporte_local_eur", "Transporte Local (EUR)", 'number', false, 'EUR')}
                 {renderTextField("costos.transporte_nacional_clp", "Transporte Nacional (CLP)", 'number', false, 'CLP')}
                  <TextField
                       fullWidth
                       variant="outlined"
                       margin="normal"
                       label="Fecha Última Actualización Tarifas Transporte"
                       name="costos.fecha_ultima_actualizacion_transporte_local"
                       type="date"
                       value={formatDateForInput(perfilData.costos?.fecha_ultima_actualizacion_transporte_local)}
                       onChange={handleDateChange} // Use specific handler for date
                       InputLabelProps={{
                           shrink: true,
                       }}
                   />
             </Grid>
             
             <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid> {/* Separator */}

             {/* Costos Adicionales (EUR) */}
            <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle1" gutterBottom>Costos Adicionales (EUR)</Typography>
                 {renderTextField("costos.costo_fabrica_original_eur", "Costo Fábrica Referencial (EUR)", 'number', false, 'EUR')}
                 {renderTextField("costos.gasto_importacion_eur", "Gasto Importación (EUR)", 'number', false, 'EUR')}
             </Grid>

             {/* Costos Adicionales (USD) */}
             <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle1" gutterBottom>Costos Adicionales (USD)</Typography>
                  {renderTextField("costos.flete_maritimo_usd", "Flete Marítimo (USD)", 'number', false, 'USD')}
                  {renderTextField("costos.recargos_destino_usd", "Recargos Destino (USD)", 'number', false, 'USD')}
                  {renderTextField("costos.honorarios_agente_aduana_usd", "Honorarios Agente Aduana (USD)", 'number', false, 'USD')}
                  {renderTextField("costos.gastos_portuarios_otros_usd", "Gastos Portuarios/Otros (USD)", 'number', false, 'USD')}
             </Grid>

             {/* Impuestos */}
             <Grid item xs={12} sm={6} md={4}>
                 <Typography variant="subtitle1" gutterBottom>Impuestos</Typography>
                 {renderTextField("costos.derecho_ad_valorem", "Derecho Ad Valorem (%)", 'number', false, '%')}
                 {renderTextField("costos.iva", "IVA (%)", 'number', false, '%')}
             </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
             <Button
               variant="outlined"
               startIcon={<ArrowBackIcon />}
               onClick={() => navigate(-1)} // Go back to previous page
             >
               Cancelar
             </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSaving || loading}
              startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Box>
        </form>
       </Paper>
    </Container>
  );
};

export default PerfilEditForm; 