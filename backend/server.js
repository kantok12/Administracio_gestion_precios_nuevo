const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
// const pricingOverridesRoutes = require('./routes/pricingOverridesRoutes');
const costosRoutes = require('./routes/costosRoutes');
const overridesRoutes = require('./routes/overridesRoutes');
const categoryOverridesRoutes = require('./routes/categoryOverridesRoutes');
// Importar las nuevas rutas de Langchain
const langchainRoutes = require('./routes/langchainRoutes');
const { fetchCurrencyValuesController, fetchProducts } = require('./controllers/productController');
const { port } = require('./config/env');
const PricingOverride = require('./models/PricingOverride');

dotenv.config();

// Imprimir un mensaje de inicio para informar al usuario del proceso
console.log('\n========== INICIANDO SERVIDOR BACKEND ==========');
console.log('Por favor espere mientras se preparan las bases de datos y modelos...');
console.log('Esto podría tardar unos segundos...');
console.log('================================================\n');

// Inicialización extendida con configuración de modelos
const initializeServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Inicializar modelos
    console.log('[Server] Initializing data models...');
    await PricingOverride.initializeDefaults();
    console.log('[Server] Models initialization complete.');
    
    // Configuración de Express
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Configuración de rutas
    app.use('/api/users', userRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/overrides', overridesRoutes);
    app.use('/api/category-overrides', categoryOverridesRoutes);
    app.use('/api', costosRoutes);
    // Registrar las nuevas rutas de Langchain
    app.use('/api/langchain', langchainRoutes);
    
    // Inicializar caché
    console.log('[Server] Initializing cache...');
    await initializeCache();
    console.log('[Server] Cache initialization complete.');
    
    // Iniciar el servidor
    app.listen(port, () => {
      console.log(`\n---- Server running on port ${port} ----`);
      console.log(`Backend API accessible at: http://localhost:${port}/api`);
      console.log(`Admin panel accessible at: http://localhost:5173/admin\n`);
    });
  } catch (error) {
    console.error('[Server] Error during initialization:', error);
    process.exit(1);
  }
};

// Initialize cache on startup
const initializeCache = async () => {
  try {
    // Inicializar caché de divisas
    await fetchCurrencyValuesController(
      { }, // req mock
      {   // res mock
        status: (code) => ({
          json: (data) => {
            console.log('Currency cache initialized with:', data);
          }
        })
      }
    );

    // Inicializar caché de productos
    await fetchProducts(
      { }, // req mock
      {   // res mock
        status: (code) => ({
          json: (data) => {
            console.log('Products cache initialized with:', data);
          }
        })
      }
    );
    
    console.log('Cache initialized successfully');
  } catch (error) {
    console.error('Failed to initialize cache:', error.message);
  }
};

// Iniciar el servidor
initializeServer();