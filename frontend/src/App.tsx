import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowLeft, ArrowRight, Check, Settings, Eye, List, Loader2, LayoutDashboard } from 'lucide-react';
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

  // Función para determinar el estilo del enlace activo
  const getLinkStyle = (path: string): LinkStyle => {
    const isActive = location.pathname === path;
    const baseStyle: LinkStyle = {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px', // Equivalente a px-4 py-2.5
      borderRadius: '6px', // Equivalente a rounded-md
      fontSize: '14px', // Equivalente a text-sm
      fontWeight: 500, // Equivalente a font-medium
      textDecoration: 'none',
      transition: 'background-color 0.15s ease, color 0.15s ease',
      marginBottom: '4px', // Espacio entre botones
    };
    const activeStyle: LinkStyle = {
      backgroundColor: '#e0f2fe', // bg-sky-100
      color: '#0369a1', // text-sky-700
      borderLeft: '4px solid #0ea5e9', // border-l-4 border-sky-500
      paddingLeft: '12px', // Ajustar padding por el borde
    };
    const inactiveStyle: LinkStyle = {
      color: '#4b5563', // text-gray-600
    };
     // Estilo hover para inactivos (simulado con CSS o lógica más compleja si es necesario)
     // En un componente real, usarías :hover en CSS o estados onMouseEnter/Leave
    
    return { ...baseStyle, ...(isActive ? activeStyle : inactiveStyle) };
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f3f4f6' /* bg-gray-100 */ }}>
      {/* Barra lateral */}
      <aside style={{ 
          width: '240px', // Ancho fijo
          backgroundColor: 'white', 
          borderRight: '1px solid #e5e7eb', // border-r border-gray-200
          display: 'flex', 
          flexDirection: 'column',
          padding: '16px' // p-4
       }}>
        {/* Logo */}
        <div style={{ marginBottom: '24px', padding: '8px 0' }}>
          <img src={ecoAllianceLogo} alt="Eco Alliance Logo" style={{ height: '40px', display: 'block', margin: '0 auto' }} />
        </div>

        {/* Navegación */}
        <nav style={{ flexGrow: 1 }}>
          {/* --- ENLACE DASHBOARD --- */}
          <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
            <LayoutDashboard size={18} style={{ marginRight: '12px' /* mr-3 */ }} />
            DASHBOARD
          </Link>
          {/* --- ENLACE EQUIPOS --- */}
          <Link to="/" style={getLinkStyle('/')}>
            <List size={18} style={{ marginRight: '12px' }} />
            EQUIPOS
          </Link>
          {/* --- ENLACE ADMIN --- */}
          <Link to="/admin" style={getLinkStyle('/admin')}>
            <Settings size={18} style={{ marginRight: '12px' }} />
            ADMIN
          </Link>
        </nav>

        {/* Footer de la barra lateral (opcional) */}
        {/* <div>Footer</div> */}
      </aside>

      {/* Contenido principal */}
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f9fafb' /* Slightly different gray */ }}>
        {/* Outlet renderizará el componente de la ruta activa */}
        <Outlet /> 
      </main>
    </div>
  );
}
