import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowLeft, ArrowRight, Check } from 'lucide-react';

// Interfaces
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

// Versión funcional con diseño simplificado
export default function App() {
  // Estados principales
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosOriginales, setProductosOriginales] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtro por categoría
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas las categorías');
  const [categorias, setCategorias] = useState<string[]>(['Todas las categorías']);
  
  // Estado para indicar cuántos elementos se están mostrando
  const [totalMostrado, setTotalMostrado] = useState(0);

  // Estado para botones de acción
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [loadingOpcionales, setLoadingOpcionales] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<string | null>(null);

  // Estado para modal
  const [showModal, setShowModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  // Nuevo estado para el modal de detalles
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [detalleProducto, setDetalleProducto] = useState<Producto | null>(null);

  // Estado para opcionales
  const [opcionalesLoading, setOpcionalesLoading] = useState(false);
  const [opcionalesError, setOpcionalesError] = useState<string | null>(null);
  const [opcionalesData, setOpcionalesData] = useState<Producto[]>([]);

  // ========== Funciones ==========
  // Funciones para manejar los botones
  const handleVerDetalle = async (producto: Producto) => {
    setLoadingDetail(producto.codigo_producto || null);
    try {
      // Verificar que tenemos el código de producto
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
      
      // Verificar la estructura de respuesta y extraer el producto
      if (data.success && data.data) {
        setDetalleProducto(data.data.product);
        setShowDetalleModal(true);
        console.log('Detalles del producto recibidos:', data.data.product);
      } else {
        throw new Error('Producto no encontrado o formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error al obtener detalles del producto:', error);
      // Opcionalmente mostrar una notificación de error al usuario
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleOpcionales = async (producto: Producto) => {
    setLoadingOpcionales(producto.codigo_producto || null);
    setOpcionalesLoading(true);
    setOpcionalesError(null);
    setProductoSeleccionado(producto);
    setShowModal(true);

    try {
      // Verificar que tenemos todos los parámetros requeridos
      if (!producto.codigo_producto || !producto.Modelo || !producto.categoria) {
        throw new Error('Faltan parámetros requeridos (código, modelo o categoría)');
      }

      // Codificar los parámetros para la URL correctamente
      const params = new URLSearchParams();
      params.append('codigo', producto.codigo_producto);
      params.append('modelo', producto.Modelo);
      params.append('categoria', producto.categoria);

      const url = `http://localhost:5001/api/products/opcionales?${params.toString()}`;
      console.log('Consultando opcionales:', url);
      
      // Usar AbortController para establecer un timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Limpiamos el timeout ya que recibimos respuesta
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar la estructura de respuesta y extraer los productos
        if (data.success && data.data) {
          console.log(`Respuesta de opcionales recibida:`, data);
          
          // Si los datos vienen del caché, mostrar un mensaje
          if (data.data.source === 'cache') {
            console.log('Los datos mostrados provienen del caché como alternativa al webhook');
          }
          
          setOpcionalesData(data.data.products);
          console.log(`Se encontraron ${data.data.total} productos opcionales`);
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (fetchError: any) {
        // Si es un error de timeout o un problema de red, intentamos usar los productos del caché
        if (fetchError.name === 'AbortError' || (fetchError.message && fetchError.message.includes('network'))) {
          console.log('Timeout o error de red, mostrando productos similares del caché');
          
          // Mostrar productos de la misma categoría como alternativa
          const productosSimilares = productosOriginales.filter(
            p => p.categoria === producto.categoria && p.codigo_producto !== producto.codigo_producto
          );
          
          if (productosSimilares.length > 0) {
            setOpcionalesData(productosSimilares);
            console.log(`Mostrando ${productosSimilares.length} productos similares del caché`);
            // Notificar al usuario que estamos mostrando alternativas
            setOpcionalesError('No se pudieron cargar los opcionales exactos. Mostrando alternativas similares.');
            return;
          }
        }
        
        // Si no podemos ofrecer alternativas, propagar el error
        throw fetchError;
      }
    } catch (error) {
      console.error('Error al obtener opcionales:', error);
      setOpcionalesError(error instanceof Error ? error.message : 'Error desconocido');
      // Mostrar mensaje amigable
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setOpcionalesError('Error de conexión con el servidor. Por favor, inténtelo de nuevo más tarde.');
      }
    } finally {
      setOpcionalesLoading(false);
      setLoadingOpcionales(null);
    }
  };

  const handleConfigurar = (producto: Producto) => {
    setLoadingSettings(producto.codigo_producto || null);
    setTimeout(() => {
      console.log("Configurar producto:", producto.codigo_producto);
      setLoadingSettings(null);
    }, 500);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setProductoSeleccionado(null);
  };
  
  // Carga inicial de productos (equipos) desde el caché
  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    console.log("Obteniendo productos del caché...");
    
    try {
      const res = await fetch('http://localhost:5001/api/products/cache/all');
      if (!res.ok) throw new Error(`Error en la respuesta del servidor: ${res.status}`);
      
      const response: ApiResponse = await res.json();
      console.log("Datos recibidos del caché:", response);
      
      // Verificar si la respuesta es exitosa
      if (!response.success) {
        throw new Error(response.message || 'Error en la respuesta del servidor');
      }
      
      // Obtener productos de la estructura correcta
      const productosRecibidos = response.data.products.data;
      console.log(`Se encontraron ${productosRecibidos.length} productos`);
      
      // Extraer categorías únicas para el filtro
      const todasCategorias = ['Todas las categorías'];
      productosRecibidos.forEach((producto: Producto) => {
        if (producto.categoria && !todasCategorias.includes(producto.categoria)) {
          todasCategorias.push(producto.categoria);
        }
      });
      
      setCategorias(todasCategorias);
      setProductos(productosRecibidos);
      setProductosOriginales(productosRecibidos);
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
  
  // Cargar datos al inicio
  useEffect(() => {
    console.log("Iniciando carga de productos...");
    fetchProductos();
  }, []);
  
  // Filtrar productos cuando cambia búsqueda o categoría
  useEffect(() => {
    let productosFiltrados = [...productosOriginales];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      productosFiltrados = productosFiltrados.filter(
        producto => 
          producto.codigo_producto?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          producto.nombre_del_producto?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por categoría
    if (categoriaSeleccionada !== 'Todas las categorías') {
      productosFiltrados = productosFiltrados.filter(
        producto => producto.categoria === categoriaSeleccionada
      );
    }
    
    setProductos(productosFiltrados);
    setTotalMostrado(productosFiltrados.length);
  }, [searchTerm, categoriaSeleccionada, productosOriginales]);

  // Agregar el useEffect para manejar la tecla ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showModal) {
          handleCloseModal();
        }
        if (showDetalleModal) {
          handleCloseDetalleModal();
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal, showDetalleModal]);

  // Agregar función para cerrar el modal de detalles
  const handleCloseDetalleModal = () => {
    setShowDetalleModal(false);
    setDetalleProducto(null);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      display: 'flex',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '240px', 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        <div style={{ padding: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#1e88e5', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontWeight: 'bold' 
            }}>
              EA
            </div>
            <div style={{ marginLeft: '8px' }}>
              <div style={{ color: '#1e88e5', fontWeight: 'bold' }}>Eco</div>
              <div style={{ color: '#1e88e5' }}>Alliance</div>
            </div>
          </div>
        </div>

        <nav style={{ marginTop: '32px', flex: '1' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 16px', 
            fontSize: '14px', 
            fontWeight: '500'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            DASHBOARD
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 16px', 
            fontSize: '14px', 
            fontWeight: '500',
            backgroundColor: '#e3f2fd',
            color: '#1e88e5',
            borderLeft: '4px solid #1e88e5'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10"></path>
              <path d="M18 20V4"></path>
              <path d="M6 20v-8"></path>
            </svg>
            EQUIPOS
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 16px', 
            fontSize: '14px', 
            fontWeight: '500'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            ADMIN
          </div>
        </nav>

        <div style={{ padding: '16px', marginTop: 'auto', borderTop: '1px solid #eee' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            fontSize: '14px', 
            fontWeight: '500',
            borderRadius: '4px'
          }}>
            CONFIGURACIÓN
          </div>
        </div>
      </aside>

      {/* Panel Principal */}
      <main style={{ 
        flex: '1', 
        overflow: 'auto',
        animation: 'fadeIn 0.5s ease-out' 
      }}>
        <div style={{ padding: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>EQUIPOS</h1>

          {/* Barra de búsqueda con animación */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '24px', 
            gap: '16px', 
            alignItems: 'center',
            animation: 'slideIn 0.5s ease-out'
          }}>
            <div style={{ 
              position: 'relative', 
              flex: '1' 
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '12px', 
                transform: 'translateY(-50%)', 
                color: '#9CA3AF',
                pointerEvents: 'none'
              }}>
                {/* Icono de búsqueda */}
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
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 40px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '12px',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    padding: '0',
                    fontSize: '16px'
                  }}
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Filtro de categoría */}
            <div style={{ position: 'relative' }}>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                style={{
                  appearance: 'none',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  padding: '8px 36px 8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {categorias.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            
            {/* Botón Actualizar con animación */}
            <button
              onClick={fetchProductos}
              className="button-hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                border: '1px solid #1e88e5',
                color: '#1e88e5',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #E5E7EB',
                    borderTopColor: '#1e88e5',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
                  </svg>
                  Actualizar Caché
                </>
              )}
            </button>
          </div>
          
          {/* Estado de carga con animación */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {loading 
                ? "Cargando equipos del caché..." 
                : `Mostrando ${totalMostrado} ${totalMostrado === 1 ? 'equipo' : 'equipos'} del caché`
              }
            </div>
          </div>

          {/* Tabla con animación */}
          <div style={{ 
            backgroundColor: 'white', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            borderRadius: '6px', 
            overflow: 'hidden',
            animation: 'slideIn 0.5s ease-out'
          }}>
            {loading ? (
              <div style={{ 
                padding: '32px', 
                textAlign: 'center', 
                color: '#6B7280',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #E5E7EB',
                  borderTopColor: '#1e88e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p>Cargando equipos desde el caché...</p>
                <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
                  Este proceso puede tardar unos segundos
                </p>
              </div>
            ) : error ? (
              <div style={{ 
                padding: '32px', 
                textAlign: 'center', 
                color: '#EF4444'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p style={{ marginBottom: '8px', fontWeight: '500', fontSize: '18px' }}>
                  Error al cargar el caché de equipos
                </p>
                <p style={{ marginBottom: '16px', fontSize: '14px' }}>{error}</p>
                <button
                  onClick={fetchProductos}
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#EF4444',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Reintentar carga del caché
                </button>
              </div>
            ) : productos.length === 0 ? (
              <div style={{ 
                padding: '32px', 
                textAlign: 'center', 
                color: '#6B7280'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', color: '#9CA3AF' }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <p style={{ marginBottom: '8px', fontWeight: '500', fontSize: '18px' }}>
                  No hay equipos en el caché
                </p>
                <p style={{ marginBottom: '16px', fontSize: '14px' }}>
                  El caché de productos está vacío o los filtros aplicados no devuelven resultados.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoriaSeleccionada('Todas las categorías');
                    fetchProductos();
                  }}
                  style={{
                    backgroundColor: '#E5E7EB',
                    color: '#4B5563',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Limpiar filtros y actualizar
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '14px' 
                }}>
                  <thead>
                    <tr style={{
                        backgroundColor: '#f3f4f6',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold',
                        color: '#374151'
                      }}>
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
                      <tr 
                        key={index}
                        className="table-row"
                        style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        <td style={{ padding: '16px', textAlign: 'left' }}>{producto.codigo_producto || '-'}</td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>{producto.nombre_del_producto || '-'}</td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>{producto.Descripcion || '-'}</td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>{producto.Modelo || '-'}</td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>{producto.categoria || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            className="button-hover"
                            style={{
                              padding: '8px',
                              backgroundColor: 'white',
                              color: '#1d4ed8',
                              border: '1px solid #e5e7eb',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => handleVerDetalle(producto)}
                            disabled={loadingDetail === producto.codigo_producto}
                          >
                            {loadingDetail === producto.codigo_producto ? (
                              <div style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid #E5E7EB',
                                borderTopColor: '#1d4ed8',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                              </svg>
                            )}
                          </button>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            className="button-hover"
                            style={{
                              padding: '8px',
                              backgroundColor: 'white',
                              color: '#059669',
                              border: '1px solid #e5e7eb',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => handleOpcionales(producto)}
                            disabled={loadingOpcionales === producto.codigo_producto}
                          >
                            {loadingOpcionales === producto.codigo_producto ? (
                              <div style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid #E5E7EB',
                                borderTopColor: '#059669',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                                <polyline points="12 8 16 12 12 16"></polyline>
                              </svg>
                            )}
                          </button>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            className="button-hover"
                            style={{
                              padding: '8px',
                              backgroundColor: 'white',
                              color: '#d97706',
                              border: '1px solid #e5e7eb',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => handleConfigurar(producto)}
                            disabled={loadingSettings === producto.codigo_producto}
                          >
                            {loadingSettings === producto.codigo_producto ? (
                              <div style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid #E5E7EB',
                                borderTopColor: '#d97706',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <path d="M9 9h6v6H9z"></path>
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {productos.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: '16px', textAlign: 'center' }}>
                          No se encontraron productos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Modal de Opcionales */}
      {showModal && productoSeleccionado && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div className="modal-content hover-scale" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: '#EBF8FF'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e88e5' }}>
                Opcionales: {productoSeleccionado.nombre_del_producto}
              </h2>
              <button
                onClick={handleCloseModal}
                className="button-hover"
                style={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#1e40af'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{
              padding: '24px',
              overflow: 'auto',
              maxHeight: 'calc(85vh - 64px)',
              backgroundColor: '#F9FAFB'
            }}>
              {opcionalesLoading ? (
                <div style={{
                  backgroundColor: 'white',
                  padding: '48px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid #E5E7EB',
                    borderTopColor: '#1e88e5',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                  }}></div>
                  <p style={{ fontSize: '18px', fontWeight: '500', color: '#4B5563', marginBottom: '8px' }}>
                    Cargando opcionales...
                  </p>
                  <p style={{ color: '#6B7280' }}>
                    Por favor espere mientras obtenemos los opcionales
                  </p>
                </div>
              ) : opcionalesError ? (
                <div style={{
                  backgroundColor: 'white',
                  padding: '48px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12" y2="16"></line>
                  </svg>
                  <p style={{ fontSize: '18px', fontWeight: '500', color: '#EF4444', marginBottom: '8px' }}>
                    Error al cargar opcionales
                  </p>
                  <p style={{ color: '#6B7280' }}>
                    {opcionalesError}
                  </p>
                </div>
              ) : opcionalesData.length === 0 ? (
                <div style={{
                  backgroundColor: 'white',
                  padding: '48px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  <p style={{ fontSize: '18px', fontWeight: '500', color: '#4B5563', marginBottom: '8px' }}>
                    No hay opcionales disponibles
                  </p>
                  <p style={{ color: '#6B7280' }}>
                    Este producto no tiene opcionales registrados
                  </p>
                </div>
              ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Código</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nombre</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Descripción</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Modelo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opcionalesData.map((opcional, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 16px' }}>{opcional.codigo_producto || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>{opcional.nombre_del_producto || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>{opcional.Descripcion || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>{opcional.Modelo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {showDetalleModal && detalleProducto && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content hover-scale" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#EBF8FF'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12" y2="8"/>
                </svg>
                <h2 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e88e5'
                }}>Especificaciones Técnicas</h2>
              </div>
              <button
                onClick={handleCloseDetalleModal}
                className="button-hover"
                style={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#1e40af'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{ 
              padding: '24px',
              overflow: 'auto',
              maxHeight: 'calc(85vh - 64px)',
              backgroundColor: '#F9FAFB'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <tbody>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: '500',
                      width: '30%',
                      borderBottom: '1px solid #e5e7eb'
                    }}>NOMBRE COMERCIAL</td>
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{detalleProducto.nombre_del_producto || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: '500',
                      width: '30%',
                      borderBottom: '1px solid #e5e7eb'
                    }}>FAMILIA</td>
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{detalleProducto.categoria || '-'}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}>ELEMENTO DE CORTE</td>
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Disco simple</td>
                  </tr>
                  <tr>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}>DIÁMETRO DE ENTRADA</td>
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{detalleProducto.Descripcion ? detalleProducto.Descripcion.match(/diámetro de entrada de (\d+)/i)?.[1] + 'mm' : '-'}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}>GARGANTA DE ALIMENTACIÓN</td>
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{detalleProducto.Descripcion ? detalleProducto.Descripcion.match(/garganta de (\d+x\d+)/i)?.[1] + 'mm' : '-'}</td>
                  </tr>
                  <tr>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}>MÉTODO DE DESPLAZAMIENTO</td>
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{detalleProducto.Descripcion ? detalleProducto.Descripcion.match(/garganta de (\d+x\d+)/i)?.[1] : '-'}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}>TIPO DE MOTOR</td>
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{detalleProducto?.nombre_del_producto?.includes('PTO') ? 'Requiere PTO' : 'Motor integrado'}</td>
                  </tr>
                  <tr>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: '500',
                      borderBottom: '1px solid #e5e7eb'
                    }}>TIPO DE ENGANCHE BOLA/ANILLO/CAT I-CAT II</td>
                    <td style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>{detalleProducto?.nombre_del_producto?.includes('Cat.') ? detalleProducto.nombre_del_producto.match(/Cat\.\s*(I+)/)?.[1] : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }

          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }

          .loading-shimmer {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(to right, #f6f7f8 8%, #edeef1 18%, #f6f7f8 33%);
            background-size: 1000px 100%;
          }

          .hover-scale {
            transition: transform 0.2s ease;
          }

          .hover-scale:hover {
            transform: scale(1.02);
          }

          .fade-in {
            animation: fadeIn 0.3s ease-in;
          }

          .slide-in {
            animation: slideIn 0.5s ease-out;
          }

          .table-row {
            transition: background-color 0.2s ease;
          }

          .table-row:hover {
            background-color: #f8fafc !important;
          }

          .button-hover {
            transition: all 0.2s ease;
          }

          .button-hover:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            background-color: #f3f4f6;
          }

          .button-hover:active {
            transform: translateY(0);
            background-color: #e5e7eb;
          }

          .modal-overlay {
            animation: fadeIn 0.2s ease-out;
          }

          .modal-content {
            animation: slideIn 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
}
