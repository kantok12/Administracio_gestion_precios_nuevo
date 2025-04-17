import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import OpcionalesCotizacionModal from '../components/OpcionalesCotizacionModal';
import DetallesCargaPanel from './DetallesCargaPanel';

// Interfaces (copiadas de App.tsx)
interface Producto {
  codigo_producto?: string;
  nombre_del_producto?: string;
  Descripcion?: string;
  Modelo?: string;
  categoria?: string;
  pf_eur?: string | number;
  dimensiones?: string;
  PESO?: string | null;
  transporte_nacional?: string;
  ay?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    currencies: {
      dollar: {
        value: number | null;
        last_update: string | null;
        fecha: string | null;
      };
      euro: {
        value: number | null;
        last_update: string | null;
        fecha: string | null;
      };
    };
    products: {
      total: number;
      data: Producto[];
    };
  };
  timestamp: string;
  message?: string;
  error?: string;
}

interface EspecificacionTecnica {
  caracteristica: string;
  especificacion: string;
}

// Interfaz para la respuesta de opcionales
interface OpcionalesResponse {
  total: number;
  products: Producto[];
}

export default function EquiposPanel() {
  // Estados principales (movidos de App.tsx)
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosOriginales, setProductosOriginales] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas las categorías');
  const [categorias, setCategorias] = useState<string[]>(['Todas las categorías']);
  const [totalMostrado, setTotalMostrado] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [loadingOpcionales, setLoadingOpcionales] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [detalleProducto, setDetalleProducto] = useState<Producto | null>(null);
  const [opcionalesLoading, setOpcionalesLoading] = useState(false);
  const [opcionalesError, setOpcionalesError] = useState<string | null>(null);
  const [opcionalesData, setOpcionalesData] = useState<Producto[]>([]);
  const [showCotizacionModal, setShowCotizacionModal] = useState(false);
  const [productoParaCotizar, setProductoParaCotizar] = useState<Producto | null>(null);

  // NUEVOS Estados para Vista/Modal Opcionales (botón Opcionales)
  const [showVistaOpcionalesModal, setShowVistaOpcionalesModal] = useState(false);
  const [productoParaVistaOpcionales, setProductoParaVistaOpcionales] = useState<Producto | null>(null);
  const [vistaOpcionalesData, setVistaOpcionalesData] = useState<Producto[]>([]);
  const [vistaOpcionalesLoading, setVistaOpcionalesLoading] = useState(false);
  const [vistaOpcionalesError, setVistaOpcionalesError] = useState<string | null>(null);
  const [loadingOpcionalesBtn, setLoadingOpcionalesBtn] = useState<string | null>(null);

  // --- NUEVO: Estados para el Flujo de Cotización ---
  const [pasoCotizacion, setPasoCotizacion] = useState<number>(0); // 0: Tabla Equipos, 1: Detalles Carga, ...
  const [opcionalesConfirmados, setOpcionalesConfirmados] = useState<Producto[]>([]); // Guarda los opcionales seleccionados

  // --- Estilos Unificados (Basados en Ver Detalle) ---
  const unifiedModalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1040 };
  const unifiedModalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' };
  const unifiedHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#EBF8FF' }; // Azul claro header
  const unifiedTitleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e88e5' }; // Reducido a 16px
  const unifiedCloseButtonStyle: React.CSSProperties = { backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', color: '#1e40af' };
  const unifiedBodyStyle: React.CSSProperties = { flexGrow: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F9FAFB' }; // Gris claro body
  const unifiedTableContainerStyle: React.CSSProperties = { overflowX: 'auto' }; // Contenedor tabla por si acaso
  const unifiedTableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' };
  const unifiedThStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', backgroundColor: '#f3f4f6' }; // Mantenido (o 13px si se prefiere)
  const unifiedTdStyle: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top', fontSize: '13px', color: '#4B5563' }; // Reducido a 13px
  const unifiedFooterStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f8f9fa' }; // Gris claro footer
  const unifiedSecondaryButtonStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }; // Reducido a 13px
  const unifiedDisabledSecondaryButtonStyle: React.CSSProperties = { ...unifiedSecondaryButtonStyle, backgroundColor: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' };

  // Funciones (movidas de App.tsx)
  const handleVerDetalle = async (producto: Producto) => {
     setLoadingDetail(producto.codigo_producto || null);
    try {
      if (!producto.codigo_producto) {
        throw new Error('El código de producto es requerido');
      }
      console.log(`Obteniendo detalles para producto ${producto.codigo_producto}`);
      const response = await fetch(`http://localhost:5001/api/products/detail?codigo=${producto.codigo_producto}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        setDetalleProducto(data.data.product);
        setShowDetalleModal(true);
        console.log('Detalles del producto recibidos:', data.data.product);
      } else {
        throw new Error('Producto no encontrado o formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error al obtener detalles del producto:', error);
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleOpcionales = async (producto: Producto) => {
    console.log("Obteniendo opcionales (vista simple) para:", producto.codigo_producto);
    setProductoParaVistaOpcionales(producto);
    setShowVistaOpcionalesModal(true);
    
    setVistaOpcionalesLoading(true);
    setVistaOpcionalesError(null);
    setVistaOpcionalesData([]);
    setLoadingOpcionalesBtn(producto.codigo_producto || null);

    try {
      if (!producto.codigo_producto || !producto.Modelo || !producto.categoria) {
        throw new Error('Faltan parámetros requeridos (código, modelo o categoría) para obtener opcionales');
      }
      const params = new URLSearchParams();
      params.append('codigo', producto.codigo_producto);
      params.append('modelo', producto.Modelo);
      params.append('categoria', producto.categoria);
      const url = `http://localhost:5001/api/products/opcionales?${params.toString()}`;
      console.log('Consultando opcionales (vista simple):', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor al obtener opcionales (vista simple): ${response.status}`);
      }
      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data.products)) {
        setVistaOpcionalesData(data.data.products);
      } else {
        throw new Error('Formato de respuesta de opcionales inválido (vista simple)');
      }
    } catch (error: any) {
      console.error('Error al obtener opcionales (vista simple):', error);
      if (error.name === 'AbortError') {
         setVistaOpcionalesError('La solicitud tardó demasiado.');
      } else if (error.message.includes('Failed to fetch')) {
        setVistaOpcionalesError('Error de conexión al obtener opcionales.');
      } else {
         setVistaOpcionalesError(error instanceof Error ? error.message : 'Error desconocido');
      }
      setVistaOpcionalesData([]);
    } finally {
      setVistaOpcionalesLoading(false);
      setLoadingOpcionalesBtn(null);
    }
  };

  const handleConfigurar = async (producto: Producto) => {
    console.log("Abriendo selección de opcionales para:", producto.nombre_del_producto);
    setProductoParaCotizar(producto);
    setOpcionalesLoading(true); // Mostrar loading en el modal mientras carga
    setOpcionalesError(null);
    setOpcionalesData([]);
    setShowCotizacionModal(true); // Abrir el modal de selección
    setLoadingSettings(producto.codigo_producto || null);

    try {
      if (!producto.codigo_producto || !producto.Modelo || !producto.categoria) {
         throw new Error('Faltan parámetros requeridos (código, modelo o categoría)');
      }
      const params = new URLSearchParams();
      params.append('codigo', producto.codigo_producto);
      params.append('modelo', producto.Modelo);
      params.append('categoria', producto.categoria);
      const url = `http://localhost:5001/api/products/opcionales?${params.toString()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data.products)) {
        setOpcionalesData(data.data.products); // Cargar datos para el modal
      } else {
         throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
       console.error('Error al obtener opcionales para modal configuración:', error);
       setOpcionalesError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
       setOpcionalesLoading(false); // Terminar carga del modal
       setLoadingSettings(null);
    }
  };
  
  const handleCloseModal = () => {
    setShowVistaOpcionalesModal(false);
    setProductoParaVistaOpcionales(null);
    setVistaOpcionalesData([]);
    setVistaOpcionalesError(null);
  };
  
  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    console.log("Obteniendo productos del caché...");
    try {
      const res = await fetch('http://localhost:5001/api/products/cache/all');
      if (!res.ok) throw new Error(`Error en la respuesta del servidor: ${res.status}`);
      const response: ApiResponse = await res.json();
      console.log("Datos recibidos del caché:", response);
      if (!response.success) {
        throw new Error(response.message || 'Error en la respuesta del servidor');
      }
      const productosRecibidos = response.data.products.data;
      console.log(`Se encontraron ${productosRecibidos.length} productos`);
      const todasCategorias = ['Todas las categorías'];
      productosRecibidos.forEach((producto: Producto) => {
        if (producto.categoria && !todasCategorias.includes(producto.categoria)) {
          todasCategorias.push(producto.categoria);
        }
      });
      setCategorias(todasCategorias);
      setProductosOriginales(productosRecibidos);
      setProductos(productosRecibidos);
      setTotalMostrado(productosRecibidos.length);
    } catch (error) {
      console.error('Error al cargar productos del caché:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al acceder al caché');
      setProductos([]);
      setProductosOriginales([]);
      setTotalMostrado(0);
    } finally {
      setLoading(false);
    }
  };

  // useEffects (movidos de App.tsx)
  useEffect(() => {
    console.log("Iniciando carga de productos...");
    fetchProductos();
  }, []);
  
  useEffect(() => {
    let productosFiltrados = [...productosOriginales];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      productosFiltrados = productosFiltrados.filter(
        producto => 
          producto.codigo_producto?.toLowerCase().includes(lowerSearchTerm) || 
          producto.nombre_del_producto?.toLowerCase().includes(lowerSearchTerm) ||
          producto.Modelo?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    if (categoriaSeleccionada !== 'Todas las categorías') {
      productosFiltrados = productosFiltrados.filter(
        producto => producto.categoria === categoriaSeleccionada
      );
    }
    setProductos(productosFiltrados);
    setTotalMostrado(productosFiltrados.length);
  }, [searchTerm, categoriaSeleccionada, productosOriginales]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
         if (showVistaOpcionalesModal) { handleCloseModal(); }
         if (showDetalleModal) { handleCloseDetalleModal(); }
         if (showCotizacionModal) { handleCloseCotizacionModal(); } // Ya cierra este
         // No necesitamos cerrar DetallesCargaPanel con ESC (se usa botón Volver)
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => { window.removeEventListener('keydown', handleEscKey); };
  }, [showVistaOpcionalesModal, showDetalleModal, showCotizacionModal]);

  const handleCloseDetalleModal = () => {
    setShowDetalleModal(false);
    setDetalleProducto(null);
  };

  const handleCloseCotizacionModal = () => { 
      setShowCotizacionModal(false); 
      setProductoParaCotizar(null); // Limpiar al cerrar sin confirmar
      setOpcionalesData([]); // Limpiar datos del modal
      setOpcionalesError(null);
  };

  // --- NUEVO: Función llamada desde OpcionalesCotizacionModal ---
  const handleConfirmarSeleccionOpcionales = (codigosSeleccionados: string[]) => {
    console.log("Confirmando opcionales con códigos:", codigosSeleccionados);
    // Filtrar los opcionales completos basados en los códigos seleccionados
    const seleccionadosCompletos = opcionalesData.filter(op => 
        op.codigo_producto && codigosSeleccionados.includes(op.codigo_producto)
    );
    setOpcionalesConfirmados(seleccionadosCompletos); // Guardar los opcionales seleccionados
    setPasoCotizacion(1); // Avanzar al paso 1: Detalles de la Carga
    setShowCotizacionModal(false); // Cerrar el modal de selección
    setProductoParaCotizar(productoParaCotizar); // Mantener el producto principal para el siguiente paso
  };
  
  // --- NUEVO: Función para volver desde DetallesCargaPanel ---
   const handleVolverDesdeDetalles = () => {
    setPasoCotizacion(0); // Volver al paso 0: Tabla de Equipos
    setProductoParaCotizar(null); // Limpiar producto en cotización
    setOpcionalesConfirmados([]); // Limpiar opcionales confirmados
  };

  // --- NUEVO: Función para eliminar un opcional confirmado ---
  const handleEliminarOpcionalConfirmado = (codigoAEliminar: string) => {
    console.log("Eliminando opcional confirmado:", codigoAEliminar);
    setOpcionalesConfirmados(prevConfirmados => 
      prevConfirmados.filter(op => op.codigo_producto !== codigoAEliminar)
    );
  };

  // JSX (movido de App.tsx, corresponde al <main>...</main>)
  if (pasoCotizacion === 1) {
    // Renderizar el panel de Detalles de la Carga
    return (
       <DetallesCargaPanel 
         productoPrincipal={productoParaCotizar} 
         opcionalesSeleccionados={opcionalesConfirmados} 
         onVolver={handleVolverDesdeDetalles}
         onSiguiente={() => { console.log("Ir al siguiente paso..."); /* Lógica futura */ }}
         onEliminarOpcional={handleEliminarOpcionalConfirmado}
       />
     );
  }

  // Renderizado por defecto (pasoCotizacion === 0): Tabla de Equipos
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>EQUIPOS</h1>

      {/* Barra de búsqueda y filtros */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '24px', 
        gap: '16px', 
        alignItems: 'center',
        animation: 'slideIn 0.5s ease-out'
      }}>
        <div style={{ position: 'relative', flex: '1' }}>
            <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 40px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0', fontSize: '16px' }}>×</button>
            )}
        </div>
        <div style={{ position: 'relative' }}>
            <select value={categoriaSeleccionada} onChange={(e) => setCategoriaSeleccionada(e.target.value)} style={{ appearance: 'none', backgroundColor: 'white', border: '1px solid #D1D5DB', padding: '8px 36px 8px 12px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
              {categorias.map((cat, idx) => (<option key={idx} value={cat}>{cat}</option>))}
            </select>
            <div style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
        </div>
        <button onClick={fetchProductos} className="button-hover" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #1e88e5', color: '#1e88e5', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          {loading ? (<><div style={{ width: '16px', height: '16px', border: '2px solid #E5E7EB', borderTopColor: '#1e88e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>Actualizando...</>) : (<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path></svg>Actualizar Caché</>)}
        </button>
      </div>

      {/* Contador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>
          {loading ? "Cargando equipos del caché..." : `Mostrando ${totalMostrado} ${totalMostrado === 1 ? 'equipo' : 'equipos'} del caché`}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '6px', overflow: 'hidden', animation: 'slideIn 0.5s ease-out' }}>
        {loading ? ( <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}><div style={{ width: '24px', height: '24px', border: '2px solid #E5E7EB', borderTopColor: '#1e88e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div><p>Cargando equipos desde el caché...</p><p style={{ fontSize: '13px', color: '#9CA3AF' }}>Este proceso puede tardar unos segundos</p></div>
        ) : error ? ( <div style={{ padding: '32px', textAlign: 'center', color: '#EF4444' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg><p style={{ marginBottom: '8px', fontWeight: '500', fontSize: '18px' }}>Error al cargar el caché de equipos</p><p style={{ marginBottom: '16px', fontSize: '14px' }}>{error}</p><button onClick={fetchProductos} style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Reintentar carga del caché</button></div>
        ) : productos.length === 0 && productosOriginales.length > 0 ? ( <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', color: '#9CA3AF' }}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg><p style={{ marginBottom: '8px', fontWeight: '500', fontSize: '18px' }}>No se encontraron equipos</p><p style={{ marginBottom: '16px', fontSize: '14px' }}>Ningún equipo coincide con los filtros actuales.</p><button onClick={() => { setSearchTerm(''); setCategoriaSeleccionada('Todas las categorías'); }} style={{ backgroundColor: '#E5E7EB', color: '#4B5563', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Limpiar filtros</button></div>
        ) : productosOriginales.length === 0 && !loading ? ( <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', color: '#9CA3AF' }}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg><p style={{ marginBottom: '8px', fontWeight: '500', fontSize: '18px' }}>No hay equipos en el caché</p><p style={{ marginBottom: '16px', fontSize: '14px' }}>El caché de productos está vacío o los filtros aplicados no devuelven resultados.</p><button onClick={fetchProductos} style={{ backgroundColor: '#E5E7EB', color: '#4B5563', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Actualizar Caché</button></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                 <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: '80px' }}>Código</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nombre</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Descripción</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Modelo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Categoría</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Ver Detalle</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Opcionales</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Configurar</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto, index) => (
                    <tr key={producto.codigo_producto || index} className="table-row" style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px', textAlign: 'left' }}>{producto.codigo_producto || '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'left' }}>{producto.nombre_del_producto || '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'left' }}>{producto.Descripcion || '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'left' }}>{producto.Modelo || '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'left' }}>{producto.categoria || '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}><button className="button-hover" style={{ padding: '8px', backgroundColor: 'white', color: '#1d4ed8', border: '1px solid #e5e7eb', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', transition: 'all 0.2s ease' }} onClick={() => handleVerDetalle(producto)} disabled={loadingDetail === producto.codigo_producto}>{loadingDetail === producto.codigo_producto ? (<div style={{ width: '14px', height: '14px', border: '2px solid #E5E7EB', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>) : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>)}</button></td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button 
                          className="button-hover" 
                          style={{ padding: '8px', backgroundColor: 'white', color: '#059669', border: '1px solid #e5e7eb', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', transition: 'all 0.2s ease' }}
                          onClick={() => handleOpcionales(producto)}
                          disabled={loadingOpcionalesBtn === producto.codigo_producto}
                        >
                          {loadingOpcionalesBtn === producto.codigo_producto ? (<div style={{ width: '14px', height: '14px', border: '2px solid #E5E7EB', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>) : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line><polyline points="12 8 16 12 12 16"></polyline></svg>)}
                        </button>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}><button className="button-hover" style={{ padding: '8px', backgroundColor: 'white', color: '#d97706', border: '1px solid #e5e7eb', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', transition: 'all 0.2s ease' }} onClick={() => handleConfigurar(producto)} disabled={loadingSettings === producto.codigo_producto}>{loadingSettings === producto.codigo_producto ? (<div style={{ width: '14px', height: '14px', border: '2px solid #E5E7EB', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>) : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path></svg>)}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showDetalleModal && detalleProducto && (
        <div className="modal-overlay" style={unifiedModalOverlayStyle}>
          <div className="modal-content hover-scale" style={{ ...unifiedModalContentStyle, maxWidth: '800px' }}>
            <div style={unifiedHeaderStyle}>
               <div style={unifiedTitleStyle}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
                 <h2>Especificaciones Técnicas</h2>
               </div>
               <button onClick={handleCloseDetalleModal} className="button-hover" style={unifiedCloseButtonStyle}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
            </div>
            <div style={unifiedBodyStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ backgroundColor: '#f8f9fa' }}><td style={{ ...unifiedTdStyle, fontWeight: 500, width: '30%' }}>NOMBRE COMERCIAL</td><td style={unifiedTdStyle}>{detalleProducto.nombre_del_producto || '-'}</td></tr>
                  <tr><td style={{ ...unifiedTdStyle, fontWeight: 500, width: '30%' }}>FAMILIA</td><td style={unifiedTdStyle}>{detalleProducto.categoria || '-'}</td></tr>
                  <tr style={{ backgroundColor: '#f8f9fa' }}><td style={{ ...unifiedTdStyle, fontWeight: 500 }}>ELEMENTO DE CORTE</td><td style={unifiedTdStyle}>Disco simple</td></tr>
                  <tr><td style={{ ...unifiedTdStyle, fontWeight: 500 }}>DIÁMETRO DE ENTRADA</td><td style={unifiedTdStyle}>{detalleProducto.Descripcion ? detalleProducto.Descripcion.match(/diámetro de entrada de (\d+)/i)?.[1] + 'mm' : '-'}</td></tr>
                  <tr style={{ backgroundColor: '#f8f9fa' }}><td style={{ ...unifiedTdStyle, fontWeight: 500 }}>GARGANTA DE ALIMENTACIÓN</td><td style={unifiedTdStyle}>{detalleProducto.Descripcion ? detalleProducto.Descripcion.match(/garganta de (\d+x\d+)/i)?.[1] + 'mm' : '-'}</td></tr>
                  <tr><td style={{ ...unifiedTdStyle, fontWeight: 500 }}>MÉTODO DE DESPLAZAMIENTO</td><td style={unifiedTdStyle}>{detalleProducto.Descripcion ? detalleProducto.Descripcion.match(/garganta de (\d+x\d+)/i)?.[1] : '-'}</td></tr>
                  <tr style={{ backgroundColor: '#f8f9fa' }}><td style={{ ...unifiedTdStyle, fontWeight: 500 }}>TIPO DE MOTOR</td><td style={unifiedTdStyle}>{detalleProducto?.nombre_del_producto?.includes('PTO') ? 'Requiere PTO' : 'Motor integrado'}</td></tr>
                  <tr><td style={{ ...unifiedTdStyle, fontWeight: 500 }}>TIPO DE ENGANCHE BOLA/ANILLO/CAT I-CAT II</td><td style={unifiedTdStyle}>{detalleProducto?.nombre_del_producto?.includes('Cat.') ? detalleProducto.nombre_del_producto.match(/Cat\.\s*(I+)/)?.[1] : '-'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCotizacionModal && productoParaCotizar && (
        <OpcionalesCotizacionModal 
          productoNombre={productoParaCotizar.nombre_del_producto || 'Producto sin nombre'}
          opcionales={opcionalesData}
          isLoading={opcionalesLoading}
          error={opcionalesError}
          onClose={handleCloseCotizacionModal}
          onConfirmarSeleccion={handleConfirmarSeleccionOpcionales}
        />
      )}

      {showVistaOpcionalesModal && productoParaVistaOpcionales && (
        <div style={unifiedModalOverlayStyle} onClick={handleCloseModal}> 
          <div style={unifiedModalContentStyle} onClick={(e) => e.stopPropagation()}> 
            <div style={unifiedHeaderStyle}>
              <div style={unifiedTitleStyle}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line><polyline points="12 8 16 12 12 16"></polyline></svg>
                 <h2>{productoParaVistaOpcionales.nombre_del_producto} - Opcionales</h2>
               </div>
               <button onClick={handleCloseModal} style={unifiedCloseButtonStyle} aria-label="Cerrar">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
            </div>
            
            <div style={unifiedBodyStyle}>
              {vistaOpcionalesLoading ? (
                 <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Cargando opcionales...</div>
              ) : vistaOpcionalesError ? (
                 <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>Error: {vistaOpcionalesError}</div>
              ) : vistaOpcionalesData.length === 0 ? (
                 <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>No hay opcionales disponibles.</div>
              ) : (
                 <div style={unifiedTableContainerStyle}>
                   <table style={unifiedTableStyle}>
                     <thead>
                       <tr>
                         <th style={{ ...unifiedThStyle, width: '100px' }}>Código</th>
                         <th style={{ ...unifiedThStyle, width: '35%' }}>Nombre</th>
                         <th style={unifiedThStyle}>Descripción</th>
                       </tr>
                     </thead>
                     <tbody>
                       {vistaOpcionalesData.map((opcional, index) => (
                         <tr key={opcional.codigo_producto || index} style={{ backgroundColor: index % 2 !== 0 ? '#f8f9fa' : 'white' }}>
                           <td style={unifiedTdStyle}>{opcional.codigo_producto || '-'}</td>
                           <td style={unifiedTdStyle}>{opcional.nombre_del_producto || '-'}</td>
                           <td style={unifiedTdStyle}>{opcional.Descripcion || '-'}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              )}
            </div>
            
            {vistaOpcionalesData.length > 0 && !vistaOpcionalesLoading && !vistaOpcionalesError && (
              <div style={unifiedFooterStyle}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <button style={true ? unifiedDisabledSecondaryButtonStyle : unifiedSecondaryButtonStyle} disabled={true}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                     Anterior
                   </button>
                   <span style={{ fontSize: '13px', color: '#4B5563', padding: '0 8px' }}>
                     1 de 1
                   </span>
                   <button style={true ? unifiedDisabledSecondaryButtonStyle : unifiedSecondaryButtonStyle} disabled={true}>
                     Siguiente
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                   </button>
                 </div>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 