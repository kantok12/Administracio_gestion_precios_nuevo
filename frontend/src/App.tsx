import React, { useState, useEffect } from 'react';
import { Info, PlusCircle, Settings, RefreshCw } from 'lucide-react';

// Interfaces
interface Producto {
  codigo_producto: string;
  nombre_del_producto: string;
  Descripcion: string;
  Modelo: string;
  categoria?: string;
  pf_eur?: string;
  dimensiones?: string;
}

interface ApiResponse {
  currencies: {
    dollar: { value: string | null; fecha: string | null; last_update: string | null };
    euro: { value: string | null; fecha: string | null; last_update: string | null };
  };
  products: {
    total: number;
    data: Producto[];
  };
}

const sidebarMenu = [
  { label: 'DASHBOARD', icon: '🏠' },
  { label: 'EQUIPOS', icon: '🛠️', selected: true },
  { label: 'ADMIN', icon: '👤' },
];

export default function App() {
  // ----------- Estados principales -----------
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [categorias, setCategorias] = useState<string[]>(['todas']);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string>('');
  const itemsPerPage = 10;
  const [resetting, setResetting] = useState(false);

  // Función para cargar productos
  const fetchProductos = () => {
    setLoading(true);
    setError(null);
    
    console.log('Iniciando fetch a /api/products/cache/all en puerto 5001');
    
    fetch('http://localhost:5001/api/products/cache/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Importante para CORS
      mode: 'cors',
      credentials: 'same-origin'
    })
      .then(res => {
        console.log('Respuesta recibida:', res.status);
        if (!res.ok) {
          throw new Error(`Error en la respuesta del servidor: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: ApiResponse) => {
        console.log('Datos recibidos:', data);
        console.log('Total de productos:', data.products?.total);
        console.log('Productos en data:', data.products?.data?.length);
        
        if (!data.products || !data.products.data) {
          throw new Error('La respuesta no contiene productos');
        }
        
        setProductos(data.products.data);
        setLastFetched(new Date().toLocaleTimeString());
        
        // Extraer categorías únicas
        const uniqueCategories = [
          'todas',
          ...Array.from(new Set((data.products.data || [])
            .map(p => p.categoria)
            .filter(Boolean)))
        ];
        setCategorias(uniqueCategories as string[]);
      })
      .catch(err => {
        console.error('Error al cargar productos:', err);
        setError(err.message);
        setProductos([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Función para forzar un fetch directo desde el archivo sin usar cache
  const fetchDirect = () => {
    setLoading(true);
    setError(null);
    
    console.log('Solicitando productos directamente desde el archivo en puerto 5001...');
    
    fetch('http://localhost:5001/api/products/fetch', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Importante para CORS
      mode: 'cors',
      credentials: 'same-origin'
    })
      .then(res => {
        console.log('Respuesta de fetch directo recibida:', res.status);
        if (!res.ok) {
          throw new Error(`Error al obtener productos: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Productos obtenidos correctamente:', data);
        // Después de obtener productos, cargamos los del cache (que deberían incluir los nuevos)
        fetchProductos();
      })
      .catch(err => {
        console.error('Error al obtener productos:', err);
        setError(`Error al obtener productos: ${err.message}`);
        // Intentamos recuperar los productos aunque falle el fetch directo
        fetchProductos();
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Función para hacer un reset de cache y obtener datos frescos
  const resetCache = () => {
    setResetting(true);
    setError(null);
    
    console.log('Solicitando reset de cache al backend en puerto 5001...');
    
    // Utilizamos fetch con POST para llamar al endpoint de reset
    fetch('http://localhost:5001/api/products/cache/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Encabezados para CORS (por si acaso)
        'Access-Control-Allow-Origin': '*',
      }
    })
      .then(res => {
        console.log('Respuesta de reset recibida:', res.status);
        if (!res.ok) {
          throw new Error(`Error al resetear el cache: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Cache reseteado correctamente:', data);
        // Después de resetear, cargamos los productos
        fetchProductos();
      })
      .catch(err => {
        console.error('Error al resetear cache:', err);
        setError(`Error al resetear cache: ${err.message}`);
        // Intentamos recuperar los productos aunque falle el reset
        fetchProductos();
      })
      .finally(() => {
        setResetting(false);
      });
  };

  // Cargar productos al iniciar
  useEffect(() => {
    fetchProductos();
  }, []);

  // Filtro y paginación
  const filteredProducts = productos.filter(producto => {
    const matchesSearch =
      producto.nombre_del_producto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo_producto?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoriaSeleccionada === 'todas' || producto.categoria === categoriaSeleccionada;
    return matchesSearch && matchesCategory;
  });
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fa', fontFamily: 'Roboto, Arial, sans-serif', display: 'flex' }}>
      {/* Sidebar visual */}
      <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #e3e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 0 0', minHeight: '100vh' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24 }}>🏢</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#1976d2', lineHeight: 1 }}>Eco<br /><span style={{ color: '#43a047', fontWeight: 400 }}>Alliance</span></div>
        </div>
        {/* Menú */}
        <nav style={{ width: '100%' }}>
          {sidebarMenu.map((item) => (
            <div key={item.label} style={{
              padding: '12px 32px',
              background: item.selected ? '#e3f2fd' : 'transparent',
              color: item.selected ? '#1976d2' : '#222',
              fontWeight: item.selected ? 700 : 500,
              borderLeft: item.selected ? '4px solid #1976d2' : '4px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 16,
            }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ padding: 24, fontSize: 14, color: '#888', borderTop: '1px solid #e3e8f0', width: '100%' }}>⚙️ CONFIGURACIÓN</div>
      </aside>
      {/* Main content */}
      <main style={{ flex: 1, padding: '0 0 0 0', minHeight: '100vh', background: '#f4f6fa' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e3e8f0', padding: '32px 40px 16px 40px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ fontSize: 28, color: '#222', margin: 0, fontWeight: 700, letterSpacing: 1 }}>EQUIPOS</h1>
          {/* Buscador y filtro */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', flex: 1, fontSize: 16, background: '#f8fafc' }}
            />
            <select
              value={categoriaSeleccionada}
              onChange={e => { setCategoriaSeleccionada(e.target.value); setCurrentPage(1); }}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 16, background: '#f8fafc' }}
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat === 'todas' ? 'Todas las categorías' : cat}</option>
              ))}
            </select>
            <button 
              onClick={fetchProductos} 
              disabled={loading}
              style={{ background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '10px 22px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              <RefreshCw size={20} /> {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button 
              onClick={resetCache} 
              disabled={resetting || loading}
              style={{ background: '#1976d2', color: '#fff', border: '1px solid #1976d2', borderRadius: 8, padding: '10px 22px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              <Settings size={20} /> {resetting ? 'Reseteando...' : 'Reset Cache'}
            </button>
            <button 
              onClick={fetchDirect} 
              disabled={loading}
              style={{ background: '#43a047', color: '#fff', border: '1px solid #43a047', borderRadius: 8, padding: '10px 22px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              <Settings size={20} /> Cargar del Backend
            </button>
          </div>
        </div>
        
        {/* Estado de carga o error */}
        {loading && (
          <div style={{ margin: '20px 40px', padding: '15px', background: '#f0f7ff', borderRadius: 8, border: '1px solid #bbd9ff' }}>
            Cargando productos...
          </div>
        )}
        
        {error && (
          <div style={{ margin: '20px 40px', padding: '15px', background: '#ffefef', borderRadius: 8, border: '1px solid #ffcaca' }}>
            <strong>Error:</strong> {error}. <button onClick={fetchProductos} style={{ background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}>Reintentar</button>
          </div>
        )}
        
        {lastFetched && (
          <div style={{ margin: '10px 40px 0', fontSize: 14, color: '#666' }}>
            Última actualización: {lastFetched}
          </div>
        )}
        
        {/* Área de diagnóstico para depuración */}
        <div style={{ margin: '20px 40px', padding: '15px', background: '#f5f5f5', borderRadius: 8, fontSize: 14 }}>
          <details>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Información de diagnóstico</summary>
            <div style={{ marginTop: 10 }}>
              <p>Estado: {loading ? 'Cargando' : error ? 'Error' : 'Listo'}</p>
              <p>Productos cargados: {productos.length}</p>
              <p>Categorías detectadas: {categorias.join(', ')}</p>
              <p>URL de API: http://localhost:5001/api/products/cache/all</p>
              <p>Última actualización: {lastFetched || 'Nunca'}</p>
              {error && <p style={{ color: 'red' }}>Error: {error}</p>}
              <hr style={{ margin: '10px 0', border: '1px solid #ddd' }} />
              <div>
                <button 
                  onClick={() => { window.open('http://localhost:5001/api/products/cache/all', '_blank'); }}
                  style={{ background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, padding: '5px 10px', marginRight: 10 }}
                >
                  Ver JSON directo
                </button>
                <button 
                  onClick={() => { resetCache(); }}
                  style={{ background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, padding: '5px 10px' }}
                >
                  Forzar reset de cache
                </button>
                <button 
                  onClick={() => { fetchDirect(); }}
                  style={{ background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, padding: '5px 10px', marginRight: 10 }}
                >
                  Fetch directo
                </button>
              </div>
            </div>
          </details>
        </div>
        
        {/* Tabla de productos */}
        <div style={{ margin: '32px 40px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e3e8f0', fontSize: 16, color: '#555', fontWeight: 500 }}>
            Mostrando {filteredProducts.length} equipos
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={th}>Código</th>
                <th style={th}>Nombre</th>
                <th style={th}>Descripción</th>
                <th style={th}>Modelo</th>
                <th style={th}>Categoría</th>
                <th style={th}>Precio (EUR)</th>
                <th style={th}>Dimensiones</th>
                <th style={th}>Ver Detalle</th>
                <th style={th}>Opcionales</th>
                <th style={th}>Configurar</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => (
                <tr key={p.codigo_producto}>
                  <td style={td}>{p.codigo_producto}</td>
                  <td style={td}>{p.nombre_del_producto}</td>
                  <td style={td}>{p.Descripcion}</td>
                  <td style={td}>{p.Modelo}</td>
                  <td style={td}><span style={{ background: '#f1f5fb', color: '#1976d2', borderRadius: 16, padding: '2px 14px', fontWeight: 600, fontSize: 14 }}>{p.categoria}</span></td>
                  <td style={td}>{p.pf_eur}</td>
                  <td style={td}>{p.dimensiones}</td>
                  <td style={{ ...td, textAlign: 'center' }}><button style={iconBtn}><Info size={18} /></button></td>
                  <td style={{ ...td, textAlign: 'center' }}><button style={iconBtn}><PlusCircle size={18} /></button></td>
                  <td style={{ ...td, textAlign: 'center' }}><button style={iconBtn}><Settings size={18} /></button></td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} style={{ ...td, textAlign: 'center', color: '#888' }}>
                    {error ? 'Error al cargar productos' : 'No hay productos para mostrar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paginación visual */}
        <div style={{ margin: '0 40px 32px 40px', display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={btnPag}>&lt;</button>
          <span style={{ alignSelf: 'center', fontWeight: 600 }}>{currentPage} / {totalPages || 1}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} style={btnPag}>&gt;</button>
        </div>
      </main>
    </div>
  );
}

const th = {
  padding: '12px 8px',
  fontWeight: 600,
  background: '#f8fafc',
  borderBottom: '2px solid #e3e8f0',
  textAlign: 'left' as const,
  fontSize: 15,
};

const td = {
  padding: '10px 8px',
  borderBottom: '1px solid #f1f1f1',
  background: '#fff',
  fontSize: 15,
};

const btnPag = {
  padding: '6px 14px',
  borderRadius: 4,
  border: '1px solid #1976d2',
  background: '#1976d2',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 16,
  minWidth: 36,
  outline: 'none',
  transition: 'background 0.2s',
  margin: '0 2px',
  opacity: 1,
};

const iconBtn = {
  background: '#e3e8f0',
  border: 'none',
  borderRadius: 4,
  padding: 6,
  margin: '0 2px',
  cursor: 'pointer',
  transition: 'background 0.2s',
  color: '#1976d2',
  fontSize: 15,
  verticalAlign: 'middle',
};
