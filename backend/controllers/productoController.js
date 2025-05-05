const xlsx = require('xlsx');
const path = require('path');
const mongoose = require('mongoose');
const Producto = require('../models/Producto'); // Importar el modelo definido externamente
const { fetchAvailableProducts, fetchFilteredProducts, fetchCurrencyValues } = require('../utils/fetchProducts'); // Asumiendo que estas utils aún son necesarias
const fs = require('fs');
const axios = require('axios');

// --- Quitar definiciones de Schema y Modelo de aquí --- 
// Ya no son necesarias porque se importan desde ../models/Producto

// --- Caché (si se sigue usando) --- 
let cachedProducts = [];
// ... (resto de la lógica de caché si aplica)
const CACHE_FILE = path.join(__dirname, '../data/productsCache.json');
// ... (lógica de carga/guardado de caché si aplica)

// --- Funciones del Controlador --- 

// Función cargarProductosDesdeExcel (modificada para usar el modelo importado y mapear datos)
const cargarProductosDesdeExcel = async (req, res) => {
    const excelFilePath = path.join(__dirname, '..', 'Plantilla_Carga_Productos_MongoDB.xlsx'); 
    console.log(`[Excel Load] Attempting to read file: ${excelFilePath}`);

    try {
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

        if (!data || data.length === 0) {
            return res.status(400).json({ message: 'No se encontraron datos en el archivo Excel.' });
        };

        console.log(`[Excel Load] Found ${data.length} rows in Excel.`);
        let operaciones = [];
        let errores = [];

        for (const row of data) {
            // Mapeo cuidadoso de Excel a Schema
            let productoData = {
                Codigo_Producto: row.Codigo_Producto,
                categoria: row.categoria,
                peso_kg: row.peso_kg,
                caracteristicas: {
                    nombre_del_producto: row.nombre_del_producto,
                    modelo: row.modelo
                },
                dimensiones: {
                    largo_cm: row.largo_cm,
                    ancho_cm: row.ancho_cm,
                    alto_cm: row.alto_cm
                },
                tipo: row.tipo,
                familia: row.familia,
                proveedor: row.proveedor,
                procedencia: row.procedencia,
                nombre_comercial: row.nombre_comercial,
                descripcion: row.descripcion,
                clasificacion_easysystems: row.clasificacion_easysystems,
                codigo_ea: row.codigo_ea,
                especificaciones_tecnicas: {}, // Inicializar
                metadata: {}, // Inicializar
                dimensiones_json: row.dimensiones_json, // Mantener si existen en Excel
                especificaciones_tecnicas_json: row.especificaciones_tecnicas_json,
                opciones_json: row.opciones_json,
                metadata_json: row.metadata_json,
            };

            // Validación básica usando los campos requeridos del Schema
            const tempProduct = new Producto(productoData); // Crear instancia temporal para validación
            const validationError = tempProduct.validateSync(); // Validar sincrónicamente

            if (validationError) {
                 const errorMessages = Object.values(validationError.errors).map(e => e.message).join(', ');
                 console.warn(`[Excel Load] Skipping row due to validation errors: ${errorMessages}`, row);
                 errores.push({ message: `Errores de validación: ${errorMessages}`, rowData: row });
                 continue;
            }

            // Procesamiento de campos JSON embebidos (si aún existen)
             const jsonFields = ['dimensiones_json', 'especificaciones_tecnicas_json', 'opciones_json', 'metadata_json'];
             for (const field of jsonFields) {
                 if (productoData[field] && typeof productoData[field] === 'string') {
                     try {
                         productoData[field] = JSON.parse(productoData[field]);
                     } catch (e) {
                          console.warn(`[Excel Load] Error parsing JSON for field ${field}. Storing as string. Error: ${e.message}`);
                     }
                 }
             }
            
             // Lógica para poblar especificaciones_tecnicas desde Excel
             if (productoData.especificaciones_tecnicas_json && typeof productoData.especificaciones_tecnicas_json === 'object') {
                 productoData.especificaciones_tecnicas = { ...productoData.especificaciones_tecnicas_json }; // Usa el JSON si existe
             } else {
                 // Alternativa: busca columnas con prefijo 'spec_' u otra lógica
                 for (const key in row) {
                     if (/* tu lógica para identificar specs, ej: key.startsWith('spec_') */ false) { 
                         // const specName = key.substring(5);
                         // productoData.especificaciones_tecnicas[specName] = row[key];
                     }
                 }
             }

            // Preparar operación de upsert
            operaciones.push({
                updateOne: {
                    filter: { Codigo_Producto: productoData.Codigo_Producto }, 
                    update: { $set: productoData },    
                    upsert: true                       
                }
            });
        }

        console.log(`[Excel Load] Prepared ${operaciones.length} bulk operations.`);

        if (operaciones.length > 0) {
            const resultado = await Producto.bulkWrite(operaciones, { ordered: false });
            console.log('[Excel Load] Bulk write operation result:', resultado);

            const resumen = {
                totalRowsInExcel: data.length,
                rowsAttempted: operaciones.length,
                rowsSkipped: errores.length,
                inserted: resultado.upsertedCount,
                updated: resultado.modifiedCount,
                writeErrors: resultado.writeErrors?.length || 0,
                validationErrors: errores 
            };
            console.log('[Excel Load] Summary:', resumen);
            const status = (resumen.writeErrors > 0 || resumen.validationErrors.length > 0) ? 207 : 200;
            res.status(status).json({ message: `Carga completada con ${status === 207 ? 'errores' : 'éxito'}.`, summary: resumen });
        } else {
            res.status(400).json({ message: 'No se procesaron filas válidas del archivo Excel.', errors: errores });
        }

    } catch (error) {
        console.error('[Excel Load] General error processing Excel file:', error);
        if (error.code === 'ENOENT') {
             res.status(404).json({ message: `Archivo Excel no encontrado en la ruta: ${excelFilePath}` });
        } else if (error instanceof mongoose.Error.ValidationError) {
             res.status(400).json({ message: 'Error de validación de datos durante la carga masiva.', error: error.message, details: error.errors });
        } else if (error instanceof mongoose.Error) {
             res.status(500).json({ message: 'Error de base de datos durante la carga masiva.', error: error.message });
        } else if (error.name === 'BulkWriteError') { 
             res.status(500).json({ message: 'Error durante la escritura masiva en la base de datos.', error: error.message, details: error.writeErrors });
        }
         else {
            res.status(500).json({ message: 'Error interno del servidor al procesar el archivo Excel.', error: error.message });
        }
    }
};

// Función createIndividualEquipment (usa el modelo importado)
const createIndividualEquipment = async (req, res) => {
    console.log('[Create Equip] Received request body:', req.body);
    try {
        // Extraer datos del body
        const {
            Codigo_Producto,
            categoria,
            peso_kg,
            caracteristicas, 
            dimensiones,    
            especificaciones_tecnicas, 
            metadata,
            // Otros campos...
            tipo, familia, proveedor, procedencia, nombre_comercial, descripcion, clasificacion_easysystems, codigo_ea 
        } = req.body;

        // Construir el documento (Mongoose validará al crear)
        const nuevoProductoData = {
            Codigo_Producto,
            categoria,
            peso_kg,
            caracteristicas,
            dimensiones,
            especificaciones_tecnicas: especificaciones_tecnicas || {}, 
            metadata: metadata || {},
            ...(tipo && { tipo }),
            ...(familia && { familia }),
            ...(proveedor && { proveedor }),
            ...(procedencia && { procedencia }),
            ...(nombre_comercial && { nombre_comercial }),
            ...(descripcion && { descripcion }),
            ...(clasificacion_easysystems && { clasificacion_easysystems }),
            ...(codigo_ea && { codigo_ea }),
        };

        console.log('[Create Equip] Attempting to create product with data:', nuevoProductoData);

        // Crear usando el modelo importado
        const productoCreado = await Producto.create(nuevoProductoData);

        console.log('[Create Equip] Product created successfully:', productoCreado);
        res.status(201).json({ message: 'Equipo creado exitosamente', producto: productoCreado });

    } catch (error) {
         console.error('[Create Equip] Error creating equipment:', error);
         if (error.name === 'ValidationError') {
             const errors = Object.values(error.errors).map(el => el.message);
             return res.status(400).json({ message: 'Error de validación', errors });
         } else if (error.code === 11000) { 
              return res.status(409).json({ message: 'Error: El Código de Producto ya existe.' });
         } else if (error instanceof mongoose.Error) {
             return res.status(500).json({ message: 'Error de base de datos al crear el equipo.', error: error.message });
         } else {
             return res.status(500).json({ message: 'Error interno del servidor al crear el equipo.' });
         }
    }
};

// --- Otras funciones existentes (adaptadas si usan Producto) ---
const getCachedProducts = async (req, res) => {
    try {
        // Leer de MongoDB usando el modelo importado
        const products = await Producto.find({}); 
        res.status(200).json(products);
    } catch(error){
        console.error("Error getting products from DB:", error);
        res.status(500).json({ message: "Error retrieving products." });
    }
};

// ... (Adaptar fetchProducts, getProductDetail, etc. si necesitan usar el modelo Producto)
// ... Ejemplo: fetchProducts podría ahora guardar en DB en lugar de/además de caché
const fetchProducts = async (req, res) => {
  try {
    const productsFromWebhook = await fetchAvailableProducts();
    // Opcional: Actualizar/insertar en MongoDB además de/en lugar de caché
    // Aquí podrías usar bulkWrite similar a cargarProductosDesdeExcel si quieres actualizar la DB
    // Ejemplo simplificado: solo cachear en memoria
    cachedProducts = productsFromWebhook; 
    saveCacheToDisk(); // Guarda en archivo JSON si aún se usa
    res.status(200).json({ message: 'Products fetched and cached successfully', products: cachedProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch filtered products from DB
// @route   GET /api/products/filter (Asumiendo esta ruta desde productRoutes)
// @access  Public (Asumiendo)
const fetchFilteredProductsController = async (req, res) => {
    try {
        const { codigo, modelo, categoria } = req.query;
        
        // Construir el objeto de filtro para Mongoose
        const filter = {};
        if (codigo) filter.Codigo_Producto = { $regex: codigo, $options: 'i' }; // Búsqueda case-insensitive
        if (modelo) filter['caracteristicas.modelo'] = { $regex: modelo, $options: 'i' };
        if (categoria) filter.categoria = { $regex: categoria, $options: 'i' };
        
        console.log('[Filter Products] Searching with filter:', filter);
        
        // Buscar en la base de datos usando el modelo Producto
        const products = await Producto.find(filter);
        
        console.log(`[Filter Products] Found ${products.length} products.`);
        res.status(200).json(products);
        
    } catch (error) {
        console.error('[Filter Products] Error filtering products:', error);
        res.status(500).json({ message: 'Error al filtrar productos', error: error.message });
    }
};

// @desc    Fetch currency values from webhook and cache them
// @route   GET /api/currency/fetch (Asumiendo desde productRoutes)
// @access  Public (Asumiendo)
const fetchCurrencyValuesController = async (req, res) => {
    console.log('[Currency Fetch] Request received.');
    try {
        // Llama a la función de utilidad que realmente hace el fetch
        const currencyData = await fetchCurrencyValues(); 
        console.log('[Currency Fetch] Data received from utility:', currencyData);
        
        // Verificar que el objeto y las propiedades esperadas existan
        // Ajusta las claves ("Valor_Dolar", "Valor_Euro", "Fecha") si son diferentes en la respuesta real de fetchCurrencyValues
        if (currencyData && currencyData.Valor_Dolar !== undefined && currencyData.Valor_Euro !== undefined && currencyData.Fecha !== undefined) {
            // Actualizar caché interno
            currencyCache.dollar.value = currencyData.Valor_Dolar;
            currencyCache.euro.value = currencyData.Valor_Euro;
            const updateTime = new Date().toISOString();
            currencyCache.dollar.fecha = currencyData.Fecha; // Usar fecha de la respuesta
            currencyCache.euro.fecha = currencyData.Fecha;
            currencyCache.dollar.last_update = updateTime;
            currencyCache.euro.last_update = updateTime;
            
            console.log('[Currency Fetch] Internal cache updated:', currencyCache);

            res.status(200).json({ 
                message: 'Currency values fetched and cached successfully', 
                currencies: currencyCache // Devuelve el caché actualizado
            });
        } else {
            console.error('[Currency Fetch] Invalid or incomplete currency data received:', currencyData);
            res.status(404).json({ message: 'Invalid or incomplete currency data received from source.' });
        }
    } catch (error) {
        console.error('[Currency Fetch] Error fetching currency values:', error);
        res.status(500).json({ message: 'Error fetching currency values', error: error.message });
    }
};

// @desc    Get cached dollar value
// @route   GET /api/currency/dollar (Asumiendo desde productRoutes)
// @access  Public (Asumiendo)
const getCachedDollarValue = (req, res) => {
    if (currencyCache.dollar.value !== null) {
        res.status(200).json({
            value: currencyCache.dollar.value,
            fecha: currencyCache.dollar.fecha,
            last_update: currencyCache.dollar.last_update
        });
    } else {
        res.status(404).json({ message: 'Dollar value not cached yet' });
    }
};

// @desc    Get cached euro value
// @route   GET /api/currency/euro (Asumiendo desde productRoutes)
// @access  Public (Asumiendo)
const getCachedEuroValue = (req, res) => {
     if (currencyCache.euro.value !== null) {
        res.status(200).json({
            value: currencyCache.euro.value,
            fecha: currencyCache.euro.fecha,
            last_update: currencyCache.euro.last_update
        });
    } else {
        res.status(404).json({ message: 'Euro value not cached yet' });
    }
};

// @desc    Get all cached values (currencies and potentially products)
// @route   GET /api/products/cache/all (Asumiendo desde productRoutes)
// @access  Public (Asumiendo)
const getAllCachedValues = async (req, res) => {
    try {
        // Decide si leer productos de caché en memoria/disco o DB
        // Ejemplo: Leyendo de DB como se configuró getCachedProducts
        const products = await Producto.find({}); 
        
        const response = {
            success: true,
            data: {
                currencies: currencyCache,
                products: {
                    count: products.length,
                    items: products
                }
            }
        };
        res.status(200).json(response);
    } catch (error) {
        console.error('[Cache All] Error retrieving cached values:', error);
        res.status(500).json({ success: false, message: 'Error retrieving cached values', error: error.message });
    }
};

// @desc    Get product detail by Codigo_Producto
// @route   GET /api/products/detail?codigo=... (Asumiendo)
// @access  Public (Asumiendo)
const getProductDetail = async (req, res) => {
    try {
        // Extraer 'codigo' sin desestructuración
        const codigo = req.query.codigo;
        
        // Validar si el parámetro 'codigo' existe
        if (!codigo) {
            return res.status(400).json({ message: "Falta el parámetro de query 'codigo'" });
        }
        
        // Buscar el producto usando el valor de 'codigo'
        const product = await Producto.findOne({ Codigo_Producto: codigo });
        
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        res.status(200).json(product);
    } catch (error) {
         console.error('[Product Detail] Error fetching product detail:', error);
        res.status(500).json({ message: 'Error al obtener detalle del producto', error: error.message });
    }
};

// @desc    Get optional products (definir lógica según necesidad, ej: por categoría o flag)
// @route   GET /api/products/opcionales (Asumiendo)
// @access  Public (Asumiendo)
const getOptionalProducts = async (req, res) => {
     try {
         // Ejemplo: Buscar productos con una categoría específica o un campo booleano
         // const optionalProducts = await Producto.find({ esOpcional: true }); 
         // O buscar por categoría específica si aplica
         // const optionalProducts = await Producto.find({ categoria: 'Opcional' }); 
         
         // Placeholder: Devolver array vacío hasta definir la lógica
         const optionalProducts = []; 
         
         console.log(`[Optional Products] Found ${optionalProducts.length} optional products.`);
         res.status(200).json(optionalProducts);
     } catch (error) {
         console.error('[Optional Products] Error fetching optional products:', error);
         res.status(500).json({ message: 'Error al obtener productos opcionales', error: error.message });
     }
 };

// @desc    Reset cache (Placeholder - definir qué caché resetear)
// @route   POST /api/products/cache/reset (Asumiendo)
// @access  Admin (Asumiendo - añadir middleware de auth si es necesario)
const resetCache = async (req, res) => {
    try {
        console.log('[Cache Reset] Request received.');
        // Implementar lógica de reseteo - ¿Borrar archivo? ¿Limpiar caché en memoria? ¿Forzar fetch?
        // Ejemplo: Limpiar caché de divisas en memoria
        currencyCache.dollar = { value: null, last_update: null, fecha: null };
        currencyCache.euro = { value: null, last_update: null, fecha: null };
        console.log('[Cache Reset] Currency cache cleared.');
        
        // Podrías también querer borrar el archivo JSON de caché de productos si lo usas
        // if (fs.existsSync(CACHE_FILE)) { fs.unlinkSync(CACHE_FILE); }
        
        res.status(200).json({ message: 'Caché reseteado (parcialmente/totalmente según implementación).' });
    } catch (error) {
        console.error('[Cache Reset] Error resetting cache:', error);
        res.status(500).json({ message: 'Error al resetear el caché', error: error.message });
    }
};

// @desc    Clear cache (similar a reset, definir lógica)
// @route   DELETE /api/products/cache (Asumiendo)
// @access  Admin (Asumiendo)
const clearCache = async (req, res) => {
     try {
        console.log('[Cache Clear] Request received.');
        // Implementar lógica - similar a resetCache
        currencyCache.dollar = { value: null, last_update: null, fecha: null };
        currencyCache.euro = { value: null, last_update: null, fecha: null };
        console.log('[Cache Clear] Currency cache cleared.');
        res.status(200).json({ message: 'Caché limpiado.' });
    } catch (error) {
        console.error('[Cache Clear] Error clearing cache:', error);
        res.status(500).json({ message: 'Error al limpiar el caché', error: error.message });
    }
};

// --- Exportaciones (asegurar que todas las necesarias estén aquí) ---
module.exports = {
    cargarProductosDesdeExcel,
    createIndividualEquipment,
    fetchProducts, 
    getCachedProducts, 
    fetchFilteredProductsController, // Ahora está definida
    fetchCurrencyValuesController, 
    getCachedDollarValue, 
    getCachedEuroValue,
    getAllCachedValues, // Asegurar que está definida y usa Producto si es necesario
    clearCache, // Revisar si interactúa con Producto
    getProductDetail, // Asegurar que está definida y usa Producto
    getOptionalProducts, // Asegurar que está definida y usa Producto
    resetCache, // Revisar si interactúa con Producto
    // Añadir funciones que faltaban en la exportación anterior
    // updateCurrencyValues, // Si es llamada externamente (aunque parece interna con setInterval)
    // saveCacheToDisk, // Si es llamada externamente
    // readProductsFromFile // Si es llamada externamente
}; 