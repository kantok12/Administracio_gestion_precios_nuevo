import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowLeft, ArrowRight, Check, Settings, Eye, List, Loader2, LayoutDashboard, FileCog, Users, Menu, Bell, User } from 'lucide-react';
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

// --- New Header Component ---
interface HeaderProps {
  logoPath: string;
}

const Header: React.FC<HeaderProps> = ({ logoPath }) => {
  const headerStyle: React.CSSProperties = {
    backgroundColor: '#60a5fa', // Lighter blue background
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'white',
    height: '60px', // Fixed header height
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const logoStyle: React.CSSProperties = {
    height: '40px', // Adjust as needed
    width: 'auto',
  };

  const rightSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  };

  const iconStyle: React.CSSProperties = {
    cursor: 'pointer',
  };

  const userNameStyle: React.CSSProperties = {
    fontSize: '14px',
  };

  return (
    <header style={headerStyle}>
      <img src={logoPath} alt="Logo" style={logoStyle} />
      <div style={rightSectionStyle}>
        {/* Placeholders for right-side elements */}
        {/* <button>Feedback</button> */}
        <Bell size={20} style={iconStyle} />
        <User size={20} style={iconStyle} />
        {/* <span style={userNameStyle}>User Name</span> */}
      </div>
    </header>
  );
};
// --- End Header Component ---

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

  // Estilos de la aplicación
  const sidebarStyle: React.CSSProperties = {
    width: '240px',
    backgroundColor: '#f8fafc', // Light gray background
    padding: '20px',
    borderRight: '1px solid #e5e7eb', // Subtle border
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  };

  const logoContainerStyle: React.CSSProperties = {
    marginBottom: '30px',
    paddingLeft: '10px', // Align logo slightly
  };

  const logoImageStyle: React.CSSProperties = {
    height: '40px', // Maintain logo size
    width: 'auto',
  };

  const navLinkBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 15px',
    marginBottom: '8px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    color: '#334155', // Default text color
    transition: 'background-color 0.2s ease, color 0.2s ease',
  };

  const navLinkHoverStyle: React.CSSProperties = {
    backgroundColor: '#e2e8f0', // Light hover background
  };

  const navLinkActiveStyle: React.CSSProperties = {
    backgroundColor: '#e0f2fe', // Light blue background for active
    color: '#0c4a6e', // Darker blue text for active
  };

  const navIconStyle: React.CSSProperties = {
    marginRight: '12px',
    flexShrink: 0, // Prevent icon from shrinking
  };

  // Función para obtener el estilo del enlace dinámicamente
  const getLinkStyle = (path: string): LinkStyle => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return {
      ...navLinkBaseStyle,
      ...(isActive ? navLinkActiveStyle : {}),
      // Simple hover effect can be done with CSS pseudo-classes if preferred
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header logoPath={ecoAllianceLogo} /> {/* Add the new Header */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}> {/* Container for sidebar + content */}
        {/* Sidebar */}
        <div style={sidebarStyle}>
          {/* Logo se movió al Header, dejamos espacio o lo eliminamos */}
          {/* <div style={logoContainerStyle}>
            <img src={ecoAllianceLogo} alt="Eco Alliance Logo" style={logoImageStyle} />
          </div> */}

          {/* Navegación */}
          <nav style={{ flexGrow: 1 }}>
            {/* Link para DASHBOARD */}
            <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
              <LayoutDashboard size={18} style={navIconStyle} />
              DASHBOARD
            </Link>
            {/* Link para EQUIPOS */}
            <Link to="/" style={getLinkStyle('/')}>
               <Menu size={18} style={navIconStyle} /> {/* Changed Icon */}
              EQUIPOS
            </Link>
            {/* Link para ADMIN */}
            <Link to="/admin" style={getLinkStyle('/admin')}>
              <FileCog size={18} style={navIconStyle} /> {/* Use FileCog or Settings */}
              ADMIN
            </Link>
            {/* Puedes añadir más enlaces aquí */}
          </nav>

          {/* Sección inferior de la barra lateral (si es necesario) */}
          {/* <div>User Info / Logout</div> */}
        </div>

        {/* Área de Contenido Principal */}
        <div style={{ flexGrow: 1, overflow: 'auto', padding: '24px' }}> {/* Added padding */}
          <Outlet /> {/* Aquí se renderizarán las rutas hijas */}
        </div>
      </div>
    </div>
  );
}
