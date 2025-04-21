import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowLeft, ArrowRight, Check, Settings, Eye, List, Loader2 } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import ecoAllianceLogo from './assets/Logotipo_EAX-EA.png';

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

// Definir tipo para los estilos de los enlaces (para legibilidad)
type LinkStyle = React.CSSProperties;

// Versión funcional con diseño simplificado
export default function App() {
  const location = useLocation(); // Hook para obtener la ruta actual

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
      const lowerSearchTerm = searchTerm.toLowerCase();
      productosFiltrados = productosFiltrados.filter(
        producto => 
          producto.codigo_producto?.toLowerCase().includes(lowerSearchTerm) || 
          producto.nombre_del_producto?.toLowerCase().includes(lowerSearchTerm) ||
          producto.Modelo?.toLowerCase().includes(lowerSearchTerm)
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

  // Estilos base para los enlaces de navegación
  const baseLinkStyle: LinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    color: '#374151', // Color por defecto
    borderLeft: '4px solid transparent' // Borde transparente por defecto
  };

  // Estilos para el enlace activo
  const activeLinkStyle: LinkStyle = {
    ...baseLinkStyle,
    backgroundColor: '#e3f2fd',
    color: '#1e88e5',
    borderLeft: '4px solid #1e88e5'
  };

  // Función para determinar el estilo del enlace
  const getLinkStyle = (path: string): LinkStyle => {
    const currentPath = location.pathname;
    
    // Si estamos en la ruta raíz, activar EQUIPOS
    if (currentPath === '/' && path === '/equipos') {
      return activeLinkStyle;
    }
    
    // Para cualquier otra ruta, activar solo si coincide exactamente
    return currentPath === path ? activeLinkStyle : baseLinkStyle;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      display: 'flex',
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '240px', 
        backgroundColor: 'white', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
        display: 'flex', 
        flexDirection: 'column',
        borderRight: '1px solid #e5e7eb' 
      }}>
        <div style={{ 
          padding: '24px 16px 16px 16px', 
          display: 'flex', 
          justifyContent: 'center' 
        }}>
          <img 
            src={ecoAllianceLogo} 
            alt="Eco Alliance Logo" 
            style={{ height: '40px', width: 'auto' }} 
          />
        </div>

        <nav style={{ marginTop: '16px', flex: '1', padding: '0 8px' }}>
          <Link to="/" style={getLinkStyle('/')}>
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
          </Link>
          <Link to="/equipos" style={getLinkStyle('/equipos')}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 16px', 
              fontSize: '14px', 
              fontWeight: '500'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10"></path>
                <path d="M18 20V4"></path>
                <path d="M6 20v-8"></path>
              </svg>
              EQUIPOS
            </div>
          </Link>
          <Link to="/admin" style={getLinkStyle('/admin')}>
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
          </Link>
        </nav>

        <div style={{ padding: '16px', marginTop: 'auto', borderTop: '1px solid #e5e7eb' }}>
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

      {/* Panel Principal - Aquí se renderizará la ruta activa */}
      <main style={{ 
        flex: '1', 
        overflow: 'auto',
        animation: 'fadeIn 0.5s ease-out' 
      }}>
        <Outlet /> {/* Componente de react-router-dom que renderiza la ruta hija */} 
      </main>
      
      {/* Mantener los estilos globales si es necesario */}
      <style>
        {`
           @keyframes spin { /* ... */ }
           @keyframes fadeIn { /* ... */ }
           @keyframes slideIn { /* ... */ }
           /* ... otros estilos globales ... */
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
