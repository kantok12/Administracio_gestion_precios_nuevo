require('dotenv').config();

// Define todas las variables de entorno necesarias para la aplicación
module.exports = {
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'defaultsecret',
  
  // URI directa para MongoDB Atlas
  mongoURI: 'mongodb+srv://ecoalliance33:cXIdVOePhB0RCArx@automatizaciondb.mj72mym.mongodb.net/Automatizacion_lista_productos_res?retryWrites=true&w=majority',
  
  // URI alternativa con formato local si la principal falla
  mongoURIFallback: 'mongodb://localhost:27017/automatizacion_productos'
};