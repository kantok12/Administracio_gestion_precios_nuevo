import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  BarChart3,
  Clock,
  BarChart2,
  Search,
  PlusCircle,
  X,
  Settings,
  Filter,
  Loader,
  RefreshCw,
  Info,
  Calculator,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Link, useNavigate, Routes, Route } from 'react-router-dom';
import LogoEcoAlliance from './components/LogoEcoAlliance';
import ReactMarkdown from 'react-markdown';
import AdminPanel from './components/admin/AdminPanel';

// Interfaces
interface Producto {
  codigo_producto: string;
  nombre_del_producto: string;
  Descripcion: string;
  Modelo: string;
  categoria?: string;
}

interface Opcional {
  codigo_producto: string;
  nombre_del_producto: string;
  Descripcion: string;
  Modelo: string;
}

// Mock de productos
const mockProducts = [
  {
    codigo_producto: '61103',
    nombre_del_producto: 'Chipeadora PTO A141XL',
    Descripcion: 'Chipeadora de construcción fija, con requerimiento de potencia de 82 [HP]',
    Modelo: 'A141XL',
    categoria: 'Chipeadora PTO',
    pf_eur: '8500',
    dimensiones: '410x300mm',
  },
  {
    codigo_producto: '61166',
    nombre_del_producto: 'Chipeadora Motor A141XL',
    Descripcion: 'Chipeadora con mesa giratoria en 270°, con motor diésel',
    Modelo: 'A141XL - 75 HP',
    categoria: 'Chipeadora Motor',
    pf_eur: '12500',
    dimensiones: '410x300mm',
  },
  // ... agrega más productos si quieres
];

export default function App() {
  const navigate = useNavigate();
  
  // ----------- Estados principales -----------
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtro por categoría
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [categorias, setCategorias] = useState<string[]>(['todas']);

  // Paginación de productos
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal de opcionales
  const [showModal, setShowModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [opcionalesData, setOpcionalesData] = useState<Opcional[] | null>(null);

  // Paginación de opcionales
  const [opcionalesPage, setOpcionalesPage] = useState(1);
  const opcionalesPerPage = 10;

  // Estados para settings
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedOpcionales, setSelectedOpcionales] = useState<Opcional[]>([]);

  // ----------- Modal para "Ver Detalle" con JSON aplanado -----------
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [flattenedData, setFlattenedData] = useState<Record<string, any>>({});

  // Estados de carga para acciones específicas
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [loadingOpcionales, setLoadingOpcionales] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<string | null>(null);

  // ----------- Webhooks -----------
  const WEBHOOK_URL_PRINCIPAL =
    'https://n8n-807184488368.southamerica-west1.run.app/webhook/6f697684-4cfc-4bc1-8918-bfffc9f20b9f';

  const WEBHOOK_URL_OPCIONALES =
    'https://n8n-807184488368.southamerica-west1.run.app/webhook/ac8b70a7-6be5-4e1a-87b3-3813464dd254';

  const WEBHOOK_URL_VER_DETALLE =
    'https://n8n-807184488368.southamerica-west1.run.app/webhook/c02247e7-84f0-49b3-a2df-28817da48017';

  // URL del webhook de settings
  const WEBHOOK_URL_SETTINGS =
    'https://n8n-807184488368.southamerica-west1.run.app/webhook/d9f32e08-c5d2-4a77-b3de-ba817e8fca3e';

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{type: 'user' | 'support', text: string}[]>([
    {type: 'support', text: '¡Hola! ¿En qué podemos ayudarte hoy?'}
  ]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    
    // Si se está cerrando el chat, limpiar el sessionId
    if (isChatOpen) {
      setChatSessionId(null);
    } else {
      // Si se está abriendo el chat, generar un nuevo sessionId
      const newSessionId = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
      setChatSessionId(newSessionId);
    }
  };
  
  const handleSendMessage = async () => {
    if (chatMessage.trim() === '') return;
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', text: chatMessage }]);
    
    // Send message to webhook
    const WEBHOOK_URL_CHAT = 'https://n8n-807184488368.southamerica-west1.run.app/webhook/57492d25-2a87-4698-aa6d-42248acec7b9';
    
    // Usar el sessionId existente o generar uno nuevo si no existe
    const sessionId = chatSessionId || 
      Math.random().toString(36).substring(2, 15) + 
      Math.random().toString(36).substring(2, 15);
    
    // Guardar el sessionId para futuras interacciones
    if (!chatSessionId) {
      setChatSessionId(sessionId);
    }
    
    // Crear los parámetros para la URL
    const params = new URLSearchParams({
      sessionId: sessionId,
      action: 'sendMessage',
      chatInput: chatMessage
    });
    
    // Construir la URL con los parámetros
    const url = `${WEBHOOK_URL_CHAT}?${params.toString()}`;
    
    console.log('Enviando al webhook (GET):', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Respuesta del servidor:', data); // Para depuración
      if (data && Array.isArray(data) && data.length > 0 && data[0].output) {
        setChatHistory(prev => [...prev, { type: 'support', text: data[0].output }]);
      } else {
        throw new Error('La respuesta del servidor no tiene el formato esperado.');
      }
    } catch (error: any) {
      console.error('Error detallado:', error);
      setChatHistory(prev => [...prev, { 
        type: 'support', 
        text: `Error de conexión: ${error.message || 'Error desconocido'}. Por favor, verifica la conexión e intenta nuevamente.` 
      }]);
    }
    
    setChatMessage('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ========== 1) Carga inicial de productos ==========
  const obtenerDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(WEBHOOK_URL_PRINCIPAL);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: Producto[] = await res.json();
      
      // Extraer categorías únicas para el filtro
      const todasCategorias = ['todas'];
      data.forEach(producto => {
        if (producto.categoria && !todasCategorias.includes(producto.categoria)) {
          todasCategorias.push(producto.categoria);
        }
      });
      setCategorias(todasCategorias);
      
      setProductos(data);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  // ========== 2) Cerrar modales al presionar ESC ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) handleCloseModal();
        if (showJsonModal) setShowJsonModal(false);
        if (showSettingsModal) handleCloseSettingsModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showJsonModal, showSettingsModal]);

  // ========== 3) Función recursiva para aplanar objetos ==========
  const flattenObject = (obj: any): Record<string, any> => {
    const result: Record<string, any> = {};
    function recurse(cur: any, prop: string) {
      if (Object(cur) === cur && !Array.isArray(cur)) {
        let isEmpty = true;
        for (const p in cur) {
          isEmpty = false;
          recurse(cur[p], prop ? prop + ' / ' + p : p);
        }
        if (isEmpty && prop) result[prop] = {};
      } else {
        result[prop] = cur;
      }
    }
    recurse(obj, '');
    return result;
  };

  // ========== 4) "Ver Detalle" con GET y modal JSON aplanado ==========
  const handleVerDetalle = async (producto: Producto) => {
    setLoadingDetail(producto.codigo_producto);
    try {
      const url = `${WEBHOOK_URL_VER_DETALLE}?codigo=${producto.codigo_producto}&modelo=${producto.Modelo}&categoria=${producto.categoria}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al enviar la solicitud');
      }

      const data = await response.json();
      const firstItem = Array.isArray(data) ? data[0] : data;
      const flattened = flattenObject(firstItem || {});
      setFlattenedData(flattened);
      setShowJsonModal(true);
    } catch (error) {
      console.error('Error al hacer la solicitud:', error);
      alert('Hubo un error al procesar la solicitud');
    } finally {
      setLoadingDetail(null);
    }
  };

  // ========== 5) Filtrar y paginar la tabla principal ==========
  const productosFiltrados = productos.filter((p) => 
    // Filtro de búsqueda por texto
    [p.codigo_producto, p.nombre_del_producto, p.Descripcion, p.Modelo]
      .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase())) &&
    // Filtro por categoría
    (categoriaSeleccionada === 'todas' || p.categoria === categoriaSeleccionada)
  );
  
  // Ordenar resultados para priorizar coincidencias exactas de código
  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    // Si hay un término de búsqueda y coincide exactamente con el código del producto a, a va primero
    if (searchTerm && a.codigo_producto.toLowerCase() === searchTerm.toLowerCase()) return -1;
    // Si hay un término de búsqueda y coincide exactamente con el código del producto b, b va primero
    if (searchTerm && b.codigo_producto.toLowerCase() === searchTerm.toLowerCase()) return 1;
    // Si hay un término de búsqueda y está contenido en el código del producto a, a va primero
    if (searchTerm && a.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !b.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase())) return -1;
    // Si hay un término de búsqueda y está contenido en el código del producto b, b va primero
    if (searchTerm && b.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !a.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase())) return 1;
    // Orden alfabético por defecto
    return a.codigo_producto.localeCompare(b.codigo_producto);
  });
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProductos = productosOrdenados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage);

  // Estado para resaltar filas con coincidencia exacta
  const [highlightedProducto, setHighlightedProducto] = useState<string | null>(null);
  
  // Actualizar highlighted cuando cambia searchTerm
  useEffect(() => {
    if (searchTerm) {
      const exactMatch = productos.find(p => 
        p.codigo_producto.toLowerCase() === searchTerm.toLowerCase()
      );
      setHighlightedProducto(exactMatch ? exactMatch.codigo_producto : null);
      
      // Si hay coincidencia exacta, mover a la página correcta
      if (exactMatch) {
        const index = productosFiltrados.findIndex(
          p => p.codigo_producto === exactMatch.codigo_producto
        );
        if (index !== -1) {
          const page = Math.floor(index / itemsPerPage) + 1;
          setCurrentPage(page);
        }
      }
    } else {
      setHighlightedProducto(null);
    }
  }, [searchTerm]);

  // ========== 6) Modal de Opcionales (botón "+") ==========
  const handleOpenModal = async (producto: Producto) => {
    setLoadingOpcionales(producto.codigo_producto);
    setProductoSeleccionado(producto);
    setOpcionalesPage(1);

    const codigoParam = encodeURIComponent(producto.codigo_producto);
    const modeloParam = encodeURIComponent(producto.Modelo || '');
    const categoriaParam = encodeURIComponent(producto.categoria || '');

    try {
      const resp = await fetch(
        `${WEBHOOK_URL_OPCIONALES}?codigo=${codigoParam}&modelo=${modeloParam}&categoria=${categoriaParam}`
      );
      if (!resp.ok) throw new Error(`Error al obtener opcionales: ${resp.status}`);
      const data: Opcional[] = await resp.json();
      setOpcionalesData(data);
      setShowModal(true);
    } catch (err) {
      console.error('Error cargando opcionales:', err);
      setOpcionalesData(null);
    } finally {
      setLoadingOpcionales(null);
    }
  };

  // Cerrar modal de Opcionales
  const handleCloseModal = () => {
    setShowModal(false);
    setProductoSeleccionado(null);
    setOpcionalesData(null);
  };

  // ========== 7) Funciones de Settings ==========
  const handleSettings = async (producto: Producto) => {
    setLoadingSettings(producto.codigo_producto);
    setProductoSeleccionado(producto);
    setOpcionalesPage(1);
    setSelectedOpcionales([]);

    const codigoParam = encodeURIComponent(producto.codigo_producto);
    const modeloParam = encodeURIComponent(producto.Modelo || '');
    const categoriaParam = encodeURIComponent(producto.categoria || '');

    try {
      const resp = await fetch(
        `${WEBHOOK_URL_OPCIONALES}?codigo=${codigoParam}&modelo=${modeloParam}&categoria=${categoriaParam}`
      );
      if (!resp.ok) throw new Error(`Error al obtener opcionales: ${resp.status}`);
      const data: Opcional[] = await resp.json();
      setOpcionalesData(data);
      setShowSettingsModal(true);
    } catch (err) {
      console.error('Error cargando opcionales:', err);
      setOpcionalesData(null);
    } finally {
      setLoadingSettings(null);
    }
  };

  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
    setProductoSeleccionado(null);
    setOpcionalesData(null);
    setSelectedOpcionales([]);
  };

  const handleCheckboxChange = (opcional: Opcional) => {
    setSelectedOpcionales((prev) => {
      const exists = prev.find((item) => item.codigo_producto === opcional.codigo_producto);
      if (exists) {
        return prev.filter((item) => item.codigo_producto !== opcional.codigo_producto);
      } else {
        return [...prev, opcional];
      }
    });
  };

  const handleCalcular = async () => {
    if (!productoSeleccionado) return;
    
    // Almacenar temporalmente para debug
    const productoPrincipal = productoSeleccionado;
    const opcionalesSeleccionados = selectedOpcionales;
    
    try {
      // Navegar directamente a la página de cotización con los datos seleccionados
      // Omitiendo la llamada al webhook para evitar errores
      console.log("Navegando a cotización con producto:", productoPrincipal.codigo_producto);
      console.log("Opcionales seleccionados:", opcionalesSeleccionados.length);
      
      // Navegar a la página de cotización con los datos
      navigate('/cotizacion', {
        state: {
          productoPrincipal: productoPrincipal,
          opcionalesSeleccionados: opcionalesSeleccionados,
        },
      });
      
    } catch (error: any) {
      console.error("Error detallado en cotización:", error);
      
      // Intentar navegar de todos modos si es posible
      try {
        // Plan B: Navegar a la cotización incluso con error
        alert(`Advertencia: Se produjo un error, pero continuaremos con cotización. Detalle: ${error.message || 'Error desconocido'}`);
        
        navigate('/cotizacion', {
          state: {
            productoPrincipal: productoPrincipal,
            opcionalesSeleccionados: opcionalesSeleccionados,
          },
        });
      } catch (navError) {
        console.error("Error fatal, no se puede continuar:", navError);
        alert(`Error crítico: No se pudo crear cotización. Por favor, intente nuevamente más tarde.`);
      }
    }
  };

  // Paginación de Opcionales
  const indexOfLastOpcional = opcionalesPage * opcionalesPerPage;
  const indexOfFirstOpcional = indexOfLastOpcional - opcionalesPerPage;
  const currentOpcionales =
    opcionalesData && opcionalesData.slice(indexOfFirstOpcional, indexOfLastOpcional);
  const totalOpcionalesPages = opcionalesData
    ? Math.ceil(opcionalesData.length / opcionalesPerPage)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white shadow-md p-4 flex flex-col">
        <header className="mb-4">
          <LogoEcoAlliance className="h-20 ml-0" />
        </header>

        {/* Menú Lateral */}
        <nav className="space-y-1 mt-4 flex-1">
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
          >
            <BarChart3 className="h-4 w-4" />
            DASHBOARD
          </Link>
          <Link
            to="/equipos"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-600"
          >
            <BarChart2 className="h-4 w-4" />
            EQUIPOS
          </Link>
          <Link
            to="/admin"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
          >
            <BarChart2 className="h-4 w-4" />
            ADMIN
          </Link>
        </nav>

        {/* Botón de configurar en la parte inferior */}
        <div className="pt-2 border-t mt-auto">
          <Link
            to="/configuracion"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            CONFIGURACIÓN
          </Link>
        </div>
      </aside>

      {/* Panel Principal */}
      <main className="flex-1 p-4 flex flex-col max-h-screen overflow-auto">
        <h2 className="text-2xl font-bold mb-6">EQUIPOS</h2>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  // Priorizar búsqueda por código exacto
                  const exactCodeMatch = productos.find(
                    p => p.codigo_producto.toLowerCase() === searchTerm.toLowerCase()
                  );
                  if (exactCodeMatch) {
                    const index = productosFiltrados.findIndex(
                      p => p.codigo_producto === exactCodeMatch.codigo_producto
                    );
                    if (index !== -1) {
                      const page = Math.floor(index / itemsPerPage) + 1;
                      setCurrentPage(page);
                    }
                  }
                }
              }}
            />
            <div className="absolute right-0 top-0 h-full flex items-center mr-2">
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help" />
                <div className="absolute z-10 w-60 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity -right-2 top-full mt-1 pointer-events-none">
                  <p className="mb-1 font-semibold">Búsqueda inteligente:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Busque por <b>código exacto</b> para localización inmediata</li>
                    <li>También puede buscar por nombre o descripción</li>
                    <li>Presione Enter para saltar a coincidencias exactas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <div className="relative">
              <select
                className="appearance-none border rounded-lg py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                value={categoriaSeleccionada}
                onChange={(e) => {
                  setCategoriaSeleccionada(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {categorias.map((categoria, index) => (
                  <option key={index} value={categoria}>
                    {categoria === 'todas' ? 'Todas las categorías' : categoria}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de carga */}
        {loading && (
          <div className="flex-1 bg-white rounded-xl shadow-sm overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center space-x-2">
              <div className="animate-spin">
                <Loader className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Cargando equipos...</p>
            </div>
            
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Modelo</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-center">Ver Detalle</th>
                  <th className="px-6 py-4 text-center">Opcionales</th>
                  <th className="px-6 py-4 text-center">Configurar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-3">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 md:w-32 lg:w-48"></div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="h-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded w-16 mx-auto"></div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="h-6 w-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full mx-auto"></div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="h-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded w-16 mx-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mensaje de error */}
        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-red-50 p-6 rounded-xl">
            <div className="text-red-500">
              <X className="h-12 w-12" />
            </div>
            <p className="text-lg text-red-600 font-medium">Error al cargar datos</p>
            <p className="text-sm text-red-500">{error}</p>
            <button 
              onClick={obtenerDatos}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla Principal */}
        {!loading && !error && (
          <div className="flex-1 bg-white rounded-xl shadow-sm overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {highlightedProducto ? (
                  <span className="flex items-center gap-1">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">Código encontrado</span> 
                    Mostrando resultados para <span className="font-mono font-medium">{searchTerm}</span>
                  </span>
                ) : (
                  <span>
                    Mostrando <span className="font-semibold">{productosFiltrados.length}</span> 
                    {categoriaSeleccionada !== 'todas' ? 
                      ` equipos en la categoría "${categoriaSeleccionada}"` : 
                      ' equipos'} 
                    {searchTerm && ` con "${searchTerm}"`}
                  </span>
                )}
              </p>
              
              <button 
                onClick={obtenerDatos}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Actualizar
              </button>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Modelo</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-center">Ver Detalle</th>
                  <th className="px-6 py-4 text-center">Opcionales</th>
                  <th className="px-6 py-4 text-center">Configurar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentProductos.map((p) => (
                  <tr
                    key={p.codigo_producto}
                    className={`hover:bg-gray-50 ${highlightedProducto === p.codigo_producto ? 'bg-blue-100 shadow-sm' : ''}`}
                  >
                    <td className="px-6 py-3 font-mono bg-blue-50 text-blue-800 font-medium border-l-2 border-blue-200 tracking-wider">{p.codigo_producto}</td>
                    <td className="px-6 py-3">{p.nombre_del_producto}</td>
                    <td className="px-6 py-3">
                      {p.Descripcion || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-3">{p.Modelo || <span className="text-gray-400">—</span>}</td>
                    <td className="px-6 py-3">
                      {p.categoria ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          p.categoria === 'Chipeadora' ? 'bg-green-100 text-green-800' :
                          p.categoria === 'Trituradora' ? 'bg-blue-100 text-blue-800' :
                          p.categoria === 'Astilladora' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {p.categoria}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    
                    {/* Botón "Ver Detalle" */}
                    <td className="px-6 py-3 text-center">
                      <div className="relative inline-block group">
                        <button
                          onClick={() => handleVerDetalle(p)}
                          className={`flex items-center justify-center ${loadingDetail === p.codigo_producto ? 'opacity-70' : ''}`}
                          disabled={loadingDetail === p.codigo_producto}
                        >
                          {loadingDetail === p.codigo_producto ? (
                            <Loader className="text-blue-600 animate-spin w-5 h-5" />
                          ) : (
                            <Info className="text-blue-600 hover:text-blue-800 w-5 h-5" />
                          )}
                        </button>
                        <div className="absolute z-10 w-40 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity -bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-none">
                          Ver especificaciones técnicas completas
                        </div>
                      </div>
                    </td>

                    {/* Botón "Opcionales" */}
                    <td className="px-6 py-3 text-center">
                      <div className="relative inline-block group">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className={`flex items-center justify-center ${loadingOpcionales === p.codigo_producto ? 'opacity-70' : ''}`}
                          disabled={loadingOpcionales === p.codigo_producto}
                        >
                          {loadingOpcionales === p.codigo_producto ? (
                            <Loader className="text-blue-600 animate-spin w-5 h-5" />
                          ) : (
                            <PlusCircle className="text-blue-600 hover:text-blue-800 w-5 h-5" />
                          )}
                        </button>
                        <div className="absolute z-10 w-40 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity -bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-none">
                          Ver opcionales disponibles
                        </div>
                      </div>
                    </td>

                    {/* Botón "Configurar" */}
                    <td className="px-6 py-3 text-center">
                      <div className="relative inline-block group">
                        <button
                          onClick={() => handleSettings(p)}
                          className={`flex items-center justify-center ${loadingSettings === p.codigo_producto ? 'opacity-70' : ''}`}
                          disabled={loadingSettings === p.codigo_producto}
                        >
                          {loadingSettings === p.codigo_producto ? (
                            <Loader className="text-blue-600 animate-spin w-5 h-5" />
                          ) : (
                            <Calculator className="text-blue-600 hover:text-blue-800 w-5 h-5" />
                          )}
                        </button>
                        <div className="absolute z-10 w-40 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity -bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-none">
                          Configurar con opcionales
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación de Productos */}
            <div className="flex justify-center items-center mt-6 space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ←
              </button>
              <span className="text-gray-700 font-semibold">
                {currentPage} de {Math.ceil(productosFiltrados.length / itemsPerPage)}
              </span>
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(productosFiltrados.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(productosFiltrados.length / itemsPerPage)}
              >
                →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Chat Button and Chat Window */}
      <div className="fixed bottom-8 right-8 z-50">
        {/* Chat Button */}
        <button
          onClick={toggleChat}
          className={`flex items-center justify-center p-4 rounded-full shadow-lg transition-colors ${
            isChatOpen ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          aria-label="Abrir chat"
        >
          {isChatOpen ? <X size={20} /> : <MessageCircle size={20} />}
        </button>

        {/* Chat Panel */}
        {isChatOpen && (
          <div className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 flex flex-col animate-scaleIn">
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-medium text-lg">Soporte EcoAlliance</h3>
              <button onClick={toggleChat} className="text-white hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 p-4 max-h-[400px] overflow-y-auto flex flex-col space-y-4">
              {chatHistory.map((msg, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg max-w-[80%] ${
                    msg.type === 'user' 
                      ? 'bg-blue-100 ml-auto rounded-tr-none' 
                      : 'bg-gray-100 rounded-tl-none'
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ))}
            </div>
            
            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 flex">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 border border-gray-300 rounded-l-md px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Opcionales */}
      {showModal && productoSeleccionado && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full mx-4 h-[85vh] animate-scaleIn overflow-hidden border border-gray-200">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-xl font-bold flex items-center gap-2 text-blue-700">
                <PlusCircle className="h-5 w-5 text-blue-600" />
                Opcionales: {productoSeleccionado.nombre_del_producto
                  .replace(/^Opcional: |^Opcional |Opcional de |Opcional: de /, '')
                  .replace(/^Chipeadora Chipeadora/, 'Chipeadora')}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 hover:bg-gray-100 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-auto h-[calc(85vh-80px)] bg-gray-50">
              {currentOpcionales && currentOpcionales.length > 0 ? (
                <>
                  <table className="w-full text-sm border bg-white rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-gradient-to-r from-gray-100 to-blue-50 font-semibold text-gray-700 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 border-b">Código</th>
                        <th className="px-4 py-3 border-b">Nombre</th>
                        <th className="px-4 py-3 border-b">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOpcionales.map((op, index) => (
                        <tr key={op.codigo_producto} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-3 border-b border-gray-100 font-mono bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-200 tracking-wider">{op.codigo_producto}</td>
                          <td className="px-4 py-3 border-b border-gray-100 font-medium">{op.nombre_del_producto
                            .replace(/^Opcional: |^Opcional |Opcional de |Opcional: de /, '')
                            .replace(/^Chipeadora Chipeadora/, 'Chipeadora')}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{op.Descripcion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Paginación Opcionales */}
                  <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                      className="px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1 shadow-sm"
                      onClick={() => setOpcionalesPage((prev) => Math.max(prev - 1, 1))}
                      disabled={opcionalesPage === 1}
                    >
                      <span>←</span> Anterior
                    </button>
                    <span className="text-gray-700 font-medium bg-white px-4 py-2 rounded-md border border-gray-200 shadow-sm">
                      {opcionalesPage} de {Math.ceil((opcionalesData?.length || 0) / opcionalesPerPage)}
                    </span>
                    <button
                      className="px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1 shadow-sm"
                      onClick={() =>
                        setOpcionalesPage((prev) =>
                          Math.min(prev + 1, Math.ceil((opcionalesData?.length || 0) / opcionalesPerPage))
                        )
                      }
                      disabled={opcionalesPage === Math.ceil((opcionalesData?.length || 0) / opcionalesPerPage)}
                    >
                      Siguiente <span>→</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
                  <div className="text-gray-400 mb-4 bg-gray-100 p-4 rounded-full">
                    <X className="h-12 w-12" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">No hay opcionales disponibles</p>
                  <p className="text-gray-500 mt-2">Este producto no tiene opcionales configurados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cotización */}
      {showSettingsModal && productoSeleccionado && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white rounded-xl shadow-xl w-11/12 max-w-6xl h-[90vh] animate-scaleIn overflow-hidden border border-gray-200">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-xl font-bold flex items-center gap-2 text-blue-700">
                <Calculator className="h-5 w-5 text-blue-600" />
                Configurar: {productoSeleccionado.nombre_del_producto
                  .replace(/^Opcional: |^Opcional |Opcional de |Opcional: de /, '')
                  .replace(/^Chipeadora Chipeadora/, 'Chipeadora')}
              </h2>
              <button
                onClick={handleCloseSettingsModal}
                className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 hover:bg-gray-100 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-gray-50 h-[calc(90vh-140px)] overflow-auto">
              {currentOpcionales && currentOpcionales.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-100 to-blue-50 font-semibold text-gray-700 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 border-b text-center w-[80px] min-w-[70px] sticky left-0 z-20 bg-gradient-to-r from-gray-100 to-blue-50">Seleccionar</th>
                        <th className="px-4 py-3 border-b min-w-[120px] w-[120px]">Código</th>
                        <th className="px-4 py-3 border-b min-w-[250px]">Nombre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOpcionales.map((item, index) => (
                        <tr key={item.codigo_producto} 
                          className={`hover:bg-blue-50 transition-colors ${
                            selectedOpcionales.some(op => op.codigo_producto === item.codigo_producto) 
                              ? 'bg-blue-50' 
                              : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="p-3 border-b border-gray-100 text-center sticky left-0 z-10"
                            style={{background: selectedOpcionales.some(op => op.codigo_producto === item.codigo_producto) 
                              ? '#EBF5FF' /* bg-blue-50 */ 
                              : index % 2 === 0 ? 'white' : '#F9FAFB' /* bg-gray-50 */}}
                          >
                            <label className="cursor-pointer relative inline-flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={selectedOpcionales.some(op => op.codigo_producto === item.codigo_producto)}
                                onChange={() => handleCheckboxChange(item)}
                              />
                              <div className="w-5 h-5 border border-gray-300 rounded-md bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-all duration-200 peer-hover:border-blue-400">
                                {selectedOpcionales.some(op => op.codigo_producto === item.codigo_producto) && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </label>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100 font-mono bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-200 tracking-wider">{item.codigo_producto}</td>
                          <td className="px-4 py-3 border-b border-gray-100 font-medium">{item.nombre_del_producto
                            .replace(/^Opcional: |^Opcional |Opcional de |Opcional: de /, '')
                            .replace(/^Chipeadora Chipeadora/, 'Chipeadora')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
                  <div className="text-gray-400 mb-4 bg-gray-100 p-4 rounded-full">
                    <X className="h-12 w-12" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">No hay opcionales disponibles para cotizar</p>
                  <p className="text-gray-500 mt-2">Este producto no tiene opcionales configurados</p>
                </div>
              )}
            </div>

            {/* Footer con contador y paginación */}
            <div className="px-6 py-4 border-t bg-white sticky bottom-0 shadow-md z-20">
              <div className="flex flex-wrap justify-between items-center gap-4">
                {/* Conteo de seleccionados */}
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedOpcionales.length} seleccionados
                  </span>
                  <span className="text-sm text-gray-600">
                    de {opcionalesData?.length} opcionales
                  </span>
                </div>

                {/* Paginación */}
                <div className="flex items-center gap-3">
                  <button
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1 text-sm shadow-sm"
                    onClick={() => setOpcionalesPage((prev) => Math.max(prev - 1, 1))}
                    disabled={opcionalesPage === 1}
                  >
                    <span>←</span> Anterior
                  </button>
                  <span className="text-gray-700 font-medium bg-white px-3 py-1.5 rounded-md border border-gray-200 text-sm shadow-sm">
                    {opcionalesPage} de {totalOpcionalesPages}
                  </span>
                  <button
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1 text-sm shadow-sm"
                    onClick={() => setOpcionalesPage((prev) => Math.min(prev + 1, totalOpcionalesPages))}
                    disabled={opcionalesPage === totalOpcionalesPages}
                  >
                    Siguiente <span>→</span>
                  </button>
                </div>

                {/* Botón "Crear configurar" */}
                <button
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md ${selectedOpcionales.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
                  onClick={handleCalcular}
                  disabled={selectedOpcionales.length === 0}
                >
                  <Calculator className="h-4 w-4" />
                  Configurar {selectedOpcionales.length > 0 && `(${selectedOpcionales.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Ver Detalle" (JSON aplanado) */}
      {showJsonModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white rounded-xl shadow-xl w-11/12 max-w-5xl h-[85vh] animate-scaleIn overflow-hidden border border-gray-200">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-xl font-bold flex items-center gap-2 text-blue-700">
                <Info className="h-5 w-5 text-blue-600" />
                Especificaciones Técnicas
              </h2>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 hover:bg-gray-100 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-auto h-[calc(85vh-80px)] bg-gray-50">
              {Object.keys(flattenedData).length > 0 ? (
                <table className="w-full text-sm border bg-white rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gradient-to-r from-gray-100 to-blue-50 font-semibold text-gray-700 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-b text-left" style={{ width: "35%" }}>Característica</th>
                      <th className="px-4 py-3 border-b text-left">Especificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(flattenedData).map(([key, value], index) => (
                      <tr key={index} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800">{key}</td>
                        <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
                  <div className="text-gray-400 mb-4 bg-gray-100 p-4 rounded-full">
                    <X className="h-12 w-12" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">No hay especificaciones disponibles</p>
                  <p className="text-gray-500 mt-2">Este producto no tiene detalles técnicos configurados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  );
}