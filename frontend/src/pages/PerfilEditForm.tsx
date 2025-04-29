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
  Switch,
  FormControlLabel
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CostoPerfilData } from '../types'; // Usar el tipo correcto
import { api } from '../services/api'; // Usar el servicio unificado

// Helper para formatear números (opcional, si se necesita mostrar diferente a como se almacena)
const formatNumberForInput = (value: number | string | boolean | undefined | null): string => {
  if (value === null || value === undefined) return '';
  return String(value); // Simplemente convertir a string para el input
};


const PerfilEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get profile ID from URL
  const navigate = useNavigate();
  // Cambiar tipo de estado a CostoPerfilData
  const [perfilData, setPerfilData] = useState<Partial<CostoPerfilData>>({}); // Usar Partial para el estado inicial
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
        // Usar la función correcta del servicio api
        const data = await api.fetchProfileData(id);
        if (data) {
          console.log(`[PerfilEditForm] Profile data received:`, data);
          setPerfilData(data);
        } else {
          setError(`No se encontró un perfil con ID: ${id}`);
        }
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
    const { name, value, type, checked } = event.target as HTMLInputElement; // Asegurar tipo para checked

    // Determinar el valor correcto (número, booleano o string)
    let parsedValue: string | number | boolean = value;
    if (type === 'number') {
      parsedValue = parseFloat(value) || 0;
      // Si es un campo de porcentaje, dividir por 100 antes de guardar (si se muestran como 0-100)
      // Asegúrate que los nombres coincidan con tus campos de porcentaje
      if (name.endsWith('_pct')) {
        parsedValue = (parseFloat(value) || 0) / 100;
      }
    } else if (type === 'checkbox') {
      parsedValue = checked;
    }

    setPerfilData(prevData => ({
      ...prevData,
      [name]: parsedValue,
    }));
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
      // Preparar payload eliminando campos no actualizables si es necesario
      const { _id, createdAt, updatedAt, ...updatePayload } = perfilData;

      // Usar la función correcta del servicio api
      await api.updateProfile(id, updatePayload);
      console.log('[PerfilEditForm] Profile updated successfully');
      alert('Perfil actualizado exitosamente!');
      navigate('/admin/perfiles'); // Volver a la lista de perfiles
    } catch (err: any) {
      console.error('[PerfilEditForm] Error updating profile:', err);
      setError(err.response?.data?.message || err.message || 'Error al guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Función renderizadora simplificada para CostoPerfilData
  const renderTextField = (fieldName: keyof Omit<CostoPerfilData, '_id' | 'createdAt' | 'updatedAt'>, label: string, type: string = 'text', required: boolean = false, adornment?: string) => {
      let value: string | number = formatNumberForInput(perfilData?.[fieldName]);
      let inputType = type;

      // Manejo especial para porcentajes (mostrar como 0-100)
      if (fieldName.endsWith('_pct') && typeof perfilData?.[fieldName] === 'number') {
          value = ( (perfilData[fieldName] as number) * 100 ).toString();
          inputType = 'number'; // Los porcentajes son números
      }

      return (
          <TextField
              fullWidth
              variant="outlined"
              margin="normal"
              label={label}
              name={fieldName}
              type={inputType}
              value={value}
              onChange={handleInputChange}
              required={required}
              InputProps={adornment ? {
                   endAdornment: <InputAdornment position="end">{adornment}</InputAdornment>,
              } : undefined}
              InputLabelProps={{
                   shrink: true,
              }}
              inputProps={{
                 step: inputType === 'number' ? (fieldName.endsWith('_pct') ? '0.1' : 'any') : undefined
               }}
              disabled={isSaving || loading}
          />
      );
  };

  if (loading) {
    return <Container><Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box></Container>;
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/perfiles')} // Volver atrás
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Container>
    );
  }

  return (
    <Container component={Paper} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h4" gutterBottom>Editar Perfil de Costo</Typography>
      <Typography variant="subtitle1" gutterBottom color="textSecondary">ID: {id}</Typography>
      <Divider sx={{ my: 2 }} />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Campos Generales */}
          <Grid item xs={12} md={6}>
            {renderTextField('nombre', 'Nombre del Perfil', 'text', true)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderTextField('descripcion', 'Descripción', 'text')}
          </Grid>
          <Grid item xs={12}>
             <FormControlLabel
                control={<Switch checked={!!perfilData?.activo} onChange={handleInputChange} name="activo" disabled={isSaving || loading} />}
                label="Perfil Activo"
             />
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 2 }}>Parámetros de Costo</Divider></Grid>

          {/* Campos Numéricos - Agrupados o individuales según preferencia */}
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('descuento_fabrica_pct', 'Descuento Fábrica', 'number', false, '%')}
          </Grid>
           <Grid item xs={12} sm={6} md={4}>
             {renderTextField('factor_actualizacion_anual', 'Factor Actualización Anual', 'number', false, '%')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('margen_total_pct', 'Margen Total', 'number', false, '%')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('tasa_seguro_pct', 'Tasa Seguro', 'number', false, '%')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('derecho_advalorem_pct', 'Derecho AdValorem', 'number', false, '%')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('iva_pct', 'IVA', 'number', false, '%')}
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 2 }}>Buffers de Cambio</Divider></Grid>
          <Grid item xs={12} sm={6}>
             {renderTextField('buffer_eur_usd_pct', 'Buffer EUR/USD', 'number', false, '%')}
          </Grid>
          <Grid item xs={12} sm={6}>
             {renderTextField('buffer_usd_clp_pct', 'Buffer USD/CLP', 'number', false, '%')}
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 2 }}>Costos Logísticos</Divider></Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('costo_origen_transporte_eur', 'Transporte Origen', 'number', false, 'EUR')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('costo_origen_gastos_export_eur', 'Gastos Export Origen', 'number', false, 'EUR')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('flete_maritimo_usd', 'Flete Marítimo', 'number', false, 'USD')}
          </Grid>
           <Grid item xs={12} sm={6} md={4}>
             {renderTextField('recargos_destino_usd', 'Recargos Destino', 'number', false, 'USD')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('honorarios_agente_aduana_usd', 'Honorarios Agente Aduana', 'number', false, 'USD')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('gastos_portuarios_otros_usd', 'Gastos Portuarios/Otros', 'number', false, 'USD')}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             {renderTextField('transporte_nacional_clp', 'Transporte Nacional', 'number', false, 'CLP')}
          </Grid>

          {/* Botones de Acción */}
          <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/perfiles')} // Volver atrás
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={isSaving || loading}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Mostrar error general del formulario si existe */}
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

    </Container>
  );
};

export default PerfilEditForm; 