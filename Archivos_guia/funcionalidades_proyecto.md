# Funcionalidades del Proyecto y Archivos Implicados

Este documento detalla las principales funcionalidades de la aplicación de Administración y Gestión de Precios, junto con los archivos clave del frontend y backend que las implementan.

**Nota Importante:** Todas las respuestas y comunicaciones relacionadas con este proyecto deben ser en **español**.

## 1. Gestión de Usuarios y Autenticación

- **Descripción:** Permite el registro, inicio de sesión y gestión de usuarios. Asegura el acceso a las funcionalidades de la aplicación.
- **Backend:**
    - Rutas: `backend/routes/userRoutes.js` (para `/api/users`)
    - Controladores: `backend/controllers/userController.js` (nombre probable, verificar existencia)
    - Modelos: `backend/models/User.js` (nombre probable, verificar existencia)
    - Middleware: `backend/middleware/authMiddleware.js` (para proteger rutas)
- **Frontend:**
    - Componentes/Páginas: Relacionados con el inicio/cierre de sesión y registro de usuarios (Ej: `LoginPage.tsx`, `RegisterPage.tsx` - nombres a confirmar o generalizar según la estructura del proyecto).
    - Servicios: Funciones para interactuar con la API de usuarios (Ej: `frontend/src/services/authService.ts` - nombre a confirmar).

## 2. Gestión de Productos (Equipos) y Divisas

- **Descripción:** Permite crear, leer, actualizar y eliminar productos (referidos como "Equipos" en el frontend). También maneja información sobre divisas necesaria para los cálculos de costos.
- **Backend:**
    - Rutas: `backend/routes/productRoutes.js` (para `/api/products`)
    - Controladores: `backend/controllers/productController.js`
    - Modelos: `backend/models/Product.js` (nombre probable, verificar existencia y estructura para "Equipos")
- **Frontend:**
    - Componentes/Páginas: `frontend/src/pages/EquiposPanel.tsx` (o similar, para listar/gestionar equipos, según `project_index.md` la ruta es `/equipos`), componentes para mostrar detalles de productos.
    - Servicios: Funciones para interactuar con la API de productos (Ej: `frontend/src/services/productService.ts` - nombre a confirmar).

## 3. Gestión de Perfiles de Costo

- **Descripción:** Permite la creación, lectura, actualización y eliminación de "Perfiles de Costo". Estos perfiles son cruciales para aplicar la lógica de cálculo de precios a los productos. El flujo "Crear Perfil" es una parte central de esta funcionalidad.
- **Backend:**
    - Rutas: `backend/routes/costoPerfilRoutes.js` (para `/api/costo-perfiles`)
    - Controladores: `backend/controllers/costoPerfilController.js`
    - Modelos: `backend/models/CostoPerfil.js`
- **Frontend:**
    - Páginas: `frontend/src/pages/admin/PerfilesPanel.tsx` (accesible vía `/admin/perfiles`), `frontend/src/pages/PerfilEditForm.tsx` (accesible vía `/perfiles/:id/editar`).
    - Servicios: Funciones para interactuar con la API de perfiles de costo (Ej: `frontend/src/services/costoPerfilService.ts` - nombre a confirmar).

## 4. Cálculo de Costos

- **Descripción:** Implementa la lógica de negocio detallada en `Archivos_guia/logica_costo_producto.md` para determinar el costo final de un producto. Esta lógica se aplica en el backend, utilizando datos de productos, perfiles de costo y tipos de cambio.
- **Backend:**
    - Controladores: Principalmente en `backend/controllers/costoPerfilController.js` y `backend/controllers/productController.js` donde se aplican o recuperan los cálculos.
    - Modelos: `backend/models/CostoPerfil.js`, `backend/models/Product.js` (o donde se almacenen los datos base y los resultados de los cálculos).
    - Utils: Podrían existir funciones de utilidad en `backend/utils/` para cálculos específicos o la obtención de tipos de cambio.
- **Frontend:**
    - Páginas/Componentes: `frontend/src/pages/admin/CostosAdminPanel.tsx` (para visualizar o gestionar aspectos generales de los costos), y cualquier componente que muestre precios o costos calculados de productos.

## 5. Carga Masiva de Datos

- **Descripción:** Ofrece la capacidad de cargar información de equipos y/o sus especificaciones de forma masiva, utilizando plantillas de archivos (Excel, CSV).
- **Backend:**
    - Rutas: Rutas específicas para la carga de archivos (Ej: `/api/upload/equipos`, `/api/upload/especificaciones` - a confirmar).
    - Controladores: Controladores dedicados para procesar los archivos cargados (Ej: `backend/controllers/uploadController.js` - nombre a confirmar).
    - Archivos plantilla: `backend/Plantilla_Carga_Equipos.xlsx`, `backend/Plantilla_Carga_Especificaciones.csv`.
- **Frontend:**
    - Páginas: `frontend/src/pages/admin/CargaEquiposPanel.tsx` (accesible vía `/admin/carga-equipos`).

## 6. Integración con Langchain

- **Descripción:** Incorpora funcionalidades basadas en Langchain, que podrían incluir un asistente de chat, herramientas de procesamiento de lenguaje natural, u otras capacidades de IA.
- **Backend:**
    - Rutas: `backend/routes/langchainRoutes.js` (para `/api/langchain`).
    - Controladores: `backend/controllers/langchainController.js` (nombre probable, verificar existencia).
- **Frontend:**
    - Componentes: `frontend/src/components/ChatWidget.tsx` (mencionado en `project_index.md`).

## 7. Panel de Administración

- **Descripción:** Es la sección del frontend que agrupa las diversas herramientas y vistas para la administración del sistema, como la gestión de perfiles, costos y carga de equipos.
- **Frontend:**
    - Componente Raíz: `frontend/src/App.tsx` (define el layout general y las rutas principales).
    - Rutas de Administración: Definidas en `frontend/src/main.tsx` bajo el path `/admin`.
    - Páginas del Panel de Administración:
        - `frontend/src/pages/admin/PerfilesPanel.tsx` (para `/admin/perfiles`).
        - `frontend/src/pages/admin/CostosAdminPanel.tsx` (para `/admin/costos`).
        - `frontend/src/pages/admin/CargaEquiposPanel.tsx` (para `/admin/carga-equipos`).

## 8. Documentación del Proyecto

- **Descripción:** Conjunto de archivos que proporcionan información esencial, guías y la lógica de negocio del proyecto.
- **Archivos:**
    - `Archivos_guia/project_index.md`: Índice general del proyecto, estructura y flujos clave.
    - `Archivos_guia/AI_PROJECT_GUIDE.md`: Guía para la colaboración con el Asistente AI.
    - `Archivos_guia/logica_costo_producto.md`: Detalle del cálculo de costo de producto.
    - `Archivos_guia/Costo de Producto.docx`: Documento complementario sobre costos.
    - `Archivos_guia/funcionalidades_proyecto.md`: Este mismo archivo, detallando funcionalidades y archivos implicados. 