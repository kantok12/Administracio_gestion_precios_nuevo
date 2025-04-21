const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const pricingOverridesRoutes = require('./routes/pricingOverridesRoutes');
const { fetchCurrencyValuesController, fetchProducts } = require('./controllers/productController');
const { port } = require('./config/env');

dotenv.config();

const app = express();

// Habilitar CORS para todas las rutas (o configura orígenes específicos)
app.use(cors());

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pricing-overrides', pricingOverridesRoutes);

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

// Inicializar caché al arrancar el servidor
initializeCache();

const startServer = async () => {
  try {
    // Initialize cache first
    console.log('Initializing cache...');
    await initializeCache(); 
    console.log('Cache initialization attempt complete.');
    
    // Start listening 
    app.listen(port, () => {
      console.log(`---- Server running on port ${port} ----`);
    });

  } catch (error) {
    console.error('🔴 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();