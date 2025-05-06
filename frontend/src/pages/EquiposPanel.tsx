import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowLeft, ArrowRight, Check, MessageCircle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import OpcionalesCotizacionModal from '../components/OpcionalesCotizacionModal';
import DetallesCargaPanel from './DetallesCargaPanel';
import DetallesEnvioPanel from './DetallesEnvioPanel';
import type { Producto } from '../types/product';
import PageLayout from '../components/PageLayout';

// Interfaces (copiadas de App.tsx)
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

// Definición de la interfaz ProductoConOpcionales (puede estar en un archivo de tipos más adelante)
interface ProductoConOpcionales {
  principal: Producto;
  opcionales: Producto[];
}

// --- Placeholder para la función API --- 
// Deberás implementar esto en tu archivo de servicios API (ej. frontend/src/services/api.ts)
const api = {
  calculatePricing: async (body: { productCode: string; [key: string]: any }) => {
    console.log("[API Placeholder] Calling calculatePricing with body:", body);
    // Simular llamada fetch a POST /api/pricing-overrides/calculate
    // const response = await fetch('/api/pricing-overrides/calculate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(body)
    // });
    // if (!response.ok) throw new Error('Error en la respuesta del cálculo de precios');
    // const data = await response.json();
    // if (!data.success) throw new Error(data.message || 'Error en el cálculo de precios');
    // return data.data; // Devolver solo la parte 'data' que contiene inputsUsed y calculations
    
    // --- Respuesta simulada (¡REEMPLAZAR!) ---
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay
    return { 
      inputsUsed: { productCode: body.productCode, categoryId: 'simulated_category', totalMarginPercent: 0.35, landedCostUSD: 124112.35, appliedUsdClpRate: 978.5, netSalePriceCLP: 163954687, finalSalePriceCLP: 195106078 }, 
      calculations: { landedCostUSD: 124112.35, appliedUsdClpRate: 978.5, landedCostCLP: 121447916, marginAmountCLP: 42506771, netSalePriceCLP: 163954687, saleIvaAmountCLP: 31151391, finalSalePriceCLP: 195106078 }
    }; 
    // --- Fin Respuesta simulada ---
  }
};
// --- Fin Placeholder API ---

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
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [detalleProducto, setDetalleProducto] = useState<Producto | null>(null);

  // Estados para el modal de "Ver Opcionales" (el que se abre desde el botón de información en cada fila)
  const [showVistaOpcionalesModal, setShowVistaOpcionalesModal] = useState(false);
  const [productoParaVistaOpcionales, setProductoParaVistaOpcionales] = useState<Producto | null>(null);
  const [vistaOpcionalesData, setVistaOpcionalesData] = useState<Producto[]>([]);
  const [vistaOpcionalesLoading, setVistaOpcionalesLoading] = useState(false);
  const [vistaOpcionalesError, setVistaOpcionalesError] = useState<string | null>(null);
  const [loadingOpcionalesBtn, setLoadingOpcionalesBtn] = useState<string | null>(null);

  // --- NUEVO: Estados para el Flujo de Cotización ---
  const [pasoCotizacion, setPasoCotizacion] = useState<number>(0); // 0: Tabla Equipos, 1: Detalles Carga, ...
  const [opcionalesConfirmados, setOpcionalesConfirmados] = useState<Producto[]>([]); // Guarda los opcionales seleccionados

  // --- NUEVO: Estados para el Resultado del Cálculo --- 
  const [pricingResult, setPricingResult] = useState<any>(null); // Almacenará la respuesta completa del cálculo
  const [pricingLoading, setPricingLoading] = useState<boolean>(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  // -------------------------------------------------------

  // --- Estado para el modo de selección de equipos para cotización ---
  const [isSelectionModeActive, setIsSelectionModeActive] = useState<boolean>(false);
  // --- Estado para almacenar los códigos de los productos seleccionados para cotizar ---
  const [productosSeleccionadosParaCotizar, setProductosSeleccionadosParaCotizar] = useState<string[]>([]);
  // --- NUEVO: Estado para la configuración secuencial de opcionales ---
  const [indiceProductoActualParaOpcionales, setIndiceProductoActualParaOpcionales] = useState<number | null>(null);
  const [opcionalesSeleccionadosPorProducto, setOpcionalesSeleccionadosPorProducto] = useState<Record<string, Producto[]>>({});
  // --- NUEVO: Estado para pasar datos estructurados a DetallesCargaPanel ---
  const [datosParaDetallesCarga, setDatosParaDetallesCarga] = useState<ProductoConOpcionales[]>([]);
  // --- NUEVO: Estado para el producto principal cuyos opcionales se están configurando ---
  const [productoActualConfigurandoOpcionales, setProductoActualConfigurandoOpcionales] = useState<Producto | null>(null);

  // --- NUEVO: Estados para los datos del OpcionalesCotizacionModal ---
  // Estos se llenarán dinámicamente para el productoActualConfigurandoOpcionales
  const [opcionalesDataModal, setOpcionalesDataModal] = useState<Producto[]>([]);
  const [opcionalesLoadingModal, setOpcionalesLoadingModal] = useState(false);
  const [opcionalesErrorModal, setOpcionalesErrorModal] = useState<string | null>(null);

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

  // Estilo para el botón flotante de chat
  const [isHoveringChat, setIsHoveringChat] = useState(false);
  const chatButtonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: isHoveringChat ? '#1d4ed8' : '#2563eb',
    color: 'white',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    border: 'none',
    transition: 'transform 0.2s ease, background-color 0.2s ease',
    zIndex: 1000,
    transform: isHoveringChat ? 'scale(1.05)' : 'scale(1)'
  };

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
    setProductoActualConfigurandoOpcionales(producto);
    setOpcionalesLoadingModal(true); // Mostrar loading en el modal mientras carga
    setOpcionalesErrorModal(null);
    setOpcionalesDataModal([]);

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
        setOpcionalesDataModal(data.data.products); // Cargar datos para el modal
      } else {
         throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
       console.error('Error al obtener opcionales para modal configuración:', error);
       setOpcionalesErrorModal(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
       setOpcionalesLoadingModal(false); // Terminar carga del modal
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
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => { window.removeEventListener('keydown', handleEscKey); };
  }, [showVistaOpcionalesModal, showDetalleModal]);

  const handleCloseDetalleModal = () => {
    setShowDetalleModal(false);
    setDetalleProducto(null);
  };

  // --- NUEVO: Función para avanzar en la configuración de opcionales o finalizar ---
  const avanzarConfiguracionOpcionales = (guardarOpcionalesActuales: Producto[] | null = null) => {
    if (indiceProductoActualParaOpcionales === null) return; // No debería pasar si se llama correctamente

    const codigoProductoActual = productosSeleccionadosParaCotizar[indiceProductoActualParaOpcionales];

    if (codigoProductoActual && guardarOpcionalesActuales) {
      setOpcionalesSeleccionadosPorProducto(prev => ({
        ...prev,
        [codigoProductoActual]: guardarOpcionalesActuales
      }));
    } else if (codigoProductoActual && guardarOpcionalesActuales === null) { // Modal cerrado sin confirmar
      setOpcionalesSeleccionadosPorProducto(prev => ({
        ...prev,
        [codigoProductoActual]: prev[codigoProductoActual] || [] // Mantener opcionales previos o array vacío si no hay
      }));
    }

    const siguienteIndice = indiceProductoActualParaOpcionales + 1;

    if (siguienteIndice < productosSeleccionadosParaCotizar.length) {
      setIndiceProductoActualParaOpcionales(siguienteIndice);
      const siguienteCodigoProducto = productosSeleccionadosParaCotizar[siguienteIndice];
      const siguienteProducto = productosOriginales.find(p => p.codigo_producto === siguienteCodigoProducto);
      if (siguienteProducto) {
        console.log("Configurando opcionales para el SIGUIENTE producto:", siguienteProducto.nombre_del_producto);
        // Asegurarse de que el modal de opcionales se limpie y recargue para el nuevo producto
        setOpcionalesDataModal([]); // Limpiar datos de opcionales del producto anterior
        setOpcionalesErrorModal(null);
        handleConfigurar(siguienteProducto); // Abre el modal para el siguiente producto
      } else {
        console.error("Error: Siguiente producto para configurar no encontrado.");
        // Considerar cómo manejar este error (ej. finalizar prematuramente)
        setIndiceProductoActualParaOpcionales(null);
        setPasoCotizacion(0); // Volver a la tabla de equipos
      }
    } else {
      // Todos los productos seleccionados han sido configurados (o se les dio la oportunidad)
      console.log("Configuración de opcionales finalizada.");
      console.log("Productos Principales Seleccionados (códigos):", productosSeleccionadosParaCotizar);
      console.log("Opcionales Seleccionados por Producto:", opcionalesSeleccionadosPorProducto);
      
      const itemsParaDetalleCarga: ProductoConOpcionales[] = productosSeleccionadosParaCotizar.map(codigoPrincipal => {
        const principal = productosOriginales.find(p => p.codigo_producto === codigoPrincipal);
        const opcionales = opcionalesSeleccionadosPorProducto[codigoPrincipal] || [];
        return {
          principal: principal || {} as Producto, // Evitar undefined si no se encuentra
          opcionales: opcionales
        };
      }).filter(item => item.principal && item.principal.codigo_producto); // Asegurarse que el principal es válido

      console.log("Datos preparados para DetallesCargaPanel:", itemsParaDetalleCarga);
      setDatosParaDetallesCarga(itemsParaDetalleCarga);
      
      setPasoCotizacion(1); // Transición a DetallesCargaPanel
      setIndiceProductoActualParaOpcionales(null); // Resetear índice
    }
  };

  // --- useEffect para cargar opcionales cuando productoActualConfigurandoOpcionales cambia y estamos en paso 1 ---
  useEffect(() => {
    const fetchOpcionalesParaProductoActual = async () => {
      if (!productoActualConfigurandoOpcionales || !productoActualConfigurandoOpcionales.codigo_producto) {
        setOpcionalesDataModal([]);
        return;
      }

      console.log(`Cargando opcionales (para modal) para: ${productoActualConfigurandoOpcionales.nombre_del_producto}`);
      setOpcionalesLoadingModal(true);
      setOpcionalesErrorModal(null);
      setOpcionalesDataModal([]); // Limpiar datos previos

      try {
        const { codigo_producto, Modelo, categoria } = productoActualConfigurandoOpcionales;
        if (!codigo_producto || !Modelo || !categoria) {
          throw new Error('Faltan parámetros (código, modelo o categoría) para obtener opcionales.');
        }
        const params = new URLSearchParams();
        params.append('codigo', codigo_producto);
        params.append('modelo', Modelo);
        params.append('categoria', categoria);
        const url = `http://localhost:5001/api/products/opcionales?${params.toString()}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Error del servidor: ${response.status}` }));
          throw new Error(errorData.message || `Error del servidor: ${response.status}`);
        }
        const dataAPI = await response.json(); // Renombrado para evitar conflicto con opcionalesDataModal

        if (dataAPI.success && dataAPI.data && Array.isArray(dataAPI.data.products)) {
          setOpcionalesDataModal(dataAPI.data.products);
        } else {
          throw new Error('Formato de respuesta de opcionales inválido.');
        }
      } catch (error: any) {
        console.error('Error al obtener opcionales para el producto actual en modal:', error);
        if (error.name === 'AbortError') {
          setOpcionalesErrorModal('La solicitud para obtener opcionales tardó demasiado.');
        } else {
          setOpcionalesErrorModal(error instanceof Error ? error.message : 'Error desconocido al obtener opcionales.');
        }
        setOpcionalesDataModal([]);
      } finally {
        setOpcionalesLoadingModal(false);
      }
    };

    if (pasoCotizacion === 1 && productoActualConfigurandoOpcionales) {
      fetchOpcionalesParaProductoActual();
    }
  }, [productoActualConfigurandoOpcionales, pasoCotizacion]);

  // --- MODIFICADO: Función llamada desde OpcionalesCotizacionModal --- 
  // Esta función se llama cuando el usuario confirma la selección de opcionales DENTRO DEL MODAL
  // para el producto principal que se está mostrando actualmente en ese modal.
  const handleConfirmarOpcionalesParaPrincipalActual = (codigosOpcionalesSeleccionados: string[]) => {
    if (!productoActualConfigurandoOpcionales || !productoActualConfigurandoOpcionales.codigo_producto) {
      console.error("Error: No hay producto principal actual para confirmar opcionales.");
      // Considerar cerrar el modal o mostrar un error al usuario aquí si esto sucede.
      return;
    }
    const codigoPrincipalActual = productoActualConfigurandoOpcionales.codigo_producto;
    console.log(`Opcionales confirmados para ${codigoPrincipalActual}:`, codigosOpcionalesSeleccionados);
    
    // opcionalesDataModal tiene los opcionales disponibles para el productoActualConfigurandoOpcionales
    const seleccionadosCompletos = opcionalesDataModal.filter(op => 
        op.codigo_producto && codigosOpcionalesSeleccionados.includes(op.codigo_producto)
    );

    setOpcionalesSeleccionadosPorProducto(prev => ({
      ...prev,
      [codigoPrincipalActual]: seleccionadosCompletos
    }));

    // Avanzar al siguiente producto principal para configurar sus opcionales, o finalizar.
    avanzarAlSiguientePrincipalParaOpcionales(); 
  };
  
  // --- MODIFICADO: Al cerrar el modal de cotización/opcionales (OpcionalesCotizacionModal) ---
  // Esto se llama si el usuario cierra el modal (ej. con su botón 'X') ANTES de completar la selección de todos los productos.
  const handleCerrarProcesoSeleccionOpcionalesGlobal = () => { 
      console.log("Proceso global de selección de opcionales cerrado/cancelado por el usuario.");
      setIsSelectionModeActive(false); // Salir del modo de checkboxes si aún estaba activo (no debería)
      setProductosSeleccionadosParaCotizar([]);
      setOpcionalesSeleccionadosPorProducto({});
      setIndiceProductoActualParaOpcionales(null);
      setProductoActualConfigurandoOpcionales(null);
      setDatosParaDetallesCarga([]);
      
      // Limpiar estados del modal
      setOpcionalesDataModal([]);
      setOpcionalesLoadingModal(false);
      setOpcionalesErrorModal(null);

      setPasoCotizacion(0); // Volver a la tabla de equipos
  };

  // --- NUEVA: Función para avanzar al siguiente producto principal para la selección de opcionales ---
  const avanzarAlSiguientePrincipalParaOpcionales = () => {
    const siguienteIndice = (indiceProductoActualParaOpcionales ?? -1) + 1; // Inicia en 0 si es null

    if (siguienteIndice < productosSeleccionadosParaCotizar.length) {
      setIndiceProductoActualParaOpcionales(siguienteIndice);
      const siguienteCodigoProducto = productosSeleccionadosParaCotizar[siguienteIndice];
      const siguienteProducto = productosOriginales.find(p => p.codigo_producto === siguienteCodigoProducto);
      
      if (siguienteProducto) {
        console.log(`Avanzando para configurar opcionales de: ${siguienteProducto.nombre_del_producto}`);
        setProductoActualConfigurandoOpcionales(siguienteProducto);
        // El useEffect se encargará de llamar a fetchOpcionalesParaProductoActual
        // y el OpcionalesCotizacionModal se re-renderizará con el nuevo producto y sus opcionales.
      } else {
        console.error(`Error: Siguiente producto principal (${siguienteCodigoProducto}) no encontrado. Deteniendo el proceso.`);
        handleCerrarProcesoSeleccionOpcionalesGlobal(); // Volver al inicio si hay un error grave
      }
    } else {
      // Todos los productos principales han sido procesados para opcionales.
      console.log("Todos los productos principales han tenido la oportunidad de configurar opcionales.");
      
      const itemsParaDetalleCargaCalc: ProductoConOpcionales[] = productosSeleccionadosParaCotizar.map(codigoPrincipal => {
        const principal = productosOriginales.find(p => p.codigo_producto === codigoPrincipal);
        const opcionales = opcionalesSeleccionadosPorProducto[codigoPrincipal] || []; // Usar los opcionales guardados
        return {
          principal: principal || {} as Producto,
          opcionales: opcionales
        };
      }).filter(item => item.principal && item.principal.codigo_producto); 
      
      setDatosParaDetallesCarga(itemsParaDetalleCargaCalc);
      console.log("Datos finales para Detalles de la Carga:", itemsParaDetalleCargaCalc);

      setPasoCotizacion(2); // Ir a Detalles de la Carga
      
      // Limpiar estados de la configuración de opcionales actual
      setIndiceProductoActualParaOpcionales(null);
      setProductoActualConfigurandoOpcionales(null);
      // No limpiar opcionalesSeleccionadosPorProducto aquí, se usó para datosParaDetallesCarga
      // No limpiar productosSeleccionadosParaCotizar aquí, se usó para datosParaDetallesCarga
    }
  };

  // --- MODIFICADO: Función para proceder a la selección de opcionales (cuando se hace clic en "Cotizar X Equipos")
  const handleProceedToOptionSelection = () => {
    if (productosSeleccionadosParaCotizar.length === 0) return;

    setIsSelectionModeActive(false); // Salir del modo de selección con checkboxes
    setOpcionalesSeleccionadosPorProducto({}); // Limpiar opcionales guardados de una sesión anterior
    setIndiceProductoActualParaOpcionales(0); // Empezar con el primer producto seleccionado

    const primerCodigoProducto = productosSeleccionadosParaCotizar[0];
    const primerProducto = productosOriginales.find(p => p.codigo_producto === primerCodigoProducto);
    
    if (primerProducto) {
      setProductoActualConfigurandoOpcionales(primerProducto);
      // El useEffect se encargará de buscar los opcionales del primerProducto
      // y el OpcionalesCotizacionModal se mostrará porque pasoCotizacion será 1
    } else {
      console.error("No se encontró el primer producto para configurar opcionales. Volviendo al inicio.");
      handleCerrarProcesoSeleccionOpcionalesGlobal(); // Resetear todo y volver al paso 0
      return; 
    }
    setPasoCotizacion(1); // Cambiar al panel/vista de "Selección de Opcionales"
  };

  // --- Función para eliminar un opcional confirmado (desde DetallesCargaPanel) ---
  // Esta es la versión correcta que actualiza los estados relevantes
  const handleEliminarOpcionalConfirmado = (codigoPrincipal: string, codigoOpcionalAEliminar: string) => {
    console.log(`Eliminando opcional ${codigoOpcionalAEliminar} del principal ${codigoPrincipal}`);
    setOpcionalesSeleccionadosPorProducto(prevOpcionalesPorProducto => {
      const nuevosOpcionalesParaPrincipal = (prevOpcionalesPorProducto[codigoPrincipal] || []).filter(
        op => op.codigo_producto !== codigoOpcionalAEliminar
      );
      return {
        ...prevOpcionalesPorProducto,
        [codigoPrincipal]: nuevosOpcionalesParaPrincipal
      };
    });
    // Actualizar datosParaDetallesCarga para que la UI de DetallesCargaPanel refleje el cambio
    setDatosParaDetallesCarga(prevDatos => prevDatos.map(item => {
      if (item.principal.codigo_producto === codigoPrincipal) {
        return {
          ...item,
          opcionales: (item.opcionales || []).filter(op => op.codigo_producto !== codigoOpcionalAEliminar)
        };
      }
      return item;
    }).filter(item => item.principal.codigo_producto)); // Asegurar que no queden items sin principal
  };

  // --- Función para alternar el modo de selección de equipos ---
  const toggleSelectionMode = () => {
    setIsSelectionModeActive(prevIsActive => {
      if (prevIsActive) { 
        // Al salir del modo de selección, no hacer nada especial aquí ya que "Cotizar" tiene su propia lógica.
      }
      return !prevIsActive;
    });
  };

  // --- Función para manejar la selección/deselección de un producto para cotizar ---
  const handleToggleProductoParaCotizar = (codigoProducto: string) => {
    setProductosSeleccionadosParaCotizar(prevSeleccionados => {
      if (prevSeleccionados.includes(codigoProducto)) {
        return prevSeleccionados.filter(codigo => codigo !== codigoProducto);
      } else {
        return [...prevSeleccionados, codigoProducto];
      }
    });
  };

  // --- Funciones de navegación y cálculo de precios que fueron eliminadas accidentalmente ---
  const handleVolverDesdeDetalles = () => {
    // Al volver desde DetallesCargaPanel, usualmente se quiere volver a la tabla de equipos
    // o al inicio del proceso de selección de opcionales si se desea modificar.
    // Por consistencia con handleCerrarProcesoSeleccionOpcionalesGlobal, reseteamos todo.
    handleCerrarProcesoSeleccionOpcionalesGlobal(); 
  };

  const handleSiguienteDesdeDetalles = async () => {
    // Esta función se llama desde DetallesCargaPanel.
    // Aquí se debería implementar la lógica para el siguiente paso, ej. Detalles de Envío.
    // Y potencialmente el cálculo de precios para los itemsEnDetalleCarga.
    console.log("Paso a Detalles de Envío/Cálculo de Precios...", datosParaDetallesCarga);
    
    // Lógica de ejemplo para el cálculo de precios (Placeholder)
    if (datosParaDetallesCarga.length > 0) {
      // Suponiendo que necesitamos el primer producto para la API de precios actual
      const primerItem = datosParaDetallesCarga[0];
      if (primerItem.principal.codigo_producto) {
        setPricingLoading(true);
        setPricingError(null);
        setPricingResult(null);
        try {
          const result = await api.calculatePricing({ 
            productCode: primerItem.principal.codigo_producto 
            // Aquí se podría extender para enviar también los opcionales del primerItem
            // o si la API soporta múltiples productos, enviar todos los datosParaDetallesCarga.
          });
          setPricingResult(result);
          // setPasoCotizacion(3); // Suponiendo que 3 es DetallesEnvioPanel después del cálculo
          console.log("Cálculo de precios simulado exitoso para el primer item.", result);
          alert("Cálculo de precios (simulado) para el primer producto realizado. Ver consola. Siguiente paso no implementado.");
          // Por ahora, no avanzamos a otro paso ya que DetallesEnvioPanel no está totalmente integrado
          // en este nuevo flujo de múltiples productos.

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Error desconocido al calcular precios.";
          setPricingError(errorMsg);
          console.error("Error en cálculo de precios (simulado):", errorMsg);
        } finally {
          setPricingLoading(false);
        }
      } else {
        setPricingError("El primer producto seleccionado no tiene código para calcular precios.");
      }
    } else {
      setPricingError("No hay productos en Detalles de Carga para calcular precios.");
    }
  };

  // JSX (movido de App.tsx, corresponde al <main>...</main>)
  if (pasoCotizacion === 1 && productoActualConfigurandoOpcionales) {
    // PASO 1: Selección de Opcionales (usando OpcionalesCotizacionModal)
    return (
      <OpcionalesCotizacionModal 
        productoNombre={productoActualConfigurandoOpcionales.nombre_del_producto || 'Seleccionar Opcionales'}
        opcionales={opcionalesDataModal} 
        isLoading={opcionalesLoadingModal}
        error={opcionalesErrorModal}
        onClose={handleCerrarProcesoSeleccionOpcionalesGlobal} 
        onConfirmarSeleccion={handleConfirmarOpcionalesParaPrincipalActual} // Corregido aquí si era necesario
      />
    );
  }

  if (pasoCotizacion === 2) {
    // PASO 2: Detalles de la Carga
    // Renderizar el panel de Detalles de la Carga con todos los productos y sus opcionales seleccionados
    return (
      <PageLayout>
        <DetallesCargaPanel 
          itemsParaCotizar={datosParaDetallesCarga} 
          onVolver={handleVolverDesdeDetalles}
          onSiguiente={handleSiguienteDesdeDetalles}
          onEliminarOpcionalDePrincipal={handleEliminarOpcionalConfirmado}
        />
      </PageLayout>
    );
  }

  // PASO 0: Tabla de Equipos (renderizado por defecto)
  return (
    <PageLayout>
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
          {/* --- Botón para iniciar/finalizar modo de selección de equipos --- */}
          <button 
            onClick={isSelectionModeActive ? handleProceedToOptionSelection : toggleSelectionMode} 
            className="button-hover" 
            disabled={isSelectionModeActive && productosSeleccionadosParaCotizar.length === 0} // Deshabilitar "Cotizar" si no hay nada seleccionado
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: isSelectionModeActive ? '#22c55e' : 'white', // Verde cuando activo
              border: `1px solid ${isSelectionModeActive ? '#16a34a' : '#1e88e5'}`, // Borde verde o azul
              color: isSelectionModeActive ? 'white' : '#1e88e5', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              fontSize: '14px', 
              fontWeight: '500', 
              cursor: 'pointer', 
              transition: 'all 0.2s ease' 
            }}
          >
            {/* Icono podría cambiar según el modo */} 
            {isSelectionModeActive ? 
              <Check size={16} /> : 
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            }
            {isSelectionModeActive 
              ? `Cotizar ${productosSeleccionadosParaCotizar.length} Equipo(s)` 
              : 'Seleccionar para Cotizar'}
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
                      {isSelectionModeActive && (
                        <th style={{ padding: '12px 16px', textAlign: 'center', width: '100px' }}>Seleccionar</th>
                      )}
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
                        {isSelectionModeActive && (
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={productosSeleccionadosParaCotizar.includes(producto.codigo_producto || '')}
                              onChange={() => producto.codigo_producto && handleToggleProductoParaCotizar(producto.codigo_producto)}
                              disabled={!producto.codigo_producto} // Deshabilitar si no hay código de producto
                              style={{
                                transform: 'scale(1.3)', // Hacer el checkbox un poco más grande
                                cursor: 'pointer'
                              }}
                            />
                          </td>
                        )}
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
    </PageLayout>
  );
} 