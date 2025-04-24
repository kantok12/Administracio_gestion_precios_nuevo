const express = require('express');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage } = require('@langchain/core/messages');
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { DynamicTool } = require("@langchain/core/tools");
const { port } = require('../config/env'); // Importar el puerto desde la configuración
// Importar las funciones de fetch desde el utilitario
const { 
  fetchAvailableProducts, 
  fetchProductDetails, 
  fetchOptionalProducts 
} = require('../utils/fetchProducts');
// Importar el nuevo modelo de Conversación
const Conversation = require('../models/Conversation'); 
const mongoose = require('mongoose'); // <-- Importar mongoose para validación de ObjectId

const router = express.Router();

// URL base para las llamadas internas al backend
const INTERNAL_API_BASE_URL = `http://localhost:${port}/api`;

// --- Definición de Herramientas ---

const equiposTool = new DynamicTool({
  name: "buscar_equipos_por_categoria",
  description: "Devuelve una lista de equipos disponibles filtrados por categoría. La entrada debe ser únicamente el nombre de la categoría.",
  func: async (categoria) => {
    console.log(`[Tool:equipos] Buscando equipos para categoría: ${categoria}`);
    try {
      // Llama a la función que obtiene *todos* los productos desde el webhook
      const allProducts = await fetchAvailableProducts();
      
      // Filtra los productos por la categoría proporcionada (insensible a mayúsculas/minúsculas)
      const filteredProducts = allProducts.filter(product => 
        product.Categoria?.toLowerCase() === categoria.toLowerCase()
      );

      console.log(`[Tool:equipos] Encontrados ${filteredProducts.length} equipos para la categoría "${categoria}".`);
      // Devuelve los productos filtrados como un string JSON para el agente
      return JSON.stringify(filteredProducts); 
    } catch (error) {
      console.error(`[Tool:equipos] Error: ${error.message}`);
      return `Error al buscar equipos para la categoría ${categoria}: ${error.message}`;
    }
  },
});

const verDetalleTool = new DynamicTool({
  name: "ver_detalle_producto",
  description: "Devuelve la ficha técnica o detalles de un producto específico. La entrada debe ser únicamente el código del producto.",
  func: async (codigo) => {
    console.log(`[Tool:ver_detalle] Buscando detalles para el código: ${codigo}`);
    try {
      // Llama a la función que obtiene detalles desde el webhook
      // Pasamos el código como parte del objeto query
      const details = await fetchProductDetails({ codigo: codigo }); 
      console.log(`[Tool:ver_detalle] Detalles encontrados para ${codigo}.`);
      return JSON.stringify(details);
    } catch (error) {
      console.error(`[Tool:ver_detalle] Error: ${error.message}`);
      return `Error al obtener detalles para el código ${codigo}: ${error.message}`;
    }
  },
});

const opcionalesTool = new DynamicTool({
  name: "buscar_opcionales_producto",
  description: "Busca accesorios y equipos opcionales para un producto principal. La entrada debe ser únicamente el código del producto principal.",
  func: async (codigo) => {
    console.log(`[Tool:opcionales] Buscando opcionales para el código: ${codigo}`);
    try {
      // Llama a la función que obtiene opcionales desde el webhook
      // Pasamos el código como parte del objeto query
      const optionals = await fetchOptionalProducts({ codigo: codigo }); 
      console.log(`[Tool:opcionales] Opcionales encontrados para ${codigo}.`);
      return JSON.stringify(optionals);
    } catch (error) {
      console.error(`[Tool:opcionales] Error: ${error.message}`);
      return `Error al buscar opcionales para el código ${codigo}: ${error.message}`;
    }
  },
});

// Herramienta SIMULADA para "Configurar" (iniciar cotización)
const configurarTool = new DynamicTool({
  name: "iniciar_configuracion_cotizacion",
  description: "Inicia el proceso de configuración o cotización para un producto específico. La entrada debe ser únicamente el código del producto.",
  func: async (codigo) => {
    console.log(`[Tool:configurar] Solicitud para iniciar configuración del código: ${codigo}`);
    // *** Lógica Simulada ***
    // Aquí, en el futuro, llamarías a tu endpoint real de configuración/cotización.
    // Por ahora, solo devolvemos un mensaje de éxito simulado.
    return `Se ha iniciado el proceso de configuración para el producto con código ${codigo}. Pronto recibirás más detalles.`;
  },
});

// --- Configuración del Modelo y Agente ---

// Asegúrate de que dotenv esté configurado en tu server.js principal
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o", // Usamos gpt-4o como en tu ejemplo
  temperature: 0.7,
});

const tools = [equiposTool, verDetalleTool, opcionalesTool, configurarTool];

// Variable para almacenar el ejecutor inicializado
let executor;

// Función asíncrona para inicializar el agente
async function initializeAgent() {
  try {
    executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "openai-functions", // Un tipo de agente común y efectivo con OpenAI
       // agentType: "chat-conversational-react-description", // Alternativa como en tu ejemplo
      verbose: true, // Muestra logs detallados del agente (útil para depurar)
      agentArgs: {
        systemMessage: `Eres EcoAsistente, un asistente técnico experto en los productos de EcoAlliance. Tu objetivo es ayudar a los usuarios respondiendo sus preguntas sobre equipos, detalles técnicos y opcionales, utilizando las herramientas disponibles. Sé claro y conciso. Si una herramienta falla, informa al usuario del problema.`,
      },
    });
    console.log("[Langchain Agent] Agente inicializado correctamente.");
  } catch (error) {
    console.error("[Langchain Agent] Error al inicializar el agente:", error);
    // Podríamos reintentar o manejar el error de otra forma
  }
}

// Llama a la inicialización del agente cuando se carga el módulo
initializeAgent();


// --- Ruta POST para interactuar con el Agente ---
router.post('/chat', async (req, res) => {
  // Obtener mensaje y conversationId (opcional) del body
  const { message, conversationId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'El campo "message" es requerido en el body.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('[Langchain Agent] Error: La variable de entorno OPENAI_API_KEY no está configurada.');
    return res.status(500).json({ error: 'Error interno del servidor: Configuración incompleta.' });
  }

  if (!executor) {
     console.error('[Langchain Agent] Error: El agente no está inicializado.');
     // Intenta inicializar de nuevo o devuelve un error
     await initializeAgent(); // Intenta inicializar de nuevo
     if (!executor) {
       return res.status(500).json({ error: 'Error interno del servidor: Agente no disponible.' });
     }
   }

  let responsePayload = {}; // Objeto para construir la respuesta final
  let dbSaveWarning = null; // Para almacenar el warning si falla la BD

  try {
    console.log(`[Langchain Agent] Recibido input: "${message}" (Conversation ID: ${conversationId || 'Nueva'})`);
    
    // Llama al agente con el input del usuario
    const result = await executor.invoke({ input: message });
    const agentOutput = result.output;
    console.log('[Langchain Agent] Respuesta del agente:', agentOutput);
    responsePayload.response = agentOutput; // Añadir respuesta del agente al payload

    // --- Guardar/Actualizar Conversación en Base de Datos ---
    let savedConversationId = null; // Usar null inicialmente
    
    // Asegúrate de que el esquema 'messageSchema' en Conversation.js tiene:
    // timestamp: { type: Date, default: Date.now }
    const newMessagePair = {
      userInput: message,
      agentResponse: agentOutput,
    };

    try {
      let conversationFound = false;
      // Validar y usar conversationId si existe y es válido
      if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
        console.log(`[Conversation] Intentando actualizar conversación existente: ${conversationId}`);
        const updatedConversation = await Conversation.findByIdAndUpdate(
          conversationId,
          { $push: { messages: newMessagePair } },
          { new: true } // Devuelve el documento actualizado
        );

        if (updatedConversation) {
          savedConversationId = updatedConversation._id;
          conversationFound = true;
          console.log(`[Conversation] Mensaje añadido a conversación existente: ${savedConversationId}`);
        } else {
          // ID válido pero no encontrado
          console.warn(`[Conversation] ID válido ${conversationId} no encontrado en la BD.`);
        }
      } else if (conversationId) {
        // ID proporcionado pero no válido
        console.warn(`[Conversation] ID de conversación proporcionado no es válido: ${conversationId}`);
      }
      
      // Si no había conversationId, no era válido, o no se encontró, crear nueva conversación
      if (!conversationFound) {
         console.log('[Conversation] Creando nueva conversación...');
        const newConversation = new Conversation({ messages: [newMessagePair] });
        const savedConversation = await newConversation.save();
        savedConversationId = savedConversation._id;
        console.log(`[Conversation] Nueva conversación creada: ${savedConversationId}`);
      }

      responsePayload.conversationId = savedConversationId; // Añadir ID al payload

    } catch (dbError) {
      // Loguear el error completo para más detalles
      console.error('[Conversation] Error detallado al guardar/actualizar:', dbError);
      // Establecer el warning para la respuesta
      dbSaveWarning = "No se pudo guardar la conversación, pero la IA respondió correctamente.";
      // Intentar mantener el ID de conversación si existía, aunque falle el guardado
      responsePayload.conversationId = conversationId || null; 
    }
    // --- Fin Guardar/Actualizar Conversación ---

    // Añadir warning si ocurrió un error de BD
    if (dbSaveWarning) {
      responsePayload.warning = dbSaveWarning;
    }

    res.json(responsePayload); // Devolver la respuesta final

  } catch (error) {
    console.error('[Langchain Agent] Error al procesar la solicitud:', error);
    // Devolver error 500 si falla el agente
    res.status(500).json({ error: 'Error al comunicarse con el servicio de IA o sus herramientas.' });
  }
});

module.exports = router; 