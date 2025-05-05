const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
// const pricingOverridesRoutes = require('./routes/pricingOverridesRoutes');
// Importar la ruta correcta para perfiles
// const perfilesRoutes = require('./routes/perfilesRoutes.js');
// Importar la nueva ruta para perfiles de costo
const costoPerfilRoutes = require('./routes/costoPerfilRoutes');
// Eliminar imports de rutas obsoletas
// const overridesRoutes = require('./routes/overridesRoutes');
// const categoryOverridesRoutes = require('./routes/categoryOverridesRoutes');
// const perfilRoutes = require('./routes/perfilRoutes'); 
// const pricingOverridesRoutes = require('./routes/pricingOverridesRoutes'); // Ya estaba comentado
// Importar las nuevas rutas de Langchain
const langchainRoutes = require('./routes/langchainRoutes');
// Importar webhookRoutes si se usa
// const webhookRoutes = require('./routes/webhookRoutes'); // <-- Comentar ya que no existe
const { fetchCurrencyValuesController, fetchProducts } = require('./controllers/productController');
const { port } = require('./config/env');
// const PricingOverride = require('./models/PricingOverride'); // REMOVE THIS LINE
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

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
    
    // Inicializar modelos llamando al método estático en el MODELO
    console.log('[Server] Initializing data models...');
    // await PricingOverride.initializeDefaults(); // REMOVE THIS LINE
    console.log('[Server] Models initialization complete.');
    
    // Configuración de Express
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    
    // Configuración de rutas
    app.use('/api/users', userRoutes);
    app.use('/api/products', productRoutes);
    // Usar la ruta correcta para perfiles
    // app.use('/api/perfiles', perfilesRoutes);
    // Registrar la nueva ruta para perfiles de costo
    app.use('/api/costo-perfiles', costoPerfilRoutes);
    // Eliminar uso de rutas obsoletas
    // app.use('/api/overrides', overridesRoutes);
    // app.use('/api/category-overrides', categoryOverridesRoutes);
    // app.use('/api', costosRoutes); // REMOVE THIS LINE
    // Registrar las nuevas rutas de Langchain
    app.use('/api/langchain', langchainRoutes);
    // app.use('/api/webhook', webhookRoutes); // <-- Comentar ya que no existe
    
    // Inicializar caché
    console.log('[Server] Initializing cache...');
    await initializeCache();
    console.log('[Server] Cache initialization complete.');
    
    // Iniciar el servidor
    const PORT = port || process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`\n---- Server running on port ${PORT} ----`);
      console.log(`Backend API accessible at: http://localhost:${PORT}/api`);
      console.log(`Admin panel accessible at: http://localhost:5173/admin\n`);
    }).on('error', (err) => {
      console.error("[Server] Server startup error:", err);
      process.exit(1);
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